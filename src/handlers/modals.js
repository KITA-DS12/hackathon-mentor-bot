import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { createReservationModal } from '../utils/modal.js';
import { QUESTION_STATUS, CONSULTATION_TYPES } from '../config/constants.js';
import { config } from '../config/index.js';

const firestoreService = new FirestoreService();

export const handleQuestionModalSubmission = async ({ ack, body, client }) => {
  await ack();

  try {
    const values = body.view.state.values;

    const questionData = {
      userId: body.user.id,
      content: values.question_content.content.value,
      category: values.category.category.selected_option.value,
      urgency: values.urgency.urgency.selected_option.value,
      consultationType:
        values.consultation_type.consultation_type.selected_option.value,
      currentSituation:
        values.current_situation?.current_situation?.value || '',
      relatedLinks: values.related_links?.related_links?.value || '',
      errorMessage: values.error_message?.error_message?.value || '',
      status: QUESTION_STATUS.WAITING,
      statusHistory: [
        {
          status: QUESTION_STATUS.WAITING,
          timestamp: new Date(),
          user: body.user.id,
        },
      ],
    };

    if (questionData.consultationType === CONSULTATION_TYPES.RESERVATION) {
      // 予約相談の場合は追加のモーダルを表示
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          ...createReservationModal(),
          private_metadata: JSON.stringify(questionData),
        },
      });
      return;
    }

    // 即座に相談の場合はそのまま処理
    const questionId = await firestoreService.createQuestion(questionData);

    // メンターチャンネルに質問を投稿
    const questionMessage = createQuestionMessage(questionData, questionId);

    await client.chat.postMessage({
      channel: config.app.mentorChannelId,
      ...questionMessage,
    });

    // 質問者にDMで確認
    await client.chat.postMessage({
      channel: body.user.id,
      text: '質問を送信しました。メンターからの返答をお待ちください。',
    });
  } catch (error) {
    console.error('Error handling question modal submission:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: '質問の送信中にエラーが発生しました。もう一度お試しください。',
    });
  }
};

export const handleReservationModalSubmission = async ({
  ack,
  body,
  client,
}) => {
  await ack();

  try {
    const values = body.view.state.values;
    const questionData = JSON.parse(body.view.private_metadata);

    const reservationTime =
      values.reservation_time.reservation_time.selected_option.value;
    const autoResolveCheck =
      values.auto_resolve_check?.auto_resolve_check?.selected_options?.length >
      0;

    const updatedQuestionData = {
      ...questionData,
      reservationTime,
      autoResolveCheck,
    };

    await firestoreService.createQuestion(updatedQuestionData);

    // TODO: 予約時間に基づいてスケジューリング機能を実装

    await client.chat.postMessage({
      channel: body.user.id,
      text: `予約相談を受け付けました。${reservationTime}に${autoResolveCheck ? '自動確認後、' : ''}メンターに質問を送信します。`,
    });
  } catch (error) {
    console.error('Error handling reservation modal submission:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: '予約の処理中にエラーが発生しました。もう一度お試しください。',
    });
  }
};
