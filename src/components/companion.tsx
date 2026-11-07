"use client";
import { useLocale } from "@/components/locale";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
  X,
  Utensils,
  Hand,
  CircleDot,
  ArrowRight,
  LoaderCircle,
  RotateCcw,
  Square,
  Leaf,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { usePet, accessHeaders } from "./store";
import { Loading } from "./shell";
import { PetRenderer } from "./pet/renderer";
import { activityLabels, transition } from "@/lib/pet/behavior";
import { actionSchema, type Action, type Message } from "@/lib/schema";
import { VoiceSession, type VoiceStatus } from "@/lib/voice";
type Service = {
  text: boolean;
  voice: boolean;
  protected: boolean;
  productionBlocked: boolean;
};
export default function Companion() {
  const { t, locale } = useLocale();
  const { data, ready, storageError, update, care, react } = usePet();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("off");
  const [muted, setMuted] = useState(false);
  const [today] = useState(() => Date.now());
  const abort = useRef<AbortController | null>(null);
  const session = useRef<VoiceSession | null>(null);
  const busyRef = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  const historyScroll = useRef<HTMLDivElement>(null);
  const actionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((r) => r.json())
      .then(setService)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(
    () => () => {
      abort.current?.abort();
      session.current?.stop();
      actionTimers.current.forEach(clearTimeout);
      window.speechSynthesis?.cancel();
    },
    [],
  );
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "smooth",
    });
    historyScroll.current?.scrollTo({
      top: historyScroll.current.scrollHeight,
      behavior: "smooth",
    });
  }, [data.messages, busy, history]);
  useEffect(() => {
    if (!history) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHistory(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable =
        drawer.current?.querySelectorAll<HTMLElement>("button,a[href]");
      if (!focusable?.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [history]);
  const addVoiceMessage = useCallback(
    (message: Message) =>
      update((s) => ({
        ...s,
        messages: s.messages.some((m) => m.id === message.id)
          ? s.messages
          : [...s.messages, message],
      })),
    [update],
  );
  function stopVoice() {
    session.current?.stop();
    session.current = null;
    react("idle");
  }
  async function toggleVoice() {
    if (voiceStatus !== "off") {
      stopVoice();
      return;
    }
    if (!data.pet) return;
    if (!service?.voice || service.productionBlocked) {
      setError(
        t("实时语音尚未配置。请先在服务器设置 OpenAI API Key 和访问保护。"),
      );
      return;
    }
    setError("");
    window.speechSynthesis?.cancel();
    const voice = new VoiceSession(
      (status) => {
        if (session.current === voice) setVoiceStatus(status);
      },
      (message) => {
        if (session.current === voice) addVoiceMessage(message);
      },
      (action) => {
        if (session.current === voice) react(action);
      },
      (message) => {
        if (session.current === voice) setError(message);
      },
    );
    session.current = voice;
    void voice
      .start({
        pet: data.pet,
        state: data.state,
        messages: data.messages.filter((m) => !m.failed).slice(-30),
        language: data.preferences.language,
        memories: data.preferences.memory
          ? data.memories.slice(-12).map((m) => m.content)
          : [],
      })
      .then(() => voice.mute(muted));
  }
  function perform(action: Action, mood?: typeof data.state.mood) {
    actionTimers.current.forEach(clearTimeout);
    transition(data.state.activity, action).forEach((a, i) => {
      if (i === 0) react(a, mood);
      else actionTimers.current.push(setTimeout(() => react(a, mood), 700));
    });
  }
  function careFor(kind: "feed" | "pet" | "play") {
    if (!data.pet) return;
    care(kind);
    setNotice(
      kind === "feed"
        ? t("已记录喂食状态。摄影原型暂不播放进食动作。")
        : kind === "play"
          ? t("已记录玩耍状态。摄影原型暂不支持捡球玩法。")
          : t("已记录抚摸互动。摄影原型暂不播放身体动作。"),
    );
    actionTimers.current.push(setTimeout(() => setNotice(""), 5000));
  }
  async function send(retry = false) {
    if (busyRef.current || !data.pet) return;
    const content = text.trim();
    if (!retry && !content) return;
    if (content.length > 4000) {
      setError(t("单条消息最多 4000 字。"));
      return;
    }
    stopVoice();
    window.speechSynthesis?.cancel();
    setError("");
    setNotice("");
    busyRef.current = true;
    setBusy(true);
    const previous = data.messages.filter((m) => !m.failed);
    const messages = retry
      ? previous
      : [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: "user" as const,
            content,
            modality: "text" as const,
            createdAt: new Date().toISOString(),
          },
        ];
    if (retry && messages.at(-1)?.role !== "user") {
      busyRef.current = false;
      setBusy(false);
      return;
    }
    const replyId = crypto.randomUUID();
    const controller = new AbortController();
    abort.current = controller;
    update((s) => ({
      ...s,
      messages,
      state: { ...s.state, lastInteractionAt: new Date().toISOString() },
    }));
    setText("");
    perform("listen");
    let answer = "";
    let done = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: accessHeaders(),
        body: JSON.stringify({
          pet: data.pet,
          messages: messages.slice(-30),
          state: data.state,
          language: data.preferences.language,
          memories: data.preferences.memory
            ? data.memories.slice(-12).map((m) => m.content)
            : [],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || t("消息发送失败。"));
      }
      if (!res.body) throw new Error(t("没有收到回复数据。"));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "delta") {
          answer += event.text;
          update((s) => {
            const existing = s.messages.find((m) => m.id === replyId);
            return {
              ...s,
              messages: existing
                ? s.messages.map((m) =>
                    m.id === replyId ? { ...m, content: answer } : m,
                  )
                : [
                    ...s.messages,
                    {
                      id: replyId,
                      role: "assistant",
                      content: answer,
                      modality: "text",
                      createdAt: new Date().toISOString(),
                    },
                  ],
            };
          });
        }
        if (event.type === "action") {
          const parsed = actionSchema.safeParse(event.action);
          if (parsed.success) perform(parsed.data, event.mood);
        }
        if (event.type === "done") done = true;
        if (event.type === "error") throw new Error(event.error);
      };
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) >= 0) {
            consume(buffer.slice(0, idx));
            buffer = buffer.slice(idx + 1);
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) consume(buffer);
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!done || !answer) throw new Error(t("回复中断，请重试。"));
      if (
        data.preferences.autoSpeech &&
        !muted &&
        "speechSynthesis" in window
      ) {
        const utterance = new SpeechSynthesisUtterance(answer);
        utterance.lang = /[\u4e00-\u9fff]/.test(answer) ? "zh-CN" : "en-US";
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      update((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === replyId ? { ...m, failed: true } : m,
        ),
      }));
      setError(
        controller.signal.aborted
          ? t("回复已停止，可以重试。")
          : e instanceof Error
            ? e.message
            : t("连接失败，请重试。"),
      );
      react("idle");
    } finally {
      busyRef.current = false;
      setBusy(false);
      abort.current = null;
      input.current?.focus();
    }
  }
  if (!ready) return <Loading />;
  if (!data.pet)
    return (
      <main className="center-page">
        <span className="eyebrow">YOUR LITTLE WORLD AWAITS</span>
        <h1>{t("给生活，多一点陪伴。")}</h1>
        <p>{t("先认识一下你的金毛伙伴吧。")}</p>
        <Link href="/adopt" className="button primary">
          {t("去领养")}
          <ArrowRight size={18} />
        </Link>
      </main>
    );
  const pet = data.pet;
  const recent = data.messages.slice(-2);
  const days = Math.max(
    1,
    Math.floor((today - Date.parse(pet.adoptedAt)) / 86400000) + 1,
  );
  return (
    <main className="companion-page">
      <section
        className="pet-stage"
        aria-label={t("{0} 的陪伴空间", { "0": pet.name })}
      >
        <PetRenderer
          action={data.state.activity}
          name={pet.name}
          onPet={() => careFor("pet")}
        />
        <div className="stage-top">
          <div>
            <span className="stage-eyebrow">YOUR EVERYDAY COMPANION</span>
            <h1>
              {pet.name}
              <span>{t("金毛寻回犬")}</span>
            </h1>
            <p>
              <span className="live-dot" />
              {t(activityLabels[data.state.activity])}
              {!process.env.NEXT_PUBLIC_PET_MODEL_URL && (
                <span className="intent-note">{t("\u00B7 行为状态")}</span>
              )}
            </p>
          </div>
          <Link
            className="glass-icon"
            href="/settings"
            aria-label={t("宠物设置")}
          >
            <Settings2 size={19} />
          </Link>
        </div>
        <div className="stage-aside">
          <span>JUST YOU & ME</span>
          <div />
          <span>{t("一起的第 {days} 天", { days })}</span>
        </div>
        <div className="stage-bottom">
          <div
            className="chat-overlay"
            ref={scroll}
            aria-live="polite"
            aria-busy={busy}
          >
            {data.preferences.subtitles &&
              recent.map((m) => (
                <div
                  className={`bubble ${m.role} ${m.failed ? "failed" : ""}`}
                  key={m.id}
                >
                  <span>
                    {m.role === "user" ? t("你") : pet.name}
                    {m.modality === "voice" ? t("\u00B7 语音") : ""}
                  </span>
                  <p>{m.content}</p>
                  {m.failed && <small>{t("回复未完成")}</small>}
                </div>
              ))}
            {busy &&
              !data.messages.some(
                (m) =>
                  m.role === "assistant" && m.id === data.messages.at(-1)?.id,
              ) && (
                <div className="thinking">
                  <span />
                  <span />
                  <span />
                  {pet.name}
                  {t("正在听\u2026")}
                </div>
              )}
          </div>
          {notice && (
            <p className="care-notice" role="status">
              {t(notice)}
            </p>
          )}
          <div className="care-controls">
            <button onClick={() => careFor("feed")}>
              <Utensils size={18} />
              <span>{t("喂食")}</span>
            </button>
            <span />
            <button onClick={() => careFor("pet")}>
              <Hand size={18} />
              <span>{t("摸摸")}</span>
            </button>
            <span />
            <button onClick={() => careFor("play")}>
              <CircleDot size={18} />
              <span>{t("陪它玩")}</span>
            </button>
          </div>
        </div>
      </section>
      <section className="conversation-bar" aria-label={t("与宠物聊天")}>
        <div className="conversation-heading">
          <span>
            <span
              className={`live-dot ${voiceStatus !== "off" ? "pulsing" : ""}`}
            />
            {voiceStatus === "connecting"
              ? t("正在连接语音\u2026")
              : voiceStatus === "listening"
                ? t("正在倾听 \u00B7 可以直接说话")
                : voiceStatus === "speaking"
                  ? t("{0} 正在说话", { "0": pet.name })
                  : t("和 {0} 待一会儿", { "0": pet.name })}
          </span>
          <button className="text-button" onClick={() => setHistory(true)}>
            <History size={15} />
            {t("对话记录")}
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="composer"
        >
          <input
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
            placeholder={t("今天过得怎么样？说给 {0} 听听\u2026", {
              "0": pet.name,
            })}
            aria-label={t("输入给宠物的消息")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.nativeEvent.isComposing)
                e.preventDefault();
            }}
          />
          <button
            type="button"
            className={`mic-button ${voiceStatus !== "off" ? "mic-active" : ""}`}
            onClick={() => void toggleVoice()}
            disabled={busy}
            aria-label={voiceStatus === "off" ? t("开启语音") : t("结束语音")}
            title={voiceStatus === "off" ? t("开启实时语音") : t("结束语音")}
          >
            {voiceStatus === "connecting" ? (
              <LoaderCircle className="spin" size={20} />
            ) : voiceStatus === "off" ? (
              <Mic size={20} />
            ) : (
              <MicOff size={20} />
            )}
          </button>
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label={t("停止回复")}
              onClick={() => abort.current?.abort()}
            >
              <Square size={15} />
            </button>
          ) : (
            <button
              className="send-button"
              type="submit"
              disabled={!text.trim()}
              aria-label={t("发送消息")}
            >
              <ArrowUp size={21} />
            </button>
          )}
        </form>
        <div className="composer-footer">
          <span>
            <Leaf size={12} />
            {service === null
              ? t("正在检查连接\u2026")
              : service.productionBlocked
                ? t("服务器尚需配置访问保护")
                : service.text
                  ? t("AI 服务已配置 \u00B7 本地保存")
                  : t("AI 尚未连接 \u00B7 需要配置 API Key")}
          </span>
          <div>
            {voiceStatus === "speaking" && (
              <button
                className="text-button"
                onClick={() => session.current?.interrupt()}
              >
                {t("打断")}
              </button>
            )}
            <button
              className="sound-button"
              onClick={() => {
                setMuted((v) => !v);
                session.current?.mute(!muted);
                if (!muted) window.speechSynthesis?.cancel();
              }}
              aria-label={muted ? t("开启声音") : t("静音")}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
        {(error || storageError) && (
          <div role="alert" className="inline-error">
            <span>{t(error || storageError)}</span>
            {error &&
              !busy &&
              data.messages.filter((m) => !m.failed).at(-1)?.role ===
                "user" && (
                <button onClick={() => void send(true)}>
                  <RotateCcw size={14} />
                  {t("重试")}
                </button>
              )}
            <Link href="/settings">{t("设置")}</Link>
          </div>
        )}
      </section>
      {history && (
        <div className="drawer-backdrop" onClick={() => setHistory(false)}>
          <section
            ref={drawer}
            className="history-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("对话记录")}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setHistory(false);
            }}
          >
            <div className="drawer-header">
              <div>
                <span className="eyebrow">LITTLE CONVERSATIONS</span>
                <h2>{t("和 {name} 的对话", { name: pet.name })}</h2>
              </div>
              <button
                autoFocus
                className="icon-button"
                onClick={() => setHistory(false)}
                aria-label={t("关闭对话记录")}
              >
                <X size={21} />
              </button>
            </div>
            <p className="drawer-note">
              {t("保存在当前浏览器，最近 500 条。")}
              <ChevronDown size={13} />
            </p>
            <div className="history-messages" ref={historyScroll}>
              {data.messages.length === 0 ? (
                <p className="empty-copy">
                  {t("还没有对话。先和它打个招呼吧。")}
                </p>
              ) : (
                data.messages.map((m) => (
                  <article key={m.id} className={`history-message ${m.role}`}>
                    <div>
                      <strong>{m.role === "user" ? t("你") : pet.name}</strong>
                      <time>
                        {new Intl.DateTimeFormat(
                          locale === "en" ? "en-US" : "zh-CN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Shanghai",
                          },
                        ).format(new Date(m.createdAt))}
                        {m.modality === "voice" ? t("\u00B7 语音") : ""}
                      </time>
                    </div>
                    <p>{m.content}</p>
                    {m.failed && (
                      <small className="error">{t("回复未完成")}</small>
                    )}
                  </article>
                ))
              )}
            </div>
            <Link href="/settings" className="drawer-settings">
              {t("管理对话和隐私")}
              <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}
