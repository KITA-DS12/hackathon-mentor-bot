# Hackathon Mentor Bot（マルチチャンネル対応）

ハッカソン向けのメンター呼び出し・質問管理Slack botです。
効率的な質問管理、メンタースケジュール管理、質問者解決ボタン機能、**マルチチャンネル対応**を提供します。

## 主な機能

### 🏢 マルチチャンネル対応（NEW）
- **各チームチャンネルで質問投稿**: 各チームが独立して質問可能
- **チーム内スレッド対応**: 質問したチャンネル内でメンターと対話
- **一元通知システム**: 全チャンネルの質問をメンターチャンネルに通知
- **チーム透明性**: チームメンバー全員が質問と回答を確認可能

### 質問投稿機能
- `/mentor-help` - 投稿方法選択式の質問フォーム（シンプル/詳細）
- **チーム名必須入力** - 全質問にチーム名を必須で記録
- 質問の自動分類・整理（カテゴリ、緊急度別）
- スレッドベースの対応管理とリアルタイムステータス追跡
- **Slack優先投稿** - 数秒以内の高速投稿を実現

### メンター登録・管理機能
- `/mentor-register` - メンター登録（名前、自己紹介、ステータス設定）
- `/mentor-unregister` - メンター登録解除（確認付き安全削除）
- `/mentor-list` - 登録メンター一覧表示
- `/mentor-questions` - 質問一覧・管理機能
- `/mentor-health` - システム状態確認
- 質問投稿時の**全メンター自動メンション**

### 質問管理・監視機能
- **複数メンター同時対応**: 複数のメンターが同じ質問を協力して対応可能
- **要注意質問の自動検出**: 担当者不在・24時間以上経過の質問を警告表示
- **包括的質問一覧**: 待機中・中断中・対応中の全質問を状態別表示
- **質問の中断・再開**: メンターが一時離席しても後で対応再開可能
- **担当者交代**: 対応困難な場合は担当解除して他のメンターに引き継ぎ
- **質問者解決ボタン**: 質問者本人が「✅ 解決済み」ボタンで完了

### メンターステータス機能
- `/mentor-status` - メンターの現在の空き状況を表示・変更
- リアルタイムの対応可能状況の確認とステータス管理

### スレッド対応管理機能（マルチチャンネル対応）
- **メンターチャンネル通知**: 全チャンネルの質問をメンターチャンネルに集約通知
- **元チャンネルでスレッド作成**: 対応開始時に質問元のチームチャンネルでスレッド作成
- **チーム内対応**: チームメンバー全員が対応過程を確認可能
- **チャンネル別統計**: 複数チャンネルの質問分布を可視化表示
- リアルタイムステータス管理：🟡対応待ち → 🔵対応中 → 🟠中断中 → ✅完了
- **対応中断・再開機能**: 一時的な離席に対応
- **担当解除機能**: 質問を他のメンターに引き継ぎ可能
- **複数メンター対応**: 配列ベースで複数の担当者を管理
- **クロスチャンネルリンク**: 質問への直接リンクとチャンネル情報表示
- 対応履歴の自動記録と可視化

## 技術構成

- **Runtime**: Node.js + Slack Bolt SDK
- **Database**: Firestore（リアルタイム同期対応）
- **Deployment**: Google Cloud Run（自動スケーリング）
- **Performance**: 最適化されたスペック（1GB RAM、20並行性、常時稼働）
- **Reliability**: 同期的処理によるデータ整合性保証
- **Cost**: 低コスト（2週間で約30円、常時稼働込み）

## システムスペック

### Cloud Run設定
- **メモリ**: 1GB
- **CPU**: 1 vCPU
- **並行性**: 20リクエスト/インスタンス
- **最小インスタンス**: 1（常時稼働で高速応答）
- **最大インスタンス**: 10
- **タイムアウト**: 300秒

### コスト試算（2週間）
- **CPU使用料**: 約22円（常時稼働）
- **メモリ使用料**: 約6円（常時稼働）
- **リクエスト料**: 約0.05円
- **Firestore**: 約1.5円
- **その他**: 約0.7円
- **合計**: **約30円**

※ハッカソン参加者50名、1日60リクエスト想定、1インスタンス常時稼働

## 質問フォーム項目

### 投稿方法
- **📝 シンプル投稿**: 基本項目で質問（推奨）
- **📋 詳細投稿**: テンプレート形式で構造化された質問

### シンプル投稿の項目
#### 必須項目
- **チーム名**: "例：ABC"
- **質問内容**: "例：ログイン機能でエラーが出て困っています"

#### 基本項目
- **カテゴリ**: 技術的な問題/デザイン・UI/UX/ビジネス・企画/その他
- **緊急度**: 🔴緊急/🟡急ぎ/🟢いつでも
- **相談方法**: Slackで相談/Zoomで相談

#### 任意項目
- **現在の状況**: "例：公式ドキュメントを見たが解決せず"
- **関連リンク**: "GitHub、CodePen、参考サイトのURLなど"
- **エラーメッセージ**: "出ているエラーがあれば貼り付けてください"

### 詳細投稿（テンプレート）の項目
#### 技術的な問題
- **フロントエンド**: React、Vue、HTML/CSS、JavaScript
  - 何をやろうとしているか、何が起きているか、エラーメッセージ、関連コード、環境・技術スタック
- **バックエンド**: サーバーサイド、データベース、API、認証
  - 何をやろうとしているか、何が起きているか、エラーメッセージ・ログ、関連コード・設定、環境・技術スタック
- **インフラ・デプロイ**: Vercel、Netlify、AWS、Docker
  - 何をやろうとしているか、何が起きているか、エラーメッセージ・ログ、関連コード・設定ファイル、デプロイ先・環境

#### デザイン・UI/UX
- **レイアウト・CSS**: レイアウト、CSS、スタイリング、レスポンシブデザイン
  - 何をやろうとしているか、何が起きているか、現在のCSS・コード、参考・目標デザイン、使用CSS技術
- **UI・UX相談**: ユーザビリティ、デザイン判断、UI改善
  - 現在のデザイン・UI、気になっている点・課題、想定ユーザー、参考デザイン・画面

#### ビジネス・企画
- **アイデア相談**: 機能やサービスのアイデア相談・ブラッシュアップ
  - アイデア概要、ターゲットユーザー、解決したい課題、欲しいアドバイス、現在の機能・仕様計画
- **技術選択相談**: どの技術・ツールを使うべきか迷っている
  - 何を作ろうとしているか、迷っている選択肢、チームスキル・経験、制約・要件

#### その他
- **なんでも相談**: 技術・企画・デザイン以外の相談
  - 相談内容、背景・状況
- **エラー・トラブル**: エラーで困っているが原因が分からない
  - 何が起きているか、いつから・何をした後に起きたか、エラーメッセージ・ログ、環境・技術

## データベース設計

### questions コレクション
```javascript
{
  id: "question_123",
  userId: "user_id",
  sourceChannelId: "C1234567890", // 質問投稿元のチャンネルID（NEW）
  teamName: "ABC", // 必須フィールド
  content: "質問内容",
  category: "技術的な問題",
  urgency: "普通", 
  consultationType: "Slackで相談",
  status: "waiting|in_progress|paused|completed",
  assignedMentors: ["mentor_id1", "mentor_id2"], // 複数メンター対応
  threadTs: "1234567890.123456",
  messageTs: "1234567890.123456", // 元チャンネルでの質問メッセージタイムスタンプ
  resolvedByUser: true, // 質問者による解決マーク
  statusHistory: [
    { status: "waiting", timestamp: "...", user: "..." },
    { status: "in_progress", timestamp: "...", user: "mentor_id" }
  ],
  // 任意項目
  currentSituation: "試したこと",
  relatedLinks: "関連URL",
  errorMessage: "エラー内容",
  templateData: {}, // テンプレート質問のデータ
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
- `/mentor-list` - メンター一覧表示
- `/mentor-questions` - 質問一覧・管理
- `/mentor-status` - ステータス確認・変更
- `/mentor-health` - システム状態確認

### Interactive Components
- Request URL: `https://your-app-url/slack/events`

### Event Subscriptions
- Request URL: `https://your-app-url/slack/events`

## 使用方法

### 質問者の使い方
1. **質問作成**: `/mentor-help` で投稿方法を選択
   - 📝 シンプル投稿 - 基本項目で質問（推奨）
   - 📋 詳細投稿 - テンプレート形式で質問
2. **内容入力**: 必要項目を入力して送信
3. **自動投稿**: 数秒以内にSlackチャンネルに投稿
4. **自動メンション**: 全メンターに通知
5. **スレッド対応**: メンターとスレッド内でやり取り
6. **解決報告**: 「✅ 解決済み」ボタンで完了

### メンターの使い方
1. **メンター登録**: `/mentor-register` で名前と自己紹介を登録
2. **ステータス管理**: `/mentor-status` で現在の状況を確認・変更
3. **質問一覧確認**: `/mentor-questions` で要注意・待機中・中断中・対応中の質問を包括的に確認
4. **システム状態確認**: `/mentor-health` でアプリの稼働状況を確認
5. **質問対応**: 
   - 質問投稿時の自動メンション受信
   - 「対応開始」ボタンで質問に着手（複数メンター同時対応可能）
   - 自動作成されたスレッドで質問者とやり取り
   - 「中断」「対応再開」「担当解除」「完了」でステータス管理
6. **問題のある質問の管理**: 
   - 担当者不在の質問を検出・対応
   - 24時間以上経過した長期未完了質問の警告表示
7. **登録解除**: `/mentor-unregister` で登録解除（確認付き）

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
│   └── schedule.js   # スケジュール関連処理
├── services/         # ビジネスロジック
│   └── firestore.js  # Firestore操作
├── utils/           # ユーティリティ
│   ├── modal.js     # モーダル生成
│   ├── message.js   # メッセージ生成
│   ├── questionType.js # 質問方法選択モーダル
│   ├── template.js  # テンプレート関連
│   ├── schedule.js  # スケジュール関連
│   ├── errorHandler.js # エラーハンドリング
│   └── index.js     # ユーティリティ関数
└── index.js         # アプリケーションエントリーポイント
```

## パフォーマンス最適化

- **高速投稿**: Firestore保存後即座にSlackチャンネルに投稿
- **最適化されたスペック**: 1GB RAM + 20並行性で安定動作
- **レスポンス時間**: Slack 3秒制限内で処理
- **常時稼働**: 1インスタンス常時稼働でコールドスタート解消
- **データ整合性**: 同期的処理により確実なデータ保存

## モニタリング

### システム状態確認
```bash
# Slackから確認（推奨）
/mentor-health

# Cloud Run ログ確認
gcloud logs read --project=$PROJECT_ID --service=hackathon-mentor-bot

# リアルタイムログ
make logs-tail

# ヘルスチェックエンドポイント
curl https://your-service-url/health
```

### パフォーマンス確認
- Cloud Run メトリクス（CPU・メモリ使用率）
- Firestore 使用量監視
- Slack API レート制限監視

## トラブルシューティング

### よくある問題と解決方法

#### 1. 質問投稿後にチャンネルに表示されない
**解決方法**:
```bash
# ログを確認
make logs

# システム状態確認
/mentor-health

# 環境変数確認
make validate-env
```

#### 2. モーダルが表示されない
**解決方法**:
- Slack App権限を確認
- Request URL設定確認: `https://your-service-url/slack/events`

#### 3. 「質問が見つかりません」エラー
**解決済み**:
- 同期的なFirestore保存により正式IDを使用
- temp_ID方式を廃止してデータ整合性を保証
- 常時1インスタンス稼働でアクセス速度向上

### デバッグコマンド
```bash
# ローカルでのデバッグ実行
make dev

# Cloud Runログのリアルタイム監視
make logs-tail

# ヘルスチェックテスト
curl https://your-service-url/health

# Slack接続テスト
make slack-test
```

