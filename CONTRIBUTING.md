# 開発・デプロイ手順

## 基本方針

- `main`では直接開発・コミットしない。
- 作業ごとにブランチを作成し、1コミットを1つの論理的な変更に限定する。
- すべての変更はPull Request（PR）を経由して`main`へマージする。
- Firebase本番環境へのデプロイは、最新の`main`からだけ実行する。
- 未コミット変更がある状態、テスト失敗中、Emulator用ビルドの状態ではデプロイしない。

## 1. 最新のmainから作業ブランチを作る

```bash
git switch main
git pull --ff-only origin main
git status --short
git switch -c feat/<task-name>
```

ブランチ名には日本語を使わず、変更内容に応じて`feat/`、`fix/`、`docs/`などを使用する。
`git status --short`に何も表示されないことを確認してからブランチを作成する。

## 2. 開発・テスト・コミット

実装後、変更内容に応じてテストとビルドを実行する。

```bash
npm test
npm run lint
npm --prefix functions run lint
npm --prefix functions run build
npm run build
```

コミット前に`$commit-plan`を使用し、機能、テスト、ドキュメントなどを論理単位へ分割する。
`git add .`や`git add -A`は使用せず、対象ファイルを明示する。

```bash
git status --short
git add <file1> <file2>
git commit -m "feat(scope): 具体的な変更内容"
```

## 3. GitHubへpushしてPRを作る

```bash
git push -u origin <branch-name>
```

GitHubで`<branch-name>`から`main`へのPRを作成し、次を記載する。

- 変更の目的と主要な実装内容
- 実行したテストと結果
- Firebase Rules、Functions、Hostingへの影響
- 画面変更がある場合は確認方法またはスクリーンショット

レビュー指摘を反映した場合は同じ作業ブランチへ追加コミットし、再度pushする。

## 4. PRをmainへマージする

次の条件を満たしてからGitHub上でPRをマージする。

- 必要なレビューが完了している
- 手元のテスト、lint、buildが成功している
- GitHub Checksが設定されている場合はすべて成功している
- 意図しないファイルやSecretが差分に含まれていない

マージ後はGitHub上の作業ブランチを削除する。

## 5. ローカルのmainを最新化する

本番デプロイ前に、マージ済みの`main`を改めて取得する。

```bash
git switch main
git pull --ff-only origin main
git branch --show-current
git status --short
git log -1 --oneline
```

次の状態でなければデプロイしない。

- `git branch --show-current`の結果が`main`
- `git status --short`に何も表示されない
- 最新コミットがマージしたPRの内容と一致する

## 6. デプロイ対象を確認する

`$deploy-plan`を使用し、最後のデプロイ以降に変更されたFirebase対象を確認する。
必要な対象だけを`--only`へ指定し、無関係なサービスをデプロイしない。

初回デプロイまたはOpenAI APIキーを変更する場合は、本番用Secretを設定する。
`functions/.secret.local`はEmulator専用であり、本番環境には反映されない。

```bash
npx -y firebase-tools@latest functions:secrets:set OPENAI_API_KEY \
  --project rikemen-notebook
```

## 7. mainで最終確認して本番デプロイする

```bash
npm test
npm run lint
npm run build
npm --prefix functions run lint
npm --prefix functions run build
```

現在の主要なFirebase対象をすべてデプロイする場合は、次を実行する。

```bash
npx -y firebase-tools@latest deploy \
  --project rikemen-notebook \
  --only hosting:app,functions,firestore:rules,storage
```

Hostingの`predeploy`でも`npm run build`が実行される。
本番ビルドは`.env.production`を使用するため、Firebase Emulatorには接続しない。

## 8. デプロイ後に確認する

デプロイ完了後、[https://rikemen-notebook.web.app](https://rikemen-notebook.web.app)で次を確認する。

- Googleアカウントで新規登録・ログインできる
- ノートを作成し、再読み込み後も保存されている
- ノート画面の各パネルが表示される
- AIチャットから応答が返る
- ブラウザのNetworkに`127.0.0.1`や`localhost`への通信がない
- Firebase Functionsのログに継続的なエラーがない

デプロイしたコミットは次で確認する。

```bash
git rev-parse --short HEAD
```

デプロイ日時、環境、Firebaseプロジェクト、コミットSHA、対象サービスを
`DEPLOYMENTS.md`へ記録する。記録の変更も直接`main`へコミットせず、
`docs/record-production-deploy-<date>`ブランチからPRを作成する。

## Emulatorで確認する場合

Emulatorは作業ブランチで利用できる。本番デプロイとはコマンドを分ける。

```bash
npm run build:emulator
npx -y firebase-tools@latest emulators:start
```

[http://127.0.0.1:5000](http://127.0.0.1:5000)を開いて確認する。
