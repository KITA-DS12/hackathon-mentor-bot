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
    
    const waitingQuestions = await firestoreService.getQuestionsByStatus('waiting');
    const pausedQuestions = await firestoreService.getQuestionsByStatus('paused');
    const inProgressQuestions = await firestoreService.getQuestionsByStatus('in_progress');
    
    if (waitingQuestions.length === 0 && pausedQuestions.length === 0 && inProgressQuestions.length === 0) {
      await sendEphemeralMessage(
        client, 
        body.channel_id, 
        body.user_id, 
        '📋 現在対応可能な質問はありません。'
      );
      return;
    }

    // 待機中の質問
    for (const question of waitingQuestions) {
      const message = createQuestionMessage(question, question.id);
      await client.chat.postMessage({
        channel: body.channel_id,
        ...message,
      });
    }

    // 中断中の質問
    for (const question of pausedQuestions) {
      const message = createQuestionMessage(question, question.id);
      await client.chat.postMessage({
        channel: body.channel_id,
        ...message,
      });
    }

    // 対応中の質問（参考情報として）
    if (inProgressQuestions.length > 0) {
      await client.chat.postMessage({
        channel: body.channel_id,
        text: `📋 *対応中の質問* (${inProgressQuestions.length}件)\n` +
              inProgressQuestions.map(q => 
                `• ${q.category} - <@${q.userId}> (担当: <@${q.assignedMentor}>)`
              ).join('\n'),
      });
    }
  },
  { client: null, userId: null, channelId: null },
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
