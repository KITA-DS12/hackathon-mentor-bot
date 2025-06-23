# Hackathon Mentor Bot

ハッカソン向けのメンター呼び出し・質問管理Slack botです。
効率的な質問管理、メンタースケジュール管理、予約機能を提供します。

## 主な機能

### 基本機能
- `/mentor-help` - 質問フォームを表示してメンターに質問
- 質問の自動分類・整理（カテゴリ、緊急度別）
- スレッドベースの対応管理とステータス追跡

### メンタースケジュール機能
- `/mentor-schedule` - メンターが対応可能時間を事前登録
- `/mentor-status` - 全メンターの現在の空き状況を表示
- リアルタイムの対応可能状況の確認

### スレッド対応管理機能
- 質問投稿時の対応ボタン（対応開始/詳細確認）
- 対応開始時の自動スレッド作成とメンター・質問者招待
- リアルタイムステータス管理：🟡対応待ち → 🔵対応中 → ✅完了
- 対応中断・再開機能（🟠中断中ステータス）
- 対応履歴の自動記録

### フォローアップ機能
- 質問後30分・2時間での自動フォローアップ
- 未解決問題の再通知
- 解決状況の追跡

## 技術構成

- **Runtime**: Node.js(TypeScript) + Slack Bolt SDK
- **Database**: Firestore
- **Deployment**: Google Cloud Run
- **Cost**: 無料枠内で運用可能

## 質問フォーム項目

### 必須項目
- 質問内容（詳細な問題説明）
- カテゴリ（技術/デザイン/ビジネス/その他）
- 緊急度（至急/普通/低め）

### 任意項目
- 現在の状況（試したこと）
- 関連コード・リンク
- エラーメッセージ

## セットアップ

### 必要な環境変数
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
GOOGLE_CLOUD_PROJECT=your-project-id
PORT=8080
```

### ローカル開発
```bash
npm install
npm run dev
```

### Cloud Runデプロイ
```bash
gcloud run deploy hackathon-mentor-bot \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --cpu 0.25 \
  --memory 256Mi
```

## Slack App設定

以下の機能を有効にする必要があります：
- Slash Commands: `/mentor-help`, `/mentor-schedule`, `/mentor-status`
- Interactive Components: モーダル・ボタン処理用
- OAuth & Permissions: 必要なbot権限
- Event Subscriptions: メッセージ受信用

## 使用方法

### 質問者
1. `/mentor-help` でフォーム表示
2. 必要項目を入力して送信
3. メンターからの回答を待機
4. 自動フォローアップに応答

### メンター
1. `/mentor-schedule` で対応可能時間を登録
2. 質問通知を受信したら「対応開始」ボタンをクリック
3. 自動作成されたスレッドで質問者とやり取り
4. 必要に応じて「対応中断」で一時中断
5. 完了時に「対応完了」ボタンをクリック
6. 対応履歴が自動で記録される
