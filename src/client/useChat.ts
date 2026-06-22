import { useCallback, useRef, useState } from "react";
import type { ChatMessage, DisplayMessage, Role } from "./types.ts";

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

const isRole = (v: unknown): v is Role => v === "user" || v === "assistant";

/**
 * import された JSON 文字列を ChatMessage[] に検証付きで変換する。
 * 受け付ける形: `{ "messages": [...] }`（export 形式）または素の配列 `[...]`。
 * 不正な場合は理由を添えて throw する。
 */
function parseHistory(json: string): ChatMessage[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("JSON の形式が不正です。");
  }

  const raw: unknown = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "messages" in data
      ? (data as { messages: unknown }).messages
      : undefined;

  if (!Array.isArray(raw)) {
    throw new Error('messages 配列が見つかりません（{ "messages": [...] } 形式が必要です）。');
  }

  const result: ChatMessage[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== "object") {
      throw new Error(`${i + 1} 番目の要素がオブジェクトではありません。`);
    }
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (!isRole(role)) {
      throw new Error(`${i + 1} 番目の role が不正です（"user" か "assistant"）。`);
    }
    if (typeof content !== "string") {
      throw new Error(`${i + 1} 番目の content が文字列ではありません。`);
    }
    result.push({ role, content });
  });

  return result;
}

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

  /** 確定済みの履歴を export 形式の整形済み JSON 文字列で返す。 */
  const exportHistory = useCallback(
    () => JSON.stringify({ messages: historyRef.current }, null, 2),
    [],
  );

  /**
   * JSON 文字列を検証して現在のセッションの末尾に追加する。
   * 検証に失敗したら throw（呼び出し側でエラー表示）。成功時は追加件数を返す。
   */
  const importHistory = useCallback(
    (json: string): number => {
      if (busy) throw new Error("応答の生成中はインポートできません。");
      const incoming = parseHistory(json);
      if (incoming.length === 0) return 0;

      historyRef.current = [...historyRef.current, ...incoming];
      setMessages((prev) => [
        ...prev,
        ...incoming.map((m) => ({ ...m, id: nextId() }) satisfies DisplayMessage),
      ]);
      return incoming.length;
    },
    [busy],
  );

  return { messages, busy, send, clear, exportHistory, importHistory };
}
