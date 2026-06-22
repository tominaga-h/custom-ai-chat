import { useEffect, useRef, useState } from "react";
import { useChat } from "./useChat.ts";
import { useTheme } from "./useTheme.ts";
import { useMenu } from "./useMenu.ts";
import { Message } from "./components/Message.tsx";
import { Composer } from "./components/Composer.tsx";
import { ExportModal, ImportModal } from "./components/HistoryModals.tsx";
import { HeaderActions } from "./components/HeaderActions.tsx";
import type { ServerConfig } from "./types.ts";

function useConfigLabel(): string {
  const [label, setLabel] = useState("読み込み中…");
  useEffect(() => {
    let alive = true;
    fetch("/api/config")
      .then((r) => r.json() as Promise<ServerConfig>)
      .then((c) => alive && setLabel(`${c.model} @ ${c.host}`))
      .catch(() => alive && setLabel("(設定の取得に失敗)"));
    return () => {
      alive = false;
    };
  }, []);
  return label;
}

export default function App() {
  const { messages, busy, send, clear, exportHistory, importHistory } = useChat();
  const { theme, toggle: toggleTheme } = useTheme();
  const configLabel = useConfigLabel();
  const threadRef = useRef<HTMLDivElement>(null);
  const menu = useMenu();
  // null = 閉じている / "export" | "import" = 表示中のモーダル
  const [modal, setModal] = useState<null | "export" | "import">(null);

  // 狭幅メニュー内の項目をタップしたら、アクション実行後にメニューを閉じる
  const runAndCloseMenu = (action: () => void) => () => {
    action();
    menu.close();
  };

  // 新規メッセージ / ストリーミング更新のたびに最下部へ
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-border-soft bg-bg flex items-center gap-3 border-b px-4 py-[10px]">
        <div className="font-semibold">Custom AI Chat</div>
        <div
          className="text-text-dim flex-1 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap [font-family:ui-monospace,SFMono-Regular,Menlo,monospace]"
          title="サーバーの .env で設定"
        >
          {configLabel}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "ライトテーマに切り替え" : "ダークテーマに切り替え"}
          title={theme === "dark" ? "ライトテーマに切り替え" : "ダークテーマに切り替え"}
          className="text-text-dim border-border-soft hover:text-text-main hover:border-text-dim flex-none rounded-lg border bg-transparent px-3 py-1.5 text-[13px]"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* 広い画面: 横並びでそのまま表示 */}
        <div className="hidden items-center gap-3 sm:flex">
          <HeaderActions
            busy={busy}
            onExport={() => setModal("export")}
            onImport={() => setModal("import")}
            onClear={clear}
          />
        </div>

        {/* 狭い画面: ハンバーガー。ボタンで開閉トグルし、開いている間だけ中身を描画する。
            外側クリック / Escape / 画面拡大での自動クローズは useMenu が処理。 */}
        <div ref={menu.containerRef} className="relative flex-none sm:hidden">
          <button
            type="button"
            onClick={menu.toggle}
            aria-label="メニュー"
            aria-expanded={menu.open}
            title="メニュー"
            className="text-text-dim border-border-soft hover:text-text-main hover:border-text-dim aria-expanded:text-text-main aria-expanded:border-text-dim rounded-lg border bg-transparent px-3 py-1.5 text-base leading-none"
          >
            ☰
          </button>
          {menu.open && (
            <div className="bg-bg-elev border-border-soft absolute top-[calc(100%+8px)] right-0 z-50 flex w-44 flex-col gap-1 rounded-lg border p-1.5 shadow-xl">
              <HeaderActions
                busy={busy}
                variant="menu"
                onExport={runAndCloseMenu(() => setModal("export"))}
                onImport={runAndCloseMenu(() => setModal("import"))}
                onClear={runAndCloseMenu(clear)}
              />
            </div>
          )}
        </div>
      </header>

      <main ref={threadRef} className="flex-1 overflow-y-auto px-4 pt-6 pb-2" aria-live="polite">
        {messages.length === 0 ? (
          <div className="text-text-dim mx-auto mt-[12vh] max-w-[760px] text-center">
            <h1 className="text-text-main mb-2 text-[26px]">何でも聞いてください</h1>
            <p>
              BASE_URL / MODEL / API_KEY はサーバーの{" "}
              <code className="bg-bg-elev rounded-md px-1.5 py-0.5">.env</code> で切り替えられます。
            </p>
          </div>
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
      </main>

      <Composer busy={busy} onSend={send} />

      {modal === "export" && (
        <ExportModal json={exportHistory()} onClose={() => setModal(null)} />
      )}
      {modal === "import" && (
        <ImportModal onImport={importHistory} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
