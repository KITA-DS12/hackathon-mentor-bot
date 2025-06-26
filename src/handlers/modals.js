import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { config } from '../config/index.js';
import { extractQuestionData } from '../utils/questionUtils.js';
import { generateMentionText } from '../utils/mentorUtils.js';
import {
  postQuestionToChannel,
  sendUserConfirmation,
  notifyMentorChannel,
} from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';

const firestoreService = new FirestoreService();

/**
 * 質問処理（同期的にFirestoreに保存してから投稿）
 */
const processQuestionSubmission = async (client, questionData) => {
  try {
    console.log(
      'Processing question submission for user:',
      questionData.userId
    );

    // 🚀 STEP 1: Firestoreに質問を保存
    console.log('Saving question to Firestore...');
    const questionId = await firestoreService.createQuestion(questionData);
    console.log('✅ Question saved to Firestore with ID:', questionId);

    // 🚀 STEP 2: Slackに投稿
    console.log('Creating question message...');
    const questionMessage = createQuestionMessage(questionData, questionId);

    console.log('Generating mention text for category:', questionData.category);
    const mentionText = await generateMentionText(questionData.category);

    console.log('Posting question to source channel...');
    const targetChannelId =
      questionData.sourceChannelId || config.app.mentorChannelId;
    console.log('Debug: sourceChannelId =', questionData.sourceChannelId);
    console.log('Debug: mentorChannelId =', config.app.mentorChannelId);
    console.log('Debug: targetChannelId =', targetChannelId);

    let questionResult;
    let finalTargetChannelId = targetChannelId;

    try {
      questionResult = await postQuestionToChannel(
        client,
        targetChannelId,
        questionMessage,
        mentionText
      );
      console.log(
        '✅ Question posted to channel successfully with ID:',
        questionId,
        'in channel:',
        targetChannelId
      );
    } catch (error) {
      if (
        error.data?.error === 'channel_not_found' &&
        targetChannelId !== config.app.mentorChannelId
      ) {
        console.log(
          '❌ Failed to post to source channel, falling back to mentor channel...'
        );
        finalTargetChannelId = config.app.mentorChannelId;
        questionResult = await postQuestionToChannel(
          client,
          finalTargetChannelId,
          questionMessage,
          mentionText
        );
        console.log(
          '✅ Question posted to mentor channel as fallback with ID:',
          questionId
        );
      } else {
        throw error;
      }
    }

    // Firestoreの質問データにメッセージタイムスタンプを更新
    await firestoreService.updateQuestion(questionId, {
      messageTs: questionResult.ts,
    });

    // メンターチャンネルに投稿していない場合のみ通知を送信
    if (finalTargetChannelId !== config.app.mentorChannelId) {
      console.log('Sending notification to mentor channel...');
      await notifyMentorChannel(
        client,
        questionData,
        questionId,
        questionResult.ts,
        mentionText
      );
      console.log('✅ Mentor channel notification sent');
    } else {
      console.log(
        '✅ Question already posted to mentor channel, skipping duplicate notification'
      );
    }

    // 質問者にDMで確認
    console.log('Sending confirmation to user...');
    await sendUserConfirmation(
      client,
      questionData.userId,
      '質問を送信しました。メンターからの返答をお待ちください。'
    );
    console.log('Confirmation sent to user');

    return questionId;
  } catch (error) {
    console.error('Error in processQuestionSubmission:', error);
    throw error;
  }
};

export const handleQuestionModalSubmission = withErrorHandling(
  async ({ ack, body, client }) => {
    // モーダルからチャンネル情報を取得
    const metadata = body.view.private_metadata
      ? JSON.parse(body.view.private_metadata)
      : {};
    const sourceChannelId = metadata.sourceChannelId;

    console.log('Debug: Modal metadata =', metadata);
    console.log('Debug: Extracted sourceChannelId =', sourceChannelId);

    const questionData = extractQuestionData(
      body.view.state.values,
      body.user.id,
      sourceChannelId
    );

    // 質問処理
    try {
      // モーダルを閉じて処理開始
      await ack();

      console.log('Processing question submission for user:', body.user.id);
      await processQuestionSubmission(client, questionData);
      console.log('Question submission processed successfully');
    } catch (error) {
      console.error('Error processing question submission:', error);
      // エラーが発生した場合はユーザーに通知
      try {
        await client.chat.postMessage({
          channel: body.user.id,
          text: '❌ 質問の処理中にエラーが発生しました。もう一度お試しください。',
        });
      } catch (dmError) {
        console.error('Error sending error message to user:', dmError);
      }
    }
  },
  { client: null, userId: null }, // contextは実行時に設定
  ERROR_MESSAGES.QUESTION_SUBMISSION
);
