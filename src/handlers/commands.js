import { createQuestionModal, createMentorRegistrationModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { createQuestionTypeSelectionModal } from '../utils/questionType.js';
import { createStatusModal, formatMentorStatus } from '../utils/schedule.js';
import { FirestoreService } from '../services/firestore.js';
import { sendEphemeralMessage, openModal } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';

const firestoreService = new FirestoreService();

export const handleMentorHelpCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    // 質問方法選択モーダルを表示
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createQuestionTypeSelectionModal(),
    });
  } catch (error) {
    console.error('Error opening question type selection modal:', error);
  }
};

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
