import { QUESTION_TEMPLATES } from '../config/templates.js';
import { URGENCY_LEVELS, CONSULTATION_TYPES } from '../config/constants.js';

export const createCategorySelectionModal = () => {
  return {
    type: 'modal',
    callback_id: 'category_selection_modal',
    title: {
      type: 'plain_text',
      text: 'メンターに質問する',
    },
    submit: {
      type: 'plain_text',
      text: '質問フォームを開く',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*質問のカテゴリを選択してください*\nカテゴリに応じて最適な質問フォームを表示します。',
        },
      },
      {
        type: 'input',
        block_id: 'category_selection',
        element: {
          type: 'static_select',
          action_id: 'category',
          placeholder: {
            type: 'plain_text',
            text: 'カテゴリを選択',
          },
          options: Object.keys(QUESTION_TEMPLATES).map((category) => {
            const template = QUESTION_TEMPLATES[category];
            return {
              text: {
                type: 'plain_text',
                text: category,
              },
              value: category,
              description: {
                type: 'plain_text',
                text: template.description,
              },
            };
          }),
        },
        label: {
          type: 'plain_text',
          text: 'カテゴリ',
        },
      },
    ],
  };
};

export const createTemplateQuestionModal = (category) => {
  console.log('Debug: Creating template for category:', category);
  console.log('Debug: Available templates:', Object.keys(QUESTION_TEMPLATES));
  const template = QUESTION_TEMPLATES[category];
  console.log('Debug: Found template:', template ? 'YES' : 'NO');

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${category}*\n${template.description}`,
      },
    },
    {
      type: 'divider',
    },
    // チーム名（共通・必須）
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
        text: '👥 チーム名',
      },
    },
    // 問題サマリー（共通）
    {
      type: 'input',
      block_id: 'question_summary',
      element: {
        type: 'plain_text_input',
        action_id: 'summary',
        placeholder: {
          type: 'plain_text',
          text: '一行で問題を要約してください',
        },
      },
      label: {
        type: 'plain_text',
        text: '📋 問題サマリー',
      },
    },
  ];

  // テンプレート固有のフィールドを追加
  template.fields.forEach((field) => {
    blocks.push({
      type: 'input',
      block_id: `template_field_${field.id}`,
      element: {
        type: 'plain_text_input',
        action_id: field.id,
        multiline: field.type === 'textarea',
        placeholder: {
          type: 'plain_text',
          text: field.placeholder,
        },
      },
      label: {
        type: 'plain_text',
        text: field.label,
      },
      optional: !field.required,
    });
  });

  // 共通フィールドを追加
  blocks.push(
    {
      type: 'divider',
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
    {
      type: 'input',
      block_id: 'additional_info',
      element: {
        type: 'plain_text_input',
        action_id: 'additional_info',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: '補足情報があれば記入してください',
        },
      },
      label: {
        type: 'plain_text',
        text: '補足情報（任意）',
      },
      optional: true,
    }
  );

  return {
    type: 'modal',
    callback_id: 'template_question_modal',
    title: {
      type: 'plain_text',
      text: `${category} - 質問`,
    },
    submit: {
      type: 'plain_text',
      text: '質問を送信',
    },
    private_metadata: JSON.stringify({ category }),
    blocks,
  };
};

export const formatTemplateQuestion = (questionData) => {
  const { category } = questionData;
  const templateConfig = QUESTION_TEMPLATES[category];

  let formattedContent = `📋 *${category}*\n\n`;
  formattedContent += `*【チーム名】*\n${questionData.teamName}\n\n`;
  formattedContent += `*【問題サマリー】*\n${questionData.summary}\n\n`;

  // テンプレートフィールドをフォーマット
  templateConfig.fields.forEach((field) => {
    const value = questionData[field.id];
    if (value && value.trim()) {
      formattedContent += `*【${field.label}】*\n${value}\n\n`;
    }
  });

  // 補足情報
  if (questionData.additionalInfo && questionData.additionalInfo.trim()) {
    formattedContent += `*【補足情報】*\n${questionData.additionalInfo}\n\n`;
  }

  // 共通情報
  formattedContent += `*【緊急度】* ${questionData.urgency}\n`;
  formattedContent += `*【相談方法】* ${questionData.consultationType}\n`;

  return formattedContent;
};
