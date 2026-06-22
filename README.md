# Custom AI Chat

OpenAI互換API なら何でもチャットできる、ChatGPT風のローカルWeb UI。
`BASE_URL` / `MODEL` / `API_KEY` を `.env` で書き換えるだけで、Sakana AI の **Fugu** でも、
OpenAI でも、ローカルの llama.cpp / Ollama でも同じUIから使えます。

- ストリーミング表示（トークンが届くたびに逐次表示）
- APIキーはサーバー側に留まり、ブラウザには出ない（薄いプロキシ構成）
- 依存パッケージ **ゼロ**（Node 標準機能のみ）。履歴はメモリ上だけ（リロードで消える）

## 必要なもの

- Node.js **v22.6 以上**（`--env-file` と TypeScript の直接実行に対応）

## セットアップ

```sh
cp .env.example .env
# .env を編集して API_KEY などを設定
npm start
```

ブラウザで http://localhost:8787 を開く。

## .env

```ini
# OpenAI互換APIのベースURL（末尾の /v1 まで含める）
BASE_URL=https://api.sakana.ai/v1
# 使うモデル名（Fugu の例: fugu / fugu-ultra）
MODEL=fugu-ultra
# APIキー
API_KEY=sk-...
# （任意）ポート
PORT=8787
```

### 別のモデルに切り替える例

| サービス        | BASE_URL                          | MODEL の例        |
| --------------- | --------------------------------- | ----------------- |
| Sakana Fugu     | `https://api.sakana.ai/v1`        | `fugu-ultra`      |
| OpenAI          | `https://api.openai.com/v1`       | `gpt-4o`          |
| Ollama (ローカル) | `http://localhost:11434/v1`       | `llama3.1`        |
| llama.cpp       | `http://localhost:8080/v1`        | （任意）          |

`.env` を書き換えてサーバーを再起動すれば反映されます。

## 仕組み

```
ブラウザ (src/public/*)
   │  POST /api/chat  { messages }
   ▼
Node サーバー (src/server.ts)   ← API_KEY をここで付与
   │  POST {BASE_URL}/chat/completions  (stream: true)
   ▼
OpenAI互換API（Fugu 等）
```

サーバーは上流のSSEストリームをそのままブラウザへ中継します。
ブラウザ側で `data:` 行をパースして `choices[].delta.content` を結合し、逐次描画します。

## 注意

- 履歴はブラウザのメモリ上のみ。永続化は行いません（リロードで消えます）。
- `.gitignore` で `.env` は除外済み。キーをコミットしないよう注意してください。
- `fugu-ultra` は推論系モデルです。応答開始まで少し時間がかかることがあります。
