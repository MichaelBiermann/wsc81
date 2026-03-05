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
- When creating events or content, ask for any missing required information before proceeding.
- Format lists clearly with names, dates, and IDs where helpful.`;

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message, history } = body as {
    message: string;
    history: Anthropic.MessageParam[];
  };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const messages: Anthropic.MessageParam[] = [
    ...(history ?? []),
    { role: "user", content: message },
  ];

  let response!: Anthropic.Message;

  // Agentic tool-use loop — max 8 iterations
  for (let i = 0; i < 8; i++) {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
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

  return NextResponse.json({ reply, updatedHistory: cappedHistory });
}
