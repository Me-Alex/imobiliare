import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

// Mock the dependencies
vi.mock("@/lib/supabase", () => ({
  supabaseUrl: "https://test.supabase.co",
  supabaseAnonKey: "test-anon-key",
}))

vi.mock("@/lib/admin-api", () => ({
  getEnv: vi.fn((key) => {
    if (key === "RATE_LIMIT_SALT") return "test-salt"
    return null
  }),
}))

describe("rateLimit", () => {
  const originalFetch = global.fetch

  beforeAll(() => {
    vi.stubGlobal("crypto", {
      subtle: {
        digest: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 15, 16]).buffer)
      }
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  function createMockRequest(headers: Record<string, string> = {}) {
    // Return a Request object mock
    const mockHeaders = new Headers(headers)
    return {
      headers: mockHeaders,
    } as unknown as Request
  }

  it("should return null if rate limit is allowed", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        allowed: true,
        retry_after: 0,
        count: 5,
        reset_at: Date.now() + 60000
      })
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest({ "cf-connecting-ip": "1.2.3.4" })
    const result = await rateLimit(req, "test-scope")

    expect(result).toBeNull()

    // With mocked crypto returning [1, 2, 15, 16], hash is "01020f10"
    expect(global.fetch).toHaveBeenCalledWith(
      "https://test.supabase.co/rest/v1/rpc/check_rate_limit",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "apikey": "test-anon-key",
          "Authorization": "Bearer test-anon-key"
        }),
        body: JSON.stringify({
          p_scope: "test-scope",
          p_identifier_hash: "01020f10",
          p_limit: 30,
          p_window_seconds: 60
        })
      })
    )
  })

  it("should return 429 response if rate limit is exceeded", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        allowed: false,
        retry_after: 30,
        count: 30,
        reset_at: Date.now() + 60000
      })
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest({ "cf-connecting-ip": "1.2.3.4" })
    const result = await rateLimit(req, "test-scope", 30)

    expect(result).toBeInstanceOf(NextResponse)
    expect(result?.status).toBe(429)

    // Extract headers (NextResponse headers API)
    const retryAfter = result?.headers.get("Retry-After")
    expect(retryAfter).toBe("30")

    const limit = result?.headers.get("X-RateLimit-Limit")
    expect(limit).toBe("30")

    const remaining = result?.headers.get("X-RateLimit-Remaining")
    expect(remaining).toBe("0")
  })

  it("should fallback to 503 response if fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    const req = createMockRequest()
    const result = await rateLimit(req, "test-scope")

    expect(result).toBeInstanceOf(NextResponse)
    expect(result?.status).toBe(503)
    expect(result?.headers.get("Retry-After")).toBe("30")
  })

  it("should fallback to 503 response if fetch returns non-ok", async () => {
    const mockResponse = {
      ok: false
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest()
    const result = await rateLimit(req, "test-scope")

    expect(result).toBeInstanceOf(NextResponse)
    expect(result?.status).toBe(503)
  })

  it("should fallback to 503 response if JSON parsing fails", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON"))
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest()
    const result = await rateLimit(req, "test-scope")

    expect(result).toBeInstanceOf(NextResponse)
    expect(result?.status).toBe(503)
  })

  it("should fallback to 503 response if payload format is invalid", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue("not-an-object")
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest()
    const result = await rateLimit(req, "test-scope")

    expect(result).toBeInstanceOf(NextResponse)
    expect(result?.status).toBe(503)
  })

  it("should handle IP from x-forwarded-for header", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        allowed: true,
      })
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest({ "x-forwarded-for": "10.0.0.1, 10.0.0.2" })
    await rateLimit(req, "test-scope")

    expect(global.fetch).toHaveBeenCalled()

    const cryptoDigestSpy = global.crypto.subtle.digest as import("vitest").Mock

    // We check that the encoded string matched the expected payload logic (`${salt}:${ip}`)
    // "test-salt:10.0.0.1" -> TextEncoder gives a Uint8Array
    const expectedBuffer = new TextEncoder().encode("test-salt:10.0.0.1")

    expect(cryptoDigestSpy).toHaveBeenCalledWith(
      "SHA-256",
      expectedBuffer
    )
  })

  it("should fallback to local if no IP headers present", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        allowed: true,
      })
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const req = createMockRequest()
    await rateLimit(req, "test-scope")

    expect(global.fetch).toHaveBeenCalled()

    const cryptoDigestSpy = global.crypto.subtle.digest as import("vitest").Mock
    const expectedBuffer = new TextEncoder().encode("test-salt:local")

    expect(cryptoDigestSpy).toHaveBeenCalledWith(
      "SHA-256",
      expectedBuffer
    )
  })
})
