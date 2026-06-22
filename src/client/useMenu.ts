import { useEffect, useRef, useState } from "react";

// 開閉トグルできるメニュー（ハンバーガー等）の状態管理。
// - open/close/toggle を提供
// - 開いている間だけ「外側クリック」「Escape」で閉じる
// - 画面が広がって sm 以上になったら自動で閉じる（横並び表示に戻るため）
//
// containerRef は「トリガー + パネル」を内包する要素に張る。
// その外側のクリックを外部クリックと判定する。
export function useMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // sm(640px) 以上になったら横並びに戻るのでメニューは閉じる
    const mq = window.matchMedia("(min-width: 640px)");
    const onWide = (e: MediaQueryListEvent) => e.matches && setOpen(false);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onWide);
    };
  }, [open]);

  return {
    open,
    containerRef,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
  };
}
