# Gauss Notebook Functions

## OpenAI設定

OpenAI APIキーはブラウザ側や `VITE_*` へ設定しません。

ローカルの Firebase Emulator では、Git管理外の
`functions/.secret.local` を作成します。

```dotenv
OPENAI_API_KEY=<自分のOpenAI APIキー>
```

モデルを変更する場合は、Git管理外の `functions/.env.local` を作成します。
省略時は `gpt-5.6-luna` を使用します。

```dotenv
OPENAI_MODEL=gpt-5.6-luna
```

本番用Secretはプロジェクトルートから設定します。

```bash
npx -y firebase-tools@latest functions:secrets:set OPENAI_API_KEY
```

このリポジトリの既定Firebaseプロジェクトは
`.firebaserc` の `rikemen-notebook` です。Secret更新後は
`sendMathChatMessage` Functionの再デプロイが必要です。

APIキー本文をチャット、Vueの `.env`、Firestore、ソースコード、
ログへ保存しないでください。

## Local Emulator

1. プロジェクトルートの `.env.emulator.example` を参考に、
   Git管理外の `.env.local` へ次を設定します。

```dotenv
VITE_USE_FIREBASE_EMULATORS=true
```

2. frontendをビルドし、Firebase Emulatorを起動します。

```bash
npm run build
npx -y firebase-tools@latest emulators:start
```

3. `http://127.0.0.1:5000` を開きます。frontendはAuth `9099`、
   Firestore `8080`、Functions `5001` の各Emulatorへ接続します。
