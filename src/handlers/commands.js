import { createQuestionModal, createMentorRegistrationModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { createQuestionTypeSelectionModal } from '../utils/questionType.js';
import { createScheduleModal, formatMentorStatus } from '../utils/schedule.js';
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
    // 全メンターのステータスを表示
    const mentors = await firestoreService.getAllMentors();
    const statusMessage = formatMentorStatus(mentors);

    await client.chat.postMessage({
      channel: body.channel_id,
      text: statusMessage,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: statusMessage,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'ステータス変更',
              },
              action_id: 'change_status',
              style: 'primary',
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Error handling mentor status command:', error);
    await client.chat.postMessage({
      channel: body.channel_id,
      text: 'ステータス確認中にエラーが発生しました。',
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
      await client.chat.postMessage({
        channel: body.channel_id,
        text: '現在登録されているメンターはいません。\n`/mentor-register` でメンター登録してください。',
      });
      return;
    }

    const mentorList = mentors
      .map((mentor) => {
        const specialtiesText = mentor.specialties?.length 
          ? mentor.specialties.join(', ') 
          : '未設定';
        const statusEmoji = mentor.availability === 'available' ? '🟢' : 
                           mentor.availability === 'busy' ? '🟡' : '🔴';
        
        return `${statusEmoji} <@${mentor.userId}> - ${specialtiesText}`;
      })
      .join('\n');

    await client.chat.postMessage({
      channel: body.channel_id,
      text: `📋 **登録メンター一覧** (${mentors.length}名)\n\n${mentorList}`,
    });
  } catch (error) {
    console.error('Error listing mentors:', error);
    await client.chat.postMessage({
      channel: body.channel_id,
      text: 'メンター一覧の取得中にエラーが発生しました。',
    });
  }
};
