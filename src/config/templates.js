export const QUESTION_TEMPLATES = {
  フロントエンド: {
    description: 'React、Vue、HTML/CSS、JavaScript の問題',
    fields: [
      {
        id: 'what_trying',
        label: '何をやろうとしているか',
        type: 'textarea',
        placeholder:
          '例：ログイン画面でsubmitボタンを押したらユーザー情報を送信したい',
        required: true,
      },
      {
        id: 'what_happened',
        label: '何が起きているか（現在の状況）',
        type: 'textarea',
        placeholder:
          '例：ボタンを押しても何も起こらない / TypeError: Cannot read property... のエラーが出る',
        required: true,
      },
      {
        id: 'error_message',
        label: 'エラーメッセージ（出ている場合）',
        type: 'textarea',
        placeholder:
          "例：TypeError: Cannot read property 'id' of undefined at login.js:25:12",
        required: false,
      },
      {
        id: 'related_code',
        label: '関連するコード・リンク',
        type: 'textarea',
        placeholder: '例：GitHub Gist、CodePen、問題の箇所のコード抜粋など',
        required: false,
      },
      {
        id: 'environment',
        label: '環境・技術スタック',
        placeholder: '例：React 18, Next.js 13, TypeScript',
        required: false,
      },
    ],
  },
  バックエンド: {
    description: 'サーバーサイド、データベース、API、認証の問題',
    fields: [
      {
        id: 'what_trying',
        label: '何をやろうとしているか',
        type: 'textarea',
        placeholder: '例：POST /api/users でユーザー登録APIを実装したい',
        required: true,
      },
      {
        id: 'what_happened',
        label: '何が起きているか（現在の状況）',
        type: 'textarea',
        placeholder:
          '例：500エラーが返る / データベースに保存されない / 認証が通らない',
        required: true,
      },
      {
        id: 'error_message',
        label: 'エラーメッセージ・ログ',
        type: 'textarea',
        placeholder:
          '例：Error: connect ECONNREFUSED 127.0.0.1:5432 / ValidationError: email is required',
        required: false,
      },
      {
        id: 'related_code',
        label: '関連するコード・設定',
        type: 'textarea',
        placeholder:
          '例：API エンドポイント、データベーススキーマ、設定ファイルなど',
        required: false,
      },
      {
        id: 'environment',
        label: '環境・技術スタック',
        placeholder: '例：Node.js + Express, PostgreSQL, Firebase Auth',
        required: false,
      },
    ],
  },
  'インフラ・デプロイ': {
    description: 'Vercel、Netlify、AWS、Docker、デプロイの問題',
    fields: [
      {
        id: 'what_trying',
        label: '何をやろうとしているか',
        type: 'textarea',
        placeholder:
          '例：Next.jsアプリをVercelにデプロイしたい / AWSでデータベースに接続したい',
        required: true,
      },
      {
        id: 'what_happened',
        label: '何が起きているか（現在の状況）',
        type: 'textarea',
        placeholder:
          '例：Build failed / 404エラーが出る / 環境変数が反映されない',
        required: true,
      },
      {
        id: 'error_message',
        label: 'エラーメッセージ・ログ',
        type: 'textarea',
        placeholder:
          '例：Error: Command "npm run build" exited with 1 / ENOENT: no such file or directory',
        required: false,
      },
      {
        id: 'related_code',
        label: '関連するコード・設定ファイル',
        type: 'textarea',
        placeholder:
          '例：package.json、vercel.json、dockerfile、環境変数設定など',
        required: false,
      },
      {
        id: 'platform',
        label: 'デプロイ先・環境',
        placeholder: '例：Vercel、Netlify、AWS EC2、Google Cloud Run',
        required: false,
      },
    ],
  },
  'レイアウト・CSS': {
    description: 'レイアウト、CSS、スタイリング、レスポンシブデザインの問題',
    fields: [
      {
        id: 'what_trying',
        label: '何をやろうとしているか',
        type: 'textarea',
        placeholder:
          '例：ヘッダーを画面幅いっぱいに表示したい / グリッドレイアウトで3列に並べたい',
        required: true,
      },
      {
        id: 'what_happened',
        label: '何が起きているか（現在の状況）',
        type: 'textarea',
        placeholder:
          '例：スマホで崩れる / 要素が重なってしまう / 中央寄せができない',
        required: true,
      },
      {
        id: 'current_css',
        label: '現在のCSS・コード',
        type: 'textarea',
        placeholder: '例：問題の箇所のCSSや関連するHTMLコード',
        required: false,
      },
      {
        id: 'reference',
        label: '参考・目標デザイン',
        placeholder: '例：Figma URL、参考サイト、CodePenなど',
        required: false,
      },
      {
        id: 'css_framework',
        label: '使用しているCSS技術',
        placeholder:
          '例：Tailwind CSS、Bootstrap、styled-components、CSS Modules',
        required: false,
      },
    ],
  },
  'UI・UX相談': {
    description: 'ユーザビリティ、デザイン判断、UI改善の相談',
    fields: [
      {
        id: 'current_design',
        label: '現在のデザイン・UI',
        type: 'textarea',
        placeholder: '例：どんな画面・機能のUIについて相談したいか',
        required: true,
      },
      {
        id: 'concern',
        label: '気になっている点・課題',
        type: 'textarea',
        placeholder:
          '例：使いにくそう / 分かりにくい / どっちのデザインがいいか迷う',
        required: true,
      },
      {
        id: 'target_user',
        label: '想定ユーザー',
        placeholder: '例：大学生、エンジニア、一般の人、高齢者など',
        required: false,
      },
      {
        id: 'reference_design',
        label: '参考デザイン・画面',
        placeholder: '例：Figma、画面キャプチャ、参考サイトなど',
        required: false,
      },
    ],
  },
  アイデア相談: {
    description: '機能やサービスのアイデア相談・ブラッシュアップ',
    fields: [
      {
        id: 'idea_summary',
        label: 'アイデアの概要',
        type: 'textarea',
        placeholder:
          '例：学生向けの課題共有アプリ / 地域のイベント情報を集約するサービス',
        required: true,
      },
      {
        id: 'target_users',
        label: 'ターゲットユーザー（誰のため？）',
        placeholder: '例：大学生、地域住民、エンジニア、子育て世代など',
        required: true,
      },
      {
        id: 'problem_solving',
        label: 'どんな課題を解決したいか',
        type: 'textarea',
        placeholder:
          '例：課題の締切管理が大変 / イベント情報が分散していて探しにくい',
        required: true,
      },
      {
        id: 'what_want_advice',
        label: 'どんなアドバイスが欲しいか',
        type: 'textarea',
        placeholder:
          '例：実現可能性、改善点、技術選択、マネタイズ、競合分析など',
        required: true,
      },
      {
        id: 'current_plan',
        label: '現在考えている機能・仕様',
        type: 'textarea',
        placeholder: '例：ユーザー登録、投稿機能、通知機能など（あれば）',
        required: false,
      },
    ],
  },
  技術選択相談: {
    description: 'どの技術・ツールを使うべきか迷っている',
    fields: [
      {
        id: 'what_building',
        label: '何を作ろうとしているか',
        type: 'textarea',
        placeholder: '例：Webアプリ、モバイルアプリ、API、データベース設計など',
        required: true,
      },
      {
        id: 'choice_options',
        label: '迷っている選択肢',
        type: 'textarea',
        placeholder: '例：React vs Vue / MySQL vs PostgreSQL / Vercel vs AWS',
        required: true,
      },
      {
        id: 'team_skill',
        label: 'チームのスキル・経験',
        placeholder: '例：JavaScript経験あり、Python初心者、インフラ未経験など',
        required: true,
      },
      {
        id: 'constraints',
        label: '制約・要件',
        type: 'textarea',
        placeholder: '例：無料で使いたい、スマホ対応必須、期間は2日間など',
        required: false,
      },
    ],
  },
  なんでも相談: {
    description: '技術・企画・デザイン以外の相談や、カテゴリに迷う質問',
    fields: [
      {
        id: 'question_content',
        label: '相談内容',
        type: 'textarea',
        placeholder:
          '例：チーム運営について / 発表資料の作り方 / プレゼンのコツ / その他何でも',
        required: true,
      },
      {
        id: 'background',
        label: '背景・状況（任意）',
        type: 'textarea',
        placeholder: '例：なぜこの相談をしたいか、どんな状況かなど',
        required: false,
      },
    ],
  },
  'エラー・トラブル': {
    description: 'エラーで困っているが、原因がよく分からない',
    fields: [
      {
        id: 'what_happened',
        label: '何が起きているか',
        type: 'textarea',
        placeholder:
          '例：アプリが動かなくなった / 画面が真っ白になる / データが消えた',
        required: true,
      },
      {
        id: 'when_happened',
        label: 'いつから・何をした後に起きたか',
        type: 'textarea',
        placeholder:
          '例：さっきまで動いていた / ライブラリを追加した後 / デプロイしてから',
        required: true,
      },
      {
        id: 'error_message',
        label: 'エラーメッセージ・ログ',
        type: 'textarea',
        placeholder:
          '例：コンソールエラー、ターミナルのエラー、画面に表示されるエラーなど',
        required: false,
      },
      {
        id: 'environment',
        label: '環境・技術',
        placeholder: '例：React, Node.js, Vercel, Chrome, Windowsなど',
        required: false,
      },
    ],
  },
};
