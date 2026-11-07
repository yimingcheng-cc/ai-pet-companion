"use client";
import { useLocale } from "@/components/locale";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Plus,
  Trash2,
  Leaf,
} from "lucide-react";
import { usePet } from "@/components/store";
import { Loading } from "@/components/shell";
export default function Memories() {
  const { t, locale } = useLocale();
  const { data, ready, update } = usePet();
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  if (!ready) return <Loading />;
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !data.pet) return;
    if (data.memories.length >= 100) {
      setNotice(t("最多保存 100 条记忆，请先整理一些。"));
      return;
    }
    update((s) => ({
      ...s,
      memories: [
        ...s.memories,
        {
          id: crypto.randomUUID(),
          content: text.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setText("");
    setNotice(t("已由你确认并保存到当前浏览器。"));
  }
  return (
    <main className="document-page memories-page">
      <Link href={data.pet ? "/pet" : "/"} className="back-link">
        <ArrowLeft size={15} />
        {t("回到陪伴")}
      </Link>
      <span className="eyebrow">THE LITTLE THINGS WE KEEP</span>
      <h1>
        {t("值得记住的，")}
        <em>{t("是我们。")}</em>
      </h1>
      <p className="muted">
        {t("不是每句话都要记住。有些小事，却想一直留着。")}
      </p>
      {data.pet ? (
        <>
          <section className="adoption-memory">
            <span className="memory-heart">
              <Heart size={24} />
            </span>
            <div>
              <span className="eyebrow">WHERE IT ALL BEGAN</span>
              <h2>{t("和 {name} 成为家人", { name: data.pet.name })}</h2>
              <time>
                {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
                  dateStyle: "long",
                  timeZone: "Asia/Shanghai",
                }).format(new Date(data.pet.adoptedAt))}
              </time>
            </div>
            <span className="memory-flower">✳</span>
          </section>
          <div className="memory-heading">
            <h2>
              {t("我们的小记忆")}
              <span>{data.memories.length}</span>
            </h2>
            <Link href="/settings" className="quiet-link">
              {t("记忆设置")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <p className="memory-info">
            <Leaf size={15} />
            {data.preferences.memory
              ? t("已开启：这些记忆可以用于之后的 AI 对话。")
              : t("对话记忆已关闭：可以整理和保存，开启后才会用于回复。")}
          </p>
          <form className="memory-form" onSubmit={save}>
            <label htmlFor="memory-text">
              {t("告诉它一件你愿意让它记住的小事")}
            </label>
            <textarea
              id="memory-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("比如：以后叫我哥哥吧；我喜欢下雨天\u2026")}
              required
            />
            <div>
              <small>
                {t("点击保存，即确认将这条内容作为长期记忆。最多 500 字。")}
              </small>
              <button className="button primary" disabled={!text.trim()}>
                <Plus size={16} />
                {t("保存记忆")}
              </button>
            </div>
          </form>
          {notice && (
            <p role="status" className="settings-notice">
              {t(notice)}
            </p>
          )}
          <div className="memory-list">
            {data.memories.length === 0 ? (
              <p className="empty-copy">
                {t("还没有保存的记忆。慢慢来，你们有很多时间。")}
              </p>
            ) : (
              data.memories.map((m) => (
                <article className="memory-item" key={m.id}>
                  <div>
                    <p>{m.content}</p>
                    <time>
                      {new Intl.DateTimeFormat(
                        locale === "en" ? "en-US" : "zh-CN",
                        {
                          dateStyle: "medium",
                          timeZone: "Asia/Shanghai",
                        },
                      ).format(new Date(m.createdAt))}{" "}
                      {t("\u00B7 由你保存")}
                    </time>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={t("删除记忆：{0}", { "0": m.content })}
                    onClick={() => {
                      update((s) => ({
                        ...s,
                        memories: s.memories.filter((x) => x.id !== m.id),
                      }));
                      setNotice(t("这条记忆已删除。"));
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <Link href="/adopt" className="button primary">
          {t("先认识你的伙伴")}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </main>
  );
}
