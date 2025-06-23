import { SchedulerService } from '../services/scheduler.js';
import { FirestoreService } from '../services/firestore.js';

const firestoreService = new FirestoreService();
let schedulerService;

export const initializeScheduler = (slackClient) => {
  schedulerService = new SchedulerService(slackClient);
};

export const getSchedulerService = () => {
  return schedulerService;
};

export const handleMarkResolvedAction = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const userId = body.user.id;

    await schedulerService.markAsResolved(questionId, userId);

    // ボタンを無効化するため、メッセージを更新
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: '✅ 質問を自力解決済みとしてマークしました。',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ 質問を自力解決済みとしてマークしました。お疲れ様でした！',
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error handling mark resolved action:', error);

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: '処理中にエラーが発生しました。',
    });
  }
};

export const handleSendToMentorAction = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const question = await firestoreService.getQuestion(questionId);

    if (!question) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: '質問が見つかりません。',
      });
      return;
    }

    await schedulerService.processReservation(questionId);

    // ボタンを無効化するため、メッセージを更新
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: '❓ 質問をメンターに送信しました。',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❓ 質問をメンターに送信しました。返答をお待ちください。',
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error handling send to mentor action:', error);

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: '処理中にエラーが発生しました。',
    });
  }
};
