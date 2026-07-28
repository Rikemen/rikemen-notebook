# Antigravity 設定ガイド

Antigravity IDEを実務で安全・快適に利用するための初期設定について説明します。
本ガイドでは、**「プロジェクトごとに設定するもの」**と**「初回のみ（グローバル）設定するもの」**に分けて解説します。

## 1. プロジェクトごとの設定

### 1.1 エディタ設定 (`.vscode/settings.json`)

エージェントとエディタ機能の競合（フォーマッターの喧嘩など）を防ぐための設定です。
`.vscode` ディレクトリをプロジェクトルートに作成し、以下の内容で `settings.json` ファイルを作成・設定してください。（プロジェクトのルートに `.vscode > settings.json` として配置することで、そのプロジェクトのみに設定が適用されます）

```json
{
  // --- 表示・ラッピング制御 ---
  "editor.wordWrap": "off",
  "editor.wrappingIndent": "none",
  "editor.rulers": [],
  "editor.minimap.enabled": false,

  // --- フォーマット制御 (エージェントとの競合回避) ---
  "editor.formatOnType": false,
  "editor.formatOnPaste": false,
  "files.trimTrailingWhitespace": false,
  "files.insertFinalNewline": false,
  "files.trimFinalNewlines": false,

  // --- 保存時コードアクションの無効化 ---
  "editor.codeActionsOnSave": {
    "source.fixAll": "never",
    "source.organizeImports": "never"
  },

  // --- エージェント用プロファイル設定 ---
  "workbench.settings.applyToAllProfiles": [
    "editor.wordWrap",
    "editor.formatOnSave",
    "files.trimTrailingWhitespace"
  ],

  // --- その他 ---
  "editor.accessibilitySupport": "off",
  "editor.comments.ignoreEmptyLines": false,
  "diffEditor.ignoreTrimWhitespace": false,
  "[prompt]": {},
  "editor.dropIntoEditor.preferences": [],

  // --- 言語固有設定 ---
  "html.format.wrapAttributes": "preserve",
  "html.format.wrapLineLength": 0,
  "css.format.newlineBetweenRules": false,
  "javascript.format.semicolons": "ignore",
  "typescript.format.semicolons": "ignore",

  // --- ユーザー設定 (好み) ---
  "editor.autoIndent": "brackets",
  "editor.tabSize": 2
}
```

### 1.2 ルール (Rules)

`.agent/rules/` ディレクトリに配置されたマークダウンファイルは、エージェントが**常に**遵守すべき行動規範として機能します。

- **`senior-engineer-conduct.md`**: シニアエンジニアとしての振る舞い（安全性、透明性、思考の深さ）を強制します。
- **`indexing-codebase.md`**: プロジェクト構造認識（Context Awareness）を強制します。推測でファイルパスや依存関係を捏造せず、必ず実在確認を行ってから行動することを定めています。
- **`git-commit-rules.md`**: GitHub のコミットメッセージ形式を強制します。
- **`language-strategies.md`**: 言語使用に関する戦略です。
  - **注意**: 内部推論（CoT）やコード自体は英語が推奨されるため、**エージェントの出力が完全に日本語になるわけではなく、日本語出力の可能性が高まるルールです**。
  - ユーザー向けの最終出力（チャット、ドキュメント）は日本語になるよう指示されています。

#### Activation Mode (ルールの有効化設定)

Antigravity では、各ルールファイルをいつコンテキストに読み込むかを **Activation Mode** で制御できます。エディタの設定画面またはルールファイル作成時に以下の4つから選択します。

- **Always On (常時有効)**
  - すべての対話で常に読み込まれます。
  - 用途: プロジェクト全体の行動規範、言語設定、絶対に守るべき禁止事項。
- **Glob (ファイルパス連動)**
  - 指定したパターン（例: `**/*.ts`）に一致するファイルを編集・閲覧している時のみ有効化されます。
  - 用途: 特定言語やフレームワーク（React, SQLなど）固有のコーディング規約。
- **Model Decision (AI判断)**
  - 会話の内容から AI が「このルールが必要だ」と判断した場合に自動的に読み込まれます。
  - 用途: 特定のライブラリの詳細仕様など、必要な時だけ参照してほしい情報。
- **Manual (手動)**
  - ユーザーがチャットで明示的に（`@RuleName` 等で）参照しない限り読み込まれません。
  - 用途: 頻繁には使わない手順書や、コンテキストを圧迫したくない長大なドキュメント。

**設定画面へのアクセス方法**  
エディタ右下の `Antigravity - Settings > Customizations [Manage] > Rules` から、GUI 上でルールの作成や Activation Mode の変更が可能です。

### 1.3 ワークフロー (Workflows)

Antigravity のチャット欄で `/` (スラッシュ) を入力すると、利用可能なワークフロー（`.agent/workflows/*.md` で定義されたコマンド）の一覧がオートコンプリート候補として表示されます。

| コマンド     | 説明                                    | モード       |
| ------------ | --------------------------------------- | ------------ |
| `/ask`       | ファイルを変更せずに相談のみを行う      | 読み取り専用 |
| `/check`     | 既存コードの仕様や挙動を確認・分析する  | 読み取り専用 |
| `/plan`      | 実装計画を作成する（コード編集禁止）    | 計画モード   |
| `/grasp`     | コードの依存関係や役割を分析する        | 読み取り専用 |
| `/review`    | コードやテキストのレビューを受ける      | -            |
| `/explain`   | コードや仕様について詳しく説明を求める  | -            |
| `/commit`    | Gitのコミットメッセージを生成（英語）   | -            |
| `/commit-ja` | Gitのコミットメッセージを生成（日本語） | -            |
| `/discard`   | 現在のセッション内容を要約して破棄      | -            |
| `/update-file` | ファイルやドキュメントの記述を現在の実態に合わせて更新する | - |
| `/update-slide-number` | スライドファイル名の連番を自動的に更新する | - |
| `/create-rop` | 文字起こしファイルから議事録を生成する | - |

これらは一例であり、`.agent/workflows/` およびグローバルに定義されたすべてのワークフローを実行できます。
また、エディタ右下の `Antigravity - Settings > Customizations [Manage] > Workflows` から、グローバルまたは現在のワークスペース固有のスラッシュコマンドを追加・編集できます。

詳細な仕様については [Antigravity Documentation: Rules & Workflows](https://antigravity.google/docs/rules-workflows) を参照してください。

### 1.4 スキル (Agent Skills)

Skills は、エージェントに追加の能力（外部ツール連携、特定のデータ取得方法など）を与えるための仕組みです。`.agent/skills/` ディレクトリに配置された各スキルの `SKILL.md` に定義された手順に従ってエージェントが行動します。

#### knowledge-cutoff-awareness (プリインストール済み)

このスターターテンプレートには、エージェントに「現在のシステム時刻」を認識させるスキルがあらかじめ組み込まれています。

- **機能**: 現在の日時を取得し、相対的な日付計算（明日、先週など）を行います。
- **利点**: 学習データのカットオフ（Knowledge Cutoff）を意識し、「2026年の最新情報」などを検索する際に適切な時間的コンテキストを提供します。
- **ソース**: [github.com/imkohenauser/knowledge-cutoff-awareness](https://github.com/imkohenauser/knowledge-cutoff-awareness)

#### indexing-awareness (v1.1.0 追加)

- **機能**: プロジェクト構造とドキュメント（Usage）の整合性を検証します。
- **利点**: 「ルールがあるのにドキュメントに書いてない」といった状態（隠れルール）を防ぎ、エージェントの認識齟齬を減らします。

詳細な仕様については [Antigravity Documentation: Skills](https://antigravity.google/docs/skills) を参照してください。

### 1.5 カスタマイズのまとめ

| ファイル            | 用途                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `AGENTS.md`         | プロジェクト固有の技術ガイドライン（コマンド、コードスタイル、アーキテクチャ） |
| `.agent/rules/`     | エージェントの行動規範を追加・編集                                             |
| `.agent/workflows/` | 独自のスラッシュコマンドを追加                                                 |

## 2. 初回のみ（グローバル）の設定

これらの設定は一度行えば、プロジェクトをまたいでも適用される、あるいは1回だけ設定すれば済むものです。

### 2.1 Terminal Execution Policy (Deny List) の設定

設定画面の Terminal Execution Policy から、エージェントによる自動実行をブロックするコマンドのリストに以下を追加してください。

**推奨 Deny List**
以下のパターンを1行ずつ追加することをおすすめします。

| コマンドパターン | 危険な理由                                                             |
| :--------------- | :--------------------------------------------------------------------- |
| `sudo`           | 特権昇格により、他のすべての制限をバイパスできてしまう                 |
| `rm -rf`         | 再帰的にファイルを削除する定番コマンド。ワークスペースが消える高リスク |
| `mkfs`           | パーティションのフォーマットに使用。ドライブの全データが消える可能性   |
| `dd`             | 低レベルのデータ複製ツール。誤用するとハードドライブ全体を上書きできる |
| `chmod -R 777`   | 全ユーザーに読み書き実行権限を開放してしまう重大なセキュリティホール   |
| `curl \| sh`     | 外部スクリプトをダウンロードして即実行するパターンを防ぐ               |
| `env`            | 環境変数（APIキー等の機密情報が含まれることが多い）を一覧表示させない  |
| `history`        | 過去に入力した機密コマンドやパスワードが平文で露出する恐れがある       |
| `shutdown`       | 誤って（または意図的に）マシンをシャットダウンされるのを防ぐ           |
| `reboot`         | 同上。エージェントによる予期せぬ再起動を防ぐ                           |

### 2.2 Terminal Sandboxing の有効化（macOS）

設定から「Enable Terminal Sandboxing」をオンにしてください。

### 2.3 Antigravity IDE 設定

ウィンドウ右下の `Antigravity - Settings` からの設定です。エージェントの「自律性」と「安全性」のバランスを調整します。

#### Security (セキュリティ)
- `Strict Mode`: **Off**

#### Artifact (成果物・生成コード)
- `Review Policy`: **Request Review** (必ず人間が確認を行う)

#### Terminal (ターミナル)
- `Command Auto Execution`: **Always Proceed** (確認プロンプトをスキップ)
- `Enable Sandbox`: **On** (ネットワーク許可)

#### Automation (自動化・ファイル操作)
- `Agent Auto-Fix Lints`: **Off** (動作軽量化のため無効化)
- `Auto-Continue`: **On**
- `Auto-Open Edited Files`: **On**

#### History & Context (履歴・コンテキスト)
- `Conversation History`: **Off** (重要: 過去のチャット履歴による文脈汚染を防ぐ)
- `Knowledge`: **Off** (重要: 不正確なRAG検索を避け、都度読み込みさせる)

### 2.4 プロジェクト共通設定 (`~/.gemini/GEMINI.md`)

**設定なし**  
プロジェクト毎に `antigravity-starter-ja` を配置。

### 2.5 推奨拡張機能 (Extensions)

無闇な拡張機能の追加はエージェントのコンテキスト認識に悪影響を与える可能性があるため、必要最小限の構成を推奨します。

※現在、準備中です。
