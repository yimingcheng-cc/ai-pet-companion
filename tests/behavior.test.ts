import { describe, it, expect } from "vitest";
import {
  initialState,
  advanceState,
  interact,
  transition,
  routine,
} from "../src/lib/pet/behavior";
import { partialReply, instructions } from "../src/lib/ai/personality";
import {
  chatSchema,
  petSchema,
  replySchema,
  savedSchema,
} from "../src/lib/schema";
const now = "2026-11-07T00:00:00.000Z";
const pet = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  name: "Milo",
  personality: "friendly" as const,
  voice: "marin" as const,
  adoptedAt: now,
};
describe("care and independent routine", () => {
  it("persists incremental feeding with a timestamp", () => {
    const s = interact(initialState(now), "feed", now);
    expect(s.satiety).toBe(85);
    expect(s.lastFedAt).toBe(now);
    expect(s.activity).toBe("eat");
  });
  it("clamps feeding and play to safe ranges", () => {
    expect(
      interact({ ...initialState(now), satiety: 95 }, "feed", now).satiety,
    ).toBe(100);
    expect(
      interact({ ...initialState(now), energy: 5 }, "play", now).energy,
    ).toBe(0);
  });
  it("restores energy and caps absence effects without punishment", () => {
    const s = advanceState(initialState(now), "2030-01-01T00:00:00.000Z");
    expect(s.satiety).toBeGreaterThanOrEqual(20);
    expect(s.energy).toBe(100);
    expect(s.mood).toBe("calm");
  });
  it("ignores negative elapsed time", () => {
    expect(
      advanceState(initialState(now), "2026-11-06T00:00:00.000Z").satiety,
    ).toBe(65);
  });
  it("wakes before responding from sleep", () => {
    expect(transition("sleep", "listen")).toEqual(["wake_up", "listen"]);
    expect(transition("idle", "play")).toEqual(["play"]);
  });
  it("supports resting and sleepy autonomous behavior without an LLM", () => {
    expect(routine({ ...initialState(now), energy: 20 }, "friendly")).toBe(
      "sleep",
    );
    expect(routine(initialState(now), "independent")).toBe("lie_down");
  });
});
describe("structured streaming", () => {
  it("streams Chinese and escaped quotes safely", () => {
    expect(partialReply('{"reply":"今天辛苦啦，')).toBe("今天辛苦啦，");
    expect(partialReply('{"reply":"hi \\"Milo\\"","action":"listen"}')).toBe(
      'hi "Milo"',
    );
  });
  it("waits for incomplete Unicode escapes", () => {
    expect(partialReply('{"reply":"hello \\u4e')).toBe("hello ");
    expect(partialReply('{"reply":"hello \\u4e16')).toBe("hello 世");
  });
  it("does not expose metadata as dialogue", () => {
    expect(partialReply('{"action":"play"')).toBe("");
    expect(partialReply('{"reply":"Hi","action":"eat"}')).toBe("Hi");
  });
  it("blocks model-proposed arbitrary actions", () => {
    expect(
      replySchema.safeParse({
        reply: "hi",
        action: "delete_database",
        mood: "happy",
      }).success,
    ).toBe(false);
  });
  it("personality influences instructions beyond greetings", () => {
    const a = instructions(pet, initialState(now));
    const b = instructions(
      { ...pet, personality: "independent" },
      initialState(now),
    );
    expect(a).not.toBe(b);
    expect(b).toContain("Speak sparingly");
    expect(a).toContain("Chinese");
  });
});
describe("input and storage validation", () => {
  it("rejects blank adoption names and unavailable personalities", () => {
    expect(petSchema.safeParse({ ...pet, name: "   " }).success).toBe(false);
    expect(petSchema.safeParse({ ...pet, personality: "angry" }).success).toBe(
      false,
    );
  });
  it("round trips complete browser data", () => {
    const data = {
      pet,
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
    expect(savedSchema.parse(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
  it("rejects invalid state bounds and oversized text", () => {
    const payload = {
      pet,
      state: initialState(now),
      messages: [
        { id: "a", role: "user", content: "x".repeat(4001), createdAt: now },
      ],
    };
    expect(chatSchema.safeParse(payload).success).toBe(false);
    expect(
      chatSchema.safeParse({
        ...payload,
        state: { ...initialState(now), energy: 101 },
      }).success,
    ).toBe(false);
  });
  it("requires the last turn to be from the user", () => {
    expect(
      chatSchema.safeParse({
        pet,
        state: initialState(now),
        messages: [
          { id: "a", role: "assistant", content: "hi", createdAt: now },
        ],
      }).success,
    ).toBe(false);
  });
});
