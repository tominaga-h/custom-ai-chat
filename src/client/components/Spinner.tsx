/** 応答待ち中に表示する回転スピナー（Tailwind の animate-spin を利用）。 */
export function Spinner() {
  return (
    <span
      className="border-text-dim inline-block size-4 animate-spin rounded-full border-2 border-t-transparent align-[-2px]"
      role="status"
      aria-label="考え中"
    />
  );
}
