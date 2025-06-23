// 質問タイプ選択モーダルを作成

export const createQuestionTypeSelectionModal = () => {
  return {
    type: 'modal',
    callback_id: 'question_type_selection_modal',
    title: {
      type: 'plain_text',
      text: '質問方法を選択',
    },
    submit: {
      type: 'plain_text',
      text: '選択',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*質問方法を選択してください*\n投稿する内容や状況に応じて、適切な方法を選んでください。',
        },
      },
      {
        type: 'input',
        block_id: 'question_type',
        element: {
          type: 'static_select',
          action_id: 'type',
          placeholder: {
            type: 'plain_text',
            text: '質問方法を選択',
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: '🚀 自由投稿 - 何でも気軽に質問',
              },
              value: 'free',
            },
            {
              text: {
                type: 'plain_text',
                text: '📝 シンプル投稿 - 基本項目で質問',
              },
              value: 'simple',
            },
            {
              text: {
                type: 'plain_text',
                text: '📋 詳細投稿 - テンプレート形式で質問',
              },
              value: 'template',
            },
          ],
        },
        label: {
          type: 'plain_text',
          text: '質問方法',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📖 各方法の説明*\n\n' +
                '🚀 *自由投稿*: 質問内容だけ入力すればOK。雑談や相談も歓迎！\n\n' +
                '📝 *シンプル投稿*: カテゴリや緊急度も設定したい場合（すべて任意）\n\n' +
                '📋 *詳細投稿*: 技術的な問題を構造化して詳しく質問したい場合',
        },
      },
    ],
  };
};