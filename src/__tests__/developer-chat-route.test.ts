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

import { POST } from "@/app/api/admin/developer-chat/route";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

const mockAuth = auth as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/admin/developer-chat", {
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

describe("POST /api/admin/developer-chat — authorization", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when role is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user" } });
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when role is member", async () => {
    mockAuth.mockResolvedValue({ user: { role: "member" } });
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(401);
  });

  it("allows request when role is admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(200);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe("POST /api/admin/developer-chat — input validation", () => {
  it("returns 400 when message is missing", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeRequest({ history: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 when message is not a string", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeRequest({ message: 42 }));
    expect(res.status).toBe(400);
  });
});

// ─── Successful response ──────────────────────────────────────────────────────

describe("POST /api/admin/developer-chat — successful response", () => {
  it("returns reply text", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("The booking flow uses Stripe Checkout."));
    const res = await POST(makeRequest({ message: "Explain the booking flow" }));
    const data = await res.json();
    expect(data.reply).toBe("The booking flow uses Stripe Checkout.");
  });

  it("includes updatedHistory in response", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const res = await POST(makeRequest({ message: "Hello", history: [] }));
    const data = await res.json();
    expect(Array.isArray(data.updatedHistory)).toBe(true);
  });

  it("updatedHistory includes the user message and assistant reply", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("Architecture answer"));
    const res = await POST(makeRequest({ message: "What is the architecture?", history: [] }));
    const data = await res.json();
    const history = data.updatedHistory;
    const userMsg = history.find((m: { role: string }) => m.role === "user");
    expect(userMsg).toBeDefined();
    expect(userMsg.content).toBe("What is the architecture?");
  });

  it("caps history at 30 messages", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    const longHistory = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
    }));
    const res = await POST(makeRequest({ message: "New question", history: longHistory }));
    const data = await res.json();
    expect(data.updatedHistory.length).toBeLessThanOrEqual(30);
  });

  it("uses existing history in the Claude call", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("Answer"));
    const priorHistory = [{ role: "user", content: "Previous question" }, { role: "assistant", content: "Previous answer" }];
    await POST(makeRequest({ message: "Follow-up", history: priorHistory }));
    const callMessages = mockCreate.mock.calls[0][0].messages;
    expect(callMessages[0].content).toBe("Previous question");
    expect(callMessages[2].content).toBe("Follow-up");
  });
});

// ─── No tool use ──────────────────────────────────────────────────────────────

describe("POST /api/admin/developer-chat — no tool use", () => {
  it("does not include tools in the Claude call (read-only assistant)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("No tools here"));
    await POST(makeRequest({ message: "Hello" }));
    const callArgs = mockCreate.mock.calls[0][0];
    // Developer chat has no tools — tools key should be absent or empty
    expect(callArgs.tools).toBeUndefined();
  });

  it("response has no navigateTo field", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("Info"));
    const res = await POST(makeRequest({ message: "Info?" }));
    const data = await res.json();
    expect(data.navigateTo).toBeUndefined();
  });
});

// ─── Locale handling ──────────────────────────────────────────────────────────

describe("POST /api/admin/developer-chat — locale", () => {
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

  it("system prompt contains codebase documentation", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    await POST(makeRequest({ message: "What stack?" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("Next.js");
    expect(callArgs.system).toContain("Prisma");
    expect(callArgs.system).toContain("Stripe");
  });

  it("uses claude-sonnet-4-6 model", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValueOnce(endTurnResponse("OK"));
    await POST(makeRequest({ message: "Hello" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
  });
});
