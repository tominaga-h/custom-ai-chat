import type { DisplayMessage } from "../types.ts";
import { Markdown } from "./Markdown.tsx";
import { Spinner } from "./Spinner.tsx";

const ROLE_BADGE: Record<DisplayMessage["role"], string> = {
  user: "You",
  assistant: "AI",
};

export function Message({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  const badge = message.error ? "!" : ROLE_BADGE[message.role];
  // アシスタントの応答だけ Markdown 描画。ユーザー入力・エラーはプレーンテキスト。
  const asMarkdown = message.role === "assistant" && !message.error;
  // まだ最初のトークンが届く前（content が空でストリーミング中）は「考え中…」を表示。
  const thinking = message.streaming && message.content.length === 0;

  return (
    <div className="mx-auto mb-[18px] flex max-w-[760px] gap-3">
      <div
        className={[
          "flex size-[30px] flex-none place-items-center justify-center rounded-lg text-[13px] font-bold select-none",
          isUser
            ? "bg-accent text-white"
            : "bg-bg-assistant border-border-soft border",
        ].join(" ")}
      >
        {badge}
      </div>
      <div
        className={[
          "min-w-0 flex-1 pt-[3px] break-words [overflow-wrap:anywhere]",
          asMarkdown ? "" : "whitespace-pre-wrap",
          message.error ? "text-danger" : "",
        ].join(" ")}
      >
        {thinking ? (
          <span className="text-text-dim flex items-center gap-2">
            <Spinner />
            考え中…
          </span>
        ) : (
          <>
            {asMarkdown ? <Markdown>{message.content}</Markdown> : message.content}
            {message.streaming && <span className="streaming-cursor" aria-hidden="true" />}
          </>
        )}
      </div>
    </div>
  );
}
