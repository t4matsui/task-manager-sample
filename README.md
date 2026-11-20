# 社内タスク管理サンプル

Next.js（React）フロントエンド、Node.js + Express API、Supabase Auth / Databaseで構成するサンプルです。タスクはログインユーザーごとに分離され、SupabaseのRow Level Security（RLS）でも保護されます。

## 構成

- `frontend/`: Next.js画面（登録、ログイン、パスワードリセット、タスク管理）
- `backend/`: Express API（Bearer token検証、タスクCRUD）
- `supabase/migrations/`: タスクテーブルとRLSポリシー
- `deploy/`: Ubuntu向けDocker ComposeとNginx設定

## Supabaseの準備

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase/migrations/20261119000000_create_tasks.sql` を実行します。
3. Project URLとanon（publishable）keyを控えます。service role keyは使用しません。
4. AuthenticationのURL設定で、Site URLとRedirect URLsに、利用者がアクセスするURL（例 `https://192.168.1.10`）および `https://192.168.1.10/tasks`、`https://192.168.1.10/update-password` を登録します。

メール確認を有効にする場合、Supabaseのメール設定を行ってください。サンプルでは確認メールを利用する動作を想定しています。

## Ubuntu Server 24.04での起動

Docker EngineとDocker Compose pluginをインストールし、このプロジェクトをUbuntuへ配置します。以下はプロジェクトルートを `~/task-manager-sample` に置いた場合の例です。

### 1. 環境変数を設定

```bash
cd ~/task-manager-sample
cp .env.example .env
nano .env
```

`.env` のSupabase URLとanon keyを設定します。`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` にも同じ値を設定してください。

### 2. IPアドレス用の自己署名証明書を作成

アクセスに使うUbuntuの固定IPアドレスを `192.168.1.10` とした例です。実際のIPに置き換えてください。

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 365 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/CN=192.168.1.10" \
  -addext "subjectAltName=IP:192.168.1.10"
chmod 600 certs/server.key
```

自己署名証明書は自動的には信頼されません。アクセスする各PCで `certs/server.crt` を信頼する証明書として登録してください。信頼設定をしない場合、ブラウザーに証明書警告が表示されます。秘密鍵 `server.key` は配布しないでください。

### 3. 起動

```bash
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
```

ブラウザーから `https://192.168.1.10` にアクセスします。HTTP（ポート80）へのアクセスはHTTPSへ転送されます。ファイアウォールでは必要に応じてTCP 80/443を許可してください。

停止・ログ確認:

```bash
docker compose --env-file .env -f deploy/docker-compose.yml ps
docker compose --env-file .env -f deploy/docker-compose.yml logs -f
docker compose --env-file .env -f deploy/docker-compose.yml down
```

`frontend` / `backend` のポートはホストへ公開せず、Nginx経由でのみアクセスできます。Supabaseはホストサービスを利用するため、UbuntuからSupabaseへのインターネット接続が必要です。

## ローカル開発

Node.js 22以降が必要です。ルートの `.env` を作成し、Supabaseの値を設定します。開発サーバーは別プロセスで起動します。

```bash
cd backend
cp ../.env .env
npm install
npm run dev
```

別のターミナルで:

```bash
cd frontend
cp ../.env .env.local
npm install
npm run dev
```

Next.jsは `/api` を `http://localhost:4000` のExpressへ転送します。ブラウザーのSupabase redirect URLには開発用の `http://localhost:3000/**` も登録します。
