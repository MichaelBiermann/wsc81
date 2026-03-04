import { z } from "zod";

const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const postalCodeDE = /^\d{5}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const PersonSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  dob: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
});

const OptionalPersonSchema = z.object({
  name: z.string().max(200).trim().optional(),
  dob: z.string().regex(dateRegex).optional(),
});

export const MembershipSchema = z.object({
  category: z.enum(["FAMILIE", "ERWACHSENE", "JUGENDLICHE", "SENIOREN", "GDB"]),
  person1: PersonSchema,
  person2: OptionalPersonSchema.optional(),
  person3: OptionalPersonSchema.optional(),
  person4: OptionalPersonSchema.optional(),
  person5: OptionalPersonSchema.optional(),
  street: z.string().min(1).max(200).trim(),
  postalCode: z.string().regex(postalCodeDE, "5-digit postal code required"),
  city: z.string().min(1).max(100).trim(),
  phone: z.string().min(1).max(50).trim(),
  email: z.string().email().max(254).toLowerCase(),
  bankName: z.string().min(1).max(200).trim(),
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => ibanRegex.test(v), "Invalid IBAN format"),
  bic: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => bicRegex.test(v), "Invalid BIC format"),
  consentData: z.boolean().refine((v) => v === true, { message: "Required" }),
  consentCancellation: z.boolean().refine((v) => v === true, { message: "Required" }),
  consentBylaws: z.boolean().refine((v) => v === true, { message: "Required" }),
  locale: z.enum(["de", "en"]).default("de"),
});

export const BookingSchema = z.object({
  eventId: z.string().cuid(),
  person1: PersonSchema,
  person2: OptionalPersonSchema.optional(),
  person3: OptionalPersonSchema.optional(),
  person4: OptionalPersonSchema.optional(),
  person5: OptionalPersonSchema.optional(),
  person6: OptionalPersonSchema.optional(),
  person7: OptionalPersonSchema.optional(),
  person8: OptionalPersonSchema.optional(),
  person9: OptionalPersonSchema.optional(),
  person10: OptionalPersonSchema.optional(),
  street: z.string().min(1).max(200).trim(),
  postalCode: z.string().regex(postalCodeDE, "5-digit postal code required"),
  city: z.string().min(1).max(100).trim(),
  phone: z.string().min(1).max(50).trim(),
  email: z.string().email().max(254).toLowerCase(),
  isMember: z.boolean().default(false),
  remarks: z.string().max(2000).trim().optional(),
  locale: z.enum(["de", "en"]).default("de"),
});

export const SearchSchema = z.object({
  q: z.string().min(2).max(200).trim(),
});

export const EventSchema = z.object({
  titleDe: z.string().min(1).max(300).trim(),
  titleEn: z.string().min(1).max(300).trim(),
  descriptionDe: z.string().min(1).trim(),
  descriptionEn: z.string().min(1).trim(),
  location: z.string().min(1).max(300).trim(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  depositAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  imageUrl: z.string().url().optional().nullable(),
  maxParticipants: z.number().int().min(1).optional().nullable(),
  registrationDeadline: z.string().datetime().optional().nullable(),
});

export const SponsorSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  websiteUrl: z.string().url(),
  imageUrl: z.string().url(),
  displayOrder: z.number().int().min(0).default(0),
});

export const NewsletterSchema = z.object({
  subjectDe: z.string().min(1).max(300).trim(),
  subjectEn: z.string().min(1).max(300).trim(),
  bodyDe: z.string().min(1).trim(),
  bodyEn: z.string().min(1).trim(),
});

export const ContentSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  titleDe: z.string().min(1).max(300).trim(),
  titleEn: z.string().min(1).max(300).trim(),
  bodyDe: z.string().min(1).trim(),
  bodyEn: z.string().min(1).trim(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const AIRephraseSchema = z.object({
  text: z.string().min(1).max(5000),
  action: z.enum(["rephrase", "shorten", "expand", "fix_grammar", "translate"]),
  locale: z.enum(["de", "en"]).default("de"),
});

export const ClubSettingsSchema = z.object({
  bankName: z.string().max(200).trim(),
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => ibanRegex.test(v), "Invalid IBAN format"),
  bic: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => bicRegex.test(v), "Invalid BIC format"),
  feeCollectionDay: z.number().int().min(1).max(28),
  feeCollectionMonth: z.number().int().min(1).max(12),
});

export const UserRegisterSchema = z.object({
  firstName:  z.string().min(1).max(100).trim(),
  lastName:   z.string().min(1).max(100).trim(),
  dob:        z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  street:     z.string().min(1).max(200).trim(),
  postalCode: z.string().regex(postalCodeDE, "5-digit postal code required"),
  city:       z.string().min(1).max(100).trim(),
  phone:      z.string().min(1).max(50).trim(),
  email:      z.string().email().max(254).toLowerCase(),
  password:   z.string().min(8).max(128),
  locale:     z.enum(["de", "en"]).default("de"),
});

export type MembershipInput = z.infer<typeof MembershipSchema>;
export type BookingInput = z.infer<typeof BookingSchema>;
export type EventInput = z.infer<typeof EventSchema>;
export type SponsorInput = z.infer<typeof SponsorSchema>;
export type NewsletterInput = z.infer<typeof NewsletterSchema>;
export type ContentInput = z.infer<typeof ContentSchema>;
export type AIRephraseInput = z.infer<typeof AIRephraseSchema>;
export type ClubSettingsInput = z.infer<typeof ClubSettingsSchema>;
export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
