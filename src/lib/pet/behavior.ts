import type { Action, PetState, Pet } from "../schema";
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function initialState(now = new Date().toISOString()): PetState {
  return {
    energy: 75,
    satiety: 65,
    mood: "calm",
    activity: "idle",
    lastFedAt: null,
    lastPlayedAt: null,
    lastInteractionAt: null,
    updatedAt: now,
  };
}
export function advanceState(
  state: PetState,
  now = new Date().toISOString(),
): PetState {
  const hours = Math.max(
    0,
    Math.min(24, (Date.parse(now) - Date.parse(state.updatedAt)) / 3600000),
  );
  return {
    ...state,
    energy: clamp(state.energy + hours * 3),
    satiety: Math.max(20, clamp(state.satiety - hours * 2)),
    updatedAt: now,
  };
}
export function interact(
  state: PetState,
  kind: "feed" | "pet" | "play",
  now = new Date().toISOString(),
): PetState {
  const s = advanceState(state, now);
  if (kind === "feed")
    return {
      ...s,
      satiety: clamp(s.satiety + 20),
      mood: "happy",
      activity: "eat",
      lastFedAt: now,
      lastInteractionAt: now,
    };
  if (kind === "play")
    return {
      ...s,
      energy: clamp(s.energy - 12),
      mood: "happy",
      activity: "play",
      lastPlayedAt: now,
      lastInteractionAt: now,
    };
  return { ...s, mood: "happy", activity: "tail_wag", lastInteractionAt: now };
}
export function routine(
  state: PetState,
  personality: Pet["personality"],
  now = Date.now(),
): Action {
  if (state.energy < 25) return "sleep";
  const quiet = state.lastInteractionAt
    ? now - Date.parse(state.lastInteractionAt)
    : 120000;
  if (quiet < 30000) return state.activity;
  if (personality === "independent" || personality === "calm")
    return "lie_down";
  return Math.floor(now / 60000) % 3 === 0 ? "look_at_user" : "idle";
}
export function transition(current: Action, next: Action): Action[] {
  return current === "sleep" && next !== "sleep" ? ["wake_up", next] : [next];
}
export const activityLabels: Record<Action, string> = {
  idle: "安静地陪着你",
  look_at_user: "望向你",
  blink: "眨了眨眼",
  sit: "乖乖坐着",
  lie_down: "正在休息",
  sleep: "打了个小盹",
  wake_up: "慢慢醒来",
  walk: "想走一走",
  tail_wag: "开心地摇尾巴",
  eat: "正在享用食物",
  play: "想和你玩一会儿",
  happy: "心情很好",
  curious: "有点好奇",
  listen: "认真听你说",
  speak: "正在和你说话",
};
