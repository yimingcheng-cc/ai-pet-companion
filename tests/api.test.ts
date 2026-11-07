import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initialState } from "../src/lib/pet/behavior";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    responses = { create: mocks.create };
  },
}));
import { POST } from "../src/app/api/chat/route";
import { POST as voice } from "../src/app/api/voice/session/route";
import { GET } from "../src/app/api/status/route";
import { boundedJson } from "../src/lib/server";
const now = "2026-11-07T00:00:00.000Z";
const payload = {
  pet: {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Milo",
    personality: "friendly",
    voice: "marin",
    adoptedAt: now,
  },
  state: initialState(now),
  messages: [
    {
      id: "user1",
      role: "user",
      content: "今天好累。",
      createdAt: now,
      modality: "text",
    },
  ],
  memories: [],
};
function request(body: unknown, extra: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
}
async function* events(raw: string) {
  for (const delta of [raw.slice(0, 20), raw.slice(20)])
    yield { type: "response.output_text.delta", delta };
}
beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("APP_ACCESS_TOKEN", "");
  vi.stubEnv("NODE_ENV", "test");
  mocks.create.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("chat API (provider is mocked, not a live AI acceptance test)", () => {
  it("returns honest setup status and never produces a fake reply", async () => {
    const res = await POST(request(payload));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "SETUP_REQUIRED" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects invalid input before provider calls", async () => {
    expect((await POST(request({ ...payload, messages: [] }))).status).toBe(
      400,
    );
  });
  it("rejects a foreign Origin", async () => {
    expect(
      (await POST(request(payload, { Origin: "https://evil.example" }))).status,
    ).toBe(403);
  });
  it("requires configured private access token", async () => {
    vi.stubEnv("APP_ACCESS_TOKEN", "secret");
    expect((await POST(request(payload))).status).toBe(401);
  });
  it("blocks unprotected production cost endpoints", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(request(payload))).status).toBe(503);
  });
  it("streams validated model content and matching action", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.create.mockResolvedValue(
      events(
        JSON.stringify({
          reply: "那就歇一会儿，我陪你。",
          action: "listen",
          mood: "calm",
        }),
      ),
    );
    const res = await POST(request(payload));
    expect(res.status).toBe(200);
    const lines = (await res.text())
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(
      lines
        .filter((l) => l.type === "delta")
        .map((l) => l.text)
        .join(""),
    ).toBe("那就歇一会儿，我陪你。");
    expect(lines).toContainEqual({
      type: "action",
      action: "listen",
      mood: "calm",
    });
    expect(lines.at(-1)).toEqual({ type: "done" });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      store: false,
      stream: true,
    });
  });
  it("does not execute invalid model actions and marks the stream failed", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.create.mockResolvedValue(
      events('{"reply":"hello","action":"delete_data","mood":"happy"}'),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(request(payload));
    const body = await res.text();
    expect(body).toContain('"type":"error"');
    expect(body).not.toContain('"type":"action"');
    expect(body).not.toContain('"type":"done"');
    log.mockRestore();
  });
  it("reports provider authentication failure without leaking secrets", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.create.mockRejectedValue({ status: 401, message: "test-key" });
    const res = await POST(request(payload));
    expect(res.status).toBe(502);
    const body = await res.text();
    expect(body).toContain("凭证无效");
    expect(body).not.toContain("test-key");
  });
  it("reports interrupted provider output as an error", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.create.mockResolvedValue(
      (async function* () {
        yield { type: "response.incomplete" };
      })(),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(request(payload));
    expect(await res.text()).toContain('"type":"error"');
    log.mockRestore();
  });
  it("status reports availability without revealing configuration values", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const res = GET();
    const body = await res.json();
    expect(body.text).toBe(true);
    expect(JSON.stringify(body)).not.toContain("test-key");
  });
  it("voice reports missing credentials without fake microphone success", async () => {
    const res = await voice(
      request({ ...payload, sdp: "v=0\r\n" + "x".repeat(30) }),
    );
    expect(res.status).toBe(503);
  });
  it("rejects oversized request bodies with and without content length", async () => {
    await expect(
      boundedJson(request({ value: "x".repeat(200) }), 20),
    ).rejects.toThrow("请求过大");
    await expect(
      boundedJson(request({}, { "content-length": "999999" })),
    ).rejects.toThrow("请求过大");
  });
});

describe("incoming browser origin behind the Next bind address", () => {
  it("accepts a matching incoming host while still reporting missing credentials", async () => {
    const req = new Request("http://0.0.0.0:3000/api/chat", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    expect((await POST(req)).status).toBe(503);
  });
  it("rejects mismatched ports and invalid origins", async () => {
    expect(
      (
        await POST(
          request(payload, {
            host: "localhost:3000",
            origin: "http://localhost:3001",
          }),
        )
      ).status,
    ).toBe(403);
    expect((await POST(request(payload, { origin: "null" }))).status).toBe(403);
  });
});

describe("production setup without service credentials", () => {
  it("keeps local-only status available with no AI or database configuration", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const status = await GET().json();
    expect(status).toMatchObject({
      text: false,
      voice: false,
      productionBlocked: false,
      storage: "local",
    });
    const res = await POST(request(payload));
    expect(await res.json()).toMatchObject({ code: "SETUP_REQUIRED" });
  });
  it("protects paid production calls if a key exists but no access token is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    expect(await GET().json()).toMatchObject({ productionBlocked: true });
    const res = await POST(request(payload));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("APP_ACCESS_TOKEN");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
