import type { DisplayMessage } from "../types.ts";

const ROLE_BADGE: Record<DisplayMessage["role"], string> = {
  user: "You",
  assistant: "AI",
};

export function Message({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  const badge = message.error ? "!" : ROLE_BADGE[message.role];

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
          "min-w-0 flex-1 pt-[3px] break-words whitespace-pre-wrap [overflow-wrap:anywhere]",
          message.error ? "text-[#ff8a8a]" : "",
          message.streaming ? "streaming-cursor" : "",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}
