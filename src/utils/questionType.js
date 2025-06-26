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
          initial_option: {
            text: {
              type: 'plain_text',
              text: '📝 シンプル投稿 - 基本項目で質問',
            },
            value: 'simple',
          },
          options: [
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
          text:
            '*📖 各方法の説明*\n\n' +
            '📝 *シンプル投稿*: 質問内容＋カテゴリ・緊急度・相談方法を設定（推奨）\n\n' +
            '📋 *詳細投稿*: 技術的な問題を構造化して詳しく質問（テンプレート利用）',
        },
      },
    ],
  };
};
