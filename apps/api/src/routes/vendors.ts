import { Router } from 'express';
import { ComplianceStatus, SubscriptionStatus, SubscriptionTier, UserRole, VendorStatus, VerificationDocumentType } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { signAccessToken } from '../lib/auth';
import { requireAuth, requireRole } from '../middleware/auth';
import { MARKETPLACE_PLANS, PUBLICATION_REQUIRED_DOCUMENTS } from '../config/marketplace-plans';
import { decryptMobileSasaToken, encryptMobileSasaToken, getMobileSasaBalances, sendMobileSasaMessage, topUpMobileSasaWallet } from '../services/mobilesasa';
import { notifyUser } from '../services/notifications';

const router = Router();
const mobileSasaPlatformDefaults = { enabled: true, agentRegistrationUrl: 'https://account.mobilesasa.com/', portalUrl: 'https://account.mobilesasa.com/', docsUrl: 'https://docs.mobilesasa.com/', supportEmail: 'support@mobilesasa.com', minimumWalletTopUp: 500, onboardingNote: 'Create your MobileSasa account, buy SMS units, create a scoped API token, then connect it to Merry Tales.' };
const mobileSasaConnectionSelect = { senderId: true, tokenLastFour: true, status: true, lastTestedAt: true, lastSuccessfulSendAt: true, lastError: true, updatedAt: true } as const;

async function vendorWithSmsConnection(ownerId: string) {
  return db.vendorProfile.findUnique({ where: { ownerId }, include: { smsConnection: true } });
}

function vendorSlug(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'vendor';
}

async function uniqueVendorSlug(businessName: string) {
  const baseSlug = vendorSlug(businessName);
  let slug = baseSlug;
  let suffix = 1;
  while (await db.vendorProfile.findUnique({ where: { slug } })) slug = `${baseSlug}-${++suffix}`;
  return slug;
}

const vendorOnboardingSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).optional(),
  whatsapp: z.string().trim().min(9).max(20),
});

router.get('/account/sms/platform-settings', requireAuth, requireRole(UserRole.VENDOR), async (_req, res, next) => {
  try {
    const setting = await db.systemSetting.findUnique({ where: { key: 'mobilesasa' } });
    const stored = setting?.value && typeof setting.value === 'object' && !Array.isArray(setting.value) ? setting.value as Record<string, unknown> : {};
    return res.json({ data: { ...mobileSasaPlatformDefaults, ...stored } });
  } catch (error) { next(error); }
});

router.get('/plans', (_req,res)=>res.json({data:Object.entries(MARKETPLACE_PLANS).map(([tier,plan])=>({tier,...plan}))}));
router.get('/account/me', requireAuth, async (req, res, next) => { try { const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id }, include: { services: true, reviews: true, verificationDocuments:true, subscriptions:{orderBy:{createdAt:'desc'},take:5} } }); if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } }); return res.json({ data: vendor }); } catch (error) { next(error); } });
router.post('/account/onboard', requireAuth, async (req, res, next) => {
  try {
    const input = vendorOnboardingSchema.parse(req.body);
    const existing = await db.vendorProfile.findUnique({
      where: { ownerId: req.user!.id },
      include: { services: true, reviews: true, verificationDocuments: true, subscriptions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    const userRecord = await db.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, status: true, locale: true, mustChangePassword: true },
    });
    if (!userRecord) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'Account not found.' } });
    if (existing) return res.json({
      data: {
        user: userRecord,
        vendor: existing,
        accessToken: signAccessToken({ id: userRecord.id, email: userRecord.email, role: userRecord.role, status: userRecord.status, mustChangePassword: userRecord.mustChangePassword }),
      },
    });
    const slug = await uniqueVendorSlug(input.businessName);
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userRecord.id },
        data: { role: UserRole.VENDOR },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, status: true, locale: true, mustChangePassword: true },
      });
      const vendor = await tx.vendorProfile.create({
        data: {
          ownerId: user.id,
          businessName: input.businessName,
          slug,
          category: input.category,
          city: input.city,
          description: input.description,
          whatsapp: input.whatsapp,
          status: VendorStatus.DRAFT,
        },
        include: { services: true, reviews: true, verificationDocuments: true, subscriptions: { orderBy: { createdAt: 'desc' }, take: 5 } },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'VENDOR_PROFILE_ONBOARDED',
          entityType: 'VendorProfile',
          entityId: vendor.id,
          metadata: { previousRole: userRecord.role, businessName: vendor.businessName },
        },
      });
      return { user, vendor };
    });
    return res.status(201).json({
      data: {
        ...result,
        accessToken: signAccessToken({ id: result.user.id, email: result.user.email, role: result.user.role, status: result.user.status, mustChangePassword: result.user.mustChangePassword }),
      },
    });
  } catch (error) { next(error); }
});
router.get('/account/compliance',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id},include:{verificationDocuments:{orderBy:{createdAt:'desc'}},subscriptions:{orderBy:{createdAt:'desc'},take:5}}});if(!vendor)return res.status(404).json({error:{code:'VENDOR_NOT_FOUND',message:'Vendor profile not found.'}});const approved=new Set(vendor.verificationDocuments.filter(d=>d.status==='APPROVED'&&(!d.expiresAt||d.expiresAt>new Date())).map(d=>d.type));return res.json({data:{vendor,requirements:PUBLICATION_REQUIRED_DOCUMENTS.map(type=>({type,satisfied:approved.has(type)})),plan:MARKETPLACE_PLANS[vendor.subscriptionTier]}});}catch(error){next(error);}});
router.post('/account/compliance/documents',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const input=z.object({type:z.enum(VerificationDocumentType),referenceNumber:z.string().trim().max(120).optional(),fileUrl:z.string().trim().min(1).max(500),issuedAt:z.iso.datetime().optional(),expiresAt:z.iso.datetime().optional()}).parse(req.body);const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id}});if(!vendor)return res.status(404).json({error:{code:'VENDOR_NOT_FOUND',message:'Vendor profile not found.'}});const document=await db.verificationDocument.create({data:{vendorId:vendor.id,type:input.type,referenceNumber:input.referenceNumber,fileUrl:input.fileUrl,issuedAt:input.issuedAt?new Date(input.issuedAt):undefined,expiresAt:input.expiresAt?new Date(input.expiresAt):undefined}});await db.vendorProfile.update({where:{id:vendor.id},data:{status:VendorStatus.DRAFT}});return res.status(201).json({data:document});}catch(error){next(error);}});
router.post('/account/compliance/submit',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id},include:{verificationDocuments:true}});if(!vendor)return res.status(404).json({error:{code:'VENDOR_NOT_FOUND',message:'Vendor profile not found.'}});const supplied=new Set(vendor.verificationDocuments.filter(d=>d.status!=='REJECTED'&&(!d.expiresAt||d.expiresAt>new Date())).map(d=>d.type));const missing=PUBLICATION_REQUIRED_DOCUMENTS.filter(type=>!supplied.has(type));if(missing.length)return res.status(400).json({error:{code:'COMPLIANCE_DOCUMENTS_MISSING',message:`Upload: ${missing.join(', ')}`}});const updated=await db.vendorProfile.update({where:{id:vendor.id},data:{status:VendorStatus.PENDING_REVIEW,taxComplianceStatus:ComplianceStatus.PENDING,etimsStatus:ComplianceStatus.PENDING}});await db.auditLog.create({data:{actorId:req.user!.id,action:'VENDOR_SUBMITTED_FOR_REVIEW',entityType:'VendorProfile',entityId:updated.id,metadata:{ownerId:req.user!.id}}});try{const admins=await db.user.findMany({where:{role:{in:[UserRole.STAFF,UserRole.ADMIN,UserRole.SUPERADMIN]}},select:{id:true}});await Promise.all(admins.map(a=>notifyUser(db as any,{userId:a.id,title:'Vendor compliance submitted',body:`${updated.businessName} has submitted verification documents and is awaiting review.`,severity: 'INFO' as any,category:'COMPLIANCE',actionUrl:`/operations/admin/vendors/${updated.id}`})));
        // create or append to an ops thread for vendor submissions so ops can triage in one place
        try{
          let thread = await db.opsThread.findFirst({ where: { type: 'VENDOR' } });
          if(!thread){
            thread = await db.opsThread.create({ data: { type: 'VENDOR', title: 'Vendor compliance submissions', participants: { create: admins.map(a => ({ userId: a.id })) } } });
          }
          await db.opsMessage.create({ data: { threadId: thread.id, senderId: req.user!.id, body: `${updated.businessName} submitted verification documents and requires review. View: /operations/admin/vendors/${updated.id}` } });
        }catch(err){console.error('ops thread notification failed',err);} }catch(e){}return res.json({data:updated});}catch(error){next(error);}});
router.post('/account/subscription/choose',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const {tier}=z.object({tier:z.enum(SubscriptionTier)}).parse(req.body);const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id}});if(!vendor)return res.status(404).json({error:{code:'VENDOR_NOT_FOUND',message:'Vendor profile not found.'}});const plan=MARKETPLACE_PLANS[tier];const subscription=await db.vendorSubscription.create({data:{vendorId:vendor.id,tier,status:SubscriptionStatus.PENDING_PAYMENT,priceKes:plan.priceKes}});return res.status(201).json({data:{subscription,plan,message:'Complete payment through the configured payment provider. Verification remains independent of payment.'}});}catch(error){next(error);}});
router.patch('/account/me', requireAuth, requireRole(UserRole.VENDOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const input = z.object({ businessName: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(2000).nullable().optional(), category: z.string().trim().min(2).max(80).optional(), city: z.string().trim().min(2).max(80).optional(), whatsapp: z.string().trim().max(20).nullable().optional(), startingPrice: z.coerce.number().nonnegative().nullable().optional() }).parse(req.body);
    const existing = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    const vendor = await db.vendorProfile.update({ where: { id: existing.id }, data: input, include: { services: true, reviews: true } });
    return res.json({ data: vendor });
  } catch (error) { next(error); }
});
const serviceSchema=z.object({name:z.string().trim().min(2).max(140),description:z.string().trim().max(2000).nullable().optional(),price:z.coerce.number().nonnegative().nullable().optional(),currency:z.string().length(3).default('KES')});
router.post('/account/services',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const input=serviceSchema.parse(req.body);const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id}});if(!vendor)return res.status(404).json({error:{code:'VENDOR_NOT_FOUND',message:'Vendor profile not found.'}});const service=await db.vendorService.create({data:{vendorId:vendor.id,...input}});return res.status(201).json({data:service});}catch(error){next(error);}});
router.patch('/account/services/:id',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const input=serviceSchema.partial().parse(req.body);const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id}});const existing=await db.vendorService.findFirst({where:{id:req.params.id,vendorId:vendor?.id??'none'}});if(!existing)return res.status(404).json({error:{code:'SERVICE_NOT_FOUND',message:'Service listing not found.'}});return res.json({data:await db.vendorService.update({where:{id:existing.id},data:input})});}catch(error){next(error);}});
router.delete('/account/services/:id',requireAuth,requireRole(UserRole.VENDOR),async(req,res,next)=>{try{const vendor=await db.vendorProfile.findUnique({where:{ownerId:req.user!.id}});const existing=await db.vendorService.findFirst({where:{id:req.params.id,vendorId:vendor?.id??'none'}});if(!existing)return res.status(404).json({error:{code:'SERVICE_NOT_FOUND',message:'Service listing not found.'}});await db.vendorService.delete({where:{id:existing.id}});return res.status(204).send();}catch(error){next(error);}});

router.get('/account/sms', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id }, include: { smsConnection: { select: mobileSasaConnectionSelect } } });
    if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    return res.json({ data: vendor.smsConnection });
  } catch (error) { next(error); }
});

router.put('/account/sms', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const input = z.object({ apiToken: z.string().trim().min(12).max(500), senderId: z.string().trim().min(2).max(11).regex(/^[A-Za-z0-9]+$/) }).parse(req.body);
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    const encryptedApiToken = encryptMobileSasaToken(input.apiToken);
    const connection = await db.vendorSmsConnection.upsert({
      where: { vendorId: vendor.id },
      create: { vendorId: vendor.id, encryptedApiToken, tokenLastFour: input.apiToken.slice(-4), senderId: input.senderId.toUpperCase(), status: 'CONNECTED' },
      update: { encryptedApiToken, tokenLastFour: input.apiToken.slice(-4), senderId: input.senderId.toUpperCase(), status: 'CONNECTED', lastError: null },
      select: mobileSasaConnectionSelect,
    });
    await db.auditLog.create({ data: { actorId: req.user!.id, action: 'MOBILESASA_CONNECTION_SAVED', entityType: 'VendorProfile', entityId: vendor.id, metadata: { senderId: connection.senderId } } });
    return res.json({ data: connection });
  } catch (error) { next(error); }
});

router.get('/account/sms/balance', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await vendorWithSmsConnection(req.user!.id);
    if (!vendor?.smsConnection) return res.status(409).json({ error: { code: 'MOBILESASA_NOT_CONNECTED', message: 'Connect your MobileSasa account first.' } });
    try {
      const balances = await getMobileSasaBalances(decryptMobileSasaToken(vendor.smsConnection.encryptedApiToken));
      await db.vendorSmsConnection.update({ where: { id: vendor.smsConnection.id }, data: { status: 'CONNECTED', lastError: null, lastTestedAt: new Date() } });
      return res.json({ data: balances });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to reach MobileSasa.';
      await db.vendorSmsConnection.update({ where: { id: vendor.smsConnection.id }, data: { status: 'ERROR', lastError: message, lastTestedAt: new Date() } });
      return res.status(502).json({ error: { code: 'MOBILESASA_ERROR', message } });
    }
  } catch (error) { next(error); }
});

router.post('/account/sms/test', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().trim().min(9).max(20) }).parse(req.body);
    const vendor = await vendorWithSmsConnection(req.user!.id);
    if (!vendor?.smsConnection) return res.status(409).json({ error: { code: 'MOBILESASA_NOT_CONNECTED', message: 'Connect your MobileSasa account first.' } });
    try {
      const result = await sendMobileSasaMessage(decryptMobileSasaToken(vendor.smsConnection.encryptedApiToken), vendor.smsConnection.senderId, phone, `Your ${vendor.businessName} MobileSasa connection to Merry Tales is working.`);
      await db.vendorSmsConnection.update({ where: { id: vendor.smsConnection.id }, data: { status: 'CONNECTED', lastError: null, lastTestedAt: new Date(), lastSuccessfulSendAt: new Date() } });
      return res.json({ data: result });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Test SMS failed.';
      await db.vendorSmsConnection.update({ where: { id: vendor.smsConnection.id }, data: { status: 'ERROR', lastError: message, lastTestedAt: new Date() } });
      return res.status(502).json({ error: { code: 'MOBILESASA_ERROR', message } });
    }
  } catch (error) { next(error); }
});

router.post('/account/sms/wallet/top-up', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const input = z.object({ phone: z.string().trim().min(9).max(20), amount: z.coerce.number().int().min(1).max(70000) }).parse(req.body);
    const vendor = await vendorWithSmsConnection(req.user!.id);
    if (!vendor?.smsConnection) return res.status(409).json({ error: { code: 'MOBILESASA_NOT_CONNECTED', message: 'Connect your MobileSasa account first.' } });
    try {
      const result = await topUpMobileSasaWallet(decryptMobileSasaToken(vendor.smsConnection.encryptedApiToken), input.phone, input.amount);
      await db.auditLog.create({ data: { actorId: req.user!.id, action: 'MOBILESASA_WALLET_TOP_UP_REQUESTED', entityType: 'VendorProfile', entityId: vendor.id, metadata: { amount: input.amount } } });
      return res.json({ data: result.data });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to start the MobileSasa wallet top-up.';
      return res.status(502).json({ error: { code: 'MOBILESASA_ERROR', message } });
    }
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const query = z.object({ category: z.string().optional(), city: z.string().optional(), q: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(50).default(12) }).parse(req.query);
    const where = { status: VendorStatus.VERIFIED, ...(query.category && { category: query.category }), ...(query.city && { city: query.city }), ...(query.q && { OR: [{ businessName: { contains: query.q, mode: 'insensitive' as const } }, { description: { contains: query.q, mode: 'insensitive' as const } }] }) };
    const [items, total] = await Promise.all([db.vendorProfile.findMany({ where, include: { services: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }] }), db.vendorProfile.count({ where })]);
    res.json({ data: items, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
  } catch (error) { next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findFirst({
      where: { slug: req.params.slug, status: VendorStatus.VERIFIED },
      include: {
        services: true,
        reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
        products: {
          where: { isActive: true, moderationStatus: 'APPROVED' },
          orderBy: { price: 'asc' },
          take: 24,
        },
      },
    });
    if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor not found.' } });
    return res.json({ data: vendor });
  } catch (error) { next(error); }
});

export { router as vendorsRouter };
