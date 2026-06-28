import { describe, it, expect, vi, beforeEach } from "vitest"
import { processAdminQueues } from "../../lib/admin-queue"
import * as adminApi from "../../lib/admin-api"
import * as adminIntegrations from "../../lib/admin-integrations"

vi.mock("../../lib/admin-api", () => ({
  getAdminClient: vi.fn(),
  getEnv: vi.fn(),
}))

vi.mock("../../lib/admin-integrations", () => ({
  createDocuSignEnvelope: vi.fn(),
  createGoogleCalendarEvent: vi.fn(),
  createStripeInvoice: vi.fn(),
  sendResendEmail: vi.fn(),
  sendTwilioSms: vi.fn(),
}))

describe("processAdminQueues performance benchmark", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(adminApi.getEnv).mockReturnValue("mock-key")

    // Mock the integrations to simulate some delay
    const mockDelay = () => new Promise(resolve => setTimeout(resolve, 50))
    vi.mocked(adminIntegrations.sendResendEmail).mockImplementation(async () => {
      await mockDelay()
      return { id: "resend-123" }
    })
    vi.mocked(adminIntegrations.sendTwilioSms).mockImplementation(async () => {
      await mockDelay()
      return { sid: "twilio-123" }
    })
  })

  it("should process jobs efficiently", async () => {
    // Generate 50 jobs
    const jobs = Array.from({ length: 50 }, (_, i) => ({
      id: `job-${i}`,
      provider: i % 2 === 0 ? "resend" : "twilio",
      action: "test_action",
      target: `target-${i}@example.com`,
      request: { to: `target-${i}@example.com`, body: "test body" },
      created_by: "test",
    }))

    const mockSupabase = {
      rpc: vi.fn().mockImplementation(async (name) => {
        if (name === "claim_admin_notification_outbox") {
          return { data: [] }
        }
        if (name === "claim_admin_provider_jobs") {
          return { data: jobs }
        }
        return { data: [] }
      }),
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({}),
        }),
        insert: vi.fn().mockResolvedValue({}),
      }),
    }

    vi.mocked(adminApi.getAdminClient).mockReturnValue(mockSupabase as any)

    const start = performance.now()
    const result = await processAdminQueues({ jobLimit: 50 })
    const end = performance.now()

    const timeTaken = end - start
    console.log(`Processed ${result.jobs.claimed} jobs in ${timeTaken.toFixed(2)}ms`)

    expect(result.jobs.claimed).toBe(50)
    expect(result.jobs.sent).toBe(50)
  })
})
