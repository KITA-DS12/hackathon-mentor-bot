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
 * 複数のメンターにDMで質問通知を送信
 * @param {Object} client - Slackクライアント
 * @param {Array} mentorIds - メンターIDの配列
 * @param {Object} questionData - 質問データ
 * @param {string} questionId - 質問ID
 */
export const notifyMentorsDirectly = async (client, mentorIds, questionData, questionId) => {
  const promises = mentorIds.map(async (mentorId) => {
    try {
      const notificationText = `
🔔 **新しい質問が投稿されました**

**チーム**: ${questionData.teamName}
**カテゴリ**: ${questionData.category}
**緊急度**: ${questionData.urgency}
**質問内容**: ${questionData.content.substring(0, 100)}...

**チャンネル**: <#${questionData.sourceChannelId}>
**質問ID**: ${questionId}

詳細は該当チャンネルでご確認ください。`;

      return await sendUserConfirmation(client, mentorId, notificationText);
    } catch (error) {
      console.error(`Failed to notify mentor ${mentorId}:`, error);
      return null;
    }
  });

  const results = await Promise.allSettled(promises);
  const succeeded = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;
  
  console.log(`Mentor notifications: ${succeeded} succeeded, ${failed} failed`);
  return { succeeded, failed };
};