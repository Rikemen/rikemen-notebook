---
name: sync-readme-html
description: README.md が更新されたとき、同じ内容を README.html に反映する同期スキル。水色ベースのデザインシステム（docs/dev-plan.html 準拠）で整形されたHTMLドキュメントを生成する。
---

# README.md → README.html 同期スキル

## トリガー

以下のいずれかが発生した場合にこのスキルを適用する：

- `README.md` の内容が変更（追加・編集・削除）された
- ユーザーが「READMEをHTMLに同期して」「README.htmlを更新して」等のリクエストをした

## 目的

プロジェクトルートの `README.md` と `README.html` を常に同じ内容で同期する。
`README.html` は水色ベースのデザインシステムで整形されたHTMLドキュメントであり、ブラウザで直接開いて閲覧可能。

## ソースと出力

| 項目 | パス |
|------|------|
| **ソース（SSoT）** | `README.md`（プロジェクトルート） |
| **出力** | `README.html`（プロジェクトルート） |

> **重要:** `README.md` が唯一の情報源（Single Source of Truth）です。`README.html` は常に `README.md` から生成されます。`README.html` を直接編集してはいけません。

## 変換ルール

### デザインシステム

- **カラー**: プライマリ水色 `#0284c7`、背景 `#f0f9ff`、テキスト `#0f172a`
- **フォント**: Noto Sans JP + Source Code Pro
- **レイアウト**: 固定ヘッダー + 左サイドバー（目次） + メインコンテンツ
- **レスポンシブ**: 860px 以下でサイドバーがハンバーガーメニューに折りたたみ

### Markdown → HTML の対応

| Markdown | HTML |
|----------|------|
| `# H1` | `<div class="hero-banner"><h1>...</h1></div>` (先頭のみ) |
| `## H2` | `<h2>` セクションタイトル + 新しい `<section class="doc-section">` |
| `### H3` | `<h3>` サブセクション |
| `#### H4` | `<h4>` 小見出し |
| `> blockquote` | `<div class="callout info">` (通常) / `<div class="callout warning">` (⚠️含む場合) |
| `- list` | `<ul><li>` |
| `1. list` | `<ol><li>` |
| `` `code` `` | `<code>` インラインコード |
| ` ```block``` ` | `<pre><code>` コードブロック |
| `\| table \|` | `<div class="table-wrap"><table>` テーブル |
| `[text](url)` | `<a href="url" target="_blank">text</a>` リンク |
| `---` | `<hr>` 区切り線（ただしセクション区切りとして処理されることが多い） |

### サイドバー目次

- `README.md` の `## ` 見出しごとにサイドバーの `<ul class="sidebar__nav">` にリンクを追加
- `### ` 見出しは `<li class="sub">` としてネスト表示（重要なサブセクションのみ）
- 各セクションに `id="sec-xxx"` 形式のアンカーを付与

### セクション構造

```html
<section class="doc-section" id="sec-xxx">
  <h2><span class="section-icon">🔥</span>セクション名</h2>
  <!-- 内容 -->
</section>
```

## 手順

1. `README.md` の全内容を読み取る
2. 既存の `README.html` を読み取る
3. `README.md` の変更差分を特定する
4. 対応する `README.html` のセクションを更新する（全体再生成でも可）
5. 更新後のHTMLが正しい構造であることを確認する

## 注意事項

- 絵文字（📋🛡️💻🌎📄 など）はそのまま保持する
- 外部リンクには `target="_blank"` を付与する
- `<pre><code>` 内では HTML エスケープを適用する（`<` → `&lt;` など）
- モバイルメニュー制御の `<script>` タグは常に維持する
