import { createQuestionModal, createMentorRegistrationModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { createQuestionTypeSelectionModal } from '../utils/questionType.js';
import { createStatusModal, formatMentorStatus } from '../utils/schedule.js';
import { FirestoreService } from '../services/firestore.js';

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

export const handleMentorStatusCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    // 自分がメンターとして登録されているか確認
    const mentor = await firestoreService.getMentor(body.user_id);
    
    if (!mentor) {
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: '❌ メンターとして登録されていません。\n`/mentor-register` でメンター登録を行ってください。',
      });
      return;
    }

    // ステータス変更モーダルを直接表示
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createStatusModal(),
    });
  } catch (error) {
    console.error('Error handling mentor status command:', error);
    await client.chat.postEphemeral({
      channel: body.channel_id,
      user: body.user_id,
      text: 'ステータス変更モーダルの表示中にエラーが発生しました。',
    });
  }
};

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

export const handleMentorListCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    const mentors = await firestoreService.getAllMentors();
    
    if (mentors.length === 0) {
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: '現在登録されているメンターはいません。\n`/mentor-register` でメンター登録してください。',
      });
      return;
    }

    const mentorList = mentors
      .map((mentor) => {
        const statusEmoji = mentor.availability === 'available' ? '🟢' : 
                           mentor.availability === 'busy' ? '🟡' : '🔴';
        
        return `${statusEmoji} <@${mentor.userId}> - ${mentor.name}`;
      })
      .join('\n');

    await client.chat.postEphemeral({
      channel: body.channel_id,
      user: body.user_id,
      text: `📋 **登録メンター一覧** (${mentors.length}名)\n\n${mentorList}`,
    });
  } catch (error) {
    console.error('Error listing mentors:', error);
    await client.chat.postEphemeral({
      channel: body.channel_id,
      user: body.user_id,
      text: 'メンター一覧の取得中にエラーが発生しました。',
    });
  }
};

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
