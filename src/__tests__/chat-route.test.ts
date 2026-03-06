import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

// Mock Anthropic as a proper class constructor
vi.mock("@anthropic-ai/sdk", () => {
  function Anthropic() {
    return { messages: { create: mockCreate } };
  }
  return { default: Anthropic };
});

const mockExecutePublicTool = vi.hoisted(() => vi.fn());

vi.mock("@/lib/public-chat-tools", () => ({
  PUBLIC_CHAT_TOOLS: [],
  executePublicTool: mockExecutePublicTool,
}));

import { POST } from "@/app/api/chat/route";
import type { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function endTurnResponse(text: string) {
  return {
    id: "msg-1",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-haiku-4-5-20251001",
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

beforeEach(() => vi.clearAllMocks());

// ─── Input validation ─────────────────────────────────────────────────────────

describe("POST /api/chat — input validation", () => {
  it("returns 400 when message is missing", async () => {
    const res = await POST(makeRequest({ history: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 when message is not a string", async () => {
    const res = await POST(makeRequest({ message: 42 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message exceeds 1000 characters", async () => {
    const res = await POST(makeRequest({ message: "a".repeat(1001) }));
    expect(res.status).toBe(400);
  });

  it("accepts a message of exactly 1000 characters", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const res = await POST(makeRequest({ message: "a".repeat(1000) }));
    expect(res.status).toBe(200);
  });
});

// ─── Successful response ──────────────────────────────────────────────────────

describe("POST /api/chat — successful response", () => {
  it("returns reply text from Claude", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("Hallo! Wie kann ich helfen?"));
    const res = await POST(makeRequest({ message: "Hallo" }));
    const data = await res.json();
    expect(data.reply).toBe("Hallo! Wie kann ich helfen?");
  });

  it("returns null navigateTo when no navigate tool called", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("Hier sind die Infos."));
    const res = await POST(makeRequest({ message: "Info bitte" }));
    const data = await res.json();
    expect(data.navigateTo).toBeNull();
  });

  it("includes updatedHistory in response", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("Antwort"));
    const res = await POST(makeRequest({ message: "Frage", history: [] }));
    const data = await res.json();
    expect(Array.isArray(data.updatedHistory)).toBe(true);
  });

  it("caps history at 20 messages", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const longHistory = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
    }));
    const res = await POST(makeRequest({ message: "Neue Frage", history: longHistory }));
    const data = await res.json();
    expect(data.updatedHistory.length).toBeLessThanOrEqual(20);
  });
});

// ─── Locale handling ──────────────────────────────────────────────────────────

describe("POST /api/chat — locale", () => {
  it("uses German system prompt by default", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("Antwort"));
    await POST(makeRequest({ message: "Hallo" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("German");
  });

  it("uses English system prompt when locale is en", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("Answer"));
    await POST(makeRequest({ message: "Hello", locale: "en" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("English");
  });
});

// ─── Auth instruction ─────────────────────────────────────────────────────────

describe("POST /api/chat — auth instruction", () => {
  it("includes logged-in instruction when isLoggedIn=true", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    await POST(makeRequest({ message: "Meine Buchungen", isLoggedIn: true }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("logged in");
  });

  it("includes login redirect instruction when isLoggedIn=false", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    await POST(makeRequest({ message: "Meine Buchungen", isLoggedIn: false }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("not logged in");
  });
});

// ─── Tool-use loop ────────────────────────────────────────────────────────────

function toolUseResponse(toolName: string, toolInput: Record<string, unknown>, toolId = "tool-1") {
  return {
    id: "msg-2", type: "message", role: "assistant",
    content: [{ type: "tool_use", id: toolId, name: toolName, input: toolInput }],
    model: "claude-haiku-4-5-20251001",
    stop_reason: "tool_use", stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 30 },
  };
}

describe("POST /api/chat — tool-use loop", () => {
  it("executes tool and returns final reply after second call", async () => {
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("list_upcoming_events", {}))
      .mockResolvedValueOnce(endTurnResponse("Hier sind die Events."));
    mockExecutePublicTool.mockResolvedValue([{ id: "evt-1", title: "Ski" }]);

    const res = await POST(makeRequest({ message: "Events?" }));
    const data = await res.json();
    expect(data.reply).toBe("Hier sind die Events.");
    expect(mockExecutePublicTool).toHaveBeenCalledWith("list_upcoming_events", {}, "de");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("captures navigateTo and navigateLabel from navigate tool", async () => {
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("navigate", { path: "/de/membership", label: "Mitglied werden" }))
      .mockResolvedValueOnce(endTurnResponse("Hier ist der Link."));
    mockExecutePublicTool.mockResolvedValue({ navigateTo: "/de/membership", label: "Mitglied werden" });

    const res = await POST(makeRequest({ message: "Mitglied werden" }));
    const data = await res.json();
    expect(data.navigateTo).toBe("/de/membership");
    expect(data.navigateLabel).toBe("Mitglied werden");
  });

  it("passes chatLocale to executePublicTool", async () => {
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("list_upcoming_events", {}))
      .mockResolvedValueOnce(endTurnResponse("Events found."));
    mockExecutePublicTool.mockResolvedValue([]);

    await POST(makeRequest({ message: "Events?", locale: "en" }));
    expect(mockExecutePublicTool).toHaveBeenCalledWith("list_upcoming_events", {}, "en");
  });

  it("returns tool error as is_error when tool throws", async () => {
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("get_event", { id: "missing" }))
      .mockResolvedValueOnce(endTurnResponse("Nicht gefunden."));
    mockExecutePublicTool.mockRejectedValue(new Error("Event not found: missing"));

    const res = await POST(makeRequest({ message: "Event suchen" }));
    const data = await res.json();
    expect(data.reply).toBe("Nicht gefunden.");
    const secondCallMessages = mockCreate.mock.calls[1][0].messages;
    const lastUserMsg = secondCallMessages[secondCallMessages.length - 1];
    expect(lastUserMsg.content[0].is_error).toBe(true);
  });

  it("breaks on unknown stop_reason", async () => {
    mockCreate.mockResolvedValueOnce({
      id: "msg-1", type: "message", role: "assistant",
      content: [{ type: "text", text: "Fertig." }],
      model: "claude-haiku-4-5-20251001",
      stop_reason: "max_tokens", stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    const res = await POST(makeRequest({ message: "Hallo" }));
    const data = await res.json();
    expect(data.reply).toBe("Fertig.");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("returns navigateLabel in response", async () => {
    mockCreate.mockResolvedValueOnce(endTurnResponse("Willkommen!"));
    const res = await POST(makeRequest({ message: "Hallo" }));
    const data = await res.json();
    expect("navigateLabel" in data).toBe(true);
    expect(data.navigateLabel).toBeNull();
  });
});
