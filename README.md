# Hackathon Mentor Bot

ハッカソン向けのメンター呼び出し・質問管理Slack botです。
効率的な質問管理、メンタースケジュール管理、予約機能、自動フォローアップを提供します。

## 主な機能

### 質問投稿機能
- `/mentor-help` - 投稿方法選択式の質問フォーム（自由投稿/シンプル/詳細）
- **チーム名必須入力** - 全質問にチーム名を必須で記録
- 質問の自動分類・整理（カテゴリ、緊急度別）
- スレッドベースの対応管理とリアルタイムステータス追跡
- 関連コードフィールドで技術的な問題をより効果的にサポート
- **自動リトライ機能** - Cloud Runスピンアップ対策で確実な投稿

### メンター登録・管理機能
- `/mentor-register` - メンター登録（名前、自己紹介、ステータス設定）
- `/mentor-unregister` - メンター登録解除（確認付き安全削除）
- `/mentor-list` - 登録メンター一覧表示（エフェメラル表示）
- `/mentor-questions` - 質問一覧・管理機能（**エフェメラル表示**）
- `/mentor-health` - システム状態確認（**NEW**）
- 質問投稿時の**全メンター自動メンション**（人数制限なし）

### 質問管理・監視機能 ⭐**NEW**
- **複数メンター同時対応**: 複数のメンターが同じ質問を協力して対応可能
- **要注意質問の自動検出**: 担当者不在・24時間以上経過の質問を警告表示
- **包括的質問一覧**: 待機中・中断中・対応中の全質問を状態別表示（エフェメラル）
- **質問の中断・再開**: メンターが一時離席しても後で対応再開可能
- **担当者交代**: 対応困難な場合は担当解除して他のメンターに引き継ぎ
- **スレッド化ステータス更新**: 全てのステータス変更がスレッド内で管理

### メンターステータス機能
- `/mentor-status` - メンターの現在の空き状況を表示・変更
- リアルタイムの対応可能状況の確認とステータス管理

### 質問予約機能
- Slackで相談 or Zoomで相談の選択
- 30分後/1時間後/2時間後/明日午前の予約設定
- 予約時間での自動解決確認（5分間の猶予）
- 未解決時の自動メンター通知

### スレッド対応管理機能
- 質問投稿時の対応ボタン（対応開始/詳細確認）
- 対応開始時の自動スレッド作成とメンター・質問者招待
- リアルタイムステータス管理：🟡対応待ち → 🔵対応中 → 🟠中断中 → ✅完了
- **対応中断・再開機能**: 一時的な離席に対応
- **担当解除機能**: 質問を他のメンターに引き継ぎ可能
- **複数メンター対応**: 配列ベースで複数の担当者を管理
- **スレッドリンク表示**: 質問IDとスレッドリンクを併記
- 対応履歴の自動記録と可視化

### フォローアップ自動化機能
- 質問後30分・2時間での自動フォローアップメッセージ
- 未解決問題の自動メンター再通知
- 解決状況の追跡とボタンベースの応答
- メンター対応開始時のフォローアップ自動キャンセル

## 技術構成

- **Runtime**: Node.js + Slack Bolt SDK
- **Database**: Firestore（リアルタイム同期対応）
- **Deployment**: Google Cloud Run（自動スケーリング）
- **Reliability**: 自動リトライ機能（指数バックオフ）
- **Monitoring**: ヘルスチェック機能とシステム状態監視
- **Cost**: 無料枠内で運用可能（最小リソース設定）

## 質問フォーム項目

### 必須項目（投稿方法により異なる）
`/mentor-help`コマンドで以下から選択：
- **自由投稿**: 質問内容のみ（その他すべて任意）
- **シンプル投稿**: 質問内容のみ必須、カテゴリ・緊急度・相談方法は任意
- **詳細投稿**: テンプレート式で詳細項目あり

### 基本項目
- **チーム名（必須）**: "例：チーム〇〇"
- 質問内容（テキストエリア）: "例：ログイン機能でエラーが出て困っています"
- カテゴリ（選択式）: 技術的な問題/デザイン・UI/UX/ビジネス・企画/その他
- 緊急度（選択式）: 🔴緊急（他の開発が止まっている）/🟡急ぎ（今日明日中に解決したい）/🟢いつでも（時間のある時で大丈夫）
- 相談方法（選択式）: Slackで相談/Zoomで相談

### 任意項目
- 現在の状況（短文）: "例：公式ドキュメントを見たが解決せず"
- 関連コード・リンク（URL）: "GitHub Gist、CodePen、参考サイトのURLなど"
- エラーメッセージ（短文）: "出ているエラーがあれば貼り付けてください"
- **関連するコード**（テキストエリア）: "問題に関連するコードがあれば貼り付けてください"

### 予約選択時の追加項目
- 希望相談時間（選択式）: 30分後/1時間後/2時間後/明日午前など
- 自動解決確認（チェックボックス）: "予約時間に自力解決確認を受け取る"（デフォルトON）

## データベース設計

### questions コレクション
```javascript
{
  id: "question_123",
  userId: "user_id",
  teamName: "チーム〇〇", // NEW: 必須フィールド
  content: "質問内容",
  category: "技術的な問題",
  urgency: "普通", 
  consultationType: "すぐ相談したい",
  status: "waiting|in_progress|paused|completed",
  assignedMentors: ["mentor_id1", "mentor_id2"], // NEW: 複数メンター対応
  threadTs: "1234567890.123456",
  statusHistory: [
    { status: "waiting", timestamp: "...", user: "..." },
    { status: "in_progress", timestamp: "...", user: "mentor_id" }
  ],
  // 任意項目
  currentSituation: "試したこと",
  relatedLinks: "関連URL",
  errorMessage: "エラー内容",
  // 予約関連
  reservationTime: "30分後",
  autoResolveCheck: true,
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### mentors コレクション
```javascript
{
  userId: "mentor_user_id",
  userName: "slack_username",
  name: "表示名",
  bio: "自己紹介・経歴",
  availability: "available|busy|offline",
  registeredAt: "timestamp",
  updatedAt: "timestamp"
}
```


## セットアップ

### 必要な環境変数
```env
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
GOOGLE_CLOUD_PROJECT=your-project-id
PORT=8080
MENTOR_CHANNEL_ID=C1234567890
```

### 🚀 クイックスタート（推奨）
```bash
# リポジトリクローン
git clone https://github.com/KITA-DS12/hackathon-mentor-bot.git
cd hackathon-mentor-bot

# 自動セットアップ実行
./scripts/setup.sh

# または個別実行
make setup
make install
make env-setup
```

### 📋 Makefileコマンド一覧
```bash
# ヘルプ表示
make help

# 初回セットアップ
make setup              # GCP API有効化、Firestore作成
make install             # 依存関係インストール
make env-setup           # 環境変数設定ガイド

# 開発
make dev                 # ローカル開発サーバー起動
make test                # テスト実行
make lint                # リントチェック
make format              # コードフォーマット
make check               # リント + フォーマット

# デプロイ
make build               # Dockerイメージビルド
make deploy              # Cloud Runにデプロイ
make deploy-env          # 環境変数付きデプロイ

# 運用・モニタリング
make logs                # ログ表示
make logs-tail           # リアルタイムログ
make status              # サービス状態確認
make service-url         # サービスURL表示

# Slack関連
make slack-test          # URL検証テスト
make slack-webhook-url   # Webhook URL表示

# ユーティリティ
make clean               # 一時ファイル削除
make ngrok               # ローカル公開（開発用）
make project-info        # プロジェクト情報表示
```

### ローカル開発
```bash
# 環境変数設定後
make dev

# または従来の方法
npm install
cp .env.example .env
# .envファイルを編集
npm run dev
```

### Cloud Runデプロイ
```bash
# 🚀 簡単デプロイ（最も簡単）
make deploy-simple      # ソースから直接デプロイ

# 📦 環境変数付きデプロイ（推奨）
make deploy-env         # .envから環境変数を読み込み

# ☁️ Cloud Buildデプロイ
make deploy             # Cloud Buildを使用

# 🔧 環境変数のみ更新
make set-env            # 既存サービスの環境変数更新
```

#### デプロイ手順の詳細
```bash
# 1. 最初のデプロイ（簡単）
make deploy-simple

# 2. 環境変数を設定
make env-setup          # .envファイル作成ガイド
# .envファイルを編集

# 3. 環境変数をCloud Runに反映
make set-env

# または一発で環境変数付きデプロイ
make deploy-env
```

## Slack App設定

### 必要な権限（OAuth & Permissions）
```
channels:read
chat:write
chat:write.public
commands
im:read
im:write
users:read
```

### Slash Commands
- `/mentor-help` - 質問投稿（方法選択式）
- `/mentor-register` - メンター登録
- `/mentor-unregister` - メンター登録解除
- `/mentor-list` - メンター一覧表示（エフェメラル）
- `/mentor-questions` - 質問一覧・管理（エフェメラル）
- `/mentor-status` - ステータス確認・変更
- `/mentor-health` - システム状態確認（**NEW**）

### Interactive Components
- Request URL: `https://your-app-url/slack/events`

### Event Subscriptions
- Request URL: `https://your-app-url/slack/events`

## 使用方法

### 質問者の使い方
1. **質問作成**: `/mentor-help` で投稿方法を選択
   - 🚀 自由投稿 - 何でも気軽に質問
   - 📝 シンプル投稿 - 基本項目で質問
   - 📋 詳細投稿 - テンプレート形式で質問
2. **内容入力**: 必要項目を入力して送信
3. **予約設定**: 即座相談 or 予約相談を選択
4. **自動メンション**: カテゴリに応じて適切なメンターに自動通知
5. **フォローアップ**: 30分後、2時間後の自動確認に応答
6. **解決報告**: 問題解決時にボタンで報告

### メンターの使い方
1. **メンター登録**: `/mentor-register` で名前と自己紹介を登録
2. **ステータス管理**: `/mentor-status` で現在の状況を確認・変更
3. **質問一覧確認**: `/mentor-questions` で要注意・待機中・中断中・対応中の質問を包括的に確認（エフェメラル表示）
4. **システム状態確認**: `/mentor-health` でアプリの稼働状況・メモリ使用量を確認
5. **質問対応**: 
   - 質問投稿時の自動メンション受信（**全メンター対象・人数制限なし**）
   - 「対応開始」ボタンで質問に着手（**複数メンター同時対応可能**）
   - 自動作成されたスレッドで質問者とやり取り
   - 「中断」で一時中断、「対応再開」で再開、「担当解除」で他者に引き継ぎ、「完了」で対応終了
   - **全ステータス更新がスレッド内で管理**（チャンネルを汚さない）
6. **問題のある質問の管理**: 
   - 担当者不在の質問を検出・対応
   - 24時間以上経過した長期未完了質問の警告表示
7. **フォローアップ**: 未解決質問の自動通知を受信
8. **登録解除**: `/mentor-unregister` で登録解除（確認付き安全削除）

## アーキテクチャ

```
src/
├── config/           # 設定ファイル
│   ├── constants.js  # 定数定義
│   └── index.js      # 環境変数管理
├── handlers/         # Slackイベントハンドラー
│   ├── actions.js    # ボタンアクション処理
│   ├── commands.js   # スラッシュコマンド処理
│   ├── modals.js     # モーダル送信処理
│   ├── mentorRegistration.js # メンター登録処理
│   ├── mentorUnregister.js # メンター登録解除処理
│   ├── questionType.js # 質問方法選択処理
│   ├── template.js   # テンプレート処理
│   ├── schedule.js   # スケジュール関連処理
│   ├── reservation.js # 予約機能処理
│   └── followup.js   # フォローアップ処理
├── services/         # ビジネスロジック
│   ├── firestore.js  # Firestore操作
│   ├── scheduler.js  # 予約スケジューリング
│   └── followup.js   # フォローアップ管理
├── utils/           # ユーティリティ
│   ├── modal.js     # モーダル生成
│   ├── message.js   # メッセージ生成
│   ├── questionType.js # 質問方法選択モーダル
│   ├── template.js  # テンプレート関連
│   ├── schedule.js  # スケジュール関連
│   ├── retryUtils.js # 自動リトライ機能
│   ├── healthCheck.js # ヘルスチェック機能
│   └── slackUtils.js # Slack API呼び出し
└── index.js         # アプリケーションエントリーポイント
```

## パフォーマンス最適化

- **メモリ効率**: 最小512MBで動作
- **レスポンス時間**: Slack 3秒制限内で処理
- **自動スケーリング**: Cloud Runの0→10インスタンス
- **タイムアウト処理**: 予約・フォローアップのメモリ内管理
- **Cold Start対策**: 自動リトライ機能で確実な処理実行
- **ヘルスチェック**: 質問投稿前のウォームアップ機能

## モニタリング

### システム状態確認
```bash
# Slackから確認（推奨）
/mentor-health

# Cloud Run ログ確認
gcloud logs read --project=$PROJECT_ID --service=hackathon-mentor-bot

# リアルタイムログ
gcloud logs tail --project=$PROJECT_ID --service=hackathon-mentor-bot

# ヘルスチェックエンドポイント
curl https://your-service-url/health
```

### パフォーマンス確認
- Cloud Run メトリクス（CPU・メモリ使用率）
- Firestore 使用量監視
- Slack API レート制限監視
- 自動リトライ成功率の監視
- ヘルスチェック応答時間の追跡

## トラブルシューティング

### よくある問題
1. **モーダルが表示されない**: Slack App権限を確認
2. **Firestoreエラー**: プロジェクトIDと権限を確認
3. **タイムアウト**: Cloud Runのメモリ・CPU設定を調整
4. **Slack API制限**: レート制限と権限を確認

### デバッグ
```bash
# ローカルでのデバッグ実行
DEBUG=* npm run dev

# 特定のSlackイベントをテスト
curl -X POST localhost:8080/slack/events \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test"}'
```

## ライセンス

MIT