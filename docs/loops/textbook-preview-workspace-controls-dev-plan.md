# 資料プレビュー・ワークスペース操作改善 実装計画

| Loop | Task | User-facing summary | Unit test | Refactor checkpoint |
| --- | --- | --- | --- | --- |
| 1 | DESIGN仕様を固定 | サムネイル折りたたみ、最大化配置、ズーム、ヘッダー操作を正式仕様へ反映します。 | `npm run test -- designSsoT` | 既存の最大化・資料仕様と重複させない |
| 2 | 折りたたみ状態を追加 | ノートごとにサムネイル一覧の開閉状態を保持します。 | `npm run test -- textbookPanelStore` | 教材データと表示設定を混同しない |
| 3 | サムネイル開閉UIを追加 | 選択ページを残したまま一覧を小さくできる切り替えボタンを追加します。 | `npm run test -- PageThumbnailStrip` | ボタンのラベルと状態通知を一か所に集約する |
| 4 | 通常プレビューへ開閉を統合 | 一覧を閉じた分だけ選択中ページの表示領域を縦に広げます。 | `npm run test -- TextbookPanel` | レイアウトCSSは教材パネル専用ファイルへ置く |
| 5 | 最大化状態を教材へ伝搬 | 資料パネルが最大化中かをプレビューへ明示的に伝えます。 | `npm run test -- WorkspaceView` | 祖先CSSの暗黙判定に依存しない |
| 6 | 縦型サムネイルレールを追加 | 最大化時のサムネイルを左側の縦一覧として表示します。 | `npm run test -- PageThumbnailStrip` | 向き固有のCSSをサムネイル部品内に閉じる |
| 7 | 最大化プレビュー配置を統合 | 左約1/8をサムネイル、残りをPDF本文へ割り当てます。 | `npm run test -- TextbookPanel` | 通常表示と最大化表示の責務をclassで分離する |
| 8 | PDFズーム計算を追加 | ピンチ量を安全な倍率へ変換し、過度な拡大縮小を防ぎます。 | `npm run test -- pdfZoom` | ジェスチャ計算をDOMから分離する |
| 9 | ズーム操作UIを追加 | 最大化時に拡大・縮小・100%復帰をキーボードでも操作可能にします。 | `npm run test -- TextbookPreview` | PDF.jsアダプターを表示状態から独立させる |
| 10 | ピンチズームを接続 | 2本指の距離変化でPDFを滑らかに拡大・縮小できるようにします。 | `npm run test -- TextbookPreview` | Pointer管理と後始末を小さな関数へ分ける |
| 11 | レイアウト切替をヘッダーへ移動 | ドッキングと自由配置をヘッダー内のアイコンボタンで切り替えます。 | `npm run test -- WorkspaceHeader` | `AppIconButton`と既存トークンを再利用する |
| 12 | ヘッダー操作を画面へ統合 | 旧ツールバーを除去し、その高さを各パネルの表示領域へ戻します。 | `npm run test -- workspaceDockedLayout WorkspaceView` | 画面構成CSSは`WorkspaceView.vue`に限定する |
| 13 | Esc最大化解除を追加 | 最大化中にEscを押すと元のパネル配置へ戻せるようにします。 | `npm run test -- WorkspaceView` | グローバルイベントをmount/unmountで対称に管理する |
| 14 | 主要操作の統合回帰を固定 | ヘッダー切替、資料最大化、復元の一連の操作をまとめて確認します。 | `npm run test -- design-workspace-flow` | 既存fixtureとPiniaを再利用する |

## 目的・スコープ

### 参照元

- 要望メモ: `docs/loops/loop-20260804-01.md`
- デザインSSoT: `DESIGN.md`
- 現行の資料UI: `src/components/textbook/`
- 現行のワークスペースUI: `src/views/WorkspaceView.vue`、`src/components/workspace/`

### 目的

- 資料パネルのプレビューモードでサムネイル一覧を折りたたみ、PDF本文へより多くの縦領域を割り当てる。
- 資料パネル最大化時は、サムネイルを左約1/8、選択中ページを右の残り領域へ配置する。
- 最大化したPDFプレビューを2本指のピンチでズームできるようにし、同じ操作をキーボードでも代替できるようにする。
- `ドッキング` / `自由配置` をワークスペース上部の独立ツールバーからヘッダー内のアイコン操作へ移し、パネル領域を広げる。
- 最大化中のパネルを `Esc` で復元する。

### 最小の有用な完了状態

1. 通常プレビューでサムネイル一覧を開閉でき、閉じた状態ではPDF表示領域が縦に広がる。
2. 資料パネル最大化時、展開中のサムネイルが左レール、PDF本文が右側に表示される。
3. 最大化したCanvasプレビューを100%から400%の範囲でピンチズームできる。
4. ヘッダー内の2つのアイコンボタンでドッキングと自由配置を切り替えられる。
5. 旧レイアウト切替ツールバーがなくなり、パネルグリッドがその高さを利用する。
6. 任意のパネルを最大化した状態で `Esc` を押すと通常表示へ戻る。

### 対象外

- PDFへの注釈、回転、ページ編集、OCR、本文検索。
- ブラウザ全体のズームやOSジェスチャ設定の上書き。
- トラックパッドの `Ctrl` / `Cmd` + ホイールズーム対応。必要ならピンチ実装後の別タスクとする。
- サムネイル折りたたみ状態やズーム倍率のFirestore・LocalStorage永続化。
- モバイルのワークスペース全体を1画面1パネル方式へ作り直すこと。
- パネルのデータモデル、Firebase保存形式、PDF metadataの変更。

## 前提・現状・リスク

### 前提と仕様判断

- 要望の「プレビューモード最大表示時」は、資料の `MovablePanel` が `state === "maximized"` の状態を指す。
- サムネイル折りたたみ状態はPinia上でノート単位に保持し、同一セッション内の再マウントでは維持する。再読込後の永続化は行わない。
- 折りたたみ時はサムネイルのグリッドとページ送りを隠し、選択ページ番号と再展開ボタンだけのコンパクトな行またはレールを残す。
- 最大化かつ展開中は、サムネイル列と本文列を `1fr 7fr` を基本にする。サムネイル列には操作可能な最小幅を設定し、厳密な12.5%より可読性を優先する。
- 最大化かつ折りたたみ中は、コンパクトな開閉操作だけを左側に残し、PDF本文へ残りの幅を割り当てる。
- ズームはCanvas描画幅を倍率に応じて再計算し、CSS transformだけで引き伸ばさない。
- ズーム範囲は100%〜400%、ボタン操作は25%刻みとする。同じPDF内ではページ移動後も倍率を維持し、PDF変更または最大化解除で100%へ戻す。
- PDF.js文書が未準備で `<object>` にフォールバックしている場合、アプリ独自ズームは無効にする。

### 現行実装との差分

| 領域 | 現行 | 計画後 |
| --- | --- | --- |
| 通常プレビュー | PDF本文の下に常時サムネイルを表示 | サムネイルを展開・折りたたみ可能 |
| 最大化プレビュー | 通常時と同じ上下配置 | 左にサムネイル、右にPDF本文 |
| PDFズーム | コンテナ幅へ自動追従のみ | 最大化時にピンチ・ボタンで100%〜400% |
| レイアウト切替 | パネルグリッド上の文字ボタン | `WorkspaceHeader`内のアイコンボタン |
| 最大化解除 | タイトルバーの復元ボタンのみ | 復元ボタンと`Esc`の両方 |

### 主なリスク

- `TextbookPreview`は`ResizeObserver`で再描画しているため、ズームでCanvas幅を変えた結果を再度コンテナ幅として拾うと描画ループになる。監視対象はスクロールコンテナの利用可能幅に限定する。
- ブラウザや端末によってPointer Eventsとネイティブピンチの優先順位が異なる。1本指スクロールを維持し、2本指ジェスチャ中だけ独自倍率計算を有効にする。
- 視覚順序とTab順序をCSSだけで逆転させると操作順が不自然になる。最大化用レイアウトでもDOM順とフォーカス順が理解しやすい構造を維持する。
- ヘッダーは1280px未満で2段、768px未満で1列になる。レイアウト切替アイコンを追加してもパネル表示切替や主要操作を押し出さないことを確認する。
- `Esc`は既存ダイアログの閉じる操作にも使われる。ワークスペース側は「最大化中だけ復元」を行い、イベントの多重登録を残さない。
- 現在の作業ツリーには資料PDF実装の未コミット差分があるため、実装時は既存差分を前提にし、reset・stash・上書きを行わない。

### CSS配置方針

- `src/styles/components/textbook-panel.css`: 資料パネル内の通常・最大化レイアウト構成だけを置く。
- `src/components/textbook/PageThumbnailStrip.vue`: 横一覧、縦レール、折りたたみ時の部品固有CSSを置く。
- `src/components/textbook/TextbookPreview.vue`: PDFスクロール面、ズーム操作、Canvasの部品固有CSSを置く。
- `src/components/workspace/WorkspaceHeader.vue`: ヘッダー内レイアウト切替操作とレスポンシブ調整を置く。
- `src/views/WorkspaceView.vue`: ヘッダーとパネルグリッドの画面構成だけを置く。
- `src/index.css`へ今回固有のセレクタを追加しない。色、余白、影、角丸は`DESIGN.md`由来の既存トークンを再利用する。

## 詳細ループ

### Loop 1: DESIGN仕様をテストで固定

- Objective: 実装前に、今回のUI判断を`DESIGN.md`へ反映し、SSoTと実装計画の差異をなくす。
- TDD test to add or change:
  - `tests/docs/designSsoT.test.ts`へ、サムネイル折りたたみ、最大化時の左レール、PDFズーム、ヘッダー内のレイアウト切替、`Esc`復元が記載されていることを確認するテストを追加する。
- Minimal implementation steps:
  - `DESIGN.md` 6.2へ`Esc`復元の既存定義を維持したまま、ワークスペースヘッダー内の表示モード操作を追記する。
  - `DESIGN.md` 7.1へドッキング・自由配置のアイコン操作とアクセシブルネームを追記する。
  - `DESIGN.md` 8.1へ通常時のサムネイル折りたたみ、最大化時の左約1/8レール、100%〜400%ズームを追記する。
- Unit test command to run after the task: `npm run test -- designSsoT`
- Refactoring checkpoint: 同じ仕様を複数章へ重複記載せず、画面構成は6章、ヘッダー部品は7章、資料固有動作は8章へ置く。
- Completion criteria: テストが成功し、要望メモだけを読まなくても`DESIGN.md`から実装判断が再現できる。

### Loop 2: ノート別のサムネイル折りたたみ状態を追加

- Objective: サムネイル一覧の開閉状態をノート単位で保持し、別ノートへ漏らさない。
- TDD test to add or change:
  - `tests/textbook/textbookPanelStore.test.ts`へ、初期値が展開状態であること、トグル後に同じノートで維持されること、別ノートは影響を受けないことを追加する。
- Minimal implementation steps:
  - `TextbookPanelState`へ`thumbnailsCollapsed: boolean`を追加する。
  - `createStateForNote`の初期値を`false`にする。
  - `setThumbnailsCollapsed(noteId, collapsed)`を選択UI用actionとして追加する。
- Unit test command to run after the task: `npm run test -- textbookPanelStore`
- Refactoring checkpoint: PDF metadataや教材保存状態へUI設定を混ぜず、既存のノート別パネル状態に限定する。
- Completion criteria: 同一Piniaでは再マウント後も開閉状態が残り、別ノートは展開状態から始まる。

### Loop 3: サムネイル一覧の開閉操作を追加

- Objective: サムネイル部品単体で、展開・折りたたみをアクセシブルに操作できるようにする。
- TDD test to add or change:
  - `tests/components/PageThumbnailStrip.test.ts`へ、展開時にグリッドを表示し、折りたたみ時にグリッドとページ送りを隠すケースを追加する。
  - トグルボタンの`aria-expanded`、展開/折りたたみ用`aria-label`、`update:collapsed` emitを確認する。
  - 折りたたみ時も「選択ページ / 総ページ数」が確認できることを固定する。
- Minimal implementation steps:
  - `PageThumbnailStrip.vue`へ`collapsed` propと`update:collapsed` emitを追加する。
  - 既存のサムネイルグリッドとpaginationを`collapsed === false`の時だけ表示する。
  - `AppIconButton`または同じアクセシビリティ契約を持つボタンで開閉操作を追加する。
- Unit test command to run after the task: `npm run test -- PageThumbnailStrip`
- Refactoring checkpoint: 折りたたみ文言、現在ページ表示、emit処理をtemplate内へ重複させず、computedまたは小さな関数へまとめる。
- Completion criteria: マウスとキーボードのどちらでも開閉でき、折りたたみ時にページ選択イベントを誤送信しない。

### Loop 4: 通常プレビューへ折りたたみ状態を統合

- Objective: サムネイルを閉じたとき、選択ページのプレビューが教材パネルの残り高さを使用するようにする。
- TDD test to add or change:
  - `tests/components/TextbookPanel.test.ts`へ、プレビューモードでトグル操作がstoreへ反映され、折りたたみclassが付くことを追加する。
  - 同じPinia・同じnoteIdで再マウントすると折りたたみ状態が維持され、別noteIdでは展開されることを確認する。
- Minimal implementation steps:
  - `TextbookPanel.vue`から`thumbnailsCollapsed`を読み、`PageThumbnailStrip`のprop/emitへ接続する。
  - プレビューbodyへ`textbook-panel__body--thumbnails-collapsed`を付与する。
  - `src/styles/components/textbook-panel.css`で、通常展開時は本文+一覧、折りたたみ時は本文+コンパクト行となるgrid rowを定義する。
- Unit test command to run after the task: `npm run test -- TextbookPanel`
- Refactoring checkpoint: `TextbookPanel.vue`の既存PDF読込・保存処理へレイアウト条件を混ぜず、computed classとstore actionだけを追加する。
- Completion criteria: 折りたたみ後も選択ページは変わらず、プレビュー本文が残りの縦領域を使用する。

### Loop 5: ワークスペース最大化状態を教材パネルへ伝える

- Objective: 資料パネルが最大化中かを、CSSの祖先探索ではなく明示的なVue propで判定できるようにする。
- TDD test to add or change:
  - `tests/views/WorkspaceView.test.ts`へ、通常時の`TextbookPanel.isMaximized`が`false`、資料最大化後が`true`になるケースを追加する。
- Minimal implementation steps:
  - `TextbookPanel.vue`へ既定値`false`の`isMaximized` propを追加する。
  - `WorkspaceView.vue`で教材パネルへ`panel.state === "maximized"`を渡す。
  - 教材パネルのrootへ`textbook-panel--maximized` classを付与する。
- Unit test command to run after the task: `npm run test -- WorkspaceView`
- Refactoring checkpoint: `MovablePanel`内部classや`:deep()`を教材機能の状態取得APIとして利用しない。
- Completion criteria: 資料パネルだけが自身の最大化状態を受け取り、他パネルの最大化では教材UIへ影響しない。

### Loop 6: サムネイルの縦レール表示を追加

- Objective: 同じ`PageThumbnailStrip`を通常時は横一覧、最大化時は左側の縦レールとして使えるようにする。
- TDD test to add or change:
  - `tests/components/PageThumbnailStrip.test.ts`へ、`orientation="vertical"`で縦レールclassが付き、既存の選択・ページ送りが維持されるケースを追加する。
  - 既定値が`horizontal`で既存テストの構造を壊さないことを確認する。
- Minimal implementation steps:
  - `orientation: "horizontal" | "vertical"` propを追加する。
  - 縦レールではサムネイルを1列にし、レール自体を縦スクロール可能にする。
  - ページ送りは狭い幅でも欠落しないコンパクトな配置にする。
- Unit test command to run after the task: `npm run test -- PageThumbnailStrip`
- Refactoring checkpoint: 向きによる分岐はclassとcomputedへ限定し、サムネイル描画やページ計算を複製しない。
- Completion criteria: 横・縦の両方で選択中ページ、`aria-current`、ページ送りが同じ意味で動作する。

### Loop 7: 最大化した資料プレビューを左右配置する

- Objective: 資料パネル最大化時に、展開中のサムネイルを左約1/8、本文を右側へ配置する。
- TDD test to add or change:
  - `tests/components/TextbookPanel.test.ts`へ、`isMaximized`時に`PageThumbnailStrip`へ`vertical`が渡り、最大化レイアウトclassが付くケースを追加する。
  - 折りたたみ中はコンパクトな開閉領域だけが残り、PDF本文の選択ページが維持されることを確認する。
- Minimal implementation steps:
  - `TextbookPanel.vue`で最大化時だけ`orientation="vertical"`を渡す。
  - `textbook-panel.css`へ最大化プレビューの`1fr 7fr`列を追加する。
  - サムネイル列には`minmax()`で操作可能な下限を、本文列には`minmax(0, 7fr)`を設定する。
  - 狭いviewportでは可読性を優先し、通常の上下配置へ戻すbreakpointを追加する。
- Unit test command to run after the task: `npm run test -- TextbookPanel`
- Refactoring checkpoint: `PageThumbnailStrip.vue`の内部セレクタを親から直接上書きせず、orientation propを境界にする。
- Completion criteria: Desktop最大化では左レール/右本文となり、通常表示と狭幅表示は既存の上下構造を維持する。

### Loop 8: PDFズーム計算を純粋関数で追加

- Objective: ボタンとピンチが同じ倍率制約を使い、DOMなしで境界値を検証できるようにする。
- TDD test to add or change:
  - `tests/textbook/pdfZoom.test.ts`を追加する。
  - 100%未満を100%、400%超過を400%へ丸めるケースを追加する。
  - 25%刻みの拡大・縮小と、開始距離/現在距離から倍率を求めるケースを追加する。
  - 距離0、NaN、無限大を安全な既定値へ戻すケースを追加する。
- Minimal implementation steps:
  - `src/features/textbook/pdfZoom.ts`へ`MIN_PDF_ZOOM`、`MAX_PDF_ZOOM`、`PDF_ZOOM_STEP`を定義する。
  - `clampPdfZoom`、`increasePdfZoom`、`decreasePdfZoom`、`calculatePinchZoom`を純粋関数として実装する。
- Unit test command to run after the task: `npm run test -- pdfZoom`
- Refactoring checkpoint: PointerEventやVue refをfeature関数へ持ち込まず、数値計算だけに保つ。
- Completion criteria: 境界値と異常値のテストが成功し、UI側に倍率の重複定数が残らない。

### Loop 9: 最大化時のズーム操作UIを追加

- Objective: ピンチできない環境でも、拡大・縮小・100%復帰を操作できるようにする。
- TDD test to add or change:
  - `tests/components/TextbookPreview.test.ts`へ、`zoomEnabled`時だけズーム操作が表示されるケースを追加する。
  - 拡大ボタンで`renderPage`のtarget widthが基準幅×倍率になること、縮小とリセットで再描画されることを確認する。
  - PDF未準備または最大化解除時に操作が非表示/無効となり、倍率が100%へ戻ることを確認する。
- Minimal implementation steps:
  - `TextbookPreview.vue`へ`zoomEnabled` propと`zoom` refを追加する。
  - `AppIconButton`で`拡大`、`縮小`、`100%に戻す`を追加し、現在倍率を`aria-live`で通知する。
  - `renderPage`へ渡す幅を`targetWidth() * zoom`へ変更する。
  - 拡大時のCanvasが`max-width: 100%`で縮め戻されないようにし、document containerでスクロールできるようにする。
- Unit test command to run after the task: `npm run test -- TextbookPreview`
- Refactoring checkpoint: PDF.js側の`LoadedPdfDocument.renderPage`契約は変更せず、利用可能幅と倍率の合成をcomponent内へ置く。
- Completion criteria: 最大化したCanvasだけが100%〜400%で再描画され、ボタンと倍率表示をキーボード・読み上げで利用できる。

### Loop 10: 2本指ピンチをズームへ接続

- Objective: 最大化したPDF本文上で、2本指の距離変化を同じズーム倍率へ反映する。
- TDD test to add or change:
  - `tests/components/TextbookPreview.test.ts`へ2つのpointer IDを開始し、距離を広げると倍率が上がり、狭めると下がるケースを追加する。
  - `pointerup`、`pointercancel`、unmountで追跡中pointerが破棄され、後続イベントで再描画しないことを確認する。
  - `zoomEnabled === false`ではpointer操作が倍率を変えないことを確認する。
- Minimal implementation steps:
  - active pointerを`Map<number, PointerPosition>`で管理する。
  - 2本目のpointer開始時に開始距離と開始倍率を記録し、move時に`calculatePinchZoom`を呼ぶ。
  - 2本指ジェスチャ中だけ既定動作を抑止し、1本指ではスクロール可能な状態を維持する。
  - 倍率変更時の再描画を必要なら`requestAnimationFrame`単位にまとめる。
- Unit test command to run after the task: `npm run test -- TextbookPreview`
- Refactoring checkpoint: pointer追加・更新・削除、距離計算、描画要求を別関数へ分け、watchとイベントハンドラーを肥大化させない。
- Completion criteria: 2本指で100%〜400%の範囲を移動でき、ジェスチャ終了後にイベントや描画taskが残らない。

### Loop 11: ドッキング・自由配置をヘッダーのアイコンへ移す

- Objective: ワークスペース表示モードをヘッダー内のアクセシブルなアイコン操作として提供する。
- TDD test to add or change:
  - `tests/components/WorkspaceHeader.test.ts`へ、ドッキングと自由配置の2ボタンが存在し、現在値を`aria-pressed`で示すケースを追加する。
  - 各ボタンの`aria-label`とTooltip、選択時の`select-layout-mode` emitを確認する。
- Minimal implementation steps:
  - `WorkspaceHeader.vue`へ`layoutMode` propを追加する。
  - `select-layout-mode` emitを`WorkspaceLayoutMode`で検証する。
  - `AppIconButton`とMaterial Symbolsの既存アイコンを使い、ヘッダー内に`ワークスペース表示モード` toolbarを追加する。
  - 1280px未満と768px未満で既存のパネル切替を押し出さない配置に調整する。
- Unit test command to run after the task: `npm run test -- WorkspaceHeader`
- Refactoring checkpoint: ボタン固有の色・影を増やさず、`AppIconButton`と`aria-pressed`の既存選択表現を再利用する。
- Completion criteria: 文字ラベルを常時表示しなくても、Tooltip・`aria-label`・押下状態から両モードを区別できる。

### Loop 12: ヘッダーの表示モード操作をWorkspaceViewへ接続

- Objective: 旧ツールバーを除去し、ヘッダー操作で同じレイアウト切替を行い、パネル領域を広げる。
- TDD test to add or change:
  - `tests/workspace/workspaceDockedLayout.test.ts`の自由配置操作をヘッダーの`自由配置`アイコンへ変更する。
  - `tests/views/WorkspaceView.test.ts`へ、旧`.workspace-view__toolbar`が存在せず、ヘッダーの押下状態とpanel grid classが同期するケースを追加する。
- Minimal implementation steps:
  - `WorkspaceView.vue`から`workspace-view__toolbar`を削除する。
  - `WorkspaceHeader`へ`layoutMode`を渡し、`select-layout-mode`を既存`setLayoutMode`へ接続する。
  - stageのgrid rowを常にパネルグリッド1行へし、旧toolbar用CSSを削除する。
  - モード切替後にpanel gridの実寸を読み直し、free layoutの境界修復が旧toolbar除去後の高さを使うようにする。
- Unit test command to run after the task: `npm run test -- workspaceDockedLayout WorkspaceView`
- Refactoring checkpoint: `setDockedMode`と`setFreeMode`の薄いwrapperが不要になれば削除し、`setLayoutMode`を単一入口にする。
- Completion criteria: ヘッダーから両モードを切り替えられ、stage直下に不要な操作行が残らず、パネルグリッドが残り高さを占有する。

### Loop 13: Escで最大化パネルを復元

- Objective: DESIGN.mdの既存仕様どおり、最大化中の任意パネルを`Esc`で復元する。
- TDD test to add or change:
  - `tests/views/WorkspaceView.test.ts`へ、パネルを最大化して`keydown Escape`を送ると通常状態へ戻るケースを追加する。
  - 最大化していない状態ではレイアウトを変更しないこと、unmount後はhandlerが反応しないことを確認する。
- Minimal implementation steps:
  - `WorkspaceView.vue`に`handleWorkspaceKeydown`を追加する。
  - `event.key === "Escape"`かつ`maximizedPanel`が存在するときだけ`restorePanel`を呼ぶ。
  - 既存のresize listenerと同じ`onMounted` / `onBeforeUnmount`でkeydown listenerを登録・解除する。
- Unit test command to run after the task: `npm run test -- WorkspaceView`
- Refactoring checkpoint: 最大化状態の直接書換えを行わず、既存のworkspace store actionを通す。
- Completion criteria: 白板、教材、AI、スケッチのどれを最大化しても`Esc`で元の位置・サイズへ戻り、listenerが重複しない。

### Loop 14: ヘッダー・最大化・復元の統合回帰を追加

- Objective: 部品単体テストだけでは見落としやすいワークスペース全体の接続を1つの利用者フローで固定する。
- TDD test to add or change:
  - `tests/integration/design-workspace-flow.test.ts`へ、ヘッダーから自由配置へ切替、資料パネル最大化、最大化中のヘッダー非表示、`Esc`復元、ヘッダー再表示を順に確認するケースを追加する。
  - 必要なら`tests/workspace/workspaceMockAcceptance.test.ts`へ、教材プレビューのサムネイル折りたたみ状態がパネル再表示後も維持されるケースを追加する。
- Minimal implementation steps:
  - 既存のPiniaとrouter mockを再利用する。
  - 実PDFネットワーク読込を統合テストへ持ち込まず、教材storeのfixtureでプレビューモードを準備する。
  - UI文言ではなく`aria-label`、`aria-pressed`、panel ID、状態classを中心に検証する。
- Unit test command to run after the task: `npm run test -- design-workspace-flow workspaceMockAcceptance`
- Refactoring checkpoint: component unit testと同じ詳細を重複検証せず、画面間の配線と状態遷移だけを統合テストへ残す。
- Completion criteria: ヘッダー操作から最大化・`Esc`復元までが1テストで成功し、既存4パネルの表示切替を壊さない。

## 検証戦略

### ループごとの自動検証

- 各Loopは記載した絞り込みVitestを、実装前のredと最小実装後のgreenで実行する。
- CSS refactor、DOM順、prop境界を変更した場合は、同じ絞り込みテストをrefactor後にも再実行する。
- Pinch倍率の境界は`pdfZoom.test.ts`で純粋関数として固定し、PointerEvent配線だけをcomponent testで確認する。
- `ResizeObserver`、PointerEvent、Canvas描画はunit testではmockを使い、ブラウザ実機確認を最終段階へ分ける。

### 関連テスト一括

```bash
npm run test -- designSsoT textbookPanelStore PageThumbnailStrip TextbookPanel pdfZoom TextbookPreview WorkspaceHeader WorkspaceView workspaceDockedLayout design-workspace-flow workspaceMockAcceptance
```

### 最終自動検証

```bash
npm run test
npm run lint
npm run build
```

### 手動・ブラウザ確認

1. PDFを追加し、プレビューモードでサムネイルを折りたたむ。選択ページが変わらず、本文の縦領域が広がることを確認する。
2. サムネイルを再展開し、25ページ以上のPDFでもページ送りと選択同期が維持されることを確認する。
3. 資料パネルを最大化し、左約1/8にサムネイル、右側に本文が表示されることを確認する。
4. タッチ端末またはDevToolsのtouch emulationで2本指ピンチを行い、100%〜400%の範囲で拡大縮小できることを確認する。
5. ズーム後にページ切替、サムネイル折りたたみ、最大化解除を行い、古いCanvas描画やconsole errorが残らないことを確認する。
6. ヘッダーのドッキング・自由配置アイコンを切り替え、panel gridが追従し、旧ツールバーの空白が残らないことを確認する。
7. 白板など資料以外のパネルも最大化し、`Esc`で復元できることを確認する。
8. 1680×945、1024×768、390×844、文字倍率200%で主要ボタンが欠落せず、横スクロールが発生しないことを確認する。
9. `prefers-reduced-motion`環境でも最大化・復元・ズーム操作が利用できることを確認する。

### 必須シナリオ

| シナリオ | 期待結果 |
| --- | --- |
| 通常プレビューで折りたたむ | サムネイルグリッドが隠れ、本文が残り高さを使う |
| 折りたたみ後に再展開する | 選択ページを含むサムネイルgroupが再表示される |
| 同じノートを再マウントする | 折りたたみ状態を同一セッションで維持する |
| 別ノートを開く | 折りたたみ状態が混ざらない |
| 資料パネルを最大化する | 左レールと右本文の2列になる |
| 狭幅で資料を最大化する | 横幅不足時は安全な上下配置へ戻る |
| 2本指を広げる/狭める | 100%〜400%内で倍率が増減する |
| ズームボタンを使う | 25%刻みで動き、100%へ戻せる |
| PDFまたは最大化状態を解除する | ズームが100%へ戻り、pointer追跡が残らない |
| ヘッダーで自由配置を選ぶ | `aria-pressed`とfree layout classが同期する |
| 最大化中にEscを押す | 元のパネル位置・サイズへ復元する |
| ダイアログがない通常状態でEscを押す | パネル配置を変更しない |

## ロールバック・フォローアップ

- UI状態とレイアウトだけの変更であり、Firestore・Storage・教材metadataのmigrationは不要。
- ピンチ操作が特定ブラウザで不安定な場合、ズームボタンと倍率再描画を残したままPointer配線だけを無効化できる構造にする。
- 左レールが狭いviewportで操作困難な場合、最大化中でも既存の上下配置へ戻すbreakpointを調整し、横スクロールで全体を崩さない。
- ヘッダーが過密になった場合、レイアウト切替をラベルなしアイコンのままoverflow menuへ移す案を別タスクで検討する。パネル表示切替は優先して常時利用可能にする。
- サムネイル折りたたみ状態やズーム倍率を再読込後も残す要望が出た場合、workspace layout storageのversioningを伴う別計画にする。
- トラックパッドの`Ctrl` / `Cmd` + ホイール、ダブルタップズーム、ズーム位置を中心に保つ高度なpanは、実機検証後のフォローアップ候補とする。
