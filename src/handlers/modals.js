import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { createReservationModal } from '../utils/modal.js';
import { CONSULTATION_TYPES } from '../config/constants.js';
import { extractQuestionData, extractReservationData, isReservationConsultation } from '../utils/questionUtils.js';
import { generateMentionText } from '../utils/mentorUtils.js';
import { postQuestionToMentorChannel, sendUserConfirmation, openModal } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';
import { HealthCheckService } from '../utils/healthCheck.js';

const firestoreService = new FirestoreService();
const healthCheckService = new HealthCheckService();

/**
 * 予約相談モーダルを表示
 */
const showReservationModal = async (client, triggerId, questionData) => {
  return await openModal(client, triggerId, createReservationModal(), questionData);
};

/**
 * 即座相談の処理
 */
const processImmediateConsultation = async (client, questionData) => {
  // アプリの応答確認（ウォームアップ）
  console.log('Performing health check before processing question...');
  const healthCheckResult = await healthCheckService.checkAndWarmup(2);
  
  if (!healthCheckResult) {
    console.warn('Health check failed, but proceeding with question processing...');
  }

  const questionId = await firestoreService.createQuestion(questionData);
  
  // メンターチャンネルに質問を投稿
  const questionMessage = createQuestionMessage(questionData, questionId);
  const mentionText = await generateMentionText(questionData.category);
  
  await postQuestionToMentorChannel(client, questionMessage, mentionText);
  
  // 質問者にDMで確認
  await sendUserConfirmation(
    client, 
    questionData.userId, 
    '質問を送信しました。メンターからの返答をお待ちください。'
  );
  
  // フォローアップを開始
  await scheduleFollowUp(questionId, questionData.userId);
  
  return questionId;
};

/**
 * フォローアップのスケジューリング
 */
const scheduleFollowUp = async (questionId, userId) => {
  try {
    const { getFollowUpService } = await import('./followup.js');
    const followUpService = getFollowUpService();
    
    if (followUpService) {
      followUpService.scheduleFollowUp(questionId, userId);
    }
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
  }
};

export const handleQuestionModalSubmission = withErrorHandling(
  async ({ ack, body, client }) => {
    // モーダルを閉じる
    await ack();
    
    const questionData = extractQuestionData(body.view.state.values, body.user.id);
    
    if (isReservationConsultation(questionData)) {
      await showReservationModal(client, body.trigger_id, questionData);
      return;
    }
    
    // 質問者にDMで処理中メッセージを送信
    try {
      await client.chat.postMessage({
        channel: body.user.id,
        text: '✅ 質問を処理しています...'
      });
    } catch (error) {
      console.error('Error sending processing message:', error);
    }
    
    // 非同期で質問処理を実行
    processImmediateConsultation(client, questionData).catch(error => {
      console.error('Error in async question processing:', error);
    });
  },
  { client: null, userId: null }, // contextは実行時に設定
  ERROR_MESSAGES.QUESTION_SUBMISSION
);

/**
 * 予約スケジューリング
 */
const scheduleReservation = async (questionId, questionData) => {
  try {
    const { getSchedulerService } = await import('./reservation.js');
    const schedulerService = getSchedulerService();
    
    if (schedulerService) {
      schedulerService.scheduleQuestion(questionId, questionData);
    }
  } catch (error) {
    console.error('Error scheduling reservation:', error);
  }
};

export const handleReservationModalSubmission = withErrorHandling(
  async ({ ack, body, client }) => {
    // モーダルを閉じる
    await ack();
    
    const questionData = JSON.parse(body.view.private_metadata);
    const updatedQuestionData = extractReservationData(body.view.state.values, questionData);
    
    // 処理中メッセージを送信
    try {
      await client.chat.postMessage({
        channel: body.user.id,
        text: '✅ 予約相談を処理しています...'
      });
    } catch (error) {
      console.error('Error sending processing message:', error);
    }
    
    // 非同期で予約処理を実行
    processReservation(client, updatedQuestionData, body.user.id).catch(error => {
      console.error('Error in async reservation processing:', error);
    });
  },
  { client: null, userId: null },
  ERROR_MESSAGES.RESERVATION_PROCESSING
);

// 予約処理を非同期化
const processReservation = async (client, updatedQuestionData, userId) => {
  try {
    const questionId = await firestoreService.createQuestion(updatedQuestionData);
    
    await scheduleReservation(questionId, updatedQuestionData);
    
    const confirmationMessage = `予約相談を受け付けました。${updatedQuestionData.reservationTime}に${
      updatedQuestionData.autoResolveCheck ? '自動確認後、' : ''
    }メンターに質問を送信します。`;
    
    await sendUserConfirmation(client, userId, confirmationMessage);
  } catch (error) {
    console.error('Error processing reservation:', error);
    await sendUserConfirmation(client, userId, '予約相談の処理中にエラーが発生しました。');
  }
};

