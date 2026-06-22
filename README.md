# Custom AI Chat

OpenAI互換API なら何でもチャットできる、ChatGPT風のローカルWeb UI。
`BASE_URL` / `MODEL` / `API_KEY` を `.env` で書き換えるだけで、Sakana AI の **Fugu** でも、
OpenAI でも、ローカルの llama.cpp / Ollama でも同じUIから使えます。

- **React + TypeScript + Vite + Tailwind CSS v4** 製のフロントエンド
- ストリーミング表示（トークンが届くたびに逐次表示）
- APIキーは Node サーバー側に留まり、ブラウザには出ない（薄いプロキシ構成）
- 履歴はメモリ上だけ（リロードで消える）

## 構成

```
ブラウザ (React / src/client)
   │  POST /api/chat  { messages }
   ▼
Node プロキシ (src/server.ts)   ← API_KEY をここで付与。dist/ も配信
   │  POST {BASE_URL}/chat/completions  (stream: true)
   ▼
OpenAI互換API（Fugu 等）
```

開発時は Vite dev サーバー(5173)が `/api/*` を Node サーバー(8787)へプロキシします。
本番は `vite build` した `dist/` を Node サーバーが配信します。

## 必要なもの

- Node.js **v22.6 以上**（`--env-file` と TypeScript の直接実行に対応）

## セットアップ

```sh
npm install
cp .env.example .env
# .env を編集して API_KEY などを設定
```

### 開発（ホットリロード）

```sh
npm run dev          # Node API(8787) と Vite(5173) を同時起動
```

ブラウザで http://localhost:5173 を開く。

### 本番（ビルドして配信）

```sh
npm start            # vite build → Node サーバーが dist/ を配信
```

ブラウザで http://localhost:8787 を開く。

## スクリプト

| コマンド            | 内容                                                 |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Node API + Vite dev を同時起動（ホットリロード）     |
| `npm run dev:api`   | Node API サーバーのみ（`--watch`）                   |
| `npm run dev:web`   | Vite dev サーバーのみ                                |
| `npm run build`     | 型チェック + `vite build`（`dist/` を生成）          |
| `npm start`         | ビルドして Node サーバーで配信                       |
| `npm run typecheck` | TypeScript の型チェックのみ                          |

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

## ストリーミングの仕組み

サーバーは上流のSSEストリームをそのままブラウザへ中継します（`src/server.ts`）。
ブラウザ側（`src/client/useChat.ts`）で `data:` 行をパースして
`choices[].delta.content` を結合し、React の state 経由で逐次描画します。

## 注意

- 履歴はブラウザのメモリ上のみ。永続化は行いません（リロードで消えます）。
- `.gitignore` で `.env` は除外済み。キーをコミットしないよう注意してください。
- `fugu-ultra` は推論系モデルです。応答開始まで少し時間がかかることがあります。
