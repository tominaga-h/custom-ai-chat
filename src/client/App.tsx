import { useEffect, useRef, useState } from "react";
import { useChat } from "./useChat.ts";
import { Message } from "./components/Message.tsx";
import { Composer } from "./components/Composer.tsx";
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
  const { messages, busy, send, clear } = useChat();
  const configLabel = useConfigLabel();
  const threadRef = useRef<HTMLDivElement>(null);

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
          onClick={clear}
          disabled={busy}
          className="text-text-dim border-border-soft hover:text-text-main hover:border-text-dim rounded-lg border bg-transparent px-3 py-1.5 text-[13px] disabled:opacity-45"
        >
          クリア
        </button>
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
    </div>
  );
}
