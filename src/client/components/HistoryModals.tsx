import { useRef, useState } from "react";
import { Modal } from "./Modal.tsx";

const PRIMARY_BTN =
  "bg-accent rounded-lg px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-45";
const GHOST_BTN =
  "text-text-dim border-border-soft hover:text-text-main hover:border-text-dim rounded-lg border bg-transparent px-3 py-1.5 text-[13px]";
const TEXTAREA =
  "bg-bg border-border-soft min-h-[260px] flex-1 resize-none rounded-lg border p-3 font-mono text-[13px] leading-relaxed text-text-main focus:outline-none";

/** 現在の履歴 JSON を表示してコピーさせるモーダル。 */
export function ExportModal({ json, onClose }: { json: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const empty = json.trim() === '{\n  "messages": []\n}';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      title="履歴をエクスポート"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={GHOST_BTN} onClick={onClose}>
            閉じる
          </button>
          <button type="button" className={PRIMARY_BTN} onClick={copy} disabled={empty}>
            {copied ? "コピーしました" : "コピー"}
          </button>
        </>
      }
    >
      {empty ? (
        <p className="text-text-dim">エクスポートできる確定済みの履歴がまだありません。</p>
      ) : (
        <p className="text-text-dim text-[13px]">
          下の JSON をコピーして保存できます。インポート時にそのまま貼り付けてください。
        </p>
      )}
      <textarea
        className={TEXTAREA}
        readOnly
        value={json}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="エクスポートされた履歴 JSON"
      />
    </Modal>
  );
}

/** JSON を貼り付けて現在のセッションへ追加するモーダル。 */
export function ImportModal({
  onImport,
  onClose,
}: {
  onImport: (json: string) => number;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const run = () => {
    setError("");
    if (!text.trim()) {
      setError("JSON を入力してください。");
      return;
    }
    try {
      const n = onImport(text);
      if (n === 0) {
        setError("追加できるメッセージがありませんでした。");
        return;
      }
      onClose(); // 成功時は閉じる
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Modal
      title="履歴をインポート"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={GHOST_BTN} onClick={onClose}>
            キャンセル
          </button>
          <button type="button" className={PRIMARY_BTN} onClick={run}>
            現在のセッションに追加
          </button>
        </>
      }
    >
      <p className="text-text-dim text-[13px]">
        エクスポートした履歴 JSON（
        <code className="bg-bg rounded px-1">{'{ "messages": [...] }'}</code>{" "}
        形式）を貼り付けてください。現在の会話の末尾に追加されます。
      </p>
      <textarea
        ref={taRef}
        className={TEXTAREA}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'{\n  "messages": [\n    { "role": "user", "content": "..." }\n  ]\n}'}
        aria-label="インポートする履歴 JSON"
        spellCheck={false}
      />
      {error && <p className="text-[13px] text-[#ff8a8a]">{error}</p>}
    </Modal>
  );
}
