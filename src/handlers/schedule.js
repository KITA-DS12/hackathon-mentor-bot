import { FirestoreService } from '../services/firestore.js';
import { createStatusModal } from '../utils/schedule.js';
import { MENTOR_AVAILABILITY } from '../config/constants.js';

const firestoreService = new FirestoreService();


export const handleStatusModalSubmission = async ({ ack, body, client }) => {
  await ack();

  try {
    const values = body.view.state.values;
    const userId = body.user.id;

    const newStatus = values.availability_status.status.selected_option.value;

    await firestoreService.updateMentorAvailability(userId, newStatus);

    const statusText = {
      [MENTOR_AVAILABILITY.AVAILABLE]: '🟢 対応可能',
      [MENTOR_AVAILABILITY.BUSY]: '🔴 対応中',
      [MENTOR_AVAILABILITY.OFFLINE]: '⚫ オフライン',
    };

    await client.chat.postMessage({
      channel: body.user.id,
      text: `ステータスを「${statusText[newStatus]}」に変更しました。`,
    });
  } catch (error) {
    console.error('Error handling status modal submission:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: 'ステータス変更中にエラーが発生しました。もう一度お試しください。',
    });
  }
};

export const handleChangeStatusAction = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createStatusModal(),
    });
  } catch (error) {
    console.error('Error opening status modal:', error);
  }
};
