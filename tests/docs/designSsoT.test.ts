import { describe, expect, it } from "vitest";
import rule from "../../.agent/rules/design-system-source-of-truth.md?raw";
import design from "../../DESIGN.md?raw";

describe("designSsoT", () => {
  it("UI実装の基準としてDESIGN.mdを参照するルールを持つ", () => {
    expect(rule).toContain("DESIGN.md");
    expect(rule).toContain("SSoT");
    expect(rule).toContain("UI");
  });

  it("ノート画面ヘッダーに4つのパネル表示切替を定義する", () => {
    expect(design).toContain("資料 / ホワイトボード / AIチャット / スケッチ");
    expect(design).toContain("ヘッダーから再表示");
    expect(design).not.toContain("中央：ノート一覧、マイノート、テンプレート、AIアシスタント、使い方");
  });

  it("AI履歴、30ターン、sandbox実行を定義する", () => {
    expect(design).toContain("30ターン");
    expect(design).toContain("チャット履歴");
    expect(design).toContain('sandbox="allow-scripts"');
    expect(design).toContain("2パネル");
  });

  it("ブックマークは別タブで開き、最大化中はパネル領域を優先する", () => {
    expect(design).toContain("別タブで開く");
    expect(design).toContain("最大化中はアプリ共通ヘッダー");
    expect(design).toContain("ワークスペース表示モードを非表示");
  });

  it("ホワイトボードの見出し階層と30秒自動保存を定義する", () => {
    expect(design).toContain("`###`を+2pt、`##`を+4pt、`#`を+6pt");
    expect(design).toContain("最後の編集から30秒後");
    expect(design).toContain("未保存のままブラウザページを閉じる場合はnative警告");
  });

  it("資料パネルの3モードと手書き画像ダイアログを定義する", () => {
    expect(design).toContain("資料一覧 / 目次 / プレビュー");
    expect(design).toContain("ノート単位");
    expect(design).toContain("手書き画像ダイアログ");
    expect(design).toContain("編集 / 削除");
  });

  it("資料プレビューとワークスペース操作の拡張仕様を定義する", () => {
    expect(design).toContain("サムネイル一覧を折りたたみ");
    expect(design).toContain("左約1/8");
    expect(design).toContain("PDF・画像とも25%〜800%");
    expect(design).toContain("通常表示と最大化表示");
    expect(design).toContain("100%へ戻す");
    expect(design).toContain("ドッキング / 自由配置のアイコンボタン");
    expect(design).toContain("`Esc` または同じボタンで復元");
  });

  it("大容量PDFの安定表示と資料名変更を定義する", () => {
    expect(design).toContain("100MiB・500ページ");
    expect(design).toContain("PDF.jsを唯一の埋め込み表示経路");
    expect(design).toContain("進捗・取消・再試行");
    expect(design).toContain("Storage上のオブジェクト名は変更しない");
    expect(design).toContain("displayName");
  });

  it("ホワイトボードの選択書式とコードブロック余白を定義する", () => {
    expect(design).toContain("太字・斜体・下線・取り消し線・引用・コードブロック");
    expect(design).toContain("preview切替の右側");
    expect(design).toContain("コードブロックの上下余白");
  });

  it("ノートブック削除は確認後の明示操作だけで確定する", () => {
    expect(design).toContain("本当に削除していいですか？");
    expect(design).toContain("「削除する」を選んだ場合だけ");
    expect(design).toContain("「キャンセル」、背景クリック、`Esc`");
    expect(design).toContain("確定ボタンだけを赤背景 + 白文字");
  });

  it("最大化した各パネルの本文が画面下端まで広がる", () => {
    expect(design).toContain("タイトルバーを除く残りの高さ");
    expect(design).toContain("画面下端");
    expect(design).toContain("ResizeObserver");
  });
});
