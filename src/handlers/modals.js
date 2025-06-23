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
      category: values.category?.category?.selected_option?.value || 'その他',
      urgency: values.urgency?.urgency?.selected_option?.value || '🟡普通',
      consultationType: values.consultation_type?.consultation_type?.selected_option?.value || 'すぐ相談したい',
      currentSituation: values.current_situation?.current_situation?.value || '',
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

    // メンターチャンネルに質問を投稿（メンションあり）
    const questionMessage = createQuestionMessage(questionData, questionId);
    
    // 適切なメンターを見つけてメンション
    const mentionText = await getMentionText(questionData.category);

    await client.chat.postMessage({
      channel: config.app.mentorChannelId,
      text: `${mentionText}\n\n${questionMessage.text}`,
      blocks: questionMessage.blocks,
    });

    // 質問者にDMで確認
    await client.chat.postMessage({
      channel: body.user.id,
      text: '質問を送信しました。メンターからの返答をお待ちください。',
    });

    // フォローアップを開始
    const { getFollowUpService } = await import('./followup.js');
    const followUpService = getFollowUpService();

    if (followUpService) {
      followUpService.scheduleFollowUp(questionId, body.user.id);
    }
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

    const questionId =
      await firestoreService.createQuestion(updatedQuestionData);

    // スケジューラーサービスの取得
    const { getSchedulerService } = await import('./reservation.js');
    const schedulerService = getSchedulerService();

    if (schedulerService) {
      schedulerService.scheduleQuestion(questionId, updatedQuestionData);
    }

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

// メンター向けのメンション文を生成
async function getMentionText(category) {
  try {
    // 全ての利用可能なメンターを取得
    const availableMentors = await firestoreService.getAvailableMentors();
    
    if (availableMentors.length > 0) {
      const mentions = availableMentors
        .slice(0, 5) // 最大5人まで
        .map(mentor => `<@${mentor.userId}>`)
        .join(' ');
      
      return `🔔 **${category}** の質問です\n${mentions}`;
    } else {
      // 利用可能なメンターがいない場合は全メンターを取得
      const allMentors = await firestoreService.getAllMentors();
      
      if (allMentors.length > 0) {
        const mentions = allMentors
          .slice(0, 3) // 最大3人まで
          .map(mentor => `<@${mentor.userId}>`)
          .join(' ');
        
        return `🔔 新しい質問です\n${mentions}`;
      } else {
        return '🔔 新しい質問が投稿されました（登録メンターなし）';
      }
    }
  } catch (error) {
    console.error('Error getting mention text:', error);
    return '🔔 新しい質問が投稿されました';
  }
}
