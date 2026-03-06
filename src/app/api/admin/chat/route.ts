import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { CHAT_TOOLS, executeTool } from "@/lib/chat-tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an AI assistant for the admin area of WSC 81 (Walldorfer Ski-Club 81 e.V.), a German ski club based in Walldorf, Baden-Württemberg.
You help the admin manage club data by executing database operations in response to natural language commands.
Today's date: ${new Date().toISOString().split("T")[0]}.

Rules:
- Before executing any delete operation, first summarize what will be deleted and ask the user to confirm by typing "ja" or "yes". Only delete after confirmation.
- For content with German (DE) and English (EN) fields, generate content in both languages unless specified otherwise.
- When listing data, return a concise human-readable summary — not raw JSON.
- Resolve relative dates like "nächsten Samstag" or "next Saturday" against today's date.
- Slugs for news posts, pages, and recaps must be lowercase letters, digits, and hyphens only (no umlauts — replace ä→ae, ö→oe, ü→ue, ß→ss).
- Respond in the same language the user used (German or English).
- When the user wants to create or edit something (event, news article, page, recap, newsletter, sponsor), use the navigate tool to open the correct admin form — do not create via chat unless the user explicitly asks you to fill in all the data.
- When the user says "go to", "open", "zeig mir", "navigiere zu" or similar, use the navigate tool.
- When navigating to edit a specific item, first look up its ID using the appropriate list tool, then navigate to the edit URL with that ID.
- When listing events, render the event title as a Markdown link to its edit page: [Title](/admin/events/ID). Do this for every event row in a table or list.
- In the bookable column of event tables, use the token ICON_BOOKABLE for true and ICON_NOT_BOOKABLE for false — never use emoji or ✓/✗.`;

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message, history, locale } = body as {
    message: string;
    history: Anthropic.MessageParam[];
    locale?: string;
  };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const uiLocale = locale === "en" ? "en" : "de";
  const langInstruction = uiLocale === "en"
    ? "The admin UI is set to English. Respond in English unless the user writes in German."
    : "The admin UI is set to German. Respond in German unless the user writes in English.";

  const messages: Anthropic.MessageParam[] = [
    ...(history ?? []),
    { role: "user", content: message },
  ];

  let response!: Anthropic.Message;
  let navigateTo: string | null = null;

  // Agentic tool-use loop — max 8 iterations
  for (let i = 0; i < 8; i++) {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT + "\n" + langInstruction,
      tools: CHAT_TOOLS,
      messages,
    });

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          try {
            const result = await executeTool(block.name, block.input as Record<string, unknown>);
            // Capture navigation intent
            if (block.name === "navigate" && result && typeof result === "object" && "navigateTo" in result) {
              navigateTo = (result as { navigateTo: string }).navigateTo;
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

  // Append final assistant message to history
  const updatedHistory: Anthropic.MessageParam[] = [
    ...messages,
    ...(response.stop_reason === "end_turn" ? [] : [{ role: "assistant" as const, content: response.content }]),
  ];

  // Cap history at last 30 messages to avoid unbounded growth
  const cappedHistory = updatedHistory.slice(-30);

  return NextResponse.json({ reply, navigateTo, updatedHistory: cappedHistory });
}
