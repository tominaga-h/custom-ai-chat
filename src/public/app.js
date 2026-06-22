// @ts-check
const thread = document.getElementById("thread");
const empty = document.getElementById("empty");
const form = document.getElementById("composer");
const input = /** @type {HTMLTextAreaElement} */ (document.getElementById("input"));
const sendBtn = /** @type {HTMLButtonElement} */ (document.getElementById("send"));
const clearBtn = document.getElementById("clear");
const meta = document.getElementById("meta");

/** @type {{ role: "user" | "assistant", content: string }[]} */
const history = [];
let busy = false;

// --- 設定表示（モデル名 / ホスト。キーはサーバーに留まる） ---
fetch("/api/config")
  .then((r) => r.json())
  .then((c) => {
    meta.textContent = `${c.model} @ ${c.host}`;
  })
  .catch(() => {
    meta.textContent = "(設定の取得に失敗)";
  });

// --- textarea 自動リサイズ（field-sizing 非対応ブラウザ向けフォールバック） ---
const supportsFieldSizing = window.CSS?.supports?.("field-sizing", "content");
function autosize() {
  if (supportsFieldSizing) return;
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 240) + "px";
}
input.addEventListener("input", autosize);

// --- Enter送信 / Shift+Enter改行 ---
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form.requestSubmit();
  }
});

function scrollToBottom() {
  thread.scrollTop = thread.scrollHeight;
}

/**
 * @param {"user" | "assistant" | "error"} role
 * @param {string} text
 * @returns {HTMLElement} bubble 要素（ストリーミング中に追記する）
 */
function addMessage(role, text) {
  empty?.remove();
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;

  const badge = document.createElement("div");
  badge.className = "role";
  badge.textContent = role === "user" ? "You" : role === "assistant" ? "AI" : "!";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  msg.append(badge, bubble);
  thread.append(msg);
  scrollToBottom();
  return bubble;
}

function setBusy(state) {
  busy = state;
  sendBtn.disabled = state;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return;

  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  history.push({ role: "user", content: text });

  input.value = "";
  autosize();
  setBusy(true);

  const bubble = addMessage("assistant", "");
  bubble.classList.add("streaming");
  let acc = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(errText || `HTTP ${res.status}`);
    }

    // SSE をパースして delta を結合
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
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            acc += delta;
            bubble.textContent = acc;
            scrollToBottom();
          }
        } catch {
          // 不完全な JSON 断片は無視
        }
      }
    }

    bubble.classList.remove("streaming");
    if (acc) {
      history.push({ role: "assistant", content: acc });
    } else {
      bubble.textContent = "(空の応答)";
    }
  } catch (err) {
    bubble.classList.remove("streaming");
    bubble.parentElement?.classList.replace("assistant", "error");
    bubble.parentElement?.classList.add("error");
    bubble.textContent = `エラー: ${err instanceof Error ? err.message : String(err)}`;
    // 失敗した応答は履歴に残さない（再送できるよう user メッセージは残す）
  } finally {
    setBusy(false);
    input.focus();
  }
});

clearBtn?.addEventListener("click", () => {
  if (busy) return;
  history.length = 0;
  thread.innerHTML = "";
  const e = document.createElement("div");
  e.className = "empty";
  e.innerHTML =
    '<h1>何でも聞いてください</h1><p>BASE_URL / MODEL / API_KEY はサーバーの <code>.env</code> で切り替えられます。</p>';
  thread.append(e);
  input.focus();
});
