import { LedgerAccountType, LedgerSide, ListingType, PriceUnit, PrismaClient, QuoteStatus, UserRole, VendorStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('DemoMerryTales2026!', 12);
  const customer = await db.user.upsert({
    where: { email: 'couple@merrytales.co.ke' },
    update: {},
    create: { email: 'couple@merrytales.co.ke', passwordHash, firstName: 'Mary', lastName: 'Wanjiku', role: UserRole.CUSTOMER },
  });

  await db.user.upsert({
    where: { email: 'superadmin@merrytales.co.ke' },
    update: { passwordHash, role: UserRole.SUPERADMIN },
    create: { email: 'superadmin@merrytales.co.ke', passwordHash, firstName: 'Merry Tales', lastName: 'Superadmin', role: UserRole.SUPERADMIN },
  });
  await db.user.upsert({ where: { email: 'admin@merrytales.co.ke' }, update: { passwordHash, role: UserRole.ADMIN }, create: { email: 'admin@merrytales.co.ke', passwordHash, firstName: 'Merry Tales', lastName: 'Administrator', role: UserRole.ADMIN } });
  await db.user.upsert({ where: { email: 'staff@merrytales.co.ke' }, update: { passwordHash, role: UserRole.STAFF }, create: { email: 'staff@merrytales.co.ke', passwordHash, firstName: 'Merry Tales', lastName: 'Staff', role: UserRole.STAFF } });
  await db.user.upsert({ where: { email: 'studio@merrytales.co.ke' }, update: { passwordHash, role: UserRole.STUDIO }, create: { email: 'studio@merrytales.co.ke', passwordHash, firstName: 'Merry Tales', lastName: 'Studio', role: UserRole.STUDIO } });

  const event = await db.event.upsert({
    where: { slug: 'john-and-mary-2026' },
    update: {},
    create: { ownerId: customer.id, title: "John & Mary's Wedding", slug: 'john-and-mary-2026', partnerOne: 'John', partnerTwo: 'Mary', eventDate: new Date('2026-12-20T09:00:00.000Z'), city: 'Nairobi', venue: 'Nairobi, Kenya', budget: 1200000, guestTarget: 250 },
  });

  const vendorUser = await db.user.upsert({
    where: { email: 'vendor@merrytales.co.ke' },
    update: {},
    create: { email: 'vendor@merrytales.co.ke', passwordHash, firstName: 'Luxe', lastName: 'Photography', role: UserRole.VENDOR },
  });

  const luxeVendor = await db.vendorProfile.upsert({
    where: { slug: 'luxe-photography' },
    update: {},
    create: { ownerId: vendorUser.id, businessName: 'Luxe Photography', slug: 'luxe-photography', category: 'Photography', city: 'Nairobi', description: 'Editorial wedding photography rooted in real Kenyan celebrations.', whatsapp: '+254700000000', startingPrice: 85000, status: VendorStatus.VERIFIED, responseMinutes: 35, rating: 4.9, reviewCount: 48, services: { create: [{ name: 'Full Day Wedding Photography', price: 120000 }, { name: 'Engagement Session', price: 35000 }] } },
  });

  const marketplaceVendors = [
    ['mc@demo.merrytales.co.ke','Nairobi Event Hosts','nairobi-event-hosts','Event MCs','Nairobi',[['Wedding & Corporate MC',25000],['Awards Gala Host',35000],['Team Building Facilitator',30000]]],
    ['limo@demo.merrytales.co.ke','Mfalme Executive Rides','mfalme-executive-rides','Limousine Hire','Nairobi',[['Stretch Limousine Hire',45000],['Bridal Mercedes Package',30000],['Corporate Airport Transfer',12000]]],
    ['print@demo.merrytales.co.ke','Big Day Print Hub','big-day-print-hub','Digital Printers','Nairobi',[['Invitation Printing',3500],['Large Format Backdrop',8500],['Branded Merchandise',5000]]],
    ['tailor@demo.merrytales.co.ke','Mavazi Bespoke Studio','mavazi-bespoke-studio','Tailors','Nairobi',[['Custom Bridal Party Attire',15000],['Bespoke Suit',28000],['Corporate Uniforms',2500]]],
    ['jewels@demo.merrytales.co.ke','Zawadi Jewellers','zawadi-jewellers','Jewellers','Nairobi',[['Custom Wedding Bands',35000],['Engagement Ring Consultation',50000],['Personalised Bracelet',4500]]],
    ['baby@demo.merrytales.co.ke','Little Joy Baby Shop','little-joy-baby-shop','Baby Shops','Kiambu',[['Newborn Gift Hamper',6500],['Baby Shower Gift Registry',3000],['Personalised Baby Blanket',2800]]],
    ['gifts@demo.merrytales.co.ke','Ubuntu Corporate Gifts','ubuntu-corporate-gifts','Corporate Gifts','Nairobi',[['Employee Welcome Kits',4500],['Executive Client Hampers',9500],['Branded Drinkware',1200]]],
    ['hire@demo.merrytales.co.ke','Sherehe Event Rentals','sherehe-event-rentals','Tents','Nakuru',[['100-Seater High Peak Tent',35000],['Lounge Furniture Package',40000],['Portable VIP Toilet',18000]]],
    ['tech@demo.merrytales.co.ke','StageCraft Kenya','stagecraft-kenya','LED Screens','Nairobi',[['LED Screen & Technician',60000],['PA System Package',35000],['Livestream Production',75000]]],
    ['flowers@demo.merrytales.co.ke','Bloom Kenya Studio','bloom-kenya-studio','Florists','Nairobi',[['Bridal Bouquet',7500],['Corporate Flower Subscription',15000],['Event Floral Installation',60000]]],
  ] as const;
  for (const [email,businessName,slug,category,city,services] of marketplaceVendors) {
    const owner=await db.user.upsert({where:{email},update:{passwordHash,role:UserRole.VENDOR},create:{email,passwordHash,firstName:businessName.split(' ')[0],lastName:'Demo',role:UserRole.VENDOR}});
    const profile=await db.vendorProfile.upsert({where:{slug},update:{category,city,status:VendorStatus.VERIFIED},create:{ownerId:owner.id,businessName,slug,category,city,status:VendorStatus.VERIFIED,description:`Verified Merry Tales marketplace provider for ${category.toLowerCase()} and related event needs.`}});
    for(const [name,price] of services){const existing=await db.vendorService.findFirst({where:{vendorId:profile.id,name}});if(!existing)await db.vendorService.create({data:{vendorId:profile.id,name,price}});}
  }

  const products = [
    ['maji-labels-dusty-rose', 'Maji Labels - Dusty Rose', 'Wedding Details', 2500, false],
    ['invitation-suite-sage', 'Luxury Suite - Sage & Gold', 'Wedding Print', 15000, false],
    ['acrylic-welcome-sign', 'Gold Acrylic Welcome Sign', 'Wedding Print', 8500, false],
    ['table-numbers-blush', 'Tent-Fold Table Numbers', 'Wedding Print', 3500, false],
    ['animated-story-tale', 'Story Tale Animation', 'Digital Invitations', 5000, true],
    ['memory-tale-website', 'Memory Tale Event Website', 'Digital Invitations', 7500, true],
    ['event-branding-kit', 'Complete Event Branding Kit', 'Event Branding', 12000, true],
    ['corporate-welcome-kit','Personalised Corporate Welcome Kit','Corporate Gifts',4500,false],
    ['executive-gift-hamper','Executive Appreciation Hamper','Gifts & Hampers',9500,false],
    ['newborn-celebration-hamper','Newborn Celebration Hamper','Baby & Kids',6500,false],
    ['personalised-travel-tumbler','Personalised Insulated Travel Tumbler','Corporate Gifts',1800,false],
    ['celebration-flower-bouquet','Celebration Flower Bouquet','Flowers & Decor',3500,false],
    ['personalised-award-trophy','Personalised Corporate Award Trophy','Printing & Branding',3200,false],
    ['branded-event-hoodie','Branded Event Hoodie','Fashion & Merchandise',2800,false],
    ['personalised-jewellery-gift','Personalised Jewellery Gift Set','Jewellery & Accessories',5500,false],
  ] as const;
  for (const [slug, name, category, price, isDigital] of products) await db.product.upsert({ where: { slug }, update: { name, category, price, isDigital }, create: { name, slug, category, price, isDigital } });
  const listingSeeds=[
    ['mfalme-executive-rides','stretch-limousine-daily-hire','Stretch Limousine Daily Hire','Limousine Hire',45000,ListingType.RENTAL,PriceUnit.DAY,4,15000],
    ['nairobi-event-hosts','corporate-gala-mc','Corporate Gala MC','Event MCs',35000,ListingType.SERVICE,PriceUnit.EVENT,null,null],
    ['big-day-print-hub','branded-conference-kit','Branded Conference Kit','Corporate Printing',3200,ListingType.PRODUCT,PriceUnit.ITEM,500,null],
    ['sherehe-event-rentals','complete-100-guest-setup','Complete 100-Guest Event Setup','Event Rentals',120000,ListingType.PACKAGE,PriceUnit.EVENT,3,30000],
  ] as const;
  for(const [vendorSlug,slug,name,category,price,listingType,priceUnit,stockQuantity,depositAmount] of listingSeeds){const vendor=await db.vendorProfile.findUnique({where:{slug:vendorSlug}});if(vendor)await db.product.upsert({where:{slug},update:{vendorId:vendor.id,listingType,priceUnit,stockQuantity,depositAmount,serviceArea:'Nairobi and surrounding counties'},create:{vendorId:vendor.id,slug,name,category,price,listingType,priceUnit,stockQuantity,depositAmount,serviceArea:'Nairobi and surrounding counties',leadTimeDays:3,description:`Verified ${listingType.toLowerCase()} listing from ${vendor.businessName}.`}});}

  const envelopeSeeds = [
    ['Venue & catering', 520000, '#E83E83'],
    ['Photo & video', 180000, '#7C3AED'],
    ['Decor & flowers', 220000, '#0284C7'],
    ['Transport & logistics', 100000, '#059669'],
    ['Contingency', 120000, '#D97706'],
  ] as const;
  for (const [name, allocatedAmount, color] of envelopeSeeds) {
    await db.budgetEnvelope.upsert({ where: { eventId_name: { eventId: event.id, name } }, update: { allocatedAmount, color }, create: { eventId: event.id, name, allocatedAmount, color, currency: event.currency } });
  }

  const photoEnvelope = await db.budgetEnvelope.findUnique({ where: { eventId_name: { eventId: event.id, name: 'Photo & video' } } });
  const quoteNumber = 'QT-DEMO-PHOTO-2026';
  const existingQuote = await db.quote.findUnique({ where: { quoteNumber } });
  if (!existingQuote && photoEnvelope) {
    const quote = await db.quote.create({ data: { eventId: event.id, vendorId: luxeVendor.id, createdById: customer.id, quoteNumber, title: 'Full wedding photography', status: QuoteStatus.ACCEPTED, currency: event.currency, subtotal: 120000, taxAmount: 0, total: 120000, depositAmount: 40000, acceptedAt: new Date(), lines: { create: [{ description: 'Full day wedding photography', quantity: 1, unitPrice: 120000, lineTotal: 120000 }] } } });
    await db.budgetCommitment.create({ data: { eventId: event.id, envelopeId: photoEnvelope.id, quoteId: quote.id, description: quote.title, amount: quote.total, currency: quote.currency } });
  }

  const providerCash = await db.financialAccount.upsert({ where: { eventId_code_currency: { eventId: event.id, code: '1000', currency: event.currency } }, update: {}, create: { eventId: event.id, code: '1000', name: 'Provider cash', type: LedgerAccountType.ASSET, currency: event.currency } });
  const eventFunds = await db.financialAccount.upsert({ where: { eventId_code_currency: { eventId: event.id, code: '2000', currency: event.currency } }, update: {}, create: { eventId: event.id, code: '2000', name: 'Event funds liability', type: LedgerAccountType.LIABILITY, currency: event.currency } });
  if (!(await db.ledgerJournal.findUnique({ where: { idempotencyKey: 'seed:john-and-mary:funding:1' } }))) {
    await db.ledgerJournal.create({ data: { eventId: event.id, reference: 'DEMO-FUNDING-2026-001', description: 'Demo provider-confirmed event funding', sourceType: 'SEED_PROVIDER_SETTLEMENT', idempotencyKey: 'seed:john-and-mary:funding:1', postings: { create: [{ accountId: providerCash.id, side: LedgerSide.DEBIT, amount: 600000, currency: event.currency }, { accountId: eventFunds.id, side: LedgerSide.CREDIT, amount: 600000, currency: event.currency }] } } });
  }
}

main().finally(() => db.$disconnect());
