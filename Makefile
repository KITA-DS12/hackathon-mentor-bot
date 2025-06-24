# Hackathon Mentor Bot - Makefile
# 使用方法: make <command>

# 変数定義
PROJECT_ID ?= $(shell gcloud config get-value project)
REGION = asia-northeast1
SERVICE_NAME = hackathon-mentor-bot
IMAGE_NAME = gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

# カラー出力用
GREEN = \033[92m
YELLOW = \033[93m
RED = \033[91m
NC = \033[0m # No Color

.PHONY: help setup install dev build deploy clean logs status test test-watch test-coverage lint format

# デフォルトターゲット
help: ## ヘルプを表示
	@echo "$(GREEN)Hackathon Mentor Bot - 利用可能なコマンド:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)使用例:$(NC)"
	@echo "  make setup          # 初回セットアップ"
	@echo "  make dev            # ローカル開発サーバー起動"
	@echo "  make deploy         # Cloud Runにデプロイ"
	@echo "  make logs           # ログ確認"

# ====================
# セットアップ関連
# ====================

setup: ## 初回セットアップ（API有効化、Firestore作成）
	@echo "$(GREEN)🚀 初回セットアップを開始...$(NC)"
	@echo "$(YELLOW)📋 現在のGCPプロジェクト: $(PROJECT_ID)$(NC)"
	@read -p "このプロジェクトでセットアップを続行しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	@echo "$(GREEN)🔧 必要なAPIを有効化...$(NC)"
	gcloud services enable run.googleapis.com
	gcloud services enable cloudbuild.googleapis.com
	gcloud services enable firestore.googleapis.com
	gcloud services enable containerregistry.googleapis.com
	@echo "$(GREEN)📚 Firestoreデータベース作成...$(NC)"
	@echo "$(YELLOW)⚠️  Firebase Console (https://console.firebase.google.com) でFirestoreデータベースを手動作成してください$(NC)"
	@echo "$(GREEN)✅ セットアップ完了！次に 'make install' を実行してください$(NC)"

install: ## 依存関係をインストール
	@echo "$(GREEN)📦 依存関係をインストール...$(NC)"
	npm install
	@echo "$(GREEN)✅ インストール完了！$(NC)"

env-setup: ## 環境変数ファイルの設定をガイド
	@echo "$(GREEN)🔧 環境変数設定ガイド$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)📝 .envファイルを作成しました$(NC)"; \
	fi
	@echo "$(YELLOW)🚨 .envファイルに以下の値を設定してください:$(NC)"
	@echo "  SLACK_BOT_TOKEN=xoxb-your-token"
	@echo "  SLACK_SIGNING_SECRET=your-secret"
	@echo "  GOOGLE_CLOUD_PROJECT=$(PROJECT_ID)"
	@echo "  MENTOR_CHANNEL_ID=C1234567890"
	@echo ""
	@echo "$(GREEN)設定後、'make dev'でローカル開発を開始できます$(NC)"

# ====================
# 開発関連
# ====================

dev: ## ローカル開発サーバー起動
	@echo "$(GREEN)🚀 ローカル開発サーバーを起動...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ .envファイルが見つかりません。'make env-setup'を先に実行してください$(NC)"; \
		exit 1; \
	fi
	npm run dev

test: ## テストを実行
	@echo "$(GREEN)🧪 テストを実行...$(NC)"
	npm test

test-watch: ## テスト監視モード
	@echo "$(GREEN)👀 テスト監視モード...$(NC)"
	npm run test:watch

test-coverage: ## テストカバレッジ生成
	@echo "$(GREEN)📊 テストカバレッジレポート生成...$(NC)"
	npm run test:coverage
	@echo "$(GREEN)📁 カバレッジレポート: coverage/index.html$(NC)"

lint: ## リントチェック
	@echo "$(GREEN)🔍 リントチェック...$(NC)"
	npm run lint

format: ## コードフォーマット
	@echo "$(GREEN)✨ コードフォーマット...$(NC)"
	npm run format

check: lint format ## リント + フォーマット
	@echo "$(GREEN)✅ コード品質チェック完了$(NC)"

# ====================
# ビルド・デプロイ関連
# ====================

build: ## Dockerイメージをビルド
	@echo "$(GREEN)🏗️  Dockerイメージをビルド...$(NC)"
	docker build -t $(SERVICE_NAME) .
	@echo "$(GREEN)✅ ビルド完了$(NC)"

build-cloud: ## Cloud Buildでイメージビルド
	@echo "$(GREEN)☁️  Cloud Buildでイメージをビルド...$(NC)"
	gcloud builds submit --tag $(IMAGE_NAME)

deploy: ## Cloud Runにデプロイ
	@echo "$(GREEN)🚀 Cloud Runにデプロイ中...$(NC)"
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "$(RED)❌ GCPプロジェクトが設定されていません$(NC)"; \
		echo "$(YELLOW)gcloud config set project YOUR_PROJECT_ID を実行してください$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)📋 プロジェクト: $(PROJECT_ID)$(NC)"
	@echo "$(YELLOW)📍 リージョン: $(REGION)$(NC)"
	@echo "$(YELLOW)⚠️  環境変数が必要です。'make deploy-env'または直接環境変数を設定してください$(NC)"
	@if [ -f .env ]; then \
		echo "$(YELLOW)💡 .envファイルを読み込んでデプロイします$(NC)"; \
		source .env && gcloud builds submit --config cloudbuild.yaml \
			--substitutions=_SLACK_BOT_TOKEN=$$SLACK_BOT_TOKEN,_SLACK_SIGNING_SECRET=$$SLACK_SIGNING_SECRET,_MENTOR_CHANNEL_ID=$$MENTOR_CHANNEL_ID; \
	else \
		echo "$(YELLOW)💡 プレースホルダー値でデプロイします（後で環境変数を設定してください）$(NC)"; \
		gcloud builds submit --config cloudbuild.yaml; \
	fi
	@echo "$(GREEN)✅ デプロイ完了！$(NC)"
	@make service-url

deploy-env: ## 環境変数付きでデプロイ
	@echo "$(GREEN)🚀 環境変数付きでCloud Runにデプロイ...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ .envファイルが見つかりません$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)⚠️  本番環境では環境変数をCloud BuildまたはCloud Runで設定することを推奨します$(NC)"
	@source .env && gcloud run deploy $(SERVICE_NAME) \
		--source . \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 1Gi \
		--cpu 1 \
		--concurrency 20 \
		--min-instances 0 \
		--max-instances 10 \
		--set-env-vars SLACK_BOT_TOKEN=$$SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET=$$SLACK_SIGNING_SECRET,GOOGLE_CLOUD_PROJECT=$$GOOGLE_CLOUD_PROJECT,MENTOR_CHANNEL_ID=$$MENTOR_CHANNEL_ID

deploy-simple: ## 簡単デプロイ（ソースから直接）
	@echo "$(GREEN)🚀 ソースから直接デプロイ...$(NC)"
	@echo "$(YELLOW)⚠️  このコマンドは環境変数を設定しません。デプロイ後にCloud Consoleで設定してください$(NC)"
	gcloud run deploy $(SERVICE_NAME) \
		--source . \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 1Gi \
		--cpu 1 \
		--concurrency 20 \
		--min-instances 0 \
		--max-instances 10
	@echo "$(GREEN)✅ デプロイ完了！$(NC)"
	@make service-url
	@echo "$(YELLOW)🔧 Cloud Console (https://console.cloud.google.com/run) で環境変数を設定してください$(NC)"

# ====================
# 運用・モニタリング関連
# ====================

logs: ## Cloud Runのログを表示
	@echo "$(GREEN)📋 Cloud Runログを表示...$(NC)"
	gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$(SERVICE_NAME)" --limit=50 --format="table(timestamp,severity,textPayload)"

logs-tail: ## リアルタイムログ監視
	@echo "$(GREEN)📊 リアルタイムログ監視中... (Ctrl+Cで終了)$(NC)"
	gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=$(SERVICE_NAME)" --format="table(timestamp,severity,textPayload)"

status: ## サービス状態確認
	@echo "$(GREEN)📊 サービス状態確認...$(NC)"
	gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="table(
		metadata.name,
		status.url,
		status.conditions[0].type,
		status.conditions[0].status,
		spec.template.spec.containers[0].image
	)"

service-url: ## サービスURLを表示
	@echo "$(GREEN)🌐 サービスURL:$(NC)"
	@gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="value(status.url)"

service-info: ## サービス詳細情報
	@echo "$(GREEN)📋 サービス詳細情報:$(NC)"
	@echo "$(YELLOW)サービス名:$(NC) $(SERVICE_NAME)"
	@echo "$(YELLOW)プロジェクト:$(NC) $(PROJECT_ID)"
	@echo "$(YELLOW)リージョン:$(NC) $(REGION)"
	@echo "$(YELLOW)URL:$(NC) $$(gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="value(status.url)" 2>/dev/null || echo "未デプロイ")"

traffic: ## トラフィック状況確認
	@echo "$(GREEN)📈 トラフィック状況:$(NC)"
	gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="table(
		status.traffic[].revisionName,
		status.traffic[].percent,
		status.traffic[].tag
	)"

# ====================
# データベース関連
# ====================

firestore-backup: ## Firestoreデータのバックアップ
	@echo "$(GREEN)💾 Firestoreデータをバックアップ...$(NC)"
	gcloud firestore export gs://$(PROJECT_ID)-firestore-backup/$(shell date +%Y%m%d_%H%M%S)

firestore-indexes: ## Firestoreインデックス確認
	@echo "$(GREEN)📚 Firestoreインデックス確認:$(NC)"
	gcloud firestore indexes list

# ====================
# Slack App関連
# ====================

slack-test: ## SlackアプリのURL検証テスト
	@echo "$(GREEN)🧪 SlackアプリのURL検証テスト...$(NC)"
	@URL=$$(gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="value(status.url)" 2>/dev/null); \
	if [ -n "$$URL" ]; then \
		echo "$(YELLOW)テスト対象URL:$(NC) $$URL/slack/events"; \
		curl -X POST $$URL/slack/events \
			-H "Content-Type: application/json" \
			-d '{"type":"url_verification","challenge":"test_challenge"}' \
			&& echo "$(GREEN)✅ URL検証テスト成功$(NC)" \
			|| echo "$(RED)❌ URL検証テスト失敗$(NC)"; \
	else \
		echo "$(RED)❌ サービスが見つかりません。先にデプロイしてください$(NC)"; \
	fi

slack-webhook-url: ## Slack Webhook URL表示
	@echo "$(GREEN)🔗 Slack App設定用URL:$(NC)"
	@URL=$$(gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="value(status.url)" 2>/dev/null); \
	if [ -n "$$URL" ]; then \
		echo "$(YELLOW)Slash Commands / Interactive Components / Event Subscriptions:$(NC)"; \
		echo "$$URL/slack/events"; \
	else \
		echo "$(RED)❌ サービスが見つかりません。先にデプロイしてください$(NC)"; \
	fi

# ====================
# クリーンアップ関連
# ====================

clean: ## ローカルの一時ファイルを削除
	@echo "$(GREEN)🧹 一時ファイルを削除...$(NC)"
	rm -rf node_modules/.cache
	rm -rf .nyc_output
	rm -rf coverage
	@echo "$(GREEN)✅ クリーンアップ完了$(NC)"

clean-images: ## 未使用のDockerイメージを削除
	@echo "$(GREEN)🧹 未使用のDockerイメージを削除...$(NC)"
	docker image prune -f

undeploy: ## Cloud Runサービスを削除
	@echo "$(RED)⚠️  Cloud Runサービスを削除します$(NC)"
	@read -p "本当に $(SERVICE_NAME) を削除しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	gcloud run services delete $(SERVICE_NAME) --region=$(REGION)
	@echo "$(GREEN)✅ サービス削除完了$(NC)"

# ====================
# ユーティリティ
# ====================

update-deps: ## 依存関係を更新
	@echo "$(GREEN)⬆️  依存関係を更新...$(NC)"
	npm update
	npm audit fix
	@echo "$(GREEN)✅ 更新完了$(NC)"

project-info: ## プロジェクト情報表示
	@echo "$(GREEN)📋 プロジェクト情報:$(NC)"
	@echo "$(YELLOW)プロジェクトID:$(NC) $(PROJECT_ID)"
	@echo "$(YELLOW)リージョン:$(NC) $(REGION)"
	@echo "$(YELLOW)サービス名:$(NC) $(SERVICE_NAME)"
	@echo "$(YELLOW)イメージ名:$(NC) $(IMAGE_NAME)"
	@echo ""
	@echo "$(GREEN)💡 使用可能なコマンド:$(NC)"
	@echo "  make help     - ヘルプ表示"
	@echo "  make setup    - 初回セットアップ"
	@echo "  make deploy   - デプロイ"
	@echo "  make logs     - ログ確認"

ngrok: ## ngrokでローカルサーバーを公開（開発用）
	@echo "$(GREEN)🌐 ngrokでローカルサーバーを公開...$(NC)"
	@echo "$(YELLOW)⚠️  別ターミナルで 'make dev' を実行してからこのコマンドを使用してください$(NC)"
	@echo "$(YELLOW)📋 生成されたURLをSlack AppのRequest URLに設定してください$(NC)"
	npx ngrok http 8080

# ====================
# その他
# ====================

version: ## アプリケーションバージョン表示
	@echo "$(GREEN)📦 アプリケーション情報:$(NC)"
	@node -p "JSON.parse(require('fs').readFileSync('package.json')).version"

validate-env: ## 環境変数の検証
	@echo "$(GREEN)🔍 環境変数を検証...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ .envファイルが見つかりません$(NC)"; \
		exit 1; \
	fi
	@source .env && \
	if [ -z "$$SLACK_BOT_TOKEN" ]; then echo "$(RED)❌ SLACK_BOT_TOKEN が設定されていません$(NC)"; exit 1; fi && \
	if [ -z "$$SLACK_SIGNING_SECRET" ]; then echo "$(RED)❌ SLACK_SIGNING_SECRET が設定されていません$(NC)"; exit 1; fi && \
	if [ -z "$$GOOGLE_CLOUD_PROJECT" ]; then echo "$(RED)❌ GOOGLE_CLOUD_PROJECT が設定されていません$(NC)"; exit 1; fi && \
	if [ -z "$$MENTOR_CHANNEL_ID" ]; then echo "$(RED)❌ MENTOR_CHANNEL_ID が設定されていません$(NC)"; exit 1; fi && \
	echo "$(GREEN)✅ 環境変数の検証完了$(NC)"

set-env: ## Cloud Runの環境変数を設定
	@echo "$(GREEN)🔧 Cloud Runの環境変数を設定...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ .envファイルが見つかりません$(NC)"; \
		exit 1; \
	fi
	@source .env && gcloud run services update $(SERVICE_NAME) \
		--region $(REGION) \
		--set-env-vars SLACK_BOT_TOKEN=$$SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET=$$SLACK_SIGNING_SECRET,GOOGLE_CLOUD_PROJECT=$$GOOGLE_CLOUD_PROJECT,MENTOR_CHANNEL_ID=$$MENTOR_CHANNEL_ID
	@echo "$(GREEN)✅ 環境変数設定完了$(NC)"