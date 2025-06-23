import { createQuestionModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { createScheduleModal, formatMentorStatus } from '../utils/schedule.js';
import { FirestoreService } from '../services/firestore.js';

const firestoreService = new FirestoreService();

export const handleMentorHelpCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    // テンプレート機能を使用（カテゴリ選択から開始）
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createCategorySelectionModal(),
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

// シンプル質問フォーム（制限の少ない自由投稿）
export const handleMentorHelpSimpleCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createQuestionModal(),
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

// 完全自由投稿用コマンド
export const handleMentorFreeCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createQuestionModal(true), // 自由投稿モード
    });
  } catch (error) {
    console.error('Error opening free modal:', error);
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
