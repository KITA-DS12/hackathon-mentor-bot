import { FirestoreService } from '../services/firestore.js';
import {
  createStatusUpdateMessage,
  createThreadInviteMessage,
} from '../utils/message.js';
import { QUESTION_STATUS } from '../config/constants.js';

const firestoreService = new FirestoreService();

export const handleStartResponse = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const mentorId = body.user.id;

    // 既に他のメンターが対応開始していないかチェック
    const question = await firestoreService.getQuestion(questionId);
    if (!question) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: '質問が見つかりません。',
      });
      return;
    }

    if (question.status !== QUESTION_STATUS.WAITING) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: 'この質問は既に他のメンターが対応中です。',
      });
      return;
    }

    // ステータスを更新
    await firestoreService.updateQuestion(questionId, {
      status: QUESTION_STATUS.IN_PROGRESS,
      assignedMentor: mentorId,
    });

    await firestoreService.addStatusHistory(
      questionId,
      QUESTION_STATUS.IN_PROGRESS,
      mentorId
    );

    // スレッドを作成
    const threadMessage = createThreadInviteMessage(
      questionId,
      question.content
    );
    const threadResult = await client.chat.postMessage({
      channel: body.channel.id,
      thread_ts: body.message.ts,
      ...threadMessage,
    });

    // スレッドのタイムスタンプを保存
    await firestoreService.updateQuestion(questionId, {
      threadTs: threadResult.ts,
    });

    // メンターチャンネルでステータス更新を通知
    const statusMessage = createStatusUpdateMessage(
      { ...question, status: QUESTION_STATUS.IN_PROGRESS },
      questionId,
      mentorId
    );

    await client.chat.postMessage({
      channel: body.channel.id,
      ...statusMessage,
    });

    // 質問者にDMで通知
    await client.chat.postMessage({
      channel: question.userId,
      text: `<@${mentorId}>があなたの質問に対応を開始しました。メンターチャンネルのスレッドをご確認ください。`,
    });
  } catch (error) {
    console.error('Error handling start response:', error);

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: '対応開始の処理中にエラーが発生しました。',
    });
  }
};

export const handleCheckDetails = async ({ ack, body, client }) => {
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

    const detailsText = `
*質問詳細:*
質問者: <@${question.userId}>
カテゴリ: ${question.category}
緊急度: ${question.urgency}
相談方法: ${question.consultationType}
作成日時: ${question.createdAt.toDate().toLocaleString()}

*質問内容:*
${question.content}

${question.currentSituation ? `*現在の状況:*\n${question.currentSituation}\n` : ''}
${question.relatedLinks ? `*関連リンク:*\n${question.relatedLinks}\n` : ''}
${question.errorMessage ? `*エラーメッセージ:*\n\`\`\`${question.errorMessage}\`\`\`\n` : ''}
`;

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: detailsText,
    });
  } catch (error) {
    console.error('Error handling check details:', error);

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: '詳細確認の処理中にエラーが発生しました。',
    });
  }
};

export const handlePauseResponse = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const mentorId = body.user.id;

    await firestoreService.updateQuestion(questionId, {
      status: QUESTION_STATUS.PAUSED,
    });

    await firestoreService.addStatusHistory(
      questionId,
      QUESTION_STATUS.PAUSED,
      mentorId
    );

    const question = await firestoreService.getQuestion(questionId);
    const statusMessage = createStatusUpdateMessage(
      { ...question, status: QUESTION_STATUS.PAUSED },
      questionId,
      mentorId
    );

    await client.chat.postMessage({
      channel: body.channel.id,
      ...statusMessage,
    });

    await client.chat.postMessage({
      channel: question.userId,
      text: `<@${mentorId}>が対応を一時中断しました。後ほど対応を再開します。`,
    });
  } catch (error) {
    console.error('Error handling pause response:', error);
  }
};

export const handleCompleteResponse = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const mentorId = body.user.id;

    await firestoreService.updateQuestion(questionId, {
      status: QUESTION_STATUS.COMPLETED,
    });

    await firestoreService.addStatusHistory(
      questionId,
      QUESTION_STATUS.COMPLETED,
      mentorId
    );

    const question = await firestoreService.getQuestion(questionId);
    const statusMessage = createStatusUpdateMessage(
      { ...question, status: QUESTION_STATUS.COMPLETED },
      questionId,
      mentorId
    );

    await client.chat.postMessage({
      channel: body.channel.id,
      ...statusMessage,
    });

    await client.chat.postMessage({
      channel: question.userId,
      text: `<@${mentorId}>があなたの質問への対応を完了しました。ありがとうございました！`,
    });
  } catch (error) {
    console.error('Error handling complete response:', error);
  }
};
