/**
 * Slack API呼び出しのユーティリティ関数
 */
import { config } from '../config/index.js';

/**
 * 質問をメンターチャンネルに投稿
 * @param {Object} client - Slackクライアント
 * @param {Object} questionMessage - 質問メッセージオブジェクト
 * @param {string} mentionText - メンション文
 */
export const postQuestionToMentorChannel = async (client, questionMessage, mentionText) => {
  return await client.chat.postMessage({
    channel: config.app.mentorChannelId,
    text: `${mentionText}\n\n${questionMessage.text}`,
    blocks: questionMessage.blocks,
  });
};

/**
 * ユーザーにDMで確認メッセージを送信
 * @param {Object} client - Slackクライアント
 * @param {string} userId - ユーザーID
 * @param {string} message - 送信メッセージ
 */
export const sendUserConfirmation = async (client, userId, message) => {
  return await client.chat.postMessage({
    channel: userId,
    text: message,
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
  const payload = {
    channel: channelId,
    user: userId,
    text,
  };
  
  if (blocks) {
    payload.blocks = blocks;
  }
  
  return await client.chat.postEphemeral(payload);
};

/**
 * モーダルを開く
 * @param {Object} client - Slackクライアント
 * @param {string} triggerId - トリガーID
 * @param {Object} view - モーダルビュー
 * @param {Object} metadata - プライベートメタデータ（オプション）
 */
export const openModal = async (client, triggerId, view, metadata = null) => {
  const payload = {
    trigger_id: triggerId,
    view,
  };
  
  if (metadata) {
    payload.view.private_metadata = JSON.stringify(metadata);
  }
  
  return await client.views.open(payload);
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
  const payload = {
    channel: channelId,
    ts: timestamp,
    text,
  };
  
  if (blocks) {
    payload.blocks = blocks;
  }
  
  return await client.chat.update(payload);
};