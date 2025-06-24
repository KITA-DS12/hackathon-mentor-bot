export const QUESTION_TEMPLATES = {
  技術的な問題: {
    フロントエンド: {
      description: 'React、Vue、HTML/CSS、JavaScript の問題',
      fields: [
        {
          id: 'what_trying',
          label: '何をやろうとしているか',
          type: 'textarea',
          placeholder: 'ボタンクリックでモーダルを表示したい',
          required: true,
        },
        {
          id: 'what_happened',
          label: '何が起きているか',
          type: 'textarea',
          placeholder: '何も起こらない、エラーが出る',
          required: true,
        },
        {
          id: 'error_message',
          label: 'エラーメッセージ',
          type: 'textarea',
          placeholder: 'コンソールエラーがあれば',
          required: false,
        },
        {
          id: 'related_code',
          label: '関連するコード',
          type: 'textarea',
          placeholder: '問題に関連するコードがあれば貼り付けてください',
          required: false,
        },
      ],
    },
    バックエンド: {
      description: 'サーバーサイド、データベース、認証の問題',
      fields: [
        {
          id: 'what_trying',
          label: '何をやろうとしているか',
          type: 'textarea',
          placeholder: 'ユーザー登録機能を作りたい',
          required: true,
        },
        {
          id: 'what_happened',
          label: '何が起きているか',
          type: 'textarea',
          placeholder: 'サーバーエラー、データが保存されない',
          required: true,
        },
        {
          id: 'error_message',
          label: 'エラーメッセージ',
          type: 'textarea',
          placeholder: 'サーバーログやエラーメッセージ',
          required: false,
        },
        {
          id: 'related_code',
          label: '関連するコード',
          type: 'textarea',
          placeholder: '問題に関連するコードがあれば貼り付けてください',
          required: false,
        },
      ],
    },
    インフラ・デプロイ: {
      description: 'AWS、Vercel、デプロイの問題',
      fields: [
        {
          id: 'what_trying',
          label: '何をやろうとしているか',
          type: 'textarea',
          placeholder: 'アプリをVercelにデプロイしたい',
          required: true,
        },
        {
          id: 'what_happened',
          label: '何が起きているか',
          type: 'textarea',
          placeholder: 'デプロイが失敗する、動かない',
          required: true,
        },
        {
          id: 'error_message',
          label: 'エラーメッセージ',
          type: 'textarea',
          placeholder: 'デプロイログやエラーメッセージ',
          required: false,
        },
        {
          id: 'related_code',
          label: '関連するコード・設定',
          type: 'textarea',
          placeholder: '設定ファイルやデプロイ関連のコードがあれば',
          required: false,
        },
      ],
    },
  },
  'デザイン・UI/UX': {
    レイアウト・CSS: {
      description: 'レイアウト、CSS、スタイリングの問題',
      fields: [
        {
          id: 'what_trying',
          label: '何をやろうとしているか',
          type: 'textarea',
          placeholder: 'レスポンシブなヘッダーを作りたい',
          required: true,
        },
        {
          id: 'what_happened',
          label: '何が起きているか',
          type: 'textarea',
          placeholder: 'スマホで崩れる、位置がずれる',
          required: true,
        },
        {
          id: 'reference',
          label: '参考（あれば）',
          placeholder: 'FigmaのURL、参考サイトなど',
          required: false,
        },
      ],
    },
  },
  'ビジネス・企画': {
    アイデア相談: {
      description: '機能やサービスのアイデア相談',
      fields: [
        {
          id: 'idea_summary',
          label: 'アイデアの概要',
          type: 'textarea',
          placeholder: 'どんな機能・サービスを考えているか',
          required: true,
        },
        {
          id: 'target_users',
          label: '誰のためのものか',
          placeholder: '大学生、エンジニア、一般の人など',
          required: true,
        },
        {
          id: 'what_want_advice',
          label: 'どんなアドバイスが欲しいか',
          type: 'textarea',
          placeholder: '実現可能性、改善点、技術選択など',
          required: true,
        },
      ],
    },
  },
  その他: {
    なんでも相談: {
      description: '何でも気軽に相談できます',
      fields: [
        {
          id: 'question_content',
          label: '相談内容',
          type: 'textarea',
          placeholder: 'どんなことでもお気軽に！',
          required: true,
        },
      ],
    },
  },
};
