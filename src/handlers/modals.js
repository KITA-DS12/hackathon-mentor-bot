import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { createReservationModal } from '../utils/modal.js';
import { generateTempId } from '../utils/index.js';
import { CONSULTATION_TYPES } from '../config/constants.js';
import { config } from '../config/index.js';
import { extractQuestionData, extractReservationData, isReservationConsultation } from '../utils/questionUtils.js';
import { generateMentionText } from '../utils/mentorUtils.js';
import { postQuestionToChannel, sendUserConfirmation, openModal } from '../utils/slackUtils.js';
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

    // 🚀 STEP 1: 一時IDでSlackに即座投稿
    console.log('Generating temporary ID for immediate Slack posting...');
    const tempId = generateTempId();
    
    console.log('Creating question message with temp ID...');
    const questionMessage = createQuestionMessage(questionData, tempId);
    
    console.log('Generating mention text for category:', questionData.category);
    const mentionText = await generateMentionText(questionData.category);
    
    console.log('Posting question to source channel immediately...');
    const targetChannelId = questionData.sourceChannelId || config.app.mentorChannelId; // フォールバック
    await postQuestionToChannel(client, targetChannelId, questionMessage, mentionText);
    console.log('✅ Question posted to channel successfully with temp ID:', tempId, 'in channel:', targetChannelId);
    
    // 質問者にDMで確認
    console.log('Sending confirmation to user...');
    await sendUserConfirmation(
      client, 
      questionData.userId, 
      '質問を送信しました。メンターからの返答をお待ちください。'
    );
    console.log('Confirmation sent to user');
    
    // 🚀 STEP 2: 背景でFirestore処理（非同期）
    processFirestoreInBackground(questionData, tempId, client).catch(error => {
      console.error('Background Firestore processing failed:', error);
      // 失敗時は質問者にDM通知
      sendUserConfirmation(
        client,
        questionData.userId,
        '⚠️ 質問の記録処理で問題が発生しましたが、メンターへの通知は完了しています。'
      ).catch(dmError => {
        console.error('Failed to send error notification:', dmError);
      });
    });
    
    return tempId; // 一時IDを返す
  } catch (error) {
    console.error('Error in processImmediateConsultation:', error);
    throw error;
  }
};

// 背景Firestore処理
const processFirestoreInBackground = async (questionData, tempId, client) => {
  console.log('Starting background Firestore processing...');
  
  try {
    // Firestoreに質問を保存
    console.log('Creating question in Firestore...');
    const realQuestionId = await firestoreService.createQuestion(questionData);
    console.log('✅ Question created in Firestore with real ID:', realQuestionId);
    
    // 一時IDから実IDへのマッピングを記録（オプション）
    console.log('Mapping temp ID to real ID:', tempId, '->', realQuestionId);
    
    // フォローアップを開始
    console.log('Scheduling follow-up...');
    await scheduleFollowUp(realQuestionId, questionData.userId);
    console.log('✅ Follow-up scheduled');
    
    console.log('✅ Background Firestore processing completed successfully');
    return realQuestionId;
    
  } catch (error) {
    console.error('❌ Background Firestore processing failed:', error);
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
    // モーダルからチャンネル情報を取得
    const metadata = body.view.private_metadata ? JSON.parse(body.view.private_metadata) : {};
    const sourceChannelId = metadata.sourceChannelId;
    
    const questionData = extractQuestionData(body.view.state.values, body.user.id, sourceChannelId);
    
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

