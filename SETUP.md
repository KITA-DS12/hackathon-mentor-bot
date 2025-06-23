# Hackathon Mentor Bot セットアップガイド

## 📋 概要

このガイドでは、Hackathon Mentor BotをGCPにデプロイし、Slackで使用するまでの完全なセットアップ手順を説明します。

## 🛠️ 前提条件

### 必要なアカウント・ツール
- [ ] Google Cloud Platform アカウント
- [ ] Slack ワークスペースの管理者権限
- [ ] Node.js (v16以上)
- [ ] Google Cloud SDK (gcloud CLI)
- [ ] Git

### 事前確認
```bash
# バージョン確認
node --version    # v16以上
npm --version
gcloud --version
git --version
```

## 🚀 セットアップ手順

### Step 1: リポジトリのクローン

```bash
git clone https://github.com/KITA-DS12/hackathon-mentor-bot.git
cd hackathon-mentor-bot
```

### Step 2: GCPプロジェクトの準備

#### 2-1. プロジェクト作成・選択
```bash
# 新規プロジェクト作成（オプション）
gcloud projects create your-project-id --name="Hackathon Mentor Bot"

# プロジェクト設定
gcloud config set project your-project-id

# 請求アカウント確認（必要に応じて）
gcloud billing projects describe your-project-id
```

#### 2-2. 必要なAPIの有効化
```bash
# 自動セットアップ（推奨）
make setup

# または手動で実行
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com  
gcloud services enable firestore.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### 2-3. Firestoreデータベース作成
1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. プロジェクトを選択
3. **Firestore Database** → **データベースを作成**
4. **ネイティブモード** を選択
5. ロケーション: **asia-northeast1** を選択
6. **完了** をクリック

### Step 3: Slack Appの作成

#### 3-1. Slack Appを作成
1. [Slack API](https://api.slack.com/apps) にアクセス
2. **Create New App** → **From scratch**
3. App名: `Hackathon Mentor Bot`
4. ワークスペースを選択して **Create App**

#### 3-2. OAuth & Permissions 設定
**Features** → **OAuth & Permissions** → **Bot Token Scopes**

以下の権限を追加：
```
✅ channels:read
✅ chat:write
✅ chat:write.public
✅ commands
✅ im:read
✅ im:write
✅ users:read
```

#### 3-3. Slash Commands 設定
**Features** → **Slash Commands** → **Create New Command**

各コマンドを個別に作成（**合計5つのコマンド**）：

##### `/mentor-help`
```
Command: /mentor-help
Request URL: https://your-app-url/slack/events
Short Description: 質問投稿（自由・シンプル・詳細から選択）
Usage Hint: [質問内容]
```

##### `/mentor-register`
```
Command: /mentor-register
Request URL: https://your-app-url/slack/events
Short Description: メンターとして登録（名前・自己紹介設定）
Usage Hint: 
```

##### `/mentor-unregister`
```
Command: /mentor-unregister
Request URL: https://your-app-url/slack/events
Short Description: メンター登録を解除（確認付き安全削除）
Usage Hint: 
```

##### `/mentor-list`
```
Command: /mentor-list
Request URL: https://your-app-url/slack/events
Short Description: 登録メンター一覧を表示（ステータス付き）
Usage Hint: 
```

##### `/mentor-status`
```
Command: /mentor-status
Request URL: https://your-app-url/slack/events
Short Description: メンターステータス確認・変更（対応可能/忙しい/対応不可）
Usage Hint: 
```

⚠️ **重要**: 各コマンドの `Request URL` は必ず **実際にデプロイしたサービスのURL** に置き換えてください。

#### 3-4. Interactive Components 設定
**Features** → **Interactivity & Shortcuts**
```
Interactivity: On
Request URL: https://your-app-url/slack/events
```

#### 3-5. Event Subscriptions 設定
**Features** → **Event Subscriptions**
```
Enable Events: On
Request URL: https://your-app-url/slack/events
```

**Subscribe to bot events** で以下を追加：
```
✅ app_mention
✅ message.channels
✅ message.groups
✅ message.im
```

#### 3-6. トークンの取得
**Settings** → **Basic Information** → **App Credentials**
- **Signing Secret** をメモ

**Features** → **OAuth & Permissions**
- **Bot User OAuth Token** (xoxb-...) をメモ

### Step 4: アプリケーションのデプロイ

#### 4-1. 依存関係のインストール
```bash
npm install
```

#### 4-2. 初回デプロイ（環境変数なし）
```bash
make deploy-simple
```

デプロイ後、サービスURLを取得：
```bash
make service-url
# 例: https://hackathon-mentor-bot-xxx.asia-northeast1.run.app
```

#### 4-3. Slack AppのURLを更新
上記で取得したURLを使用して、Slack Appの以下を更新：

**Slash Commands** の各コマンドのRequest URL：
```
https://your-actual-service-url/slack/events
```

**Interactivity & Shortcuts** のRequest URL：
```
https://your-actual-service-url/slack/events
```

**Event Subscriptions** のRequest URL：
```
https://your-actual-service-url/slack/events
```

### Step 5: 環境変数の設定

#### 5-1. .envファイル作成
```bash
make env-setup
```

#### 5-2. 環境変数の入力
`.env` ファイルを編集：
```env
SLACK_BOT_TOKEN=xoxb-your-actual-token-here
SLACK_SIGNING_SECRET=your-actual-signing-secret-here
GOOGLE_CLOUD_PROJECT=your-project-id
MENTOR_CHANNEL_ID=C1234567890
PORT=8080
```

**MENTOR_CHANNEL_ID の取得方法**：
1. Slackで対象チャンネルを開く
2. チャンネル名をクリック → **設定** → **その他**
3. 一番下の「チャンネルID」をコピー

#### 5-3. Cloud Runに環境変数を反映
```bash
make set-env
```

### Step 6: Slack Appのインストール

#### 6-1. ワークスペースにインストール
**Settings** → **Install App** → **Install to Workspace**

#### 6-2. 権限の承認
表示された権限を確認して **許可する**

### Step 7: 動作確認

#### 7-1. サービス状態確認
```bash
make status
make logs
```

#### 7-2. Slackでテスト
Slackチャンネルで以下のコマンドを順番にテスト：

##### 基本動作テスト
```bash
/mentor-help          # 質問方法選択画面が表示される
/mentor-list          # 「登録メンターなし」が表示される
```

##### メンター機能テスト
```bash
/mentor-register      # メンター登録フォームが表示される
/mentor-list          # 登録したメンターが表示される
/mentor-status        # ステータス管理画面が表示される
/mentor-unregister    # 登録解除確認画面が表示される
```

正常に動作すれば各コマンドで適切なモーダルや応答が表示されます。

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. "slash command did not respond"
**原因**: Request URLが正しく設定されていない
**解決**: Slack AppのSlash CommandsのRequest URLを確認

#### 2. モーダルが表示されない
**原因**: Bot権限が不足
**解決**: OAuth & Permissionsで必要な権限を再確認

#### 3. Firestoreエラー
**原因**: Firestoreが作成されていない、またはプロジェクトIDが間違い
**解決**: Firebase Consoleでデータベース作成を確認

#### 4. 環境変数エラー
**原因**: トークンまたはシークレットが正しく設定されていない
**解決**: `.env`ファイルとCloud Runの環境変数を確認

### デバッグコマンド

```bash
# ログ確認
make logs-tail

# サービス詳細確認
make service-info

# Slack API接続テスト
make slack-test

# 環境変数検証
make validate-env
```

## 📊 運用・監視

### 基本的な運用コマンド

```bash
# ログ監視
make logs-tail

# サービス状態確認
make status

# Firestoreバックアップ
make firestore-backup

# 依存関係更新
make update-deps
```

### パフォーマンス監視

- [Cloud Run Console](https://console.cloud.google.com/run)
- [Firebase Console](https://console.firebase.google.com)
- Slackアプリの使用統計

## 🔄 アップデート手順

```bash
# コード更新
git pull origin main

# 再デプロイ
make deploy-simple

# または環境変数付き再デプロイ  
make deploy-env
```

## 📞 サポート

### 参考資料
- [README.md](./README.md) - 詳細な機能説明
- [Makefile](./Makefile) - 利用可能なコマンド一覧
- [Slack API Documentation](https://api.slack.com/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)

### よく使うコマンド
```bash
make help              # ヘルプ表示
make service-url       # サービスURL確認
make slack-webhook-url # Slack設定用URL表示
make project-info      # プロジェクト情報表示
```

## ✅ セットアップ完了チェックリスト

### GCP・インフラ設定
- [ ] GCPプロジェクト作成・API有効化
- [ ] Firestoreデータベース作成
- [ ] アプリケーションデプロイ
- [ ] 環境変数設定

### Slack App設定
- [ ] Slack App作成・権限設定（7つの権限）
- [ ] **Slash Commands設定（5つのコマンド）**
  - [ ] `/mentor-help` - 質問投稿
  - [ ] `/mentor-register` - メンター登録
  - [ ] `/mentor-unregister` - メンター登録解除  
  - [ ] `/mentor-list` - メンター一覧
  - [ ] `/mentor-status` - ステータス管理
- [ ] Interactive Components設定
- [ ] Event Subscriptions設定（4つのイベント）
- [ ] Slack Appインストール

### 動作確認
- [ ] 基本動作テスト（`/mentor-help`, `/mentor-list`）
- [ ] メンター機能テスト（登録・一覧・ステータス・解除）
- [ ] 質問投稿テスト（3つの投稿方法）

全ての項目が完了したら、ハッカソンメンターボットの利用を開始できます！

## 📱 Quick Setup Summary

**最重要**: 以下の5つのSlash Commandsを忘れずに設定してください：

```
/mentor-help          ← 質問投稿（メイン機能）
/mentor-register      ← メンター登録
/mentor-unregister    ← メンター登録解除
/mentor-list          ← メンター一覧
/mentor-status        ← ステータス管理
```

すべて同じRequest URL: `https://your-service-url/slack/events`