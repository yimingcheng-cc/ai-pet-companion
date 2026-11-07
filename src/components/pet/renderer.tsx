"use client";
import { useLocale } from "@/components/locale";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useState, useCallback, type ReactNode } from "react";
import { Hand, ImageIcon } from "lucide-react";
import { activityLabels } from "@/lib/pet/behavior";
import type { Action } from "@/lib/schema";
const ModelScene = dynamic(() => import("./model-scene"), {
  ssr: false,
  loading: ModelLoading,
});
function ModelLoading() {
  const { t } = useLocale();
  return <div className="model-loading">{t("正在载入 3D 场景…")}</div>;
}
class AssetBoundary extends Component<
  {
    children: ReactNode;
    fallback: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function PetRenderer({
  action,
  name,
  onPet,
}: {
  action: Action;
  name: string;
  onPet: () => void;
}) {
  const { t } = useLocale();
  const model = process.env.NEXT_PUBLIC_PET_MODEL_URL;
  const [clips, setClips] = useState<string[] | null>(null);
  const onClips = useCallback((v: string[]) => setClips(v), []);
  const photo = (
    <>
      <Image
        className={`pet-photo reaction-${action}`}
        src="/images/golden-retriever.jpg"
        alt={t("{0}，一只金毛寻回犬的真实摄影照片", { "0": name })}
        fill
        priority
        sizes="100vw"
      />
      <div className="scene-shade" />
      <span className="prototype-label">
        <ImageIcon size={13} />
        {t("真实摄影原型 \u00B7 非 3D 动画")}
      </span>
      <button
        className="pet-touch"
        onClick={onPet}
        aria-label={t("轻轻摸摸 {0}", { "0": name })}
      >
        <Hand size={18} />
        <span>{t("轻轻摸摸")}</span>
      </button>
    </>
  );
  return (
    <div className="pet-renderer">
      {model ? (
        <AssetBoundary
          fallback={
            <>
              {photo}
              <span className="asset-notice">
                {t("3D 素材载入失败，已使用照片原型")}
              </span>
            </>
          }
        >
          <ModelScene url={model} action={action} onClips={onClips} />
          {clips === null ? (
            <span className="prototype-label">
              {t("正在载入模型与动画\u2026")}
            </span>
          ) : (
            <span className="prototype-label">
              {clips.length
                ? t("{0} 个动画片段", { "0": clips.length })
                : t("此模型未包含动画")}
              {!clips.includes(action) &&
                t("\u00B7 当前动作 {0} 无匹配动画", { "0": action })}
            </span>
          )}
          <button className="model-pet-button" onClick={onPet}>
            <Hand size={17} />
            {t("摸摸它")}
          </button>
        </AssetBoundary>
      ) : (
        photo
      )}
      <span className="sr-only">
        {t("当前行为意图：")}
        {t(activityLabels[action])}
        {t("。照片原型仅提供状态和轻微视觉反馈。")}
      </span>
    </div>
  );
}
