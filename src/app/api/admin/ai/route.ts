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
  translate:
    "You are a professional translator. Translate the given text between German and English (detect the source language and translate to the other). Return only the translated text, nothing else.",
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

  const { text, action } = parsed.data;
  const systemPrompt = SYSTEM_PROMPTS[action];

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
