"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { LocaleProvider } from "./locale";
import { savedSchema, type Saved, type Action } from "@/lib/schema";
import {
  initialState,
  advanceState,
  interact,
  routine,
} from "@/lib/pet/behavior";
const key = "companion.v1";
const empty = (): Saved => ({
  pet: null,
  state: initialState(),
  messages: [],
  memories: [],
  preferences: {
    language: "auto",
    subtitles: true,
    autoSpeech: false,
    memory: false,
  },
});
type Store = {
  data: Saved;
  ready: boolean;
  storageError: string;
  update: (fn: (s: Saved) => Saved) => void;
  care: (kind: "feed" | "pet" | "play") => void;
  react: (action: Action, mood?: Saved["state"]["mood"]) => void;
  reset: () => void;
};
const Context = createContext<Store | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Saved>(empty);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    let next = empty();
    let error = "";
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = savedSchema.safeParse(JSON.parse(raw));
        if (parsed.success)
          next = { ...parsed.data, state: advanceState(parsed.data.state) };
        else error = "本地存档格式无效，已打开新的本地会话。";
      }
    } catch {
      error = "无法读取本地存档。请检查浏览器的存储权限。";
    }
    // Hydrate browser-only persistence after the server and initial client render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(next);
    setStorageError(error);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      queueMicrotask(() =>
        setStorageError("本地保存失败，可能已超出存储空间。请导出数据。"),
      );
    }
  }, [data, ready]);
  const update = useCallback(
    (fn: (s: Saved) => Saved) =>
      setData((s) => {
        const next = fn(s);
        return { ...next, messages: next.messages.slice(-500) };
      }),
    [],
  );
  const care = useCallback(
    (kind: "feed" | "pet" | "play") =>
      setData((s) => ({ ...s, state: interact(s.state, kind) })),
    [],
  );
  const react = useCallback(
    (activity: Action, mood?: Saved["state"]["mood"]) =>
      setData((s) => ({
        ...s,
        state: { ...s.state, activity, mood: mood ?? s.state.mood },
      })),
    [],
  );
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(
      () =>
        setData((s) => {
          if (!s.pet) return s;
          const state = advanceState(s.state);
          return {
            ...s,
            state: { ...state, activity: routine(state, s.pet.personality) },
          };
        }),
      60000,
    );
    return () => clearInterval(timer);
  }, [ready]);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setData(empty());
  }, []);
  return (
    <LocaleProvider>
      <Context.Provider
        value={{ data, ready, storageError, update, care, react, reset }}
      >
        {children}
      </Context.Provider>
    </LocaleProvider>
  );
}
export function usePet() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing pet provider");
  return context;
}
export function accessHeaders() {
  return {
    "Content-Type": "application/json",
    ...(sessionStorage.getItem("companion.access")
      ? {
          Authorization: `Bearer ${sessionStorage.getItem("companion.access")}`,
        }
      : {}),
  };
}
