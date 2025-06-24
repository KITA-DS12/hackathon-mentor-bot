import {
  CATEGORIES,
  URGENCY_LEVELS,
  CONSULTATION_TYPES,
  MENTOR_AVAILABILITY,
  DEFAULT_VALUES,
} from '../config/constants.js';

export const createQuestionModal = (freeMode = false) => {
  const baseBlocks = [
    {
      type: 'input',
      block_id: 'team_name',
      element: {
        type: 'plain_text_input',
        action_id: 'team_name',
        placeholder: {
          type: 'plain_text',
          text: '例：ABC',
        },
      },
      label: {
        type: 'plain_text',
        text: 'チーム名',
      },
    },
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
            text: 'カテゴリを選択',
          },
          initial_option: {
            text: {
              type: 'plain_text',
              text: DEFAULT_VALUES.CATEGORY,
            },
            value: DEFAULT_VALUES.CATEGORY,
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
          text: 'カテゴリ',
        },
      },
      {
        type: 'input',
        block_id: 'urgency',
        element: {
          type: 'static_select',
          action_id: 'urgency',
          placeholder: {
            type: 'plain_text',
            text: '緊急度を選択',
          },
          initial_option: {
            text: {
              type: 'plain_text',
              text: DEFAULT_VALUES.URGENCY,
            },
            value: DEFAULT_VALUES.URGENCY,
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
          text: '緊急度',
        },
      },
      {
        type: 'input',
        block_id: 'consultation_type',
        element: {
          type: 'static_select',
          action_id: 'consultation_type',
          placeholder: {
            type: 'plain_text',
            text: '相談方法を選択',
          },
          initial_option: {
            text: {
              type: 'plain_text',
              text: DEFAULT_VALUES.CONSULTATION_TYPE,
            },
            value: DEFAULT_VALUES.CONSULTATION_TYPE,
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
          text: '相談方法',
        },
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


export const createMentorRegistrationModal = () => {
  return {
    type: 'modal',
    callback_id: 'mentor_registration_modal',
    title: {
      type: 'plain_text',
      text: 'メンター登録',
    },
    submit: {
      type: 'plain_text',
      text: '登録する',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*メンターとして登録*\n質問が投稿された際にメンションを受け取ることができます。',
        },
      },
      {
        type: 'input',
        block_id: 'mentor_name',
        element: {
          type: 'plain_text_input',
          action_id: 'name',
          placeholder: {
            type: 'plain_text',
            text: '表示名を入力してください',
          },
        },
        label: {
          type: 'plain_text',
          text: 'メンター名',
        },
      },
      {
        type: 'input',
        block_id: 'mentor_bio',
        element: {
          type: 'plain_text_input',
          action_id: 'bio',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: '経歴、得意技術、サポートできる内容など（任意）',
          },
        },
        label: {
          type: 'plain_text',
          text: '自己紹介（任意）',
        },
        optional: true,
      },
      {
        type: 'input',
        block_id: 'initial_availability',
        element: {
          type: 'static_select',
          action_id: 'availability',
          placeholder: {
            type: 'plain_text',
            text: '初期ステータスを選択',
          },
          initial_option: {
            text: {
              type: 'plain_text',
              text: '🟢 対応可能',
            },
            value: MENTOR_AVAILABILITY.AVAILABLE,
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: '🟢 対応可能',
              },
              value: MENTOR_AVAILABILITY.AVAILABLE,
            },
            {
              text: {
                type: 'plain_text',
                text: '🟡 忙しい',
              },
              value: MENTOR_AVAILABILITY.BUSY,
            },
            {
              text: {
                type: 'plain_text',
                text: '🔴 対応不可',
              },
              value: MENTOR_AVAILABILITY.OFFLINE,
            },
          ],
        },
        label: {
          type: 'plain_text',
          text: '初期ステータス',
        },
      },
    ],
  };
};
