import { Download, Trash2, Upload, type LucideIcon } from "lucide-react";

type Props = {
  busy: boolean;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  // menu = ハンバーガー内（縦並び・幅いっぱい・アイコン付き）
  variant?: "inline" | "menu";
};

// エクスポート / インポート / クリアの3アクション。
// ヘッダー（横並び）とハンバーガー（縦並び）の両方で使い回す。
export function HeaderActions({ busy, onExport, onImport, onClear, variant = "inline" }: Props) {
  const isMenu = variant === "menu";
  const base =
    "text-text-dim border-border-soft hover:text-text-main hover:border-text-dim rounded-lg border bg-transparent text-[13px] disabled:opacity-45";
  const shape = isMenu ? "flex w-full items-center gap-2 px-3 py-2 text-left" : "px-3 py-1.5";
  const cls = `${base} ${shape}`;

  // menu のときだけアイコンを描画
  const icon = (Icon: LucideIcon) => (isMenu ? <Icon size={15} className="flex-none" /> : null);

  return (
    <>
      <button type="button" onClick={onExport} className={cls}>
        {icon(Download)}
        エクスポート
      </button>
      <button type="button" onClick={onImport} disabled={busy} className={cls}>
        {icon(Upload)}
        インポート
      </button>
      <button type="button" onClick={onClear} disabled={busy} className={cls}>
        {icon(Trash2)}
        クリア
      </button>
    </>
  );
}
