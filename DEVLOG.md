# 開発ログ

このキットに対しての主な開発ログをこのファイルに記録します
※ 詳細は各コミット参照

## 2026-04-23

### npm audit 脆弱性対応

`npm install` 時に high severity × 2 の脆弱性が報告された。

- **原因:** `eslint-plugin-sonarjs`（v3系）が依存する `minimatch` 10.0.0–10.2.2 に ReDoS 脆弱性（GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74）
- **対応:** `eslint-plugin-sonarjs` を v3 → v4（latest）にメジャーバージョンアップ
- **コマンド:** `npm install -D eslint-plugin-sonarjs@latest`
- **結果:** `npm audit` で `found 0 vulnerabilities` を確認
- **備考:** 開発時ツール（ESLint プラグイン）の間接依存であり、本番ビルドへの影響はなし

### 開発タスク

github issuesで今後のこのスターターに対する開発課題は管理します。

## 2026-06-03

### Cloud Functions（第2世代）デプロイ時の権限エラー対応

**事象:** `firebase deploy` で Cloud Functions（第2世代）をデプロイした際、`missing permission on the build service account.` というエラーでビルドが失敗した。

**原因:** Cloud Functions（第2世代）のコンテナビルド処理は、デフォルトで **Compute Engine デフォルトサービスアカウント** (`[プロジェクト番号]-compute@developer.gserviceaccount.com`) が使用される仕様になっているが、このアカウントに適切な権限が付与されていなかった。

**ハマりポイント:**

- エラー名から旧来のビルドサービスアカウント（`@cloudbuild.gserviceaccount.com`）に権限を付与してしまい、空振りした。
- IAM画面のリストに Compute Engine デフォルトアカウントが表示されていなかった。過去に権限がすべて削除されており、IAMの「権限を持つアカウント一覧」から消えていたのが原因。

**対応:** Google Cloud コンソールの「IAM と管理」>「IAM」画面の「＋ アクセス権を付与」から、「新しいプリンシパル」として `[プロジェクト番号]-compute@developer.gserviceaccount.com` を直接手入力で追加し、必要なロール（`編集者` や `Artifact Registry 作成者` 等）を付与。これによりビルドプロセスが許可され、デプロイに成功した。
