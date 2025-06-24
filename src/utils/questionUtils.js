/**
 * 質問関連のユーティリティ関数
 */
import { QUESTION_STATUS, CONSULTATION_TYPES, DEFAULT_VALUES } from '../config/constants.js';

/**
 * モーダルから質問データを抽出・変換
 * @param {Object} values - モーダルの入力値
 * @param {string} userId - ユーザーID
 * @returns {Object} 質問データ
 */
export const extractQuestionData = (values, userId) => {
  const now = new Date();
  return {
    userId,
    teamName: values.team_name.team_name.value,
    content: values.question_content.content.value,
    category: values.category?.category?.selected_option?.value || DEFAULT_VALUES.CATEGORY,
    urgency: values.urgency?.urgency?.selected_option?.value || DEFAULT_VALUES.URGENCY,
    consultationType: values.consultation_type?.consultation_type?.selected_option?.value || DEFAULT_VALUES.CONSULTATION_TYPE,
    currentSituation: values.current_situation?.current_situation?.value || '',
    relatedLinks: values.related_links?.related_links?.value || '',
    errorMessage: values.error_message?.error_message?.value || '',
    status: QUESTION_STATUS.WAITING,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        status: QUESTION_STATUS.WAITING,
        timestamp: now,
        user: userId,
      },
    ],
  };
};

/**
 * 予約データを抽出・統合
 * @param {Object} values - 予約モーダルの入力値
 * @param {Object} questionData - 既存の質問データ
 * @returns {Object} 更新された質問データ
 */
export const extractReservationData = (values, questionData) => {
  const reservationTime = values.reservation_time.reservation_time.selected_option.value;
  const autoResolveCheck = values.auto_resolve_check?.auto_resolve_check?.selected_options?.length > 0;

  return {
    ...questionData,
    reservationTime,
    autoResolveCheck,
  };
};

/**
 * 質問タイプが予約相談かどうかチェック
 * @param {Object} questionData - 質問データ
 * @returns {boolean} 予約相談の場合true
 */
export const isReservationConsultation = (questionData) => {
  return questionData.consultationType === CONSULTATION_TYPES.RESERVATION;
};