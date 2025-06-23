import { STATUS_EMOJI } from '../config/constants.js';

export const createQuestionMessage = (question, questionId) => {
  const statusEmoji = STATUS_EMOJI[question.status];

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} 新しい質問 - ${question.category}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*質問者:* <@${question.userId}>\n*緊急度:* ${question.urgency}\n*相談方法:* ${question.consultationType}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*質問内容:*\n${question.content}`,
        },
      },
      ...(question.currentSituation
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*現在の状況:*\n${question.currentSituation}`,
              },
            },
          ]
        : []),
      ...(question.relatedLinks
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*関連リンク:*\n${question.relatedLinks}`,
              },
            },
          ]
        : []),
      ...(question.errorMessage
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*エラーメッセージ:*\n\`\`\`${question.errorMessage}\`\`\``,
              },
            },
          ]
        : []),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '対応開始',
            },
            style: 'primary',
            action_id: 'start_response',
            value: questionId,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '詳細確認',
            },
            action_id: 'check_details',
            value: questionId,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `質問ID: ${questionId} | 作成: <!date^${Math.floor(
              question.createdAt.toDate().getTime() / 1000
            )}^{date_short_pretty} {time}|${question.createdAt.toDate().toLocaleString()}>`,
          },
        ],
      },
    ],
  };
};

export const createStatusUpdateMessage = (
  question,
  questionId,
  mentor = null
) => {
  const statusEmoji = STATUS_EMOJI[question.status];
  let statusText = '';

  switch (question.status) {
    case 'waiting':
      statusText = '対応待ち';
      break;
    case 'in_progress':
      statusText = `対応中 (担当: <@${mentor}>)`;
      break;
    case 'paused':
      statusText = '中断中';
      break;
    case 'completed':
      statusText = '完了';
      break;
  }

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${statusEmoji} *ステータス更新*\n質問ID: ${questionId}\n新しいステータス: ${statusText}`,
        },
      },
    ],
  };
};

export const createThreadInviteMessage = (questionId, questionContent) => {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `質問の対応を開始しました。このスレッドで相談を進めます。\n\n*質問内容:*\n${questionContent}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '中断',
            },
            style: 'danger',
            action_id: 'pause_response',
            value: questionId,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '完了',
            },
            style: 'primary',
            action_id: 'complete_response',
            value: questionId,
          },
        ],
      },
    ],
  };
};
