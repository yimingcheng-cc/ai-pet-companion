"use client";
import { useLocale } from "@/components/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { usePet } from "@/components/store";
import { Loading } from "@/components/shell";
import { petSchema, type Pet } from "@/lib/schema";
import { initialState } from "@/lib/pet/behavior";
const personalities = [
  { id: "friendly", name: "亲人", text: "热情又贴心，喜欢黏在你身边。" },
  { id: "calm", name: "温柔", text: "慢慢说话，安静陪你度过日常。" },
  { id: "playful", name: "活泼", text: "充满好奇，总有一点小幽默。" },
  { id: "independent", name: "独立", text: "享受自己的时光，也在意你的出现。" },
] as const;
export default function Adopt() {
  const { t } = useLocale();
  const { data, ready, update } = usePet();
  const router = useRouter();
  const [name, setName] = useState("Milo");
  const [personality, setPersonality] =
    useState<Pet["personality"]>("friendly");
  const [voice, setVoice] = useState<Pet["voice"]>("marin");
  const [error, setError] = useState("");
  if (!ready) return <Loading />;
  if (data.pet)
    return (
      <main className="center-page">
        <span className="eyebrow">ALREADY HOME</span>
        <h1>{t("{name} 在等你。", { name: data.pet.name })}</h1>
        <p>{t("你已经有了一位小伙伴。")}</p>
        <Link className="button primary" href="/pet">
          {t("回到它身边")}
          <ArrowRight size={18} />
        </Link>
      </main>
    );
  function adopt(e: React.FormEvent) {
    e.preventDefault();
    const result = petSchema.safeParse({
      id: crypto.randomUUID(),
      name,
      personality,
      voice,
      adoptedAt: new Date().toISOString(),
    });
    if (!result.success) {
      setError(t("给它起一个 1\u201324 个字的名字吧。"));
      return;
    }
    update((s) => ({
      ...s,
      pet: result.data,
      state: initialState(),
      messages: [],
    }));
    router.push("/pet");
  }
  return (
    <main className="adopt-layout">
      <div className="adopt-photo">
        <Image
          src="/images/golden-retriever.jpg"
          alt={t("等待领养的金毛犬")}
          fill
          priority
          sizes="(max-width:760px) 100vw,45vw"
        />
        <div>
          <span className="eyebrow">A NEW CHAPTER TOGETHER</span>
          <h2>
            {t("你好，")}
            <br />
            {t("未来的家人。")}
          </h2>
          <p>{t("金毛寻回犬 \u00B7 忠诚、温暖、爱着日常")}</p>
        </div>
        <span className="photo-credit">
          {t("真实摄影 \u00B7 视觉原型，尚非 3D 动物")}
        </span>
      </div>
      <form className="adopt-form" onSubmit={adopt}>
        <span className="eyebrow">MAKE A LITTLE ROOM FOR LOVE</span>
        <h1>{t("从一个名字开始。")}</h1>
        <p className="muted">{t("每一段陪伴，都有独一无二的开始。")}</p>
        <fieldset>
          <legend>
            01 <span>{t("选择你的伙伴")}</span>
          </legend>
          <div className="species selected">
            <span>
              {t("金毛寻回犬")}
              <small>Golden Retriever</small>
            </span>
            <Check size={18} />
          </div>
          <p className="field-hint">{t("猫咪和兔子正在路上，暂不可领养。")}</p>
        </fieldset>
        <label className="field-label" htmlFor="pet-name">
          02 <span>{t("你想叫它什么？")}</span>
        </label>
        <input
          id="pet-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          required
          placeholder={t("给它起个名字")}
        />
        <fieldset>
          <legend>
            03 <span>{t("它的小性格")}</span>
          </legend>
          <div className="personality-grid">
            {personalities.map((p) => (
              <button
                key={p.id}
                type="button"
                className={
                  personality === p.id ? "personality selected" : "personality"
                }
                onClick={() => setPersonality(p.id)}
                aria-pressed={personality === p.id}
              >
                <strong>{t(p.name)}</strong>
                <span>{t(p.text)}</span>
                {personality === p.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field-label" htmlFor="pet-voice">
          04 <span>{t("它的声音")}</span>
        </label>
        <select
          id="pet-voice"
          value={voice}
          onChange={(e) => setVoice(e.target.value as Pet["voice"])}
        >
          <option value="marin">{t("Marin \u00B7 自然温暖")}</option>
          <option value="cedar">{t("Cedar \u00B7 柔和平静")}</option>
        </select>
        <p className="field-hint">
          {t("实时语音需要配置 OpenAI 服务后使用。")}
        </p>
        {error && (
          <p role="alert" className="error">
            {t(error)}
          </p>
        )}
        <button className="button primary adopt-submit" type="submit">
          {t("带它回家")}
          <ArrowRight size={18} />
        </button>
        <p className="privacy-note">
          <Leaf size={14} />
          {t("本阶段数据保存在当前浏览器，无需注册。")}
        </p>
      </form>
    </main>
  );
}
