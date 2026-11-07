"use client";
import { useLocale } from "@/components/locale";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  AudioLines,
  Leaf,
  MessageCircle,
  Heart,
} from "lucide-react";
export default function Home() {
  const { t } = useLocale();
  return (
    <main className="landing">
      <div className="landing-copy">
        <span className="eyebrow">
          <span className="live-dot" /> A LITTLE SOUL, BY YOUR SIDE
        </span>
        <h1>
          {t("世界很忙，")}
          <br />
          {t("它只想")}
          <br />
          <em>{t("陪着你。")}</em>
        </h1>
        <p className="intro">
          {t("一个有自己小世界的伙伴。")}
          <br />
          {t("听你说话，记得你的喜欢，")}
          <br />
          {t("也享受和你安静待着的每一刻。")}
        </p>
        <Link href="/adopt" className="button primary">
          {t("遇见我的伙伴")}
          <ArrowUpRight size={18} />
        </Link>
        <Link href="/pet" className="quiet-link">
          {t("已经领养？回到它身边")}
          <span>↗</span>
        </Link>
        <div className="landing-note">
          <Leaf size={17} />
          <span>{t("没有任务，也没有等级。只有你和它。")}</span>
        </div>
      </div>
      <div className="landing-photo">
        <Image
          src="/images/golden-retriever.jpg"
          alt={t("一只叼着花、安静望向你的真实金毛犬")}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 65vw"
        />
        <div className="photo-caption">
          <span className="small-caps">MEET YOUR EVERYDAY COMPANION</span>
          <p>
            {t("有些美好，")}
            <br />
            {t("只是陪在身边。")}
          </p>
        </div>
        <span className="photo-credit">{t("真实摄影 \u00B7 视觉原型")}</span>
      </div>
      <section className="landing-features" aria-label={t("陪伴体验")}>
        <div>
          <MessageCircle />
          <span>
            {t("聊聊今天")}
            <small>{t("文字交流，让心事有处安放")}</small>
          </span>
        </div>
        <div>
          <AudioLines />
          <span>
            {t("听见彼此")}
            <small>{t("同页语音入口，自然开始对话")}</small>
          </span>
        </div>
        <div>
          <Heart />
          <span>
            {t("慢慢熟悉")}
            <small>{t("由你决定，哪些瞬间值得记住")}</small>
          </span>
        </div>
      </section>
    </main>
  );
}
