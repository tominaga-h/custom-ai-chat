import { useEffect, useRef, type ReactNode } from "react";

/**
 * 中央表示の汎用モーダル。
 * - Escape / 背景クリックで閉じる
 * - 開いたとき最初のフォーカス可能要素へフォーカス
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // 開いたら最初の textarea / input にフォーカス
    panelRef.current?.querySelector<HTMLElement>("textarea, input, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="bg-bg-elev border-border-soft flex max-h-[85vh] w-full max-w-[680px] flex-col rounded-xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border-soft flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-text-dim hover:text-text-main rounded px-2 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>

        {footer && (
          <div className="border-border-soft flex items-center justify-end gap-2 border-t px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
