import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
const MODEL = process.env.MODEL ?? "";
const API_KEY = process.env.API_KEY ?? "";
const PORT = Number(process.env.PORT ?? 8787);

if (!BASE_URL || !MODEL || !API_KEY) {
  console.error(
    "[custom-ai-chat] .env が不足しています。BASE_URL / MODEL / API_KEY を設定してください。\n" +
      "  .env.example をコピーして .env を作成してください: cp .env.example .env",
  );
  process.exit(1);
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function send(res: ServerResponse, status: number, body: string, contentType: string): void {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

/** ブラウザからの履歴を受け取り、上流の /chat/completions へストリーミング転送する */
async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let messages: ChatMessage[];
  try {
    const parsed = JSON.parse(await readBody(req));
    messages = parsed.messages;
    if (!Array.isArray(messages)) throw new Error("messages は配列である必要があります");
  } catch (err) {
    send(res, 400, JSON.stringify({ error: String(err) }), "application/json");
    return;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
    });
  } catch (err) {
    send(res, 502, JSON.stringify({ error: `上流への接続に失敗: ${String(err)}` }), "application/json");
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    send(res, upstream.status || 502, JSON.stringify({ error: text || upstream.statusText }), "application/json");
    return;
  }

  // 上流の SSE をそのままブラウザへ流す
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } catch {
    // クライアント切断など — 黙って終了
  } finally {
    res.end();
  }
}

const STATIC: Record<string, { file: string; type: string }> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
  "/styles.css": { file: "styles.css", type: "text/css; charset=utf-8" },
};

const server = createServer(async (req, res) => {
  const url = (req.url ?? "/").split("?")[0];

  if (req.method === "POST" && url === "/api/chat") {
    await handleChat(req, res);
    return;
  }

  if (req.method === "GET" && url === "/api/config") {
    // キーは絶対に返さない。表示用にモデル名とBASE_URLのホストだけ
    let host = "";
    try {
      host = new URL(BASE_URL).host;
    } catch {
      host = BASE_URL;
    }
    send(res, 200, JSON.stringify({ model: MODEL, host }), "application/json");
    return;
  }

  const asset = STATIC[url];
  if (req.method === "GET" && asset) {
    try {
      const body = await readFile(join(__dirname, "public", asset.file));
      res.writeHead(200, { "Content-Type": asset.type });
      res.end(body);
    } catch {
      send(res, 404, "Not Found", "text/plain; charset=utf-8");
    }
    return;
  }

  send(res, 404, "Not Found", "text/plain; charset=utf-8");
});

server.listen(PORT, () => {
  console.log(`\n  custom-ai-chat ▸ http://localhost:${PORT}`);
  console.log(`  model: ${MODEL}  /  base: ${BASE_URL}\n`);
});
