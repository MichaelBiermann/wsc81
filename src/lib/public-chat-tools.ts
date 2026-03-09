import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export const PUBLIC_CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_upcoming_events",
    description: "List upcoming bookable and non-bookable events (startDate in the future). Returns id, title, startDate, endDate, location, bookable, depositAmount.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_event",
    description: "Get full details for a single event by ID, including description, pricing, and location.",
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_news",
    description: "List published news articles. Returns id, slug, title, publishedAt.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 5)" },
      },
    },
  },
  {
    name: "get_news",
    description: "Get the full content of a single published news article by slug or id.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The news article slug" },
        id: { type: "string", description: "The news article id (alternative to slug)" },
      },
    },
  },
  {
    name: "list_recaps",
    description: "List published event recaps (Rückblicke). Returns id, slug, title, eventDate.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 5)" },
      },
    },
  },
  {
    name: "get_recap",
    description: "Get the full content of a single published recap by slug or id.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The recap slug" },
        id: { type: "string", description: "The recap id (alternative to slug)" },
      },
    },
  },
  {
    name: "get_page",
    description: "Get the content of a published static page by slug (e.g. satzung, agb, datenschutz, impressum).",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_sponsors",
    description: "List all club sponsors with name and website URL.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "navigate",
    description: "Direct the user to a specific page on the website. Use this when the user wants to go to a page, book an event, read an article, or find information at a specific URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The public path to navigate to, e.g. /de/events/[id], /de/rueckblicke/[slug], /de/news/[slug], /de/seite/[slug], /de/membership, /de/register, /de/verein, /de/vorstand, /de/uebungsleiter, /de/sponsoren, /de/satzung, /de/agb, /de/datenschutz, /de/impressum, /de/login, /de/account, /de/account#bookings, /de/support",
        },
        label: {
          type: "string",
          description: "Short human-readable label for the link shown to the user, e.g. 'Zur Veranstaltung', 'Jetzt buchen'",
        },
      },
      required: ["path", "label"],
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executePublicTool(name: string, input: Record<string, any>, locale: string): Promise<unknown> {

  switch (name) {
    case "list_upcoming_events": {
      const events = await prisma.event.findMany({
        where: { startDate: { gte: new Date() } },
        take: (input.limit as number) ?? 10,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          titleDe: true,
          titleEn: true,
          startDate: true,
          endDate: true,
          location: true,
          bookable: true,
          depositAmount: true,
          maxParticipants: true,
          registrationDeadline: true,
        },
      });
      return events.map((e) => ({
        id: e.id,
        title: locale === "en" ? e.titleEn : e.titleDe,
        url: `/${locale}/events/${e.id}`,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        location: e.location,
        bookable: e.bookable,
        depositAmount: Number(e.depositAmount),
        maxParticipants: e.maxParticipants,
        registrationDeadline: e.registrationDeadline?.toISOString() ?? null,
      }));
    }

    case "get_event": {
      const event = await prisma.event.findUnique({
        where: { id: input.id as string },
        select: {
          id: true,
          titleDe: true, titleEn: true,
          descriptionDe: true, descriptionEn: true,
          location: true,
          startDate: true, endDate: true,
          depositAmount: true,
          maxParticipants: true,
          registrationDeadline: true,
          bookable: true,
          surchargeNonMemberAdult: true,
          busSurcharge: true,
          roomSingleSurcharge: true,
          roomDoubleSurcharge: true,
        },
      });
      if (!event) throw new Error(`Event not found: ${input.id}`);
      return {
        id: event.id,
        title: locale === "en" ? event.titleEn : event.titleDe,
        description: locale === "en" ? event.descriptionEn : event.descriptionDe,
        location: event.location,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        depositAmount: Number(event.depositAmount),
        maxParticipants: event.maxParticipants,
        registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
        bookable: event.bookable,
        surchargeNonMember: Number(event.surchargeNonMemberAdult),
        busSurcharge: Number(event.busSurcharge),
        roomSingleSurcharge: Number(event.roomSingleSurcharge),
        roomDoubleSurcharge: Number(event.roomDoubleSurcharge),
      };
    }

    case "list_news": {
      const posts = await prisma.newsPost.findMany({
        where: { status: "PUBLISHED" },
        take: (input.limit as number) ?? 5,
        orderBy: { publishedAt: "desc" },
        select: { id: true, slug: true, titleDe: true, titleEn: true, publishedAt: true },
      });
      return posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: locale === "en" ? p.titleEn : p.titleDe,
        publishedAt: p.publishedAt?.toISOString() ?? null,
      }));
    }

    case "get_news": {
      const where = input.slug
        ? { slug: input.slug as string, status: "PUBLISHED" as const }
        : { id: input.id as string, status: "PUBLISHED" as const };
      const post = await prisma.newsPost.findFirst({
        where,
        select: { id: true, slug: true, titleDe: true, titleEn: true, bodyDe: true, bodyEn: true, publishedAt: true },
      });
      if (!post) throw new Error("News article not found");
      return {
        id: post.id,
        slug: post.slug,
        title: locale === "en" ? post.titleEn : post.titleDe,
        body: locale === "en" ? post.bodyEn : post.bodyDe,
        publishedAt: post.publishedAt?.toISOString() ?? null,
      };
    }

    case "list_recaps": {
      const recaps = await prisma.recap.findMany({
        where: { status: "PUBLISHED" },
        take: (input.limit as number) ?? 5,
        orderBy: { eventDate: "desc" },
        select: { id: true, slug: true, titleDe: true, titleEn: true, eventDate: true },
      });
      return recaps.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: locale === "en" ? r.titleEn : r.titleDe,
        eventDate: r.eventDate?.toISOString() ?? null,
      }));
    }

    case "get_recap": {
      const where = input.slug
        ? { slug: input.slug as string, status: "PUBLISHED" as const }
        : { id: input.id as string, status: "PUBLISHED" as const };
      const recap = await prisma.recap.findFirst({
        where,
        select: { id: true, slug: true, titleDe: true, titleEn: true, bodyDe: true, bodyEn: true, eventDate: true, imageUrl: true },
      });
      if (!recap) throw new Error("Recap not found");
      return {
        id: recap.id,
        slug: recap.slug,
        title: locale === "en" ? recap.titleEn : recap.titleDe,
        body: locale === "en" ? recap.bodyEn : recap.bodyDe,
        eventDate: recap.eventDate?.toISOString() ?? null,
      };
    }

    case "get_page": {
      const page = await prisma.page.findFirst({
        where: { slug: input.slug as string, status: "PUBLISHED" },
        select: { id: true, slug: true, titleDe: true, titleEn: true, bodyDe: true, bodyEn: true },
      });
      if (!page) throw new Error(`Page not found: ${input.slug}`);
      return {
        id: page.id,
        slug: page.slug,
        title: locale === "en" ? page.titleEn : page.titleDe,
        body: locale === "en" ? page.bodyEn : page.bodyDe,
      };
    }

    case "list_sponsors": {
      const sponsors = await prisma.sponsor.findMany({
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true, websiteUrl: true },
      });
      return sponsors;
    }

    case "navigate":
      // Handled client-side
      return { navigateTo: input.path as string, label: input.label as string };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
