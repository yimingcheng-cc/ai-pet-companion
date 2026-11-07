// @vitest-environment jsdom
import { createElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "../src/components/store";
import Adopt from "../src/app/adopt/page";
import Companion from "../src/components/companion";
import Memories from "../src/app/memories/page";
import { initialState } from "../src/lib/pet/behavior";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) =>
    createElement("div", { role: "img", "aria-label": alt }),
}));
vi.mock("../src/components/pet/renderer", () => ({
  PetRenderer: ({ name, onPet }: { name: string; onPet: () => void }) =>
    createElement("button", { onClick: onPet }, `轻轻摸摸 ${name}`),
}));
const now = "2026-11-07T00:00:00.000Z";
const saved = {
  pet: {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Milo",
    personality: "friendly",
    voice: "marin",
    adoptedAt: now,
  },
  state: initialState(now),
  messages: [],
  memories: [],
  preferences: {
    language: "auto",
    subtitles: true,
    autoSpeech: false,
    memory: false,
  },
};
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  push.mockClear();
  Element.prototype.scrollTo = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          text: false,
          voice: false,
          protected: false,
          productionBlocked: false,
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("browser-component behavior (DOM simulation, not browser QA)", () => {
  it("adopts a named pet and restores it after remount", async () => {
    const user = userEvent.setup();
    const view = render(
      <Provider>
        <Adopt />
      </Provider>,
    );
    const field = await screen.findByLabelText("你想叫它什么？", {
      exact: false,
    });
    await user.clear(field);
    await user.type(field, "小麦");
    await user.click(screen.getByRole("button", { name: "带它回家" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/pet"));
    const stored = JSON.parse(localStorage.getItem("companion.v1")!);
    expect(stored.pet.name).toBe("小麦");
    view.unmount();
    render(
      <Provider>
        <Adopt />
      </Provider>,
    );
    expect(await screen.findByText("小麦 在等你。")).toBeTruthy();
  });
  it("care interactions update persisted state without inventing AI dialogue", async () => {
    localStorage.setItem("companion.v1", JSON.stringify(saved));
    const user = userEvent.setup();
    render(
      <Provider>
        <Companion />
      </Provider>,
    );
    await user.click(await screen.findByRole("button", { name: "喂食" }));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("companion.v1")!);
      expect(stored.state.lastFedAt).toBeTruthy();
      expect(stored.state.activity).toBe("eat");
      expect(stored.messages).toHaveLength(0);
    });
  });
  it("displays a missing-key failure and retry while preserving the user message", async () => {
    localStorage.setItem("companion.v1", JSON.stringify(saved));
    const fetcher = vi.mocked(fetch);
    fetcher.mockImplementation(async (url) =>
      String(url) === "/api/status"
        ? Response.json({
            text: false,
            voice: false,
            protected: false,
            productionBlocked: false,
          })
        : Response.json(
            { error: "尚未连接 AI。请配置 API Key。" },
            { status: 503 },
          ),
    );
    const user = userEvent.setup();
    render(
      <Provider>
        <Companion />
      </Provider>,
    );
    await user.type(
      await screen.findByRole("textbox", { name: "输入给宠物的消息" }),
      "今天好累",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "重试" })).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem("companion.v1")!);
    expect(stored.messages).toHaveLength(1);
    expect(stored.messages[0].role).toBe("user");
    expect(stored.messages[0].content).toBe("今天好累");
  });
  it("does not request microphone access when voice is unconfigured", async () => {
    localStorage.setItem("companion.v1", JSON.stringify(saved));
    const mic = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mic },
      configurable: true,
    });
    const user = userEvent.setup();
    render(
      <Provider>
        <Companion />
      </Provider>,
    );
    await user.click(await screen.findByRole("button", { name: "开启语音" }));
    expect(mic).not.toHaveBeenCalled();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "实时语音尚未配置",
    );
  });
  it("saves and deletes a memory only after explicit user interaction", async () => {
    localStorage.setItem("companion.v1", JSON.stringify(saved));
    const user = userEvent.setup();
    render(
      <Provider>
        <Memories />
      </Provider>,
    );
    await user.type(
      await screen.findByLabelText("告诉它一件你愿意让它记住的小事"),
      "叫我哥哥吧",
    );
    await user.click(screen.getByRole("button", { name: "保存记忆" }));
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("companion.v1")!).memories[0].content,
      ).toBe("叫我哥哥吧"),
    );
    await user.click(
      screen.getByRole("button", { name: "删除记忆：叫我哥哥吧" }),
    );
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("companion.v1")!).memories,
      ).toHaveLength(0),
    );
  });
});

describe("streaming client and recovery (test fixtures only)", () => {
  function answer() {
    return new Response(
      new ReadableStream({
        start(c) {
          const encoder = new TextEncoder();
          const content = [
            { type: "delta", text: "歇一会儿，" },
            { type: "delta", text: "我陪你。" },
            { type: "action", action: "listen", mood: "calm" },
            { type: "done" },
          ]
            .map((x) => JSON.stringify(x) + "\n")
            .join("");
          const bytes = encoder.encode(content);
          c.enqueue(bytes.slice(0, 29));
          c.enqueue(bytes.slice(29, 43));
          c.enqueue(bytes.slice(43));
          c.close();
        },
      }),
      { headers: { "Content-Type": "application/x-ndjson" } },
    );
  }
  it("renders streamed UTF-8 reply fragments and applies the validated reaction", async () => {
    localStorage.setItem("companion.v1", JSON.stringify(saved));
    vi.mocked(fetch).mockImplementation(async (url) =>
      String(url) === "/api/status"
        ? Response.json({ text: true, voice: true, productionBlocked: false })
        : answer(),
    );
    const user = userEvent.setup();
    render(
      <Provider>
        <Companion />
      </Provider>,
    );
    await user.type(
      await screen.findByRole("textbox", { name: "输入给宠物的消息" }),
      "今天有点累",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));
    expect(await screen.findByText("歇一会儿，我陪你。")).toBeTruthy();
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("companion.v1")!);
      expect(stored.messages).toHaveLength(2);
      expect(stored.state.activity).toBe("listen");
      expect(stored.messages[1].content).toBe("歇一会儿，我陪你。");
    });
  });
  it("retries without duplicating the original user turn", async () => {
    localStorage.setItem("companion.v1", JSON.stringify(saved));
    let attempts = 0;
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (String(url) === "/api/status")
        return Response.json({
          text: true,
          voice: true,
          productionBlocked: false,
        });
      attempts++;
      return attempts === 1
        ? Response.json({ error: "暂时无法连接 AI。" }, { status: 502 })
        : answer();
    });
    const user = userEvent.setup();
    render(
      <Provider>
        <Companion />
      </Provider>,
    );
    await user.type(
      await screen.findByRole("textbox", { name: "输入给宠物的消息" }),
      "我回来了",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));
    await user.click(await screen.findByRole("button", { name: "重试" }));
    expect(await screen.findByText("歇一会儿，我陪你。")).toBeTruthy();
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("companion.v1")!);
      expect(
        stored.messages.filter((m: { role: string }) => m.role === "user"),
      ).toHaveLength(1);
      expect(
        stored.messages.filter((m: { role: string }) => m.role === "assistant"),
      ).toHaveLength(1);
    });
    expect(attempts).toBe(2);
  });
});
