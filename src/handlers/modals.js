import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { generateTempId } from '../utils/index.js';
import { config } from '../config/index.js';
import { extractQuestionData } from '../utils/questionUtils.js';
import { generateMentionText } from '../utils/mentorUtils.js';
import { postQuestionToChannel, sendUserConfirmation, notifyMentorChannel } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';
import { HealthCheckService } from '../utils/healthCheck.js';

const firestoreService = new FirestoreService();
const healthCheckService = new HealthCheckService();


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
    
    console.log('Posting question to source channel...');
    // 元のチャンネルに投稿し、エラー時はメンターチャンネルにフォールバック
    const targetChannelId = questionData.sourceChannelId || config.app.mentorChannelId;
    console.log('Debug: sourceChannelId =', questionData.sourceChannelId);
    console.log('Debug: mentorChannelId =', config.app.mentorChannelId);
    console.log('Debug: targetChannelId =', targetChannelId);
    
    let questionResult;
    let finalTargetChannelId = targetChannelId;
    
    try {
      questionResult = await postQuestionToChannel(client, targetChannelId, questionMessage, mentionText);
      console.log('✅ Question posted to channel successfully with temp ID:', tempId, 'in channel:', targetChannelId);
    } catch (error) {
      if (error.data?.error === 'channel_not_found' && targetChannelId !== config.app.mentorChannelId) {
        console.log('❌ Failed to post to source channel, falling back to mentor channel...');
        finalTargetChannelId = config.app.mentorChannelId;
        questionResult = await postQuestionToChannel(client, finalTargetChannelId, questionMessage, mentionText);
        console.log('✅ Question posted to mentor channel as fallback with temp ID:', tempId);
      } else {
        throw error; // 他のエラーは再スロー
      }
    }
    
    // メンターチャンネルに投稿していない場合のみ通知を送信
    if (finalTargetChannelId !== config.app.mentorChannelId) {
      console.log('Sending notification to mentor channel...');
      await notifyMentorChannel(client, questionData, tempId, questionResult.ts, mentionText);
      console.log('✅ Mentor channel notification sent');
    } else {
      console.log('✅ Question already posted to mentor channel, skipping duplicate notification');
    }
    
    // 質問者にDMで確認
    console.log('Sending confirmation to user...');
    await sendUserConfirmation(
      client, 
      questionData.userId, 
      '質問を送信しました。メンターからの返答をお待ちください。'
    );
    console.log('Confirmation sent to user');
    
    // 🚀 STEP 2: 背景でFirestore処理（非同期）
    processFirestoreInBackground(questionData, tempId, questionResult.ts, client).catch(error => {
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
const processFirestoreInBackground = async (questionData, tempId, questionMessageTs, client) => {
  console.log('Starting background Firestore processing...');
  
  try {
    // Firestoreに質問を保存（タイムスタンプを追加）
    console.log('Creating question in Firestore...');
    const questionDataWithTs = {
      ...questionData,
      messageTs: questionMessageTs, // 元質問のタイムスタンプを追加
    };
    const realQuestionId = await firestoreService.createQuestion(questionDataWithTs);
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
    
    console.log('Debug: Modal metadata =', metadata);
    console.log('Debug: Extracted sourceChannelId =', sourceChannelId);
    
    const questionData = extractQuestionData(body.view.state.values, body.user.id, sourceChannelId);
    
    // 即座相談として処理
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


