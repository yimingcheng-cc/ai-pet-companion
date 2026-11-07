"use client";
import type { Message, Action, Pet, PetState } from "./schema";
import { accessHeaders } from "@/components/store";
export type VoiceStatus = "off" | "connecting" | "listening" | "speaking";
export class VoiceSession {
  private pc: RTCPeerConnection | null = null;
  private media: MediaStream | null = null;
  private channel: RTCDataChannel | null = null;
  private audio: HTMLAudioElement | null = null;
  private abort: AbortController | null = null;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(
    private onStatus: (s: VoiceStatus) => void,
    private onMessage: (m: Message) => void,
    private onAction: (a: Action) => void,
    private onError: (s: string) => void,
  ) {}
  async start(context: {
    pet: Pet;
    language: "auto" | "zh" | "en";
    state: PetState;
    messages: Message[];
    memories: string[];
  }) {
    this.stopped = false;
    this.onStatus("connecting");
    this.abort = new AbortController();
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection)
        throw new Error(
          "当前浏览器不支持实时语音，请使用 HTTPS 和较新的 Chrome 或 Safari。",
        );
      this.timer = setTimeout(() => {
        this.onError("语音连接超时，请重新连接。");
        this.stop();
      }, 30000);
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (this.stopped) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      this.media = media;
      const pc = new RTCPeerConnection();
      this.pc = pc;
      const audio = new Audio();
      audio.autoplay = true;
      this.audio = audio;
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
        void audio
          .play()
          .catch(() => this.onError("浏览器阻止了声音播放，请重新开启语音。"));
      };
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      const channel = pc.createDataChannel("oai-events");
      this.channel = channel;
      channel.onopen = () => {
        if (this.timer) clearTimeout(this.timer);
        this.onStatus("listening");
        this.onAction("listen");
      };
      channel.onmessage = (e) => {
        try {
          this.event(JSON.parse(e.data));
        } catch {
          this.onError("收到无法识别的语音事件。");
        }
      };
      pc.onconnectionstatechange = () => {
        if (
          ["failed", "disconnected"].includes(pc.connectionState) &&
          !this.stopped
        ) {
          this.onError("语音连接已断开，可以重新开启。");
          this.stop();
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const res = await fetch("/api/voice/session", {
        method: "POST",
        headers: accessHeaders(),
        body: JSON.stringify({ ...context, sdp: offer.sdp }),
        signal: this.abort.signal,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "语音连接失败。");
      }
      if (this.stopped) return;
      await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
    } catch (e) {
      if (!this.stopped)
        this.onError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "麦克风权限未开启。请允许访问麦克风，也可以继续打字。"
            : e instanceof Error
              ? e.message
              : "语音连接失败。",
        );
      this.stop();
    }
  }
  private event(e: {
    type: string;
    item_id?: string;
    transcript?: string;
    error?: { message?: string };
  }) {
    if (e.type === "input_audio_buffer.speech_started") {
      this.onStatus("listening");
      this.onAction("listen");
    }
    if (e.type === "output_audio_buffer.started") {
      this.onStatus("speaking");
      this.onAction("speak");
    }
    if (
      e.type === "output_audio_buffer.stopped" ||
      e.type === "output_audio_buffer.cleared"
    ) {
      this.onStatus("listening");
      this.onAction("listen");
    }
    if (
      e.type === "conversation.item.input_audio_transcription.completed" &&
      e.transcript
    )
      this.onMessage({
        id: e.item_id || crypto.randomUUID(),
        role: "user",
        content: e.transcript,
        modality: "voice",
        createdAt: new Date().toISOString(),
      });
    if (e.type === "response.output_audio_transcript.done" && e.transcript)
      this.onMessage({
        id: e.item_id || crypto.randomUUID(),
        role: "assistant",
        content: e.transcript,
        modality: "voice",
        createdAt: new Date().toISOString(),
      });
    if (e.type === "error") {
      this.onError("语音服务返回错误，请结束后重试。");
    }
  }
  mute(muted: boolean) {
    if (this.audio) this.audio.muted = muted;
  }
  interrupt() {
    if (this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify({ type: "response.cancel" }));
      this.channel.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
    }
  }
  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.abort?.abort();
    this.channel?.close();
    this.pc?.close();
    this.media?.getTracks().forEach((t) => t.stop());
    if (this.audio) {
      this.audio.pause();
      this.audio.srcObject = null;
    }
    this.channel = null;
    this.pc = null;
    this.media = null;
    this.audio = null;
    this.onStatus("off");
  }
}
