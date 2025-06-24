/**
 * メンター関連のユーティリティ関数
 */
import { FirestoreService } from '../services/firestore.js';

const firestoreService = new FirestoreService();

/**
 * メンターのメンション文字列を生成
 * @param {Array} mentors - メンターリスト
 * @returns {string} メンション文字列
 */
export const createMentionString = (mentors) => {
  return mentors
    .map(mentor => `<@${mentor.userId}>`)
    .join(' ');
};

/**
 * カテゴリに基づいてメンション文を生成
 * @param {string} category - 質問カテゴリ
 * @returns {Promise<string>} メンション文
 */
export const generateMentionText = async (category) => {
  try {
    // 全メンターを取得
    const allMentors = await firestoreService.getAllMentors();
    
    if (allMentors.length > 0) {
      const mentions = createMentionString(allMentors);
      return `🔔 *${category}* の質問です\n${mentions}`;
    }
    
    return '🔔 新しい質問が投稿されました（登録メンターなし）';
  } catch (error) {
    console.error('Error generating mention text:', error);
    return '🔔 新しい質問が投稿されました';
  }
};

/**
 * メンター登録データを抽出
 * @param {Object} values - モーダルの入力値
 * @param {string} userId - ユーザーID
 * @param {string} userName - ユーザー名
 * @returns {Object} メンター登録データ
 */
export const extractMentorData = (values, userId, userName) => {
  return {
    userId,
    userName,
    name: values.mentor_name.name.value,
    bio: values.mentor_bio?.bio?.value || '',
    availability: values.initial_availability.availability.selected_option.value,
    registeredAt: new Date(),
    updatedAt: new Date(),
  };
};