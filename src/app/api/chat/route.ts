import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PUBLIC_CHAT_TOOLS, executePublicTool } from "@/lib/public-chat-tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a friendly assistant for WSC 81 (Walldorfer Ski-Club 81 e.V.), a German ski club based in Walldorf, Baden-Württemberg.
You help visitors find information about the club, upcoming events, news, and how to navigate the website.
Today's date: ${new Date().toISOString().split("T")[0]}.

Rules:
- You are a read-only assistant. You can look up information but cannot create bookings, memberships, or any data on behalf of the user.
- For bookings and membership applications, always direct the user to the relevant page using the navigate tool.
- When answering about events, always use list_upcoming_events or get_event to fetch live data — never make up dates, prices, or details.
- When listing events or articles, include a navigate link to each item so the user can click through.
- Strip HTML tags when presenting body text from descriptions, news, or recaps — present clean readable text.
- Keep answers concise and friendly. Use bullet points for lists of events or facts.
- Respond in the same language the user writes in (German or English). Default to German.
- Do not discuss topics unrelated to WSC 81 or skiing/outdoor activities.
- The club website sections: Startseite (/), Über uns (/verein), Vorstand (/vorstand), Übungsleiter (/uebungsleiter), Sponsoren (/sponsoren), Satzung (/satzung), AGB (/agb), Datenschutz (/datenschutz), Impressum (/impressum), Neuigkeiten (news), Rückblicke (/rueckblicke), Mitglied werden (/membership), Anmelden (/login), Registrieren (/register).`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, history, locale, isLoggedIn } = body as {
    message: string;
    history: Anthropic.MessageParam[];
    locale?: string;
    isLoggedIn?: boolean;
  };

  if (!message || typeof message !== "string" || message.length > 1000) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const chatLocale = locale === "en" ? "en" : "de";
  const langInstruction = chatLocale === "en"
    ? "The user's UI language is English. Respond in English unless the user writes in German."
    : "The user's UI language is German. Respond in German unless the user writes in English.";
  const authInstruction = isLoggedIn
    ? "The user is currently logged in. If they ask about their bookings, use navigate to direct them to /" + chatLocale + "/account#bookings."
    : "The user is not logged in. If they ask about their bookings, direct them to /" + chatLocale + "/login first.";

  const messages: Anthropic.MessageParam[] = [
    ...(history ?? []),
    { role: "user", content: message },
  ];

  let response!: Anthropic.Message;
  let navigateTo: string | null = null;
  let navigateLabel: string | null = null;

  // Agentic tool-use loop — max 5 iterations
  for (let i = 0; i < 5; i++) {
    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + "\n" + langInstruction + "\n" + authInstruction,
      tools: PUBLIC_CHAT_TOOLS,
      messages,
    });

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          try {
            const result = await executePublicTool(block.name, block.input as Record<string, unknown>, chatLocale);
            if (block.name === "navigate" && result && typeof result === "object" && "navigateTo" in result) {
              navigateTo = (result as { navigateTo: string }).navigateTo;
              navigateLabel = (result as unknown as { label: string }).label;
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          } catch (err) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              is_error: true,
              content: String(err),
            });
          }
        }
      }
      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  const reply = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("\n");

  const updatedHistory: Anthropic.MessageParam[] = [
    ...messages,
    ...(response.stop_reason === "end_turn" ? [] : [{ role: "assistant" as const, content: response.content }]),
  ];

  // Cap history at last 20 messages
  const cappedHistory = updatedHistory.slice(-20);

  return NextResponse.json({ reply, navigateTo, navigateLabel, updatedHistory: cappedHistory });
}
