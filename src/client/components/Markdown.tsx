import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Tailwind の preflight で素の要素はスタイルが落ちるため、各要素にクラスを当てて整える。
// react-markdown は dangerouslySetInnerHTML を使わず React 要素を生成する（rehype-raw 未使用なので生HTMLは無効化＝XSS安全）。
const components: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-[1.5em] font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-[1.3em] font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-2 text-[1.15em] font-bold first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-3 mb-1 font-bold first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-6">{children}</ol>,
  li: ({ children }) => <li className="my-1">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-border-soft text-text-dim my-2 border-l-2 pl-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border-soft my-4" />,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="opacity-70">{children}</del>,
  // インラインコードとコードブロックを判定。pre 内（コードブロック）はそのまま、
  // インラインは背景付きで描画する。
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return <code className="font-mono text-[0.85em]">{children}</code>;
    }
    return (
      <code className="bg-bg-elev rounded px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-bg-elev border-border-soft my-2 overflow-x-auto rounded-lg border p-3">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-border-soft w-full border-collapse border text-[0.95em]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-bg-elev">{children}</thead>,
  th: ({ children }) => (
    <th className="border-border-soft border px-3 py-1.5 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-border-soft border px-3 py-1.5">{children}</td>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
