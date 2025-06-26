/**
 * Slack API呼び出しのユーティリティ関数
 */
import { config } from '../config/index.js';
import { RetryUtils } from './retryUtils.js';

/**
 * 質問を指定チャンネルに投稿（マルチチャンネル対応）
 * @param {Object} client - Slackクライアント
 * @param {string} channelId - 投稿先チャンネルID
 * @param {Object} questionMessage - 質問メッセージオブジェクト
 * @param {string} mentionText - メンション文
 */
export const postQuestionToChannel = async (client, channelId, questionMessage, mentionText) => {
  return RetryUtils.retrySlackOperation(async () => {
    return await client.chat.postMessage({
      channel: channelId,
      text: `${mentionText}\n\n${questionMessage.text}`,
      blocks: questionMessage.blocks,
    });
  });
};

/**
 * 質問をメンターチャンネルに投稿（後方互換性のため残す）
 * @param {Object} client - Slackクライアント
 * @param {Object} questionMessage - 質問メッセージオブジェクト
 * @param {string} mentionText - メンション文
 */
export const postQuestionToMentorChannel = async (client, questionMessage, mentionText) => {
  return postQuestionToChannel(client, config.app.mentorChannelId, questionMessage, mentionText);
};

/**
 * ユーザーにDMで確認メッセージを送信
 * @param {Object} client - Slackクライアント
 * @param {string} userId - ユーザーID
 * @param {string} message - 送信メッセージ
 */
export const sendUserConfirmation = async (client, userId, message) => {
  return RetryUtils.retrySlackOperation(async () => {
    return await client.chat.postMessage({
      channel: userId,
      text: message,
    });
  });
};

/**
 * エフェメラルメッセージ（自分にのみ表示）を送信
 * @param {Object} client - Slackクライアント
 * @param {string} channelId - チャンネルID
 * @param {string} userId - ユーザーID
 * @param {string} text - メッセージテキスト
 * @param {Array} blocks - Slackブロック（オプション）
 */
export const sendEphemeralMessage = async (client, channelId, userId, text, blocks = null) => {
  return RetryUtils.retrySlackOperation(async () => {
    const payload = {
      channel: channelId,
      user: userId,
      text,
    };
    
    if (blocks) {
      payload.blocks = blocks;
    }
    
    return await client.chat.postEphemeral(payload);
  });
};

/**
 * モーダルを開く
 * @param {Object} client - Slackクライアント
 * @param {string} triggerId - トリガーID
 * @param {Object} view - モーダルビュー
 * @param {Object} metadata - プライベートメタデータ（オプション）
 */
export const openModal = async (client, triggerId, view, metadata = null) => {
  return RetryUtils.retrySlackOperation(async () => {
    const payload = {
      trigger_id: triggerId,
      view,
    };
    
    if (metadata) {
      payload.view.private_metadata = JSON.stringify(metadata);
    }
    
    return await client.views.open(payload);
  });
};

/**
 * メッセージを更新
 * @param {Object} client - Slackクライアント
 * @param {string} channelId - チャンネルID
 * @param {string} timestamp - メッセージタイムスタンプ
 * @param {string} text - 新しいテキスト
 * @param {Array} blocks - 新しいブロック（オプション）
 */
export const updateMessage = async (client, channelId, timestamp, text, blocks = null) => {
  return RetryUtils.retrySlackOperation(async () => {
    const payload = {
      channel: channelId,
      ts: timestamp,
      text,
    };
    
    if (blocks) {
      payload.blocks = blocks;
    }
    
    return await client.chat.update(payload);
  });
};

/**
 * メンターチャンネルに質問通知を送信
 * @param {Object} client - Slackクライアント
 * @param {Object} questionData - 質問データ
 * @param {string} questionId - 質問ID
 * @param {string} questionMessageTs - 元質問のタイムスタンプ
 * @param {string} mentionText - メンション文
 */
export const notifyMentorChannel = async (client, questionData, questionId, questionMessageTs, mentionText) => {
  try {
    const notificationBlocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔔 新しい質問 - ${questionData.category}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${mentionText}\n\n**チーム**: ${questionData.teamName}\n**チャンネル**: <#${questionData.sourceChannelId}>\n**緊急度**: ${questionData.urgency}\n**相談方法**: ${questionData.consultationType}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `**質問内容**:\n${questionData.content}`,
        },
      }
    ];

    // 任意項目を追加
    if (questionData.currentSituation) {
      notificationBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `**現在の状況**:\n${questionData.currentSituation}`,
        },
      });
    }

    if (questionData.relatedLinks) {
      notificationBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `**関連リンク**:\n${questionData.relatedLinks}`,
        },
      });
    }

    if (questionData.errorMessage) {
      notificationBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `**エラーメッセージ**:\n\`\`\`${questionData.errorMessage}\`\`\``,
        },
      });
    }

    // アクションボタンを追加
    notificationBlocks.push({
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
          value: JSON.stringify({
            questionId,
            sourceChannelId: questionData.sourceChannelId,
            messageTs: questionMessageTs
          }),
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '質問を見る',
          },
          url: `https://slack.com/app_redirect?channel=${questionData.sourceChannelId}&message_ts=${questionMessageTs}`,
          action_id: 'view_question'
        }
      ],
    });

    notificationBlocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `質問ID: ${questionId} | 投稿チャンネル: <#${questionData.sourceChannelId}>`,
        },
      ],
    });

    return await client.chat.postMessage({
      channel: config.app.mentorChannelId,
      text: `🔔 新しい質問: ${questionData.teamName} - ${questionData.category}`,
      blocks: notificationBlocks,
    });
  } catch (error) {
    console.error('Failed to notify mentor channel:', error);
    throw error;
  }
};