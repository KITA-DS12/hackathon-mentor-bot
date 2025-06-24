import { FirestoreService, FieldValue } from '../services/firestore.js';
import {
  createStatusUpdateMessage,
  createThreadInviteMessage,
  createThreadStatusMessage,
  formatTimestamp,
} from '../utils/message.js';
import { QUESTION_STATUS } from '../config/constants.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';

const firestoreService = new FirestoreService();

export const handleStartResponse = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

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

    // ステータスを更新（複数メンター対応）
    await firestoreService.updateQuestion(questionId, {
      status: QUESTION_STATUS.IN_PROGRESS,
      assignedMentors: FieldValue.arrayUnion(mentorId),
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

    // フォローアップをキャンセル（メンターが対応開始したため）
    const { getFollowUpService } = await import('../handlers/followup.js');
    const followUpService = getFollowUpService();

    if (followUpService) {
      followUpService.cancelFollowUp(questionId);
    }
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user.id, 
    channelId: args[0].body.channel.id 
  }),
  ERROR_MESSAGES.START_RESPONSE
);

export const handleCheckDetails = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

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
チーム: ${question.teamName}
質問者: <@${question.userId}>
カテゴリ: ${question.category}
緊急度: ${question.urgency}
相談方法: ${question.consultationType}
作成日時: ${formatTimestamp(question.createdAt)}

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
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user.id, 
    channelId: args[0].body.channel.id 
  }),
  ERROR_MESSAGES.CHECK_DETAILS
);

export const handlePauseResponse = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

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

    // スレッドに再開ボタン付きメッセージを投稿
    if (question.threadTs) {
      const threadMessage = createThreadStatusMessage(questionId, QUESTION_STATUS.PAUSED);
      await client.chat.postMessage({
        channel: body.channel.id,
        thread_ts: question.threadTs,
        text: '対応を一時中断しました。下のボタンから再開できます。',
        ...threadMessage,
      });
    }
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user.id, 
    channelId: args[0].body.channel.id 
  }),
  ERROR_MESSAGES.PAUSE_RESPONSE
);

export const handleResumeResponse = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

    const questionId = body.actions[0].value;
    const mentorId = body.user.id;

    const question = await firestoreService.getQuestion(questionId);
    if (!question) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: '質問が見つかりません。',
      });
      return;
    }

    // 中断状態の質問のみ再開可能
    if (question.status !== QUESTION_STATUS.PAUSED) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: 'この質問は中断状態ではありません。',
      });
      return;
    }

    // 複数メンター対応：既に担当者リストに含まれているかチェック
    if (question.assignedMentors && !question.assignedMentors.includes(mentorId)) {
      // 新しいメンターとして追加
      await firestoreService.updateQuestion(questionId, {
        status: QUESTION_STATUS.IN_PROGRESS,
        assignedMentors: FieldValue.arrayUnion(mentorId),
      });
    } else {
      // 既存の担当メンターが再開
      await firestoreService.updateQuestion(questionId, {
        status: QUESTION_STATUS.IN_PROGRESS,
      });
    }

    await firestoreService.addStatusHistory(
      questionId,
      QUESTION_STATUS.IN_PROGRESS,
      mentorId
    );

    const statusMessage = createStatusUpdateMessage(
      { ...question, status: QUESTION_STATUS.IN_PROGRESS },
      questionId,
      mentorId
    );

    await client.chat.postMessage({
      channel: body.channel.id,
      ...statusMessage,
    });

    await client.chat.postMessage({
      channel: question.userId,
      text: `<@${mentorId}>があなたの質問への対応を再開しました。`,
    });

    // スレッドに中断・完了ボタン付きメッセージを投稿
    if (question.threadTs) {
      const threadMessage = createThreadStatusMessage(questionId, QUESTION_STATUS.IN_PROGRESS);
      await client.chat.postMessage({
        channel: body.channel.id,
        thread_ts: question.threadTs,
        text: '対応を再開しました。',
        ...threadMessage,
      });
    }
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user.id, 
    channelId: args[0].body.channel.id 
  }),
  ERROR_MESSAGES.RESUME_RESPONSE
);

export const handleReleaseAssignment = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

    const questionId = body.actions[0].value;
    const mentorId = body.user.id;

    const question = await firestoreService.getQuestion(questionId);
    if (!question) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: '質問が見つかりません。',
      });
      return;
    }

    // 担当者の確認（担当者本人のみ解除可能）
    if (!question.assignedMentors || !question.assignedMentors.includes(mentorId)) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: 'この質問はあなたが担当していません。',
      });
      return;
    }

    // 対応中または中断中の質問のみ解除可能
    if (question.status !== QUESTION_STATUS.IN_PROGRESS && question.status !== QUESTION_STATUS.PAUSED) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: 'この質問は担当解除できない状態です。',
      });
      return;
    }

    // 担当メンターから自分を削除
    const updateData = {
      assignedMentors: FieldValue.arrayRemove(mentorId),
    };

    // 担当メンターが0人になる場合は待機中に戻す
    const remainingMentors = question.assignedMentors.filter(id => id !== mentorId);
    if (remainingMentors.length === 0) {
      updateData.status = QUESTION_STATUS.WAITING;
    }

    await firestoreService.updateQuestion(questionId, updateData);

    const newStatus = remainingMentors.length === 0 ? QUESTION_STATUS.WAITING : question.status;
    
    await firestoreService.addStatusHistory(
      questionId,
      newStatus,
      mentorId
    );

    const statusMessage = createStatusUpdateMessage(
      { ...question, status: newStatus, assignedMentors: remainingMentors },
      questionId,
      mentorId
    );

    await client.chat.postMessage({
      channel: body.channel.id,
      ...statusMessage,
    });

    const notificationText = remainingMentors.length === 0 
      ? `<@${mentorId}>が担当を解除しました。他のメンターが対応可能になりました。`
      : `<@${mentorId}>が担当を解除しました。引き続き他のメンターが対応中です。`;
    
    await client.chat.postMessage({
      channel: question.userId,
      text: notificationText,
    });
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user.id, 
    channelId: args[0].body.channel.id 
  }),
  ERROR_MESSAGES.RELEASE_ASSIGNMENT
);

export const handleCompleteResponse = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

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

    // フォローアップをキャンセル（完了したため）
    const { getFollowUpService } = await import('../handlers/followup.js');
    const followUpService = getFollowUpService();

    if (followUpService) {
      followUpService.cancelFollowUp(questionId);
    }
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user.id, 
    channelId: args[0].body.channel.id 
  }),
  ERROR_MESSAGES.COMPLETE_RESPONSE
);
