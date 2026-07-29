---
trigger: always_on
globs: ["src/**/*.{vue,ts,css}", "tests/**/*.{ts,tsx}", "docs/loops/*.md"]
---

# Design System Source of Truth

UI、画面、CSS、コンポーネントの実装では、プロジェクトルートの `DESIGN.md` をSSoT（Single Source of Truth）として扱う。

- 色、影、角丸、余白、タイポグラフィ、パネル操作、レスポンシブ方針は `DESIGN.md` の定義を優先する。
- `DESIGN.md` と異なるUI判断が必要な場合は、実装前に差分、理由、影響範囲を計画または作業ログへ明記する。
- 共通UIはトークンとプリミティブを通して実装し、画面ごとに独自の色や影を増やさない。
- このアプリの正式名称は `Gauss Notebook` とする。domain、Firebase project ID、Firestore/Storage pathは名称変更と混ぜず、必要になった時だけ別計画で扱う。
