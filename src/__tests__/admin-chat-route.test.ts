import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => {
  function Anthropic() {
    return { messages: { create: mockCreate } };
  }
  return { default: Anthropic };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

const mockExecuteTool = vi.hoisted(() => vi.fn());

vi.mock("@/lib/chat-tools", () => ({
  CHAT_TOOLS: [],
  executeTool: mockExecuteTool,
}));

import { POST } from "@/app/api/admin/chat/route";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

const mockAuth = auth as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/admin/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function endTurnResponse(text: string) {
  return {
    id: "msg-1", type: "message", role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-sonnet-4-6",
    stop_reason: "end_turn", stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

const adminSession = { user: { role: "admin", id: "admin-1" } };

beforeEach(() => vi.clearAllMocks());

// ─── Authorization ────────────────────────────────────────────────────────────

describe("POST /api/admin/chat — authorization", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ message: "Hallo" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when role is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user" } });
    const res = await POST(makeRequest({ message: "Hallo" }));
    expect(res.status).toBe(401);
  });

  it("allows request when role is admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const res = await POST(makeRequest({ message: "Hallo" }));
    expect(res.status).toBe(200);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe("POST /api/admin/chat — input validation", () => {
  it("returns 400 when message is missing", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeRequest({ history: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 when message is not a string", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeRequest({ message: 123 }));
    expect(res.status).toBe(400);
  });
});

// ─── Successful response ──────────────────────────────────────────────────────

describe("POST /api/admin/chat — successful response", () => {
  it("returns reply text", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("Es gibt 5 Events."));
    const res = await POST(makeRequest({ message: "Wie viele Events?" }));
    const data = await res.json();
    expect(data.reply).toBe("Es gibt 5 Events.");
  });

  it("returns null navigateTo when no navigate tool called", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("Done."));
    const res = await POST(makeRequest({ message: "Stats?" }));
    const data = await res.json();
    expect(data.navigateTo).toBeNull();
  });

  it("includes updatedHistory in response", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const res = await POST(makeRequest({ message: "Hallo", history: [] }));
    const data = await res.json();
    expect(Array.isArray(data.updatedHistory)).toBe(true);
  });

  it("caps history at 30 messages", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const longHistory = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
    }));
    const res = await POST(makeRequest({ message: "Neue Frage", history: longHistory }));
    const data = await res.json();
    expect(data.updatedHistory.length).toBeLessThanOrEqual(30);
  });
});

// ─── Locale handling ──────────────────────────────────────────────────────────

describe("POST /api/admin/chat — locale", () => {
  it("uses German system prompt by default", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    await POST(makeRequest({ message: "Hallo" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("German");
  });

  it("uses English system prompt when locale is en", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    await POST(makeRequest({ message: "Hello", locale: "en" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("English");
  });
});

// ─── Tool-use loop ────────────────────────────────────────────────────────────

function toolUseResponse(toolName: string, toolInput: Record<string, unknown>, toolId = "tool-1") {
  return {
    id: "msg-2", type: "message", role: "assistant",
    content: [{ type: "tool_use", id: toolId, name: toolName, input: toolInput }],
    model: "claude-sonnet-4-6",
    stop_reason: "tool_use", stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 30 },
  };
}

describe("POST /api/admin/chat — tool-use loop", () => {
  it("executes tool and returns final reply after second call", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("get_stats", {}))
      .mockResolvedValueOnce(endTurnResponse("Es gibt 5 Events."));
    mockExecuteTool.mockResolvedValue({ events: 5 });

    const res = await POST(makeRequest({ message: "Stats?" }));
    const data = await res.json();
    expect(data.reply).toBe("Es gibt 5 Events.");
    expect(mockExecuteTool).toHaveBeenCalledWith("get_stats", {});
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("captures navigateTo from navigate tool", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("navigate", { path: "/admin/events" }))
      .mockResolvedValueOnce(endTurnResponse("Navigiere jetzt."));
    mockExecuteTool.mockResolvedValue({ navigateTo: "/admin/events" });

    const res = await POST(makeRequest({ message: "Zeige Events" }));
    const data = await res.json();
    expect(data.navigateTo).toBe("/admin/events");
  });

  it("returns tool error as tool_result with is_error when tool throws", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("get_event", { id: "missing" }))
      .mockResolvedValueOnce(endTurnResponse("Event nicht gefunden."));
    mockExecuteTool.mockRejectedValue(new Error("Event not found: missing"));

    const res = await POST(makeRequest({ message: "Event laden" }));
    const data = await res.json();
    expect(data.reply).toBe("Event nicht gefunden.");
    // Second call should receive the error tool result
    const secondCallMessages = mockCreate.mock.calls[1][0].messages;
    const lastUserMsg = secondCallMessages[secondCallMessages.length - 1];
    expect(lastUserMsg.role).toBe("user");
    expect(lastUserMsg.content[0].is_error).toBe(true);
  });

  it("handles multiple tools in a single response", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const multiToolResponse = {
      id: "msg-2", type: "message", role: "assistant",
      content: [
        { type: "tool_use", id: "tool-a", name: "get_stats", input: {} },
        { type: "tool_use", id: "tool-b", name: "list_events", input: {} },
      ],
      model: "claude-sonnet-4-6",
      stop_reason: "tool_use", stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 30 },
    };
    mockCreate
      .mockResolvedValueOnce(multiToolResponse)
      .mockResolvedValueOnce(endTurnResponse("Ergebnis."));
    mockExecuteTool.mockResolvedValue({ result: "ok" });

    const res = await POST(makeRequest({ message: "Alles" }));
    const data = await res.json();
    expect(data.reply).toBe("Ergebnis.");
    expect(mockExecuteTool).toHaveBeenCalledTimes(2);
  });

  it("breaks out of loop on unknown stop_reason", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce({
      id: "msg-1", type: "message", role: "assistant",
      content: [{ type: "text", text: "Fertig." }],
      model: "claude-sonnet-4-6",
      stop_reason: "max_tokens", stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    const res = await POST(makeRequest({ message: "Hallo" }));
    const data = await res.json();
    expect(data.reply).toBe("Fertig.");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
