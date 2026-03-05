import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export const CHAT_TOOLS: Anthropic.Tool[] = [
  // ─── Events ──────────────────────────────────────────────────────────────────
  {
    name: "list_events",
    description: "List events. Returns id, titleDe, startDate, endDate, location, bookable, booking count.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 20)" },
        upcoming_only: { type: "boolean", description: "Only events with startDate in the future" },
      },
    },
  },
  {
    name: "get_event",
    description: "Get full details for a single event including all bookings.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "create_event",
    description: "Create a new event.",
    input_schema: {
      type: "object" as const,
      properties: {
        titleDe: { type: "string" },
        titleEn: { type: "string" },
        descriptionDe: { type: "string" },
        descriptionEn: { type: "string" },
        location: { type: "string" },
        startDate: { type: "string", description: "ISO 8601 datetime" },
        endDate: { type: "string", description: "ISO 8601 datetime" },
        depositAmount: { type: "number" },
        totalAmount: { type: "number" },
        maxParticipants: { type: "number" },
        registrationDeadline: { type: "string", description: "ISO 8601 datetime, optional" },
        imageUrl: { type: "string" },
        bookable: { type: "boolean", description: "Default true" },
      },
      required: ["titleDe", "titleEn", "descriptionDe", "descriptionEn", "location", "startDate", "endDate", "depositAmount", "totalAmount"],
    },
  },
  {
    name: "update_event",
    description: "Update fields of an existing event by ID. Only include fields to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        titleDe: { type: "string" },
        titleEn: { type: "string" },
        descriptionDe: { type: "string" },
        descriptionEn: { type: "string" },
        location: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        depositAmount: { type: "number" },
        totalAmount: { type: "number" },
        maxParticipants: { type: "number" },
        bookable: { type: "boolean" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_event",
    description: "Delete an event and all its bookings by ID. Irreversible.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Members ─────────────────────────────────────────────────────────────────
  {
    name: "list_members",
    description: "List activated club members.",
    input_schema: {
      type: "object" as const,
      properties: {
        fees_paid_only: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "update_member_fees",
    description: "Mark a member's annual fee as paid or unpaid.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        feesPaid: { type: "boolean" },
      },
      required: ["id", "feesPaid"],
    },
  },
  {
    name: "list_pending_memberships",
    description: "List all pending (not yet activated) membership applications.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "delete_pending_membership",
    description: "Delete a pending membership application by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Users ───────────────────────────────────────────────────────────────────
  {
    name: "list_users",
    description: "List registered user accounts. Returns name, email, emailVerified, memberId, booking count.",
    input_schema: {
      type: "object" as const,
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "delete_user",
    description: "Delete a user account by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── News Posts ───────────────────────────────────────────────────────────────
  {
    name: "list_news_posts",
    description: "List all news articles.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "all"] },
      },
    },
  },
  {
    name: "create_news_post",
    description: "Create a new news article.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Lowercase letters, digits, hyphens only" },
        titleDe: { type: "string" },
        titleEn: { type: "string" },
        bodyDe: { type: "string", description: "HTML content in German" },
        bodyEn: { type: "string", description: "HTML content in English" },
        status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      },
      required: ["slug", "titleDe", "titleEn", "bodyDe", "bodyEn"],
    },
  },
  {
    name: "update_news_post",
    description: "Update a news article by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        titleDe: { type: "string" },
        titleEn: { type: "string" },
        bodyDe: { type: "string" },
        bodyEn: { type: "string" },
        status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_news_post",
    description: "Delete a news article by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Pages ────────────────────────────────────────────────────────────────────
  {
    name: "list_pages",
    description: "List all static pages.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "all"] },
      },
    },
  },
  {
    name: "create_page",
    description: "Create a new static page.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string" },
        titleDe: { type: "string" },
        titleEn: { type: "string" },
        bodyDe: { type: "string" },
        bodyEn: { type: "string" },
        status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      },
      required: ["slug", "titleDe", "titleEn", "bodyDe", "bodyEn"],
    },
  },
  {
    name: "delete_page",
    description: "Delete a static page by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Recaps ───────────────────────────────────────────────────────────────────
  {
    name: "list_recaps",
    description: "List all event recaps (Rückblicke).",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "all"] },
      },
    },
  },
  {
    name: "create_recap",
    description: "Create a new event recap.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string" },
        titleDe: { type: "string" },
        titleEn: { type: "string" },
        bodyDe: { type: "string" },
        bodyEn: { type: "string" },
        eventDate: { type: "string", description: "YYYY-MM-DD, optional" },
        imageUrl: { type: "string" },
        status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      },
      required: ["slug", "titleDe", "titleEn", "bodyDe", "bodyEn"],
    },
  },
  {
    name: "delete_recap",
    description: "Delete a recap by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Sponsors ─────────────────────────────────────────────────────────────────
  {
    name: "list_sponsors",
    description: "List all sponsors.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "create_sponsor",
    description: "Create a new sponsor.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        websiteUrl: { type: "string" },
        imageUrl: { type: "string" },
        displayOrder: { type: "number" },
      },
      required: ["name", "websiteUrl", "imageUrl"],
    },
  },
  {
    name: "delete_sponsor",
    description: "Delete a sponsor by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Newsletter ───────────────────────────────────────────────────────────────
  {
    name: "list_newsletters",
    description: "List all newsletter drafts and sent newsletters.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "delete_newsletter",
    description: "Delete a newsletter draft by ID.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },

  // ─── Club Settings ────────────────────────────────────────────────────────────
  {
    name: "get_club_settings",
    description: "Get current club settings (fee collection date, masked bank details).",
    input_schema: { type: "object" as const, properties: {} },
  },

  // ─── Dashboard Stats ──────────────────────────────────────────────────────────
  {
    name: "get_stats",
    description: "Get a summary of counts: events, members, pending applications, users, newsletters, recaps.",
    input_schema: { type: "object" as const, properties: {} },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeTool(name: string, input: Record<string, any>): Promise<unknown> {
  switch (name) {
    case "list_events": {
      const where = input.upcoming_only ? { startDate: { gte: new Date() } } : {};
      const events = await prisma.event.findMany({
        where,
        take: (input.limit as number) ?? 20,
        orderBy: { startDate: "asc" },
        include: { _count: { select: { bookings: true } } },
      });
      return events.map((e) => ({
        id: e.id,
        titleDe: e.titleDe,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        location: e.location,
        bookable: e.bookable,
        bookingCount: e._count.bookings,
      }));
    }

    case "get_event": {
      const event = await prisma.event.findUnique({
        where: { id: input.id as string },
        include: { bookings: { orderBy: { createdAt: "desc" } } },
      });
      if (!event) throw new Error(`Event not found: ${input.id}`);
      return {
        ...event,
        depositAmount: Number(event.depositAmount),
        totalAmount: Number(event.totalAmount),
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
      };
    }

    case "create_event": {
      const event = await prisma.event.create({
        data: {
          titleDe: input.titleDe as string,
          titleEn: input.titleEn as string,
          descriptionDe: input.descriptionDe as string,
          descriptionEn: input.descriptionEn as string,
          location: input.location as string,
          startDate: new Date(input.startDate as string),
          endDate: new Date(input.endDate as string),
          depositAmount: input.depositAmount as number,
          totalAmount: input.totalAmount as number,
          maxParticipants: (input.maxParticipants as number) ?? null,
          registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline as string) : null,
          imageUrl: (input.imageUrl as string) ?? null,
          bookable: (input.bookable as boolean) ?? true,
        },
      });
      return { id: event.id, titleDe: event.titleDe, startDate: event.startDate.toISOString() };
    }

    case "update_event": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {};
      for (const f of ["titleDe", "titleEn", "descriptionDe", "descriptionEn", "location", "bookable", "depositAmount", "totalAmount", "maxParticipants"]) {
        if (input[f] !== undefined) data[f] = input[f];
      }
      if (input.startDate) data.startDate = new Date(input.startDate as string);
      if (input.endDate) data.endDate = new Date(input.endDate as string);
      const event = await prisma.event.update({ where: { id: input.id as string }, data });
      return { id: event.id, titleDe: event.titleDe };
    }

    case "delete_event":
      await prisma.event.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_members": {
      const where = input.fees_paid_only ? { feesPaid: true } : {};
      const members = await prisma.member.findMany({
        where,
        take: (input.limit as number) ?? 50,
        orderBy: { activatedAt: "desc" },
        select: { id: true, memberNumber: true, person1Name: true, email: true, category: true, feesPaid: true, activatedAt: true },
      });
      return members.map((m) => ({ ...m, activatedAt: m.activatedAt.toISOString() }));
    }

    case "update_member_fees": {
      const m = await prisma.member.update({
        where: { id: input.id as string },
        data: { feesPaid: input.feesPaid as boolean },
      });
      return { id: m.id, feesPaid: m.feesPaid };
    }

    case "list_pending_memberships": {
      const pending = await prisma.pendingMembership.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, person1Name: true, email: true, category: true, createdAt: true, tokenExpiresAt: true },
      });
      return pending.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        tokenExpiresAt: p.tokenExpiresAt.toISOString(),
      }));
    }

    case "delete_pending_membership":
      await prisma.pendingMembership.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_users": {
      const users = await prisma.user.findMany({
        take: (input.limit as number) ?? 50,
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, email: true, emailVerified: true, memberId: true, createdAt: true, _count: { select: { bookings: true } } },
      });
      return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
    }

    case "delete_user":
      await prisma.user.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_news_posts": {
      const where = input.status && input.status !== "all"
        ? { status: input.status as "DRAFT" | "PUBLISHED" }
        : {};
      const posts = await prisma.newsPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: { id: true, slug: true, titleDe: true, status: true, createdAt: true },
      });
      return posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));
    }

    case "create_news_post": {
      const post = await prisma.newsPost.create({
        data: {
          slug: input.slug as string,
          titleDe: input.titleDe as string,
          titleEn: input.titleEn as string,
          bodyDe: input.bodyDe as string,
          bodyEn: input.bodyEn as string,
          status: (input.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        },
      });
      return { id: post.id, slug: post.slug, status: post.status };
    }

    case "update_news_post": {
      const existing = await prisma.newsPost.findUnique({ where: { id: input.id as string } });
      if (!existing) throw new Error(`News post not found: ${input.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {};
      for (const f of ["titleDe", "titleEn", "bodyDe", "bodyEn", "status"]) {
        if (input[f] !== undefined) data[f] = input[f];
      }
      if (input.status === "PUBLISHED" && !existing.publishedAt) data.publishedAt = new Date();
      if (input.status === "DRAFT") data.publishedAt = null;
      return prisma.newsPost.update({ where: { id: input.id as string }, data });
    }

    case "delete_news_post":
      await prisma.newsPost.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_pages": {
      const where = input.status && input.status !== "all"
        ? { status: input.status as "DRAFT" | "PUBLISHED" }
        : {};
      const pages = await prisma.page.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: { id: true, slug: true, titleDe: true, status: true },
      });
      return pages;
    }

    case "create_page": {
      const page = await prisma.page.create({
        data: {
          slug: input.slug as string,
          titleDe: input.titleDe as string,
          titleEn: input.titleEn as string,
          bodyDe: input.bodyDe as string,
          bodyEn: input.bodyEn as string,
          status: (input.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        },
      });
      return { id: page.id, slug: page.slug };
    }

    case "delete_page":
      await prisma.page.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_recaps": {
      const where = input.status && input.status !== "all"
        ? { status: input.status as "DRAFT" | "PUBLISHED" }
        : {};
      const recaps = await prisma.recap.findMany({
        where,
        orderBy: { eventDate: "desc" },
        select: { id: true, slug: true, titleDe: true, eventDate: true, status: true },
      });
      return recaps.map((r) => ({ ...r, eventDate: r.eventDate?.toISOString() ?? null }));
    }

    case "create_recap": {
      const recap = await prisma.recap.create({
        data: {
          slug: input.slug as string,
          titleDe: input.titleDe as string,
          titleEn: input.titleEn as string,
          bodyDe: input.bodyDe as string,
          bodyEn: input.bodyEn as string,
          eventDate: input.eventDate ? new Date(input.eventDate as string) : null,
          imageUrl: (input.imageUrl as string) ?? null,
          status: (input.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        },
      });
      return { id: recap.id, slug: recap.slug };
    }

    case "delete_recap":
      await prisma.recap.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_sponsors":
      return prisma.sponsor.findMany({ orderBy: { displayOrder: "asc" } });

    case "create_sponsor":
      return prisma.sponsor.create({
        data: {
          name: input.name as string,
          websiteUrl: input.websiteUrl as string,
          imageUrl: input.imageUrl as string,
          displayOrder: (input.displayOrder as number) ?? 0,
        },
      });

    case "delete_sponsor":
      await prisma.sponsor.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "list_newsletters": {
      const newsletters = await prisma.newsletter.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, subjectDe: true, status: true, sentAt: true, recipientCount: true, createdAt: true },
      });
      return newsletters.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        sentAt: n.sentAt?.toISOString() ?? null,
      }));
    }

    case "delete_newsletter":
      await prisma.newsletter.delete({ where: { id: input.id as string } });
      return { deleted: true };

    case "get_club_settings": {
      const s = await prisma.clubSettings.findFirst();
      if (!s) return null;
      return {
        bankName: s.bankName,
        ibanMasked: `****${s.ibanLast4}`,
        bic: s.bic,
        feeCollectionDay: s.feeCollectionDay,
        feeCollectionMonth: s.feeCollectionMonth,
      };
    }

    case "get_stats": {
      const [events, members, pending, users, newsletters, recaps] = await Promise.all([
        prisma.event.count(),
        prisma.member.count(),
        prisma.pendingMembership.count(),
        prisma.user.count(),
        prisma.newsletter.count(),
        prisma.recap.count(),
      ]);
      return { events, members, pendingMemberships: pending, users, newsletters, recaps };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
