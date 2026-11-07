"use client";
import { useLocale } from "@/components/locale";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Trash2,
  ShieldCheck,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { usePet } from "@/components/store";
import { Loading } from "@/components/shell";
import { petSchema, type Pet } from "@/lib/schema";
export default function Settings() {
  const { t, locale, setLocale } = useLocale();
  const { data, ready, update, reset, storageError } = usePet();
  const [notice, setNotice] = useState("");
  const [access, setAccess] = useState("");
  const [confirm, setConfirm] = useState<"chat" | "all" | null>(null);
  if (!ready) return <Loading />;
  function rename(form: FormData) {
    if (!data.pet) return;
    const result = petSchema.safeParse({
      ...data.pet,
      name: form.get("name"),
      voice: form.get("voice"),
    });
    if (!result.success) {
      setNotice(t("请输入 1\u201324 个字的宠物名字。"));
      return;
    }
    update((s) => ({ ...s, pet: result.data }));
    setNotice(t("宠物资料已更新。"));
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companion-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice(t("数据已导出。请妥善保存，其中包含你的对话。"));
  }
  return (
    <main className="document-page settings-page">
      <Link href={data.pet ? "/pet" : "/"} className="back-link">
        <ArrowLeft size={15} />
        {t("回到陪伴")}
      </Link>
      <span className="eyebrow">MAKE YOURSELF AT HOME</span>
      <h1>{t("一点点，更懂彼此。")}</h1>
      <p className="muted">{t("调整陪伴的方式，也照顾好你的隐私。")}</p>
      {(notice || storageError) && (
        <p className="settings-notice" role="status">
          <Check size={16} />
          {t(notice || storageError)}
        </p>
      )}
      <section className="settings-section">
        <div>
          <span className="section-number">01</span>
          <h2>{t("关于它")}</h2>
          <p>{t("一个名字，一种熟悉的声音。")}</p>
        </div>
        {data.pet ? (
          <form action={rename} className="settings-fields">
            <label>
              {t("宠物名字")}
              <input
                name="name"
                defaultValue={data.pet.name}
                key={data.pet.id}
                maxLength={24}
                required
              />
            </label>
            <label>
              {t("实时语音的声音")}
              <select name="voice" defaultValue={data.pet.voice}>
                <option value="marin">{t("Marin \u00B7 自然温暖")}</option>
                <option value="cedar">{t("Cedar \u00B7 柔和平静")}</option>
              </select>
            </label>
            <label>
              {t("性格")}
              <select
                value={data.pet.personality}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    pet: s.pet
                      ? {
                          ...s.pet,
                          personality: e.target.value as Pet["personality"],
                        }
                      : null,
                  }))
                }
              >
                <option value="friendly">{t("亲人")}</option>
                <option value="calm">{t("温柔")}</option>
                <option value="playful">{t("活泼")}</option>
                <option value="independent">{t("独立")}</option>
              </select>
            </label>
            <button className="button primary" type="submit">
              {t("保存资料")}
              <Check size={16} />
            </button>
          </form>
        ) : (
          <Link href="/adopt" className="quiet-link">
            {t("先去领养一位伙伴")}
            <ArrowUpRight size={16} />
          </Link>
        )}
      </section>
      <section className="settings-section">
        <div>
          <span className="section-number">02</span>
          <h2>{t("交流与声音")}</h2>
          <p>{t("自在交流，保留安静的自由。")}</p>
        </div>
        <div className="settings-fields">
          <label>
            {t("界面语言")}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "zh" | "en")}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            {t("对话语言")}
            <select
              value={data.preferences.language}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  preferences: {
                    ...s.preferences,
                    language: e.target.value as "auto" | "zh" | "en",
                  },
                }))
              }
            >
              <option value="auto">{t("自动跟随输入")}</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <p className="field-hint">{t("界面语言不会翻译已有对话或记忆。")}</p>
          <Toggle
            title={t("显示最近对话与语音字幕")}
            text={t("完整对话始终可以在记录中查看。")}
            checked={data.preferences.subtitles}
            onChange={(v) =>
              update((s) => ({
                ...s,
                preferences: { ...s.preferences, subtitles: v },
              }))
            }
          />
          <Toggle
            title={t("朗读文字回复")}
            text={t("使用浏览器语音合成，声音效果取决于设备；与实时语音不同。")}
            checked={data.preferences.autoSpeech}
            onChange={(v) =>
              update((s) => ({
                ...s,
                preferences: { ...s.preferences, autoSpeech: v },
              }))
            }
          />
        </div>
      </section>
      <section className="settings-section">
        <div>
          <span className="section-number">03</span>
          <h2>{t("记忆与隐私")}</h2>
          <p>{t("留下什么，由你决定。")}</p>
        </div>
        <div className="settings-fields">
          <Toggle
            title={t("在对话中使用手动保存的记忆")}
            text={t(
              "仅使用你在记忆页主动保存的内容，不自动提取个人信息。关闭后已有记忆仍保留，可逐条删除。",
            )}
            checked={data.preferences.memory}
            onChange={(v) =>
              update((s) => ({
                ...s,
                preferences: { ...s.preferences, memory: v },
              }))
            }
          />
          <Link href="/memories" className="quiet-link">
            {t("管理我们的记忆")}
            <ArrowUpRight size={16} />
          </Link>
          <p className="field-hint">
            {t("云端同步尚未接入；当前仅在本浏览器保存。")}
          </p>
          <div className="storage-note">
            <ShieldCheck size={20} />
            <p>
              {t("当前使用浏览器本地存储。")}
              <small>
                {t(
                  "尚未接入账户、Supabase 或跨设备同步。发送消息时，最近的对话、宠物状态与启用的记忆会传给 OpenAI 生成回复。",
                )}
              </small>
            </p>
          </div>
          <button className="button secondary" onClick={exportData}>
            <Download size={16} />
            {t("导出本地数据")}
          </button>
          <button className="danger-link" onClick={() => setConfirm("chat")}>
            <Trash2 size={15} />
            {t("清空对话记录")}
          </button>
          <button className="danger-link" onClick={() => setConfirm("all")}>
            <Trash2 size={15} />
            {t("删除宠物和全部本地数据")}
          </button>
          {confirm && (
            <div className="confirm-box" role="alert">
              <p>
                {confirm === "all"
                  ? t(
                      "将删除当前浏览器中的宠物、对话、状态和记忆。此操作不可撤销。",
                    )
                  : t(
                      "将删除当前浏览器中的全部文字和语音对话。此操作不可撤销。",
                    )}
              </p>
              <button
                className="button danger"
                onClick={() => {
                  if (confirm === "all") reset();
                  else update((s) => ({ ...s, messages: [] }));
                  setConfirm(null);
                  setNotice(t("本地数据已删除。"));
                }}
              >
                {t("确认删除")}
              </button>
              <button
                className="button secondary"
                onClick={() => setConfirm(null)}
              >
                {t("取消")}
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="settings-section">
        <div>
          <span className="section-number">04</span>
          <h2>{t("服务连接")}</h2>
          <p>{t("为真实的对话准备好连接。")}</p>
        </div>
        <div className="settings-fields">
          <label>
            {t("私有部署访问口令")}
            <input
              type="password"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              autoComplete="off"
              placeholder={t("与服务器 APP_ACCESS_TOKEN 一致")}
            />
          </label>
          <button
            className="button secondary"
            onClick={() => {
              if (access.trim())
                sessionStorage.setItem("companion.access", access.trim());
              else sessionStorage.removeItem("companion.access");
              setAccess("");
              setNotice(t("访问口令已更新，仅在当前标签页会话内保存。"));
            }}
          >
            {t("保存访问口令")}
          </button>
          <p className="field-hint">
            {t(
              "OpenAI API Key 只应在服务器环境变量中配置，切勿填在这里。Key 未配置时，聊天和语音会显示明确的设置提示。",
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
function Toggle({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { t } = useLocale();
  return (
    <label className="toggle-row">
      <span>
        {t(title)}
        <small>{t(text)}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
