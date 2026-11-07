// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "../src/components/store";
import { Header } from "../src/components/shell";
import Adopt from "../src/app/adopt/page";
import Settings from "../src/app/settings/page";
import { translate } from "../src/lib/i18n/translate";
import { instructions } from "../src/lib/ai/personality";
import { initialState } from "../src/lib/pet/behavior";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/adopt",
}));
vi.mock("next/image", () => ({ default: () => null }));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
describe("V1.1 independent interface and conversation languages", () => {
  it("switches adoption UI to English and keeps preference after remount", async () => {
    const user = userEvent.setup();
    const view = render(
      <Provider>
        <Header />
        <Adopt />
      </Provider>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Switch to English" }),
    );
    expect(
      await screen.findByRole("heading", { name: "It starts with a name." }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Bring them home" }),
    ).toBeTruthy();
    expect(localStorage.getItem("companion.locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    view.unmount();
    render(
      <Provider>
        <Header />
        <Adopt />
      </Provider>,
    );
    expect(
      await screen.findByRole("heading", { name: "It starts with a name." }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "切换到中文" }));
    expect(
      await screen.findByRole("heading", { name: "从一个名字开始。" }),
    ).toBeTruthy();
  });
  it("persists conversation language independently of interface language", async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <Settings />
      </Provider>,
    );
    await user.selectOptions(await screen.findByLabelText("对话语言"), "en");
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("companion.v1")!).preferences.language,
      ).toBe("en"),
    );
    expect(document.documentElement.lang).toBe("zh-CN");
    await user.selectOptions(screen.getByLabelText("界面语言"), "en");
    expect(await screen.findByLabelText("Conversation language")).toBeTruthy();
    expect(
      screen.getByText(
        "Cloud sync is not connected. Data stays in this browser.",
      ).textContent,
    ).toBeTruthy();
  });
  it("interpolates identity without translating names or saved content", () => {
    expect(translate("en", "和 {name} 的对话", { name: "小麦" })).toBe(
      "Conversations with 小麦",
    );
    expect(translate("zh", "{name} 在等你。", { name: "Milo" })).toBe(
      "Milo 在等你。",
    );
  });
  it("sends a validated language preference into the shared personality instructions", () => {
    const pet = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      name: "小麦",
      personality: "friendly" as const,
      voice: "marin" as const,
      adoptedAt: new Date().toISOString(),
    };
    expect(instructions(pet, initialState(), [], "en")).toContain(
      "selected English",
    );
    expect(instructions(pet, initialState(), [], "zh")).toContain(
      "selected Chinese",
    );
    expect(instructions(pet, initialState())).toContain(
      "language the owner uses",
    );
  });
});
