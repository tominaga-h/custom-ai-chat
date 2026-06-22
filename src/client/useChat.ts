import { useCallback, useRef, useState } from "react";
import type { ChatMessage, DisplayMessage } from "./types.ts";

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

/**
 * /api/chat に履歴を投げ、SSE で返る delta を逐次 state に反映するフック。
 * APIキーはサーバー側で付与されるためここでは扱わない。
 */
export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [busy, setBusy] = useState(false);
  // setState のクロージャに頼らず最新の履歴を参照するための ref
  const historyRef = useRef<ChatMessage[]>([]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const userMsg: DisplayMessage = { id: nextId(), role: "user", content: trimmed };
      const assistantMsg: DisplayMessage = {
        id: nextId(),
        role: "assistant",
        content: "",
        streaming: true,
      };

      historyRef.current = [...historyRef.current, { role: "user", content: trimmed }];
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setBusy(true);

      const patch = (changes: Partial<DisplayMessage>) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, ...changes } : m)),
        );

      let acc = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyRef.current }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => res.statusText);
          throw new Error(errText || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // 末尾の未完了行を保持

          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta: unknown = json.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) {
                acc += delta;
                patch({ content: acc });
              }
            } catch {
              // 不完全な JSON 断片は無視
            }
          }
        }

        if (acc) {
          historyRef.current = [...historyRef.current, { role: "assistant", content: acc }];
          patch({ streaming: false });
        } else {
          patch({ content: "(空の応答)", streaming: false });
        }
      } catch (err) {
        // 失敗した応答は履歴に残さない（user メッセージは残るので再送できる）
        patch({
          content: `エラー: ${err instanceof Error ? err.message : String(err)}`,
          streaming: false,
          error: true,
        });
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const clear = useCallback(() => {
    if (busy) return;
    historyRef.current = [];
    setMessages([]);
  }, [busy]);

  return { messages, busy, send, clear };
}
