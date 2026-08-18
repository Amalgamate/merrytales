import { Router } from "express";
import { randomBytes } from "crypto";
import {
  ComplianceStatus,
  CommunicationChannel,
  DocumentReviewStatus,
  ListingModerationStatus,
  ProductionStatus,
  RefundCaseStatus,
  SubscriptionStatus,
  UserRole,
  VendorStatus,
} from "@prisma/client";
import { z } from "zod";
import { db } from "../db";
import { hashPassword } from "../lib/auth";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
const mobileSasaDefaults = {
  enabled: true,
  agentRegistrationUrl: "https://account.mobilesasa.com/",
  agentCode: "",
  portalUrl: "https://account.mobilesasa.com/",
  docsUrl: "https://docs.mobilesasa.com/",
  supportEmail: "support@mobilesasa.com",
  minimumWalletTopUp: 500,
  onboardingNote:
    "Create your MobileSasa account, buy SMS units, create a scoped API token, then connect it to Merry Tales.",
};
const mobileSasaSettingsSchema = z.object({
  enabled: z.boolean(),
  agentRegistrationUrl: z.string().url(),
  agentCode: z.string().trim().max(120),
  portalUrl: z.string().url(),
  docsUrl: z.string().url(),
  supportEmail: z.string().email(),
  minimumWalletTopUp: z.coerce.number().int().min(1).max(70000),
  onboardingNote: z.string().trim().min(10).max(1000),
});
router.get(
  "/admin/summary",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      const [users, vendors, orders, revenue] = await Promise.all([
        db.user.count(),
        db.vendorProfile.count(),
        db.order.count(),
        db.payment.aggregate({
          where: { status: "PAID" },
          _sum: { amount: true },
        }),
      ]);
      res.json({
        data: { users, vendors, orders, revenue: revenue._sum.amount ?? 0 },
      });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/command-center",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      const [
        pendingVendors,
        pendingListings,
        pendingPayments,
        failedPayments,
        activeDeliveries,
        deliveryIssues,
        openJobs,
        recentOrders,
        recentAudit,
      ] = await Promise.all([
        db.vendorProfile.count({
          where: { status: VendorStatus.PENDING_REVIEW },
        }),
        db.product.count({
          where: { moderationStatus: ListingModerationStatus.PENDING_REVIEW },
        }),
        db.payment.count({ where: { status: "PENDING" } }),
        db.payment.count({ where: { status: "FAILED" } }),
        db.fulfillment.count({
          where: {
            status: {
              in: [
                "PREPARING",
                "READY_FOR_PICKUP",
                "COURIER_ASSIGNED",
                "PICKED_UP",
                "IN_TRANSIT",
                "ARRIVING",
              ],
            },
          },
        }),
        db.fulfillment.count({ where: { status: "DELIVERY_FAILED" } }),
        db.productionJob.count({
          where: { status: { not: ProductionStatus.COMPLETE } },
        }),
        db.order.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { firstName: true, lastName: true } },
            fulfillments: { select: { status: true } },
          },
        }),
        db.auditLog.findMany({
          take: 12,
          orderBy: { createdAt: "desc" },
          include: {
            actor: { select: { firstName: true, lastName: true, role: true } },
          },
        }),
      ]);
      res.json({
        data: {
          queues: {
            pendingVendors,
            pendingListings,
            pendingPayments,
            failedPayments,
            activeDeliveries,
            deliveryIssues,
            openJobs,
          },
          recentOrders,
          recentAudit,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/chat/threads",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      let threads = await db.opsThread.findMany({
        where: {
          OR: [
            { participants: { some: { userId: req.user!.id } } },
            { type: "GENERAL" },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 50,
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      if (!threads.length) {
        const admins = await db.user.findMany({
          where: {
            role: { in: [UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN] },
          },
          select: { id: true },
        });
        await db.opsThread.create({
          data: {
            title: "Operations room",
            type: "GENERAL",
            participants: {
              create: admins.map((item) => ({ userId: item.id })),
            },
          },
        });
        threads = await db.opsThread.findMany({
          where: { participants: { some: { userId: req.user!.id } } },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
            messages: {
              take: 50,
              orderBy: { createdAt: "asc" },
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });
      }
      res.json({ data: threads });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/chat/threads",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          title: z.string().trim().min(3).max(120),
          type: z
            .enum(["GENERAL", "INCIDENT", "SUPPORT", "VENDOR", "ORDER"])
            .default("SUPPORT"),
          participantIds: z.array(z.string()).default([]),
        })
        .parse(req.body);
      const ids = [...new Set([req.user!.id, ...input.participantIds])];
      res.status(201).json({
        data: await db.opsThread.create({
          data: {
            title: input.title,
            type: input.type,
            participants: { create: ids.map((userId) => ({ userId })) },
          },
          include: { participants: true, messages: true },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/chat/threads/:id/messages",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const { body } = z
        .object({ body: z.string().trim().min(1).max(4000) })
        .parse(req.body);
      const thread = await db.opsThread.findFirst({
        where: {
          id: req.params.id,
          OR: [
            { participants: { some: { userId: req.user!.id } } },
            { type: "GENERAL" },
          ],
        },
      });
      if (!thread)
        return res.status(404).json({
          error: {
            code: "THREAD_NOT_FOUND",
            message: "Conversation not found.",
          },
        });
      const message = await db.$transaction(async (tx) => {
        await tx.opsThread.update({
          where: { id: thread.id },
          data: { updatedAt: new Date() },
        });
        return tx.opsMessage.create({
          data: { threadId: thread.id, senderId: req.user!.id, body },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        });
      });
      res.status(201).json({ data: message });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/notifications/broadcast",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          title: z.string().trim().min(3).max(120),
          body: z.string().trim().min(3).max(1000),
          severity: z
            .enum(["INFO", "SUCCESS", "WARNING", "CRITICAL"])
            .default("INFO"),
          roles: z.array(z.enum(UserRole)).min(1),
          actionUrl: z.string().trim().max(300).optional(),
        })
        .parse(req.body);
      const recipients = await db.user.findMany({
        where: { role: { in: input.roles } },
        select: { id: true },
      });
      await db.notification.createMany({
        data: recipients.map((item) => ({
          userId: item.id,
          title: input.title,
          body: input.body,
          severity: input.severity,
          category: "OPERATIONS",
          actionUrl: input.actionUrl,
        })),
      });
      res.status(201).json({ data: { recipients: recipients.length } });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/customer-success",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      const [events, referrals, credits] = await Promise.all([
        db.event.findMany({
          include: {
            owner: { select: { firstName: true, lastName: true, email: true } },
            budgetEnvelopes: { select: { allocatedAmount: true } },
            quotes: { select: { status: true, total: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
        }),
        db.referral.findMany({
          include: {
            referrer: {
              select: { firstName: true, lastName: true, email: true },
            },
            referee: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        db.referralCredit.aggregate({
          where: { status: "AVAILABLE", expiresAt: { gt: new Date() } },
          _sum: { amount: true },
          _count: true,
        }),
      ]);
      return res.json({
        data: {
          events,
          referrals,
          availableCredits: {
            count: credits._count,
            amount: Number(credits._sum.amount ?? 0),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

const managedUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  mustChangePassword: true,
  createdAt: true,
} as const;
router.get(
  "/admin/audit",
  requireRole(UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      const items = await db.auditLog.findMany({
        include: {
          actor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 250,
      });
      return res.json({ data: items });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/communications",
  requireRole(UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      const [templates, deliveries, consents] = await Promise.all([
        db.communicationTemplate.findMany({ orderBy: { updatedAt: "desc" } }),
        db.communicationDelivery.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
        db.communicationConsent.groupBy({ by: ["channel"], _count: true }),
      ]);
      res.json({ data: { templates, deliveries, consents } });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/communications/templates",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          name: z.string().trim().min(3).max(120),
          channel: z.enum(CommunicationChannel),
          subject: z.string().trim().max(200).optional(),
          body: z.string().trim().min(3).max(10000),
          providerTemplateId: z.string().trim().max(200).optional(),
        })
        .parse(req.body);
      res
        .status(201)
        .json({ data: await db.communicationTemplate.create({ data: input }) });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/admin/communications/templates/:id",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          name: z.string().trim().min(3).max(120).optional(),
          channel: z.enum(CommunicationChannel).optional(),
          subject: z.string().trim().max(200).optional().nullable(),
          body: z.string().trim().min(3).max(10000).optional(),
          providerTemplateId: z.string().trim().max(200).optional().nullable(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);
      const updated = await db.$transaction(async (tx) => {
        const template = await tx.communicationTemplate.update({
          where: { id: req.params.id },
          data: input,
        });
        await tx.auditLog.create({
          data: {
            actorId: req.user!.id,
            action: "COMMUNICATION_TEMPLATE_UPDATED",
            entityType: "CommunicationTemplate",
            entityId: template.id,
            metadata: {
              channel: template.channel,
              isActive: template.isActive,
            },
          },
        });
        return template;
      });
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/communications/deliveries",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          templateId: z.string().optional(),
          userId: z.string().optional(),
          channel: z.enum(CommunicationChannel),
          recipient: z.string().trim().min(3).max(200),
          subject: z.string().trim().max(200).optional(),
          body: z.string().trim().min(3).max(10000),
        })
        .parse(req.body);
      if (input.userId) {
        const consent = await db.communicationConsent.findUnique({
          where: {
            userId_channel: {
              userId: input.userId,
              channel: input.channel,
            },
          },
        });
        if (consent && !consent.transactionalAllowed)
          return res.status(409).json({
            error: {
              code: "CONSENT_BLOCKED",
              message:
                "This user has disabled transactional messages for that channel.",
            },
          });
      }
      const delivery = await db.$transaction(async (tx) => {
        const item = await tx.communicationDelivery.create({
          data: {
            ...input,
            status: "QUEUED",
            attempts: 0,
            nextRetryAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: req.user!.id,
            action: "COMMUNICATION_DELIVERY_QUEUED",
            entityType: "CommunicationDelivery",
            entityId: item.id,
            metadata: { channel: item.channel, recipient: item.recipient },
          },
        });
        return item;
      });
      res.status(201).json({ data: delivery });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/communications/deliveries/:id/retry",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const delivery = await db.communicationDelivery.findUnique({
        where: { id: req.params.id },
      });
      if (!delivery)
        return res.status(404).json({
          error: {
            code: "DELIVERY_NOT_FOUND",
            message: "Delivery log not found.",
          },
        });
      if (!["FAILED", "SUPPRESSED", "QUEUED"].includes(delivery.status))
        return res.status(409).json({
          error: {
            code: "DELIVERY_NOT_RETRYABLE",
            message: "Only failed, suppressed or queued messages can be retried.",
          },
        });
      const updated = await db.$transaction(async (tx) => {
        const item = await tx.communicationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "QUEUED",
            attempts: { increment: 1 },
            lastError: null,
            nextRetryAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: req.user!.id,
            action: "COMMUNICATION_DELIVERY_RETRIED",
            entityType: "CommunicationDelivery",
            entityId: item.id,
            metadata: { attempts: item.attempts, channel: item.channel },
          },
        });
        return item;
      });
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/communications/consents",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          userId: z.string(),
          channel: z.enum(CommunicationChannel),
          marketingAllowed: z.boolean(),
          transactionalAllowed: z.boolean(),
        })
        .parse(req.body);
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true },
      });
      if (!user)
        return res.status(404).json({
          error: { code: "USER_NOT_FOUND", message: "User not found." },
        });
      const consent = await db.$transaction(async (tx) => {
        const item = await tx.communicationConsent.upsert({
          where: {
            userId_channel: {
              userId: input.userId,
              channel: input.channel,
            },
          },
          create: input,
          update: {
            marketingAllowed: input.marketingAllowed,
            transactionalAllowed: input.transactionalAllowed,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: req.user!.id,
            action: "COMMUNICATION_CONSENT_UPDATED",
            entityType: "CommunicationConsent",
            entityId: item.id,
            metadata: {
              userId: input.userId,
              channel: input.channel,
              marketingAllowed: input.marketingAllowed,
              transactionalAllowed: input.transactionalAllowed,
            },
          },
        });
        return item;
      });
      res.json({ data: consent });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/refunds",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      res.json({
        data: await db.refundCase.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/refunds",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          paymentId: z.string(),
          requestedAmount: z.coerce.number().positive(),
          reason: z.string().trim().min(5).max(2000),
        })
        .parse(req.body);
      const payment = await db.payment.findUnique({
        where: { id: input.paymentId },
      });
      if (!payment)
        return res
          .status(404)
          .json({
            error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found." },
          });
      if (payment.status !== "PAID")
        return res
          .status(409)
          .json({
            error: {
              code: "PAYMENT_NOT_REFUNDABLE",
              message: "Only paid payments can enter refund review.",
            },
          });
      res
        .status(201)
        .json({ data: await db.refundCase.create({ data: input }) });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/admin/refunds/:id",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          status: z.enum(RefundCaseStatus),
          reviewNotes: z.string().trim().max(2000).optional(),
          providerReference: z.string().trim().max(200).optional(),
        })
        .parse(req.body);
      if (
        ["PROCESSING", "COMPLETED"].includes(input.status) &&
        !input.providerReference
      )
        return res
          .status(400)
          .json({
            error: {
              code: "PROVIDER_REFERENCE_REQUIRED",
              message: "Provider reference required.",
            },
          });
      res.json({
        data: await db.refundCase.update({
          where: { id: req.params.id },
          data: { ...input, reviewerId: req.user!.id },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/users",
  requireRole(UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      res.json({
        data: await db.user.findMany({
          select: managedUser,
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/admin/users/:id",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      if (req.params.id === req.user!.id)
        return res.status(400).json({
          error: {
            code: "SELF_CHANGE_BLOCKED",
            message:
              "Use a separate superadmin account to change your own access.",
          },
        });
      const input = z
        .object({
          role: z.enum(UserRole).optional(),
          status: z
            .enum(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"])
            .optional(),
        })
        .refine(
          (value) => value.role || value.status,
          "Choose a role or status change.",
        )
        .parse(req.body);
      const target = await db.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, role: true, status: true },
      });
      if (!target)
        return res.status(404).json({
          error: { code: "USER_NOT_FOUND", message: "User not found." },
        });
      const removesLastSuperadmin =
        target.role === UserRole.SUPERADMIN &&
        ((input.role !== undefined && input.role !== UserRole.SUPERADMIN) ||
          (input.status !== undefined && input.status !== "ACTIVE"));
      if (removesLastSuperadmin) {
        const activeSuperadmins = await db.user.count({
          where: { role: UserRole.SUPERADMIN, status: "ACTIVE" },
        });
        if (activeSuperadmins <= 1)
          return res.status(400).json({
            error: {
              code: "LAST_SUPERADMIN",
              message:
                "Create another active superadmin before removing this account’s access.",
            },
          });
      }
      const updated = await db.$transaction(async (tx) => {
        const account = await tx.user.update({
          where: { id: target.id },
          data: input,
          select: managedUser,
        });
        await tx.auditLog.create({
          data: {
            actorId: req.user!.id,
            action: "USER_ACCESS_UPDATED",
            entityType: "USER",
            entityId: account.id,
            metadata: {
              previousRole: target.role,
              previousStatus: target.status,
              role: account.role,
              status: account.status,
            },
          },
        });
        return account;
      });
      return res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/users/:id/reset-password",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      if (req.params.id === req.user!.id)
        return res.status(400).json({
          error: {
            code: "SELF_RESET_BLOCKED",
            message: "Use your account settings to change your own password.",
          },
        });
      const target = await db.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, email: true },
      });
      if (!target)
        return res.status(404).json({
          error: { code: "USER_NOT_FOUND", message: "User not found." },
        });
      const temporaryPassword = `MT-${randomBytes(18).toString("base64url")}!`;
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: target.id },
          data: {
            passwordHash: await hashPassword(temporaryPassword),
            mustChangePassword: true,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: req.user!.id,
            action: "USER_PASSWORD_RESET",
            entityType: "USER",
            entityId: target.id,
            metadata: { forcedPasswordChange: true },
          },
        });
      });
      return res.json({ data: { email: target.email, temporaryPassword } });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/vendors",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      res.json({
        data: await db.vendorProfile.findMany({
          include: {
            owner: { select: { email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/admin/vendors/:id",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const { status } = z
        .object({ status: z.enum(VendorStatus) })
        .parse(req.body);
      const vendor = await db.vendorProfile.update({
        where: { id: req.params.id },
        data: { status },
      });
      res.json({ data: vendor });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/compliance",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      res.json({
        data: await db.vendorProfile.findMany({
          where: { status: VendorStatus.PENDING_REVIEW },
          include: {
            owner: { select: { email: true, firstName: true, lastName: true } },
            verificationDocuments: true,
          },
          orderBy: { updatedAt: "asc" },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/admin/compliance/documents/:id",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          status: z.enum(DocumentReviewStatus),
          reviewNotes: z.string().trim().max(2000).optional(),
        })
        .parse(req.body);
      res.json({
        data: await db.verificationDocument.update({
          where: { id: req.params.id },
          data: {
            ...input,
            reviewedById: req.user!.id,
            reviewedAt: new Date(),
          },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/compliance/vendors/:id/decision",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          decision: z.enum(["VERIFY", "REJECT", "SUSPEND"]),
          notes: z.string().trim().max(2000).optional(),
        })
        .parse(req.body);
      const vendor = await db.vendorProfile.findUnique({
        where: { id: req.params.id },
        include: { verificationDocuments: true },
      });
      if (!vendor)
        return res.status(404).json({
          error: { code: "VENDOR_NOT_FOUND", message: "Vendor not found." },
        });
      if (input.decision === "VERIFY") {
        const required = [
          "IDENTITY",
          "BUSINESS_REGISTRATION",
          "KRA_PIN",
          "TAX_COMPLIANCE_CERTIFICATE",
          "ETIMS_PROOF",
          "BANK_OR_MPESA_PROOF",
        ];
        const approved = new Set(
          vendor.verificationDocuments
            .filter(
              (d) =>
                d.status === "APPROVED" &&
                (!d.expiresAt || d.expiresAt > new Date()),
            )
            .map((d) => d.type),
        );
        const missing = required.filter((type) => !approved.has(type as never));
        if (missing.length)
          return res.status(400).json({
            error: {
              code: "UNAPPROVED_REQUIREMENTS",
              message: `Approve first: ${missing.join(", ")}`,
            },
          });
        const tcc = vendor.verificationDocuments.find(
          (d) =>
            d.type === "TAX_COMPLIANCE_CERTIFICATE" && d.status === "APPROVED",
        );
        return res.json({
          data: await db.vendorProfile.update({
            where: { id: vendor.id },
            data: {
              status: VendorStatus.VERIFIED,
              taxComplianceStatus: ComplianceStatus.VERIFIED,
              etimsStatus: ComplianceStatus.VERIFIED,
              taxComplianceExpiresAt: tcc?.expiresAt,
              verifiedAt: new Date(),
              verificationNotes: input.notes,
            },
          }),
        });
      }
      return res.json({
        data: await db.vendorProfile.update({
          where: { id: vendor.id },
          data: {
            status:
              input.decision === "SUSPEND"
                ? VendorStatus.SUSPENDED
                : VendorStatus.REJECTED,
            taxComplianceStatus:
              input.decision === "SUSPEND"
                ? vendor.taxComplianceStatus
                : ComplianceStatus.REJECTED,
            verificationNotes: input.notes,
          },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/listings",
  requireRole(UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const { status } = z
        .object({ status: z.enum(ListingModerationStatus).optional() })
        .parse(req.query);
      res.json({
        data: await db.product.findMany({
          where: status ? { moderationStatus: status } : {},
          include: {
            vendor: {
              select: {
                businessName: true,
                status: true,
                taxComplianceStatus: true,
                etimsStatus: true,
              },
            },
          },
          orderBy: { submittedAt: "asc" },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/listings/:id/decision",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          decision: z.enum([
            "APPROVE",
            "CHANGES_REQUIRED",
            "REJECT",
            "SUSPEND",
          ]),
          reason: z.string().trim().min(5).max(2000),
        })
        .parse(req.body);
      const status = {
        APPROVE: ListingModerationStatus.APPROVED,
        CHANGES_REQUIRED: ListingModerationStatus.CHANGES_REQUIRED,
        REJECT: ListingModerationStatus.REJECTED,
        SUSPEND: ListingModerationStatus.SUSPENDED,
      }[input.decision];
      res.json({
        data: await db.product.update({
          where: { id: req.params.id },
          data: {
            moderationStatus: status,
            moderationReason: input.reason,
            moderatedById: req.user!.id,
            approvedAt:
              status === ListingModerationStatus.APPROVED ? new Date() : null,
          },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/admin/subscriptions/:id/activate",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const { paymentReference, months } = z
        .object({
          paymentReference: z.string().trim().min(3).max(120),
          months: z.coerce.number().int().min(1).max(12).default(1),
        })
        .parse(req.body);
      const subscription = await db.vendorSubscription.findUnique({
        where: { id: req.params.id },
      });
      if (!subscription)
        return res.status(404).json({
          error: {
            code: "SUBSCRIPTION_NOT_FOUND",
            message: "Subscription not found.",
          },
        });
      const startsAt = new Date();
      const endsAt = new Date(startsAt);
      endsAt.setMonth(endsAt.getMonth() + months);
      const updated = await db.$transaction([
        db.vendorSubscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            paymentReference,
            startsAt,
            endsAt,
          },
        }),
        db.vendorProfile.update({
          where: { id: subscription.vendorId },
          data: {
            subscriptionTier: subscription.tier,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionEndsAt: endsAt,
          },
        }),
      ]);
      res.json({ data: updated[0] });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/admin/integrations/mobilesasa",
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      const [setting, connections, vendors] = await Promise.all([
        db.systemSetting.findUnique({ where: { key: "mobilesasa" } }),
        db.vendorSmsConnection.findMany({
          select: {
            vendorId: true,
            senderId: true,
            tokenLastFour: true,
            status: true,
            lastTestedAt: true,
            lastSuccessfulSendAt: true,
            lastError: true,
            updatedAt: true,
            vendor: { select: { businessName: true } },
          },
          orderBy: { updatedAt: "desc" },
        }),
        db.vendorProfile.count(),
      ]);
      const stored =
        setting?.value &&
        typeof setting.value === "object" &&
        !Array.isArray(setting.value)
          ? (setting.value as Record<string, unknown>)
          : {};
      return res.json({
        data: {
          settings: { ...mobileSasaDefaults, ...stored },
          summary: {
            vendors,
            connected: connections.length,
            healthy: connections.filter((item) => item.status === "CONNECTED")
              .length,
            errors: connections.filter((item) => item.status === "ERROR")
              .length,
          },
          connections,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
router.put(
  "/admin/integrations/mobilesasa",
  requireRole(UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const settings = mobileSasaSettingsSchema.parse(req.body);
      await db.systemSetting.upsert({
        where: { key: "mobilesasa" },
        create: { key: "mobilesasa", value: settings },
        update: { value: settings },
      });
      await db.auditLog.create({
        data: {
          actorId: req.user!.id,
          action: "MOBILESASA_PLATFORM_SETTINGS_UPDATED",
          entityType: "SystemSetting",
          entityId: "mobilesasa",
          metadata: {
            enabled: settings.enabled,
            agentCode: settings.agentCode,
          },
        },
      });
      return res.json({ data: settings });
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/studio/jobs",
  requireRole(UserRole.STUDIO, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (_req, res, next) => {
    try {
      res.json({
        data: await db.productionJob.findMany({
          include: { order: true },
          orderBy: { updatedAt: "desc" },
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/studio/jobs/:id",
  requireRole(UserRole.STUDIO, UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req, res, next) => {
    try {
      const { status, notes } = z
        .object({
          status: z.enum(ProductionStatus),
          notes: z.string().max(2000).optional(),
        })
        .parse(req.body);
      const job = await db.productionJob.update({
        where: { id: req.params.id },
        data: { status, notes },
      });
      res.json({ data: job });
    } catch (error) {
      next(error);
    }
  },
);
export { router as operationsRouter };
