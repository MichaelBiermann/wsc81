import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/auth", () => ({ auth: vi.fn() }));

// Mock @vercel/blob
vi.mock("@vercel/blob", () => ({ put: vi.fn() }));

// Mock global fetch for url mode
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/admin/images/route";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import type { NextRequest } from "next/server";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockPut = put as ReturnType<typeof vi.fn>;
const adminSession = { user: { role: "admin" } };

beforeEach(() => vi.clearAllMocks());

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeFileRequest(file: File | null, url = "http://localhost/api/admin/images?mode=file"): NextRequest {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return new Request(url, { method: "POST", body: formData }) as unknown as NextRequest;
}

function makeUrlRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/admin/images?mode=url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeFetchResponse(ok: boolean, contentType: string, byteLength: number) {
  return {
    ok,
    headers: { get: (h: string) => h === "content-type" ? contentType : null },
    arrayBuffer: async () => new ArrayBuffer(byteLength),
  };
}

// ─── Authorization ────────────────────────────────────────────────────────────

describe("POST /api/admin/images — authorization", () => {
  it("returns 401 when session is missing", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeFileRequest(new File(["x"], "img.png", { type: "image/png" })));
    expect(res.status).toBe(401);
  });

  it("returns 401 when role is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user" } });
    const res = await POST(makeFileRequest(new File(["x"], "img.png", { type: "image/png" })));
    expect(res.status).toBe(401);
  });
});

// ─── File mode ────────────────────────────────────────────────────────────────

describe("POST /api/admin/images — file mode", () => {
  it("returns 400 when no file is attached", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeFileRequest(null));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No file provided");
  });

  it("returns 400 for disallowed MIME type", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_type");
  });

  it("returns 400 when file exceeds 5 MB", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const bigContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([bigContent], "big.png", { type: "image/png" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("too_large");
  });

  it("accepts exactly 5 MB file", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.png" });
    const content = new Uint8Array(5 * 1024 * 1024);
    const file = new File([content], "exact.png", { type: "image/png" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(200);
  });

  it("uploads PNG and returns blob URL", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/test.png" });
    const file = new File(["data"], "photo.png", { type: "image/png" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://blob.vercel.com/test.png");
  });

  it("uploads WebP successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.webp" });
    const file = new File(["data"], "photo.webp", { type: "image/webp" });
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(200);
  });

  it("maps jpeg extension to jpg in filename", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.jpg" });
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    await POST(makeFileRequest(file));
    const filename = mockPut.mock.calls[0][0] as string;
    expect(filename).toMatch(/\.jpg$/);
    expect(filename).not.toMatch(/\.jpeg$/);
  });

  it("uses admin-images/ prefix in filename", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.png" });
    const file = new File(["data"], "photo.png", { type: "image/png" });
    await POST(makeFileRequest(file));
    const filename = mockPut.mock.calls[0][0] as string;
    expect(filename).toMatch(/^admin-images\//);
  });

  it("calls put with access: public", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.png" });
    const file = new File(["data"], "photo.png", { type: "image/png" });
    await POST(makeFileRequest(file));
    expect(mockPut).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({ access: "public" }),
    );
  });
});

// ─── URL mode ─────────────────────────────────────────────────────────────────

describe("POST /api/admin/images — url mode", () => {
  it("returns 400 when no URL is provided", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeUrlRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No URL provided");
  });

  it("returns 400 when URL is not a string", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeUrlRequest({ url: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when remote fetch fails (network error)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockRejectedValue(new Error("Network error"));
    const res = await POST(makeUrlRequest({ url: "https://example.com/img.png" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("fetch_failed");
  });

  it("returns 400 when remote fetch returns non-OK status", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue(makeFetchResponse(false, "image/png", 100));
    const res = await POST(makeUrlRequest({ url: "https://example.com/img.png" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("fetch_failed");
  });

  it("returns 400 for disallowed content-type from remote URL", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue(makeFetchResponse(true, "application/pdf", 100));
    const res = await POST(makeUrlRequest({ url: "https://example.com/file.pdf" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_type");
  });

  it("returns 400 when remote image exceeds 5 MB", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue(makeFetchResponse(true, "image/png", 5 * 1024 * 1024 + 1));
    const res = await POST(makeUrlRequest({ url: "https://example.com/big.png" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("too_large");
  });

  it("uploads PNG from URL and returns blob URL", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue(makeFetchResponse(true, "image/png", 1024));
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/remote.png" });
    const res = await POST(makeUrlRequest({ url: "https://example.com/photo.png" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://blob.vercel.com/remote.png");
  });

  it("handles content-type with charset parameter", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue(makeFetchResponse(true, "image/jpeg; charset=utf-8", 1024));
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.jpg" });
    const res = await POST(makeUrlRequest({ url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(200);
  });

  it("maps jpeg to jpg extension in filename", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue(makeFetchResponse(true, "image/jpeg", 1024));
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.jpg" });
    await POST(makeUrlRequest({ url: "https://example.com/photo.jpg" }));
    const filename = mockPut.mock.calls[0][0] as string;
    expect(filename).toMatch(/\.jpg$/);
  });

  it("falls back to image/jpeg when content-type header is missing", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => new ArrayBuffer(1024),
    });
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/img.jpg" });
    const res = await POST(makeUrlRequest({ url: "https://example.com/photo" }));
    expect(res.status).toBe(200);
  });
});
