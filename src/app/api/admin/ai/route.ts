import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { AIRephraseSchema } from "@/lib/validation";

const client = new Anthropic();

const SYSTEM_PROMPTS: Record<string, string> = {
  rephrase:
    "You are a professional editor. Rephrase the given text to be clearer and more engaging while preserving the meaning. Return only the rephrased text, nothing else.",
  shorten:
    "You are a professional editor. Make the given text more concise without losing the key information. Return only the shortened text, nothing else.",
  expand:
    "You are a professional editor. Expand the given text with more detail and context. Return only the expanded text, nothing else.",
  fix_grammar:
    "You are a professional proofreader. Fix all grammar, spelling, and punctuation errors in the given text. Return only the corrected text, nothing else.",
  translate_to_de:
    "You are a professional translator. Translate the given text into German. Return only the translated text, nothing else.",
  translate_to_en:
    "You are a professional translator. Translate the given text into English. Return only the translated text, nothing else.",
  optimize_event:
    "You are a copywriter for a ski club website. Optimize the given event description so it works perfectly in two contexts: (1) as a short teaser on an event tile card (the first sentence or two must be a compelling 1–2 sentence summary that works standalone when HTML is stripped and truncated to ~120 characters), and (2) as a full event detail page description (well-structured with headings, bullet points for key facts like included services, what to bring, schedule, etc.). Use HTML formatting (h2, h3, ul, li, p, strong). Write in {LANGUAGE}. Return only the optimized HTML, nothing else.",
  generate_event_mail:
    `You are a club communications assistant for Walldorfer Ski-Club 81 e.V. Write an info email to participants of a club event.
You will receive a text describing the event (title, description, dates, location) and the purpose of the email (e.g. "Kick-Off", "Zahlungserinnerung", "Programmübersicht", "Wichtige Hinweise"). The text may also contain extra instructions or personal details added by the admin — incorporate those faithfully.
Write a friendly, professional email in {LANGUAGE} that fits the stated purpose. Use the event data to fill in relevant details.
You may use {{name}} as a placeholder for the recipient's first/last name.
Pricing rules — strictly follow these:
- DO NOT mention the event participation price, deposit (Anzahlung), room prices (Einzelzimmer, Doppelzimmer), or non-member surcharges. These are handled separately.
- DO include prices for external services that participants need to arrange themselves, such as ski passes (Skipass), lift tickets, rental equipment, excursion fees, or similar third-party costs mentioned in the description.
Signature rules:
- If the input contains an "Anmeldung & Kontakt" section, you MUST end the email with a signature block using exactly those contact details (name, email, phone as available). Do NOT add "Euer Walldorfer Ski-Club 81 e.V." or any other generic club closing — the contact person's details ARE the signature.
- If no "Anmeldung & Kontakt" section is present, end with a generic friendly closing.
Return ONLY the email body as HTML (use <p>, <ul>, <li>, <strong> — no <html>/<body>/<head> tags). No subject line, no explanation.`,
  extract_surcharges:
    `You are a pricing assistant for a German ski club. Read the event description (HTML) and extract any price or surcharge amounts mentioned. Return ONLY a raw JSON object with exactly these keys. Do NOT wrap in markdown code fences. No explanation, no markdown, just the raw JSON object:
{
  "organisation": <string|null>,
  "organisationEmail": <string|null>,
  "organisationPhone": <string|null>,
  "depositAmount": <number|null>,
  "surchargeNonMemberAdult": <number|null>,
  "surchargeNonMemberChild": <number|null>,
  "busSurcharge": <number|null>,
  "roomSingleSurcharge": <number|null>,
  "roomDoubleSurcharge": <number|null>,
  "agePrices": [{ "label": "<string>", "price": <number>, "minAge": <number|null>, "maxAge": <number|null> }],
  "soldOut": <boolean>,
  "bookable": <boolean>
}
Field rules:
- "organisation": extract the contact person or organisation responsible for registration, as mentioned in sections like "Anmeldung", "Kontakt", "Ansprechpartner", or similar. Use the name of the person or club listed there (e.g. "Max Mustermann", "DAV Ortsgruppe Muster"). If multiple are listed, use the primary one. If no registration contact is mentioned, fall back to any organising club or third party mentioned in the description. Do NOT use "Walldorfer Ski-Club 81 e.V." itself. Set to null if nothing found.
- "organisationEmail": the email address of the registration contact found above. Set to null if not mentioned.
- "organisationPhone": the phone number of the registration contact found above. Set to null if not mentioned.
- "depositAmount": ONLY set this if an explicit deposit or down-payment (Anzahlung) is mentioned in the text. If no deposit is mentioned, set to null. Do NOT use room prices or base prices as depositAmount.
- "roomSingleSurcharge": the full per-person price for a single room. If only a delta above double is given, add it to the double room price to get the full single room price.
- "roomDoubleSurcharge": the full per-person price for a double room. Always populate this if any double room price is mentioned.
- "busSurcharge": bus cost per person (separate from accommodation).
- "surchargeNonMemberAdult": extra charge for non-members aged 18+.
- "surchargeNonMemberChild": extra charge for non-members under 18.
- "agePrices": array of up to 10 age-based price entries (children, teens, etc.) each with a descriptive label, the full price for that group, and the age range. For "minAge" and "maxAge": set the lower bound as minAge (null if no lower bound, e.g. babies), set the upper bound as maxAge (null if no upper bound, e.g. adults). Example: children 3–12 years → minAge: 3, maxAge: 12. Babies under 3 → minAge: null, maxAge: 2. Adults 18+ → minAge: 18, maxAge: null. Use [] if no age-based prices found.
- "bookable": set to true ONLY if the description contains event participation pricing — i.e. a deposit (Anzahlung), room prices, travel/bus costs, non-member surcharges, or age-based entry fees for the event itself. Do NOT set to true for incidental item costs like certificates (Urkunde), badges (Abzeichen), merchandise, or optional add-ons that are not part of booking the event. Set to false if no such participation pricing is found.
- "soldOut": set to true if the text contains any indication that there are no more free seats (e.g. "ausgebucht", "ausverkauft", "sold out", "fully booked", "keine freien Plätze", "keine Plätze mehr"). Otherwise false.
- Use null for any numeric field not found in the description.`,
};

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AIRephraseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { text, action, locale } = parsed.data;
  const language = locale === "en" ? "English" : "German";
  const systemPrompt = SYSTEM_PROMPTS[action].replace("{LANGUAGE}", language);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  });

  const suggestion =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ suggestion });
}
