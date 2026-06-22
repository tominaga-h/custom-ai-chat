type Props = {
  busy: boolean;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  // popover 内に並べるときは縦並び・幅いっぱいにする
  variant?: "inline" | "menu";
};

// エクスポート / インポート / クリアの3アクション。
// ヘッダー（横並び）とハンバーガー popover（縦並び）の両方で使い回す。
export function HeaderActions({ busy, onExport, onImport, onClear, variant = "inline" }: Props) {
  const base =
    "text-text-dim border-border-soft hover:text-text-main hover:border-text-dim rounded-lg border bg-transparent text-[13px] disabled:opacity-45";
  const shape = variant === "menu" ? "w-full px-3 py-2 text-left" : "px-3 py-1.5";
  const cls = `${base} ${shape}`;

  return (
    <>
      <button type="button" onClick={onExport} className={cls}>
        エクスポート
      </button>
      <button type="button" onClick={onImport} disabled={busy} className={cls}>
        インポート
      </button>
      <button type="button" onClick={onClear} disabled={busy} className={cls}>
        クリア
      </button>
    </>
  );
}
