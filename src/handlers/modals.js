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
  try {
    // アプリの応答確認（ウォームアップ）
    console.log('Performing health check before processing question...');
    const healthCheckResult = await healthCheckService.checkAndWarmup(2);
    
    if (!healthCheckResult) {
      console.warn('Health check failed, but proceeding with question processing...');
    }

    console.log('Creating question in Firestore...');
    const questionId = await firestoreService.createQuestion(questionData);
    console.log('Question created with ID:', questionId);
    
    // メンターチャンネルに質問を投稿
    console.log('Creating question message...');
    const questionMessage = createQuestionMessage(questionData, questionId);
    
    console.log('Generating mention text for category:', questionData.category);
    const mentionText = await generateMentionText(questionData.category);
    
    console.log('Posting question to mentor channel...');
    await postQuestionToMentorChannel(client, questionMessage, mentionText);
    console.log('Question posted to mentor channel successfully');
    
    // 質問者にDMで確認
    console.log('Sending confirmation to user...');
    await sendUserConfirmation(
      client, 
      questionData.userId, 
      '質問を送信しました。メンターからの返答をお待ちください。'
    );
    console.log('Confirmation sent to user');
    
    // フォローアップを開始
    console.log('Scheduling follow-up...');
    await scheduleFollowUp(questionId, questionData.userId);
    console.log('Follow-up scheduled');
    
    return questionId;
  } catch (error) {
    console.error('Error in processImmediateConsultation:', error);
    throw error;
  }
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
    const questionData = extractQuestionData(body.view.state.values, body.user.id);
    
    if (isReservationConsultation(questionData)) {
      await ack();
      await showReservationModal(client, body.trigger_id, questionData);
      return;
    }
    
    // 即座相談の場合は同期的に処理
    try {
      // モーダルを閉じて処理開始
      await ack();
      
      console.log('Processing immediate consultation for user:', body.user.id);
      await processImmediateConsultation(client, questionData);
      console.log('Immediate consultation processed successfully');
      
    } catch (error) {
      console.error('Error processing immediate consultation:', error);
      // エラーが発生した場合はユーザーに通知
      try {
        await client.chat.postMessage({
          channel: body.user.id,
          text: '❌ 質問の処理中にエラーが発生しました。もう一度お試しください。'
        });
      } catch (dmError) {
        console.error('Error sending error message to user:', dmError);
      }
    }
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
    const questionData = JSON.parse(body.view.private_metadata);
    const updatedQuestionData = extractReservationData(body.view.state.values, questionData);
    
    try {
      // モーダルを閉じて処理開始
      await ack();
      
      console.log('Processing reservation for user:', body.user.id);
      
      const questionId = await firestoreService.createQuestion(updatedQuestionData);
      await scheduleReservation(questionId, updatedQuestionData);
      
      const confirmationMessage = `予約相談を受け付けました。${updatedQuestionData.reservationTime}に${
        updatedQuestionData.autoResolveCheck ? '自動確認後、' : ''
      }メンターに質問を送信します。`;
      
      await sendUserConfirmation(client, body.user.id, confirmationMessage);
      console.log('Reservation processed successfully');
      
    } catch (error) {
      console.error('Error processing reservation:', error);
      try {
        await client.chat.postMessage({
          channel: body.user.id,
          text: '❌ 予約相談の処理中にエラーが発生しました。もう一度お試しください。'
        });
      } catch (dmError) {
        console.error('Error sending error message to user:', dmError);
      }
    }
  },
  { client: null, userId: null },
  ERROR_MESSAGES.RESERVATION_PROCESSING
);

