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

  it("別タブ表示を使わず最大化中はパネル領域を優先する", () => {
    expect(design).not.toContain("別タブで開く");
    expect(design).toContain("最大化中はアプリ共通ヘッダー");
    expect(design).toContain("ワークスペース表示モードを非表示");
  });

  it("資料パネルの3モードと手書き画像ダイアログを定義する", () => {
    expect(design).toContain("資料一覧 / 目次 / プレビュー");
    expect(design).toContain("ノート単位");
    expect(design).toContain("手書き画像ダイアログ");
    expect(design).toContain("編集 / 削除");
  });

  it("最大化した各パネルの本文が画面下端まで広がる", () => {
    expect(design).toContain("タイトルバーを除く残りの高さ");
    expect(design).toContain("画面下端");
    expect(design).toContain("ResizeObserver");
  });
});
