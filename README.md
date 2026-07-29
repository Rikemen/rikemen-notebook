# Rikmen Notebook
## 📖 初期セットアップ手順

> **💡 stg / prod 環境分離について:**
>
> 使い捨てではない本格的なアプリを開発する場合、**最初に作成するGitHubリポジトリとFirebaseプロジェクトはステージング（stg）用**として構成してください。本番（prod）用のリポジトリやFirebaseプロジェクトは、開発がある程度進んだ段階で別途作成します。最初からstgとして始めておくことで、後からprod環境を追加する際にスムーズに移行できます。環境分離の詳細は「[ローカル・ステージング・本番環境について](#ローカルステージング本番環境について個人開発を想定)」を参照してください。

1. このリポジトリ（スターターキット）をGitクローンします。
   ```bash
   git clone https://github.com/<ベースキットのリポジトリURL>.git <your-project-name>
   cd <your-project-name>
   ```
2. Gitリモートの向き先を自分のリポジトリに変更します。
   - まず、GitHub上に新しいリポジトリを作成してください（stg/prod分離する場合は、リポジトリ名に `-stg` を付けるなどしてstg用と分かるようにしておくと管理しやすくなります）。
   - クローン元（スターターキット）のoriginを `upstream` にリネームし、自分のリポジトリを新たな `origin` として設定します。
   ```bash
   # 現在のoriginをupstreamにリネーム（ベースキットの更新を取り込みたい場合に残す）
   git remote rename origin upstream
   # 自分のリポジトリをoriginとして追加
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   # 自分のリポジトリにプッシュ
   git push -u origin main
   ```
   - ベースキットの更新を今後取り込む必要がない場合は、`upstream` を削除しても構いません。
   ```bash
   git remote remove upstream
   ```
   - 設定後、`git remote -v` で向き先が正しいことを確認してください。
3. `npm install -g firebase-tools` を実行して、Firebase toolsをインストールします。
4. 必要なnodeモジュールを取得するため、`npm install` を一度実行します。
5. `functions` ディレクトリ内でも `npm install` を一度実行します。
6. Firebaseコンソール (https://firebase.google.com から) を開き、プロジェクトを追加します（stg/prod分離する場合は、プロジェクト名に `-stg` を含めてステージング用として作成してください）。
   - Firebase CLI でログインしていることを確認してください。`firebase login` を実行して、Google アカウントでログインします。
   - CLIでのfirebase initは不要です(このキット自体が初期設定を代行しているため)
   - CLIでのfirebase use --add でプロジェクトを追加し、その後 firebase use でプロジェクトを選択することは必要です。
7. このプロジェクトのダッシュボードから、アプリを追加し「ウェブ」 (</>) を選択します。
8. このアプリの設定から、「Config」を選択します（Firebase SDKスニペット内）。
9. 設定ファイルをコピーし、`src/config/project.ts` ファイルに貼り付けます。
10. `.firebaserc` ファイル内の `fir-vue-startup-kit` という単語を、あなたのFirebaseプロジェクト名に置き換えます。
11. Firebaseコンソールを開き、Cloud Firestoreを作成します（とりあえず「セキュア」にしておきます）。
12. FirebaseコンソールでFirebase Hostingを有効にします。

## 開発環境の立ち上げ

1. パッケージのインストール

```bash
npm install
cd functions && npm install && cd ..
```

2. ローカルサーバーの起動

```bash
npm run serve
```

[http://localhost:8080](http://localhost:8080) でブラウザからアクセスできます。

## 変更後の使い方

Viteのmode別設定により、Emulator用ビルドはローカルのFirebase Emulatorへ接続し、
本番用ビルドはFirebase本番環境へ接続します。環境変数を実行のたびに編集する必要はありません。

### Emulatorの場合

```bash
npm run build:emulator
npx -y firebase-tools@latest emulators:start
```

起動後、[http://127.0.0.1:5000](http://127.0.0.1:5000)を開きます。

### 本番の場合

```bash
npx -y firebase-tools@latest deploy \
  --project rikemen-notebook \
  --only hosting:app
```

本番デプロイではproduction modeでビルドされた`dist`をFirebase Hostingへ公開します。

---

## 💻 Functions

デフォルト設定のコールドスタートの場合、Firebase Functionsは非常に遅いため、このスタートアップキットは少しカスタムされたFirebase Functionsとなっています。

### Functions側

- Functionsはラッパー関数（`functions/src/common/exportifneeded.ts` の `exportIfNeeded` 関数）を使用して呼び出されます。必要な関数のみを読み込みます。
- Functionsは十分なメモリで起動します。`functions/src/wrappers/tests/test.ts` にある `test` 関数は1GBのメモリで実行されます。
- Functionsは近くのリージョンで実行されます。デフォルトでは日本リージョンに設定されています。

このため、Functionsは少し特殊な使い方をされています。
クライアントから呼び出されるFunctionsは、`src/index.ts` に `exportIfNeeded ("test", "tests/test", exports);` のように書かれます。

この場合、クライアントは `test` を関数として呼び出します。そしてクライアントが `test` Functionを呼び出すと、`functions/src/wrappers/tests/test.ts` 内のデフォルト関数が呼び出されます。詳細についてはこのファイルを参照してください。

### Vue.js側

- 関数設定は `src/utils/firebase.ts` にあります。デフォルトでは、`asia-northeast1` (東京) リージョンを呼び出すように設定されています。
- すべての機能は `src/utils/functions.ts` にまとめられています。新しい関数はこのファイルに追加する必要があります。

### リージョン

Functionsのリージョンは `asia-northeast1` (東京) に設定されています。リージョンを変更する場合は、必ずFunctions側とVue.js側の両方を変更してください。

## 🌎 i18n

- このスタートアップキットは、URLパスを使用したi18nをサポートしています。
- `/en/index` と `/jp/index` の両方で1つのVueファイルを使用できます。
- 言語ファイルは `src/i18n/` ディレクトリにあります。
  - `en.ts` と `ja.ts` が言語ファイルです。
  - 言語切り替えプルダウン（セレクト）に使用される言語ファイルは `language.ts` です。同じファイルが `en.ts` と `ja.ts` から読み込まれます。それぞれの言語で記述してください。
  - 新しい言語を追加したい場合は、`index.ts` に言語を追加し、`{language}.ts` を追加し、`language.ts` に言語を追加します。
- URLパスで言語を切り替える方法については、`src/router/index.ts` も参照してください。
- `src/components/Languages.vue` にある言語切り替えプルダウンを使用できます。このファイルは `route.param.lang` を読み込む必要があるため、`App.vue` と `Layout.vue` では使用しないでください。それ以外の場所ではどこでも使用できます。
- i18nは `vue-i18n@next` を使用しているため、使用方法の詳細についてはそちらを参照してください。

## 📄 利用可能なスクリプト

プロジェクトディレクトリで、以下を実行できます：

### `npm run serve`

開発モードでアプリを実行します。<br>
ブラウザで表示するには [http://localhost:8080](http://localhost:8080) を開いてください。

編集するとページがリロードされます。<br>
コンソールにはLintエラーも表示されます。

### `npm run build`

本番環境用にアプリを `dist` フォルダにビルドします。<br>
本番モードのVueを正しくバンドルし、最高のパフォーマンスが得られるようにビルドを最適化します。

ビルドは最小化され、ファイル名にはハッシュが含まれます。<br>
これでアプリのデプロイ準備は完了です！

### `firebase deploy`

Firebaseクラウドにアプリをデプロイします。デプロイの前に `npm run build` を実行する必要があります。

**モックサイトのみをデプロイする場合:**

```bash
firebase deploy --only hosting:mock
```

### `npm run format`

Prettierを実行し、コードフォーマットとしてコードを書き換えます。

---

## UI モック (Design Mockups)

システムデザインの検討および要件定義のため、`system-design/mock/` ディレクトリにHTML/CSSベースのUIモックを構築しています。これらはFirebase Hostingのマルチサイト機能を利用して公開することが可能です。

### Hostingのマルチサイト機能の使い方

Firebase Hostingで複数のサイト（例: ユーザー向けサイト、キオスク向けサイトなど）を個別に管理・デプロイするには、以下の手順でマルチサイト設定とターゲットの登録を行います。

#### 1. サイトの作成

Firebase CLIを使用して、新しいHostingサイトを作成します。

```bash
firebase hosting:sites:create <YOUR_SITE_ID>
```

※ `<YOUR_SITE_ID>` には一意のサイト名（例: `mock-your-project-id`）を指定します。作成したサイトのURLは `https://<YOUR_SITE_ID>.web.app` になります。

#### 2. デプロイターゲットの適用

作成したサイトを、プロジェクト内のターゲット名（`firebase.json` で指定しているエイリアス名）に紐付けます。

```bash
firebase target:apply hosting <TARGET_NAME> <YOUR_SITE_ID>
```

- `<TARGET_NAME>`: `firebase.json` 内で設定する識別子（例: `mock` など）。
- `<YOUR_SITE_ID>`: 手順1で作成したサイトID。

**実行例:**

```bash
# mockターゲットを mock-your-project-id サイトに紐付ける場合
firebase target:apply hosting mock mock-your-project-id
```

この操作を行うと、プロジェクトルートの `.firebaserc` にターゲット情報が自動的に保存されます。

#### 3. 設定ファイルの構成（参考）

`firebase.json` で複数のターゲットを配列で定義します。（すでに設定されている場合は変更不要です）

```json
{
  "hosting": [
    {
      "target": "mock",
      "public": "system-design/mock",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
    }
  ]
}
```

設定完了後、指定したターゲットのみを選択してデプロイすることが可能になります。

```bash
firebase deploy --only hosting:mock
```

## ローカル・ステージング・本番環境について（個人開発を想定）

- 開発初期 : ローカルのみ or ローカルとステージングで開発する
- 開発中盤 : ローカル・ステージング
- 開発終盤 : ローカル・ステージング・本番環境で開発する

## その他Tips

- コンテナ保存期間をfirebaseデプロイ時にCLIで聞かれた時は基本はデフォルトの1日でOK
- firebase deployの際にhono serverだけ再度デプロイするとうまく行く場合がある(権限付与される前に内部的に先にデプロイが走ってしまうことがあるそう)

> **📝 開発ログ:** 開発中にハマったポイントやトラブルシューティングの詳細は `DEVLOG.md`（または `DEVLOG.html`）に記録しています。問題に遭遇した際は、まずそちらを確認してください。

## 🤖 AIエージェント設定（`.agent/`）

このプロジェクトには、AIコーディングアシスタント（Antigravity等）向けのワークフロー・スキル・ルールが `.agent/` ディレクトリに格納されています。

### ワークフロー（`.agent/workflows/`）

チャットで `/コマンド名` を入力すると、対応するワークフローが起動します。

| コマンド | 説明 |
|----------|------|
| `/ask` | 読み取り専用の相談モード。ゼロコンテキスト戦略で客観的な助言を提供する |
| `/check` | 既存コードの仕様・挙動・依存関係を調査する（読み取り専用） |
| `/commit` | staged変更からConventional Commits形式のコミットメッセージを英語で生成する |
| `/commit-ja` | staged変更からConventional Commits形式のコミットメッセージを日本語で生成する |
| `/create-rop` | 文字起こしファイルから構造化された議事録を自動生成する |
| `/discard` | 現在のセッションを要約し、新しいセッションの再開プロンプトを生成する |
| `/explain` | コードや概念の「なぜ」と「どのように」を焦点に説明する（読み取り専用） |
| `/grasp` | コードの役割・依存関係・影響範囲を360度分析する（読み取り専用） |
| `/make-dev-plan` | 実装計画を水色ベースデザインの1ファイルHTMLとして `docs/` に生成する |
| `/make-lightblue-doc` | 水色ベースデザインでインライン編集・JSON入出力を備えたHTMLドキュメントを生成する |
| `/plan` | 実装計画を `implementation_plan.md` として生成する（コード変更は行わない） |
| `/review` | コードまたはテキストをレビューし、重大な問題・提案・称賛に分類して報告する |

### スキル（`.agent/skills/`）

エージェントが特定の状況で自動的に、または明示的な指示で使用する拡張機能です。

| スキル名 | 説明 |
|----------|------|
| `indexing-awareness` | プロジェクトの構造インデックスと依存関係トレースにより、RAG的なコンテキスト取得を実現する。`index-structure.sh`、`trace-dependencies.sh`、`verify-structure.sh` の3つのスクリプトを提供 |
| `knowledge-cutoff-awareness` | システムの現在日時を取得し、知識カットオフによる事実の捏造を防止する |
| `sync-readme-html` | `README.md` の変更時に `README.html` を水色ベースのデザインシステムで自動同期する |

### ルール（`.agent/rules/`）

エージェントの行動規範・コーディング規約を定義するファイル群です。`git-commit-rules.md`（コミットメッセージ規約）、`indexing-codebase.md`（構造認識）、`language-strategies.md`（言語戦略）、`senior-engineer-conduct.md`（行動規範）が含まれています。

## 📘 README.html

`README.html` は `README.md` と同じ内容を、水色ベースのデザインシステムで整形したHTMLドキュメントです。ブラウザで直接開いて閲覧できます。

- **情報源**: `README.md` が唯一の情報源（Single Source of Truth）です
- **同期**: `README.md` を更新した際は、`sync-readme-html` スキルにより `README.html` も同期されます
- **デザイン**: 固定ヘッダー + 左サイドバー（目次） + メインコンテンツのレイアウト、860px以下でレスポンシブ対応
- **直接編集禁止**: `README.html` を直接編集せず、必ず `README.md` を編集してください
