#!/bin/bash

# Hackathon Mentor Bot - セットアップスクリプト
# 使用方法: ./scripts/setup.sh

set -e

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Hackathon Mentor Bot セットアップ開始${NC}"
echo ""

# 前提条件チェック
check_prerequisites() {
    echo -e "${GREEN}📋 前提条件をチェック中...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI が見つかりません${NC}"
        echo "Google Cloud SDK をインストールしてください: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js が見つかりません${NC}"
        echo "Node.js をインストールしてください: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm が見つかりません${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 前提条件チェック完了${NC}"
}

# GCPプロジェクト設定
setup_gcp() {
    echo -e "${GREEN}☁️  GCPプロジェクト設定...${NC}"
    
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}📝 GCPプロジェクトが設定されていません${NC}"
        read -p "プロジェクトIDを入力してください: " PROJECT_ID
        gcloud config set project $PROJECT_ID
    fi
    
    echo -e "${YELLOW}📋 現在のプロジェクト: $PROJECT_ID${NC}"
    read -p "このプロジェクトでセットアップを続行しますか？ (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ セットアップを中止しました${NC}"
        exit 1
    fi
}

# APIの有効化
enable_apis() {
    echo -e "${GREEN}🔧 必要なAPIを有効化中...${NC}"
    
    apis=(
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "firestore.googleapis.com"
        "containerregistry.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        echo -e "${YELLOW}  📡 $api を有効化中...${NC}"
        gcloud services enable $api
    done
    
    echo -e "${GREEN}✅ API有効化完了${NC}"
}

# Firestore設定
setup_firestore() {
    echo -e "${GREEN}📚 Firestore設定...${NC}"
    
    # Firestoreが既に設定されているかチェック
    if gcloud firestore databases describe --database="(default)" &>/dev/null; then
        echo -e "${GREEN}✅ Firestoreは既に設定済みです${NC}"
    else
        echo -e "${YELLOW}⚠️  Firestoreデータベースを手動で作成する必要があります${NC}"
        echo -e "${YELLOW}   Firebase Console: https://console.firebase.google.com${NC}"
        echo -e "${YELLOW}   1. プロジェクトを選択${NC}"
        echo -e "${YELLOW}   2. Firestore Database → 作成${NC}"
        echo -e "${YELLOW}   3. ネイティブモード → asia-northeast1 を選択${NC}"
        echo ""
        read -p "Firestoreの設定が完了したらEnterを押してください..."
    fi
}

# 依存関係インストール
install_dependencies() {
    echo -e "${GREEN}📦 依存関係をインストール中...${NC}"
    npm install
    echo -e "${GREEN}✅ 依存関係インストール完了${NC}"
}

# 環境変数ファイル作成
setup_env() {
    echo -e "${GREEN}🔧 環境変数設定...${NC}"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}📝 .envファイルを作成しました${NC}"
    fi
    
    PROJECT_ID=$(gcloud config get-value project)
    
    # .envファイルのPROJECT_IDを更新
    if command -v sed &> /dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-project-id/$PROJECT_ID/" .env
        else
            # Linux
            sed -i "s/your-project-id/$PROJECT_ID/" .env
        fi
    fi
    
    echo -e "${YELLOW}🚨 .envファイルに以下の値を設定してください:${NC}"
    echo -e "${YELLOW}  SLACK_BOT_TOKEN=xoxb-your-token${NC}"
    echo -e "${YELLOW}  SLACK_SIGNING_SECRET=your-signing-secret${NC}"
    echo -e "${YELLOW}  MENTOR_CHANNEL_ID=C1234567890${NC}"
    echo ""
    echo -e "${YELLOW}💡 GOOGLE_CLOUD_PROJECT は自動設定済み: $PROJECT_ID${NC}"
}

# Slack App設定ガイド
slack_guide() {
    echo -e "${GREEN}📱 Slack App設定ガイド${NC}"
    echo ""
    echo -e "${YELLOW}1. Slack Appを作成:${NC}"
    echo "   https://api.slack.com/apps"
    echo ""
    echo -e "${YELLOW}2. 必要な権限を追加:${NC}"
    echo "   OAuth & Permissions → Bot Token Scopes:"
    echo "   ✅ channels:read"
    echo "   ✅ chat:write"
    echo "   ✅ chat:write.public"
    echo "   ✅ commands"
    echo "   ✅ im:read"
    echo "   ✅ im:write"
    echo "   ✅ users:read"
    echo ""
    echo -e "${YELLOW}3. Slash Commandsを設定:${NC}"
    echo "   /mentor-help"
    echo "   /mentor-help-simple"
    echo "   /mentor-schedule"
    echo "   /mentor-status"
    echo ""
    echo -e "${YELLOW}4. トークンを取得:${NC}"
    echo "   Bot User OAuth Token (xoxb-...)"
    echo "   Signing Secret"
    echo ""
    echo -e "${YELLOW}💡 詳細な設定手順は README.md を参照してください${NC}"
}

# 開発環境テスト
test_setup() {
    echo -e "${GREEN}🧪 開発環境テスト中...${NC}"
    
    if [ -f .env ]; then
        source .env
        
        if [ -z "$SLACK_BOT_TOKEN" ] || [ -z "$SLACK_SIGNING_SECRET" ]; then
            echo -e "${YELLOW}⚠️  Slack認証情報が未設定です${NC}"
            echo -e "${YELLOW}   .envファイルを編集してからテストしてください${NC}"
            return
        fi
        
        echo -e "${GREEN}🚀 開発サーバーを起動してテスト...${NC}"
        echo -e "${YELLOW}💡 Ctrl+C でサーバーを停止できます${NC}"
        echo ""
        
        timeout 10s npm run dev || echo -e "${GREEN}✅ 開発サーバーのテスト完了${NC}"
    fi
}

# メイン処理
main() {
    check_prerequisites
    setup_gcp
    enable_apis
    setup_firestore
    install_dependencies
    setup_env
    
    echo ""
    echo -e "${GREEN}🎉 基本セットアップが完了しました！${NC}"
    echo ""
    
    slack_guide
    
    echo ""
    echo -e "${GREEN}📝 次のステップ:${NC}"
    echo -e "${YELLOW}1. .envファイルにSlack認証情報を設定${NC}"
    echo -e "${YELLOW}2. make dev でローカル開発開始${NC}"
    echo -e "${YELLOW}3. make deploy でCloud Runにデプロイ${NC}"
    echo ""
    echo -e "${GREEN}💡 利用可能なコマンド:${NC}"
    echo "   make help     - ヘルプ表示"
    echo "   make dev      - ローカル開発"
    echo "   make deploy   - デプロイ"
    echo "   make logs     - ログ確認"
    echo ""
    
    read -p "ローカル開発サーバーをテストしますか？ (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_setup
    fi
}

# スクリプト実行
main "$@"