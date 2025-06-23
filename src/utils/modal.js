import {
  CATEGORIES,
  URGENCY_LEVELS,
  CONSULTATION_TYPES,
  RESERVATION_TIMES,
} from '../config/constants.js';

export const createQuestionModal = (freeMode = false) => {
  const baseBlocks = [
    {
      type: 'input',
      block_id: 'question_content',
      element: {
        type: 'plain_text_input',
        action_id: 'content',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: freeMode ? '何でもお気軽に質問してください！' : '例：ログイン機能でエラーが出て困っています',
        },
      },
      label: {
        type: 'plain_text',
        text: '質問内容',
      },
    },
  ];

  // 自由モードではない場合のみ、カテゴリや緊急度を追加
  if (!freeMode) {
    baseBlocks.push(
      {
        type: 'input',
        block_id: 'category',
        element: {
          type: 'static_select',
          action_id: 'category',
          placeholder: {
            type: 'plain_text',
            text: 'カテゴリを選択（任意）',
          },
          options: Object.values(CATEGORIES).map((category) => ({
            text: {
              type: 'plain_text',
              text: category,
            },
            value: category,
          })),
        },
        label: {
          type: 'plain_text',
          text: 'カテゴリ（任意）',
        },
        optional: true,
      },
      {
        type: 'input',
        block_id: 'urgency',
        element: {
          type: 'static_select',
          action_id: 'urgency',
          placeholder: {
            type: 'plain_text',
            text: '緊急度を選択（任意）',
          },
          options: Object.values(URGENCY_LEVELS).map((urgency) => ({
            text: {
              type: 'plain_text',
              text: urgency,
            },
            value: urgency,
          })),
        },
        label: {
          type: 'plain_text',
          text: '緊急度（任意）',
        },
        optional: true,
      },
      {
        type: 'input',
        block_id: 'consultation_type',
        element: {
          type: 'static_select',
          action_id: 'consultation_type',
          placeholder: {
            type: 'plain_text',
            text: '相談方法を選択（任意）',
          },
          options: Object.values(CONSULTATION_TYPES).map((type) => ({
            text: {
              type: 'plain_text',
              text: type,
            },
            value: type,
          })),
        },
        label: {
          type: 'plain_text',
          text: '相談方法（任意）',
        },
        optional: true,
      },
    );
  }

  // 共通の任意項目を追加
  baseBlocks.push(
    {
      type: 'input',
      block_id: 'current_situation',
      element: {
        type: 'plain_text_input',
        action_id: 'current_situation',
        placeholder: {
          type: 'plain_text',
          text: '例：公式ドキュメントを見たが解決せず',
        },
      },
      label: {
        type: 'plain_text',
        text: '現在の状況（任意）',
      },
      optional: true,
    },
    {
      type: 'input',
      block_id: 'related_links',
      element: {
        type: 'plain_text_input',
        action_id: 'related_links',
        placeholder: {
          type: 'plain_text',
          text: 'GitHub Gist、CodePen、参考サイトのURLなど',
        },
      },
      label: {
        type: 'plain_text',
        text: '関連コード・リンク（任意）',
      },
      optional: true,
    },
    {
      type: 'input',
      block_id: 'error_message',
      element: {
        type: 'plain_text_input',
        action_id: 'error_message',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: '出ているエラーがあれば貼り付けてください',
        },
      },
      label: {
        type: 'plain_text',
        text: 'エラーメッセージ（任意）',
      },
      optional: true,
    }
  );

  return {
    type: 'modal',
    callback_id: 'question_modal',
    title: {
      type: 'plain_text',
      text: freeMode ? '自由に質問する' : 'メンターに質問する',
    },
    submit: {
      type: 'plain_text',
      text: '質問を送信',
    },
    blocks: baseBlocks,
  };
};

export const createReservationModal = () => {
  return {
    type: 'modal',
    callback_id: 'reservation_modal',
    title: {
      type: 'plain_text',
      text: '予約相談の詳細',
    },
    submit: {
      type: 'plain_text',
      text: '予約して送信',
    },
    blocks: [
      {
        type: 'input',
        block_id: 'reservation_time',
        element: {
          type: 'static_select',
          action_id: 'reservation_time',
          placeholder: {
            type: 'plain_text',
            text: '希望時間を選択',
          },
          options: Object.keys(RESERVATION_TIMES).map((time) => ({
            text: {
              type: 'plain_text',
              text: time,
            },
            value: time,
          })),
        },
        label: {
          type: 'plain_text',
          text: '希望相談時間',
        },
      },
      {
        type: 'input',
        block_id: 'auto_resolve_check',
        element: {
          type: 'checkboxes',
          action_id: 'auto_resolve_check',
          initial_options: [
            {
              text: {
                type: 'plain_text',
                text: '予約時間に自力解決確認を受け取る',
              },
              value: 'auto_resolve_check',
            },
          ],
          options: [
            {
              text: {
                type: 'plain_text',
                text: '予約時間に自力解決確認を受け取る',
              },
              value: 'auto_resolve_check',
            },
          ],
        },
        label: {
          type: 'plain_text',
          text: '自動解決確認',
        },
        optional: true,
      },
    ],
  };
};
