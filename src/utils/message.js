import { STATUS_EMOJI } from '../config/constants.js';
import { config } from '../config/index.js';

/**
 * タイムスタンプを安全にフォーマットする
 * @param {Date|Object|undefined} timestamp - Dateオブジェクト、Firestore Timestamp、またはundefined
 * @returns {string} フォーマットされたタイムスタンプ文字列
 */
export const formatTimestamp = (timestamp) => {
  try {
    let date;
    
    if (!timestamp) {
      date = new Date(); // createdAtがない場合は現在時刻を使用
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate(); // Firestore Timestamp
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000); // Firestore Timestampの生データ
    } else {
      date = new Date(timestamp); // 文字列やミリ秒を試す
    }
    
    const unixTimestamp = Math.floor(date.getTime() / 1000);
    return `<!date^${unixTimestamp}^{date_short_pretty} {time}|${date.toLocaleString()}>`;
  } catch (error) {
    console.error('Error formatting timestamp:', error, 'Input:', timestamp);
    return new Date().toLocaleString(); // フォールバック
  }
};

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
          text: `*チーム:* ${question.teamName}\n*質問者:* <@${question.userId}>\n*緊急度:* ${question.urgency}\n*相談方法:* ${question.consultationType}`,
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
        elements: (() => {
          const baseButtons = [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '詳細確認',
              },
              action_id: 'check_details',
              value: questionId,
            },
          ];

          // 状態に応じてボタンを追加
          if (question.status === 'waiting') {
            baseButtons.unshift({
              type: 'button',
              text: {
                type: 'plain_text',
                text: '対応開始',
              },
              style: 'primary',
              action_id: 'start_response',
              value: questionId,
            });
          } else if (question.status === 'paused') {
            baseButtons.unshift({
              type: 'button',
              text: {
                type: 'plain_text',
                text: '対応再開',
              },
              style: 'primary',
              action_id: 'resume_response',
              value: questionId,
            });
            baseButtons.push({
              type: 'button',
              text: {
                type: 'plain_text',
                text: '担当解除',
              },
              style: 'danger',
              action_id: 'release_assignment',
              value: questionId,
            });
          } else if (question.status === 'in_progress') {
            baseButtons.push({
              type: 'button',
              text: {
                type: 'plain_text',
                text: '担当解除',
              },
              style: 'danger',
              action_id: 'release_assignment',
              value: questionId,
            });
          }

          return baseButtons;
        })(),
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `質問ID: ${questionId} | 作成: ${formatTimestamp(question.createdAt)}${question.threadTs ? ` | <https://slack.com/app_redirect?channel=${config.app.mentorChannelId}&message_ts=${question.threadTs}|スレッドリンク>` : ''}`,
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
      // 複数メンター対応
      if (question.assignedMentors && question.assignedMentors.length > 0) {
        const mentorMentions = question.assignedMentors.map(id => `<@${id}>`).join(', ');
        statusText = `対応中 (担当: ${mentorMentions})`;
      } else {
        statusText = `対応中 (担当: <@${mentor}>)`;
      }
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
          text: `${statusEmoji} *ステータス更新*\n質問ID: ${questionId}\n新しいステータス: ${statusText}${question.threadTs ? `\n<https://slack.com/app_redirect?channel=${config.app.mentorChannelId}&message_ts=${question.threadTs}|スレッドリンク>` : ''}`,
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

export const createThreadStatusMessage = (questionId, status) => {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*対応状況が更新されました*`,
      },
    }
  ];

  // 状態に応じてボタンを追加
  if (status === 'paused') {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '対応再開',
          },
          style: 'primary',
          action_id: 'resume_response',
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
    });
  } else if (status === 'in_progress') {
    blocks.push({
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
    });
  }

  return { blocks };
};
