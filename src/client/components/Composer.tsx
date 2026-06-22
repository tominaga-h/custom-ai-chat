import { useRef, useState, type KeyboardEvent } from "react";

export function Composer({
  busy,
  onSend,
}: {
  busy: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
    // field-sizing 非対応ブラウザ向けの高さリセット
    if (taRef.current) taRef.current.style.height = "";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="border-border-soft bg-bg border-t px-4 pt-3 pb-[18px]"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="bg-bg-elev border-border-soft focus-within:border-accent mx-auto flex max-w-[760px] items-center gap-[10px] rounded-[14px] border py-2 pr-2 pl-[14px]">
        <textarea
          ref={taRef}
          className="autosize text-text-main max-h-[10lh] min-h-[1lh] min-w-0 flex-1 resize-none border-none bg-transparent outline-none placeholder:text-text-dim"
          rows={1}
          autoFocus
          placeholder="メッセージを入力…（Enterで送信 / Shift+Enterで改行）"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="bg-accent flex-none rounded-[10px] px-4 py-2 font-semibold text-white disabled:cursor-default disabled:opacity-45"
        >
          送信
        </button>
      </div>
    </form>
  );
}
