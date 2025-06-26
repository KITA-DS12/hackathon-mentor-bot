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
  const startTime = Date.now();
  const processId = Math.random().toString(36).substring(7); // プロセス追跡ID
  
  try {
    console.log(
      `[${Date.now()}] [${processId}] Starting question submission for user:`,
      questionData.userId
    );

    // 🚀 STEP 1: まずSlackに投稿（ユーザー体験を優先）
    console.log(`[${Date.now()}] Creating message for immediate posting...`);
    const tempQuestionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 🚀 STEP 2: 並列でメッセージ作成とメンション生成
    console.log(`[${Date.now()}] Creating message and generating mentions in parallel...`);
    const [questionMessage, mentionText] = await Promise.all([
      Promise.resolve(createQuestionMessage(questionData, tempQuestionId)),
      generateMentionText(questionData.category)
    ]);

    console.log(`[${Date.now()}] Posting question to source channel...`);
    const targetChannelId =
      questionData.sourceChannelId || config.app.mentorChannelId;
    console.log(`[${Date.now()}] Target channel: ${targetChannelId}`);

    let questionResult;
    let finalTargetChannelId = targetChannelId;

    try {
      const postStart = Date.now();
      questionResult = await postQuestionToChannel(
        client,
        targetChannelId,
        questionMessage,
        mentionText
      );
      console.log(
        `[${Date.now()}] ✅ Question posted to channel successfully (${Date.now() - postStart}ms) - ID: ${questionId}, Channel: ${targetChannelId}`
      );
    } catch (error) {
      if (
        error.data?.error === 'channel_not_found' &&
        targetChannelId !== config.app.mentorChannelId
      ) {
        console.log(`[${Date.now()}] ❌ Failed to post to source channel, falling back to mentor channel...`);
        finalTargetChannelId = config.app.mentorChannelId;
        const fallbackStart = Date.now();
        questionResult = await postQuestionToChannel(
          client,
          finalTargetChannelId,
          questionMessage,
          mentionText
        );
        console.log(
          `[${Date.now()}] ✅ Question posted to mentor channel as fallback (${Date.now() - fallbackStart}ms) - ID: ${questionId}`
        );
      } else {
        throw error;
      }
    }

    // 🚀 STEP 3: Slackに投稿後、Firestoreに保存
    console.log(`[${Date.now()}] Saving question to Firestore after successful posting...`);
    let questionId;
    try {
      questionId = await firestoreService.createQuestion({
        ...questionData,
        messageTs: questionResult.ts,
      });
      console.log(`[${Date.now()}] ✅ Question saved to Firestore with ID: ${questionId}`);
    } catch (firestoreError) {
      console.error(`[${Date.now()}] ❌ Firestore save failed:`, firestoreError);
      // Firestoreエラーでも処理を続行（Slackへの投稿は成功しているため）
      questionId = tempQuestionId;
    }

    // 並列処理で高速化
    const parallelTasks = [];

    // メンターチャンネルに投稿していない場合のみ通知を送信
    if (finalTargetChannelId !== config.app.mentorChannelId) {
      console.log(`[${Date.now()}] Sending notification to mentor channel...`);
      parallelTasks.push(
        notifyMentorChannel(
          client,
          questionData,
          questionId,
          questionResult.ts,
          mentionText
        )
      );
    }

    // 質問者にDMで確認
    console.log(`[${Date.now()}] Sending confirmation to user...`);
    parallelTasks.push(
      sendUserConfirmation(
        client,
        questionData.userId,
        '質問を送信しました。メンターからの返答をお待ちください。'
      )
    );

    // 並列実行
    const parallelStart = Date.now();
    await Promise.all(parallelTasks);
    console.log(`[${Date.now()}] ✅ All parallel tasks completed (${Date.now() - parallelStart}ms)`);

    console.log(`[${Date.now()}] 🎉 Question submission completed successfully! Total time: ${Date.now() - startTime}ms`);
    return questionId;
  } catch (error) {
    console.error(`[${Date.now()}] Error in processQuestionSubmission (after ${Date.now() - startTime}ms):`, error);
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

    // すぐにモーダルを閉じる（3秒以内にレスポンスが必要）
    await ack();

    // 重い処理は非同期で実行（Promise.resolveで次のイベントループへ）
    Promise.resolve().then(async () => {
      try {
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
    });
  },
  { client: null, userId: null }, // contextは実行時に設定
  ERROR_MESSAGES.QUESTION_SUBMISSION
);
