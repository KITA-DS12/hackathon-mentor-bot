import { createQuestionModal, createMentorRegistrationModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { createQuestionTypeSelectionModal } from '../utils/questionType.js';
import { createStatusModal, formatMentorStatus } from '../utils/schedule.js';
import { FirestoreService } from '../services/firestore.js';
import { sendEphemeralMessage, openModal } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';
import { createQuestionMessage } from '../utils/message.js';

const firestoreService = new FirestoreService();

export const handleMentorHelpCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();
    
    // 質問方法選択モーダルを表示
    await openModal(client, body.trigger_id, createQuestionTypeSelectionModal());
  },
  (args) => ({ client: args[0].client, userId: args[0].body.user_id, channelId: args[0].body.channel_id }),
  ERROR_MESSAGES.QUESTION_TYPE_SELECTION
);

export const handleMentorStatusCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();
    
    const mentor = await firestoreService.getMentor(body.user_id);
    
    if (!mentor) {
      await sendEphemeralMessage(
        client, 
        body.channel_id, 
        body.user_id, 
        '❌ メンターとして登録されていません。\n`/mentor-register` でメンター登録を行ってください。'
      );
      return;
    }

    await openModal(client, body.trigger_id, createStatusModal());
  },
  { client: null, userId: null, channelId: null },
  ERROR_MESSAGES.STATUS_UPDATE
);

export const handleMentorScheduleCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createScheduleModal(),
    });
  } catch (error) {
    console.error('Error opening schedule modal:', error);
    await client.chat.postMessage({
      channel: body.channel_id,
      text: 'スケジュール設定モーダルの表示中にエラーが発生しました。',
    });
  }
};

export const handleMentorRegisterCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createMentorRegistrationModal(),
    });
  } catch (error) {
    console.error('Error opening mentor registration modal:', error);
    await client.chat.postMessage({
      channel: body.channel_id,
      text: 'メンター登録モーダルの表示中にエラーが発生しました。',
    });
  }
};

const formatMentorList = (mentors) => {
  if (mentors.length === 0) {
    return '現在登録されているメンターはいません。\n`/mentor-register` でメンター登録してください。';
  }

  const mentorList = mentors
    .map((mentor) => {
      const statusEmoji = mentor.availability === 'available' ? '🟢' : 
                         mentor.availability === 'busy' ? '🟡' : '🔴';
      
      return `${statusEmoji} <@${mentor.userId}> - ${mentor.name}`;
    })
    .join('\n');

  return `📋 **登録メンター一覧** (${mentors.length}名)\n\n${mentorList}`;
};

export const handleMentorListCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();
    
    const mentors = await firestoreService.getAllMentors();
    const message = formatMentorList(mentors);
    
    await sendEphemeralMessage(client, body.channel_id, body.user_id, message);
  },
  { client: null, userId: null, channelId: null },
  ERROR_MESSAGES.MENTOR_LIST_FETCH
);

export const handleMentorQuestionsCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();
    
    console.log('mentor-questions command executed by:', body.user_id);
    
    const waitingQuestions = await firestoreService.getQuestionsByStatus('waiting');
    const pausedQuestions = await firestoreService.getQuestionsByStatus('paused');
    const inProgressQuestions = await firestoreService.getQuestionsByStatus('in_progress');
    const allMentors = await firestoreService.getAllMentors();
    
    console.log('Questions found:', {
      waiting: waitingQuestions.length,
      paused: pausedQuestions.length,
      inProgress: inProgressQuestions.length,
      mentors: allMentors.length
    });
    
    if (waitingQuestions.length === 0 && pausedQuestions.length === 0 && inProgressQuestions.length === 0) {
      await sendEphemeralMessage(
        client, 
        body.channel_id, 
        body.user_id, 
        '📋 現在対応可能な質問はありません。'
      );
      return;
    }

    // メンターIDのセットを作成（担当者不在チェック用）
    const mentorIds = new Set(allMentors.map(m => m.userId));
    
    // 現在時刻を取得（長期未完了チェック用）
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 担当者不在・長期未完了の質問をチェック（複数メンター対応）
    const problemQuestions = [...pausedQuestions, ...inProgressQuestions].filter(q => {
      // 担当メンターが存在しない、または全員が登録済みメンターでない
      const hasInvalidMentors = q.assignedMentors && q.assignedMentors.length > 0 
        ? q.assignedMentors.some(mentorId => !mentorIds.has(mentorId))
        : false;
      const isOld = q.createdAt && new Date(q.createdAt.seconds ? q.createdAt.seconds * 1000 : q.createdAt) < oneDayAgo;
      return hasInvalidMentors || isOld;
    });

    // 問題のある質問があれば警告表示
    if (problemQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        body.channel_id,
        body.user_id,
        `⚠️ *要注意の質問* (${problemQuestions.length}件)\n` +
        problemQuestions.map(q => {
          const issues = [];
          if (q.assignedMentors && q.assignedMentors.some(mentorId => !mentorIds.has(mentorId))) {
            issues.push('担当者不在');
          }
          const questionDate = new Date(q.createdAt.seconds ? q.createdAt.seconds * 1000 : q.createdAt);
          if (questionDate < oneDayAgo) {
            issues.push('24時間以上経過');
          }
          return `• ${q.category} - <@${q.userId}> (${issues.join('・')})`;
        }).join('\n')
      );
    }

    // 待機中の質問
    if (waitingQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        body.channel_id,
        body.user_id,
        `🟡 *待機中の質問* (${waitingQuestions.length}件)`
      );
      for (const question of waitingQuestions) {
        const message = createQuestionMessage(question, question.id);
        await sendEphemeralMessage(
          client,
          body.channel_id,
          body.user_id,
          message.text,
          message.blocks
        );
      }
    }

    // 中断中の質問
    if (pausedQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        body.channel_id,
        body.user_id,
        `🟠 *中断中の質問* (${pausedQuestions.length}件)`
      );
      for (const question of pausedQuestions) {
        const message = createQuestionMessage(question, question.id);
        await sendEphemeralMessage(
          client,
          body.channel_id,
          body.user_id,
          message.text,
          message.blocks
        );
      }
    }

    // 対応中の質問（詳細表示）
    if (inProgressQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        body.channel_id,
        body.user_id,
        `🔵 *対応中の質問* (${inProgressQuestions.length}件)`
      );
      for (const question of inProgressQuestions) {
        const message = createQuestionMessage(question, question.id);
        await sendEphemeralMessage(
          client,
          body.channel_id,
          body.user_id,
          message.text,
          message.blocks
        );
      }
    }
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user_id, 
    channelId: args[0].body.channel_id 
  }),
  '質問一覧の取得中にエラーが発生しました。'
);

export const handleMentorUnregisterCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    const userId = body.user_id;
    
    // 現在のメンター情報を確認
    const existingMentor = await firestoreService.getMentor(userId);
    
    if (!existingMentor) {
      await client.chat.postMessage({
        channel: body.channel_id,
        text: '❌ メンターとして登録されていません。\n`/mentor-register` でメンター登録を行ってください。',
      });
      return;
    }

    // 確認メッセージを表示
    await client.chat.postMessage({
      channel: body.channel_id,
      text: `⚠️ **メンター登録解除の確認**\n\n` +
            `現在の登録情報:\n` +
            `👤 **名前**: ${existingMentor.name}\n\n` +
            `本当にメンター登録を解除しますか？`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ **メンター登録解除の確認**\n\n` +
                  `現在の登録情報:\n` +
                  `👤 **名前**: ${existingMentor.name}\n\n` +
                  `本当にメンター登録を解除しますか？`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🗑️ 解除する',
              },
              action_id: 'confirm_unregister',
              style: 'danger',
              value: userId,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ キャンセル',
              },
              action_id: 'cancel_unregister',
            },
          ],
        },
      ],
    });

  } catch (error) {
    console.error('Error handling mentor unregister command:', error);
    await client.chat.postMessage({
      channel: body.channel_id,
      text: 'メンター登録解除の処理中にエラーが発生しました。',
    });
  }
};
