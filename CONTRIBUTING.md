# スターターキットの更新手順

1. mainブランチの最新コードをローカルに取得する

   ```bash
   git switch main
   git pull origin main
   ```

2. 作業時は必ず機能ごとに新しいブランチ（例: `feature/xxx`）を作成して行う
   ブランチ名には日本語を使用せず、英数字でわかりやすい名前をつける

   ```bash
   git switch -c feature/add-simulation
   ```

3. 変更をコミットして GitHub にプッシュしたら、Pull Request (PR) を作成してマージする

   ```bash
   git add .
   git commit -m "feat: 放物運動のシミュレーションを追加"
   git push -u origin feature/add-simulation
   ```

   → GitHub 上で Pull Request を作成し、レビュー後にマージ

4. マージが完了したら、ローカルの main を最新化し、不要になった作業ブランチを削除する

   ```bash
   git switch main
   git pull origin main
   git branch -d feature/add-simulation
   ```
