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

vi.mock("@/lib/chat-tools", () => ({
  CHAT_TOOLS: [],
  executeTool: vi.fn(),
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
