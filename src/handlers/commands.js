import { createQuestionModal, createMentorRegistrationModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { createQuestionTypeSelectionModal } from '../utils/questionType.js';
import { createStatusModal, formatMentorStatus } from '../utils/schedule.js';
import { FirestoreService } from '../services/firestore.js';
import { sendEphemeralMessage, openModal } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';
import { createQuestionMessage } from '../utils/message.js';
import { HealthCheckService } from '../utils/healthCheck.js';

const firestoreService = new FirestoreService();
const healthCheckService = new HealthCheckService();

export const handleMentorHelpCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();
    
    // チャンネル情報をメタデータとして設定
    const metadata = { sourceChannelId: body.channel_id };
    
    // 質問方法選択モーダルを表示
    await openModal(client, body.trigger_id, createQuestionTypeSelectionModal(), metadata);
  },
  (args) => ({ client: args[0].client, userId: args[0].body.user_id, channelId: args[0].body.channel_id }),
  ERROR_MESSAGES.QUESTION_TYPE_SELECTION
);

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

export const handleMentorQuestionsCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack('🔍 質問一覧を取得しています...');
    
    console.log('mentor-questions command executed by:', body.user_id);
    
    // 非同期で質問一覧処理を実行
    processQuestionsList(client, body.channel_id, body.user_id);
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user_id, 
    channelId: args[0].body.channel_id 
  }),
  '質問一覧の取得中にエラーが発生しました。'
);

// 質問一覧処理を非同期化
const processQuestionsList = async (client, channelId, userId) => {
  try {
    const [waitingQuestions, pausedQuestions, inProgressQuestions, allMentors] = await Promise.all([
      firestoreService.getQuestionsByStatus('waiting'),
      firestoreService.getQuestionsByStatus('paused'),
      firestoreService.getQuestionsByStatus('in_progress'),
      firestoreService.getAllMentors()
    ]);
    
    console.log('Questions found:', {
      waiting: waitingQuestions.length,
      paused: pausedQuestions.length,
      inProgress: inProgressQuestions.length,
      mentors: allMentors.length
    });
    
    // チャンネル別統計を作成
    const allQuestions = [...waitingQuestions, ...pausedQuestions, ...inProgressQuestions];
    const channelStats = {};
    allQuestions.forEach(q => {
      const channelId = q.sourceChannelId || 'unknown';
      if (!channelStats[channelId]) {
        channelStats[channelId] = { waiting: 0, paused: 0, in_progress: 0, total: 0 };
      }
      // ステータスをキーとして使用（アンダースコアを含む正確なキー）
      const statusKey = q.status === 'in_progress' ? 'in_progress' : q.status;
      if (channelStats[channelId][statusKey] !== undefined) {
        channelStats[channelId][statusKey]++;
      }
      channelStats[channelId].total++;
    });

    if (waitingQuestions.length === 0 && pausedQuestions.length === 0 && inProgressQuestions.length === 0) {
      await sendEphemeralMessage(
        client, 
        channelId, 
        userId, 
        '📋 現在対応可能な質問はありません。'
      );
      return;
    }

    // チャンネル別統計を表示
    if (Object.keys(channelStats).length > 1) {
      const statsText = Object.entries(channelStats).map(([chId, stats]) => {
        const channelName = chId === 'unknown' ? '不明' : `<#${chId}>`;
        return `${channelName}: ${stats.total}件 (🟡${stats.waiting} 🟠${stats.paused} 🔵${stats.in_progress})`;
      }).join('\n');
      
      await sendEphemeralMessage(
        client,
        channelId,
        userId,
        `📊 *チャンネル別質問統計*\n${statsText}\n`
      );
    }

    // メンターIDのセットを作成（担当者不在チェック用）
    const mentorIds = new Set(allMentors.map(m => m.userId));
    
    // 現在時刻を取得（長期未完了チェック用）
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 担当者不在・長期未完了の質問をチェック（複数メンター対応）
    const problemQuestions = [...pausedQuestions, ...inProgressQuestions].filter(q => {
      // 担当メンターが存在しない、または全員が登録済みメンターでない
      const hasInvalidMentors = q.assignedMentors && q.assignedMentors.length > 0 
        ? q.assignedMentors.some(mentorId => !mentorIds.has(mentorId))
        : false;
      const isOld = q.createdAt && new Date(q.createdAt.seconds ? q.createdAt.seconds * 1000 : q.createdAt) < oneDayAgo;
      return hasInvalidMentors || isOld;
    });

    // 問題のある質問があれば警告表示
    if (problemQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        channelId,
        userId,
        `⚠️ *要注意の質問* (${problemQuestions.length}件)\n` +
        problemQuestions.map(q => {
          const issues = [];
          if (q.assignedMentors && q.assignedMentors.some(mentorId => !mentorIds.has(mentorId))) {
            issues.push('担当者不在');
          }
          const questionDate = new Date(q.createdAt.seconds ? q.createdAt.seconds * 1000 : q.createdAt);
          if (questionDate < oneDayAgo) {
            issues.push('24時間以上経過');
          }
          const channelInfo = q.sourceChannelId ? ` | <#${q.sourceChannelId}>` : '';
          return `• ${q.category} - <@${q.userId}>${channelInfo} (${issues.join('・')})`;
        }).join('\n')
      );
    }

    // 待機中の質問
    if (waitingQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        channelId,
        userId,
        `🟡 *待機中の質問* (${waitingQuestions.length}件)`
      );
      for (const question of waitingQuestions) {
        const message = createQuestionMessage(question, question.id);
        await sendEphemeralMessage(
          client,
          channelId,
          userId,
          message.text,
          message.blocks
        );
      }
    }

    // 中断中の質問
    if (pausedQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        channelId,
        userId,
        `🟠 *中断中の質問* (${pausedQuestions.length}件)`
      );
      for (const question of pausedQuestions) {
        const message = createQuestionMessage(question, question.id);
        await sendEphemeralMessage(
          client,
          channelId,
          userId,
          message.text,
          message.blocks
        );
      }
    }

    // 対応中の質問（詳細表示）
    if (inProgressQuestions.length > 0) {
      await sendEphemeralMessage(
        client,
        channelId,
        userId,
        `🔵 *対応中の質問* (${inProgressQuestions.length}件)`
      );
      for (const question of inProgressQuestions) {
        const message = createQuestionMessage(question, question.id);
        await sendEphemeralMessage(
          client,
          channelId,
          userId,
          message.text,
          message.blocks
        );
      }
    }
  } catch (error) {
    console.error('Error processing questions list:', error);
    await sendEphemeralMessage(
      client,
      channelId,
      userId,
      '質問一覧の取得中にエラーが発生しました。'
    );
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

export const handleMentorHealthCommand = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();
    
    console.log('Health check command executed by:', body.user_id);
    
    try {
      // ローカルヘルスチェックを実行
      const healthResult = await healthCheckService.performLocalHealthCheck();
      
      if (healthResult.success) {
        const { data } = healthResult;
        const uptimeSeconds = Math.round(data.uptime / 1000);
        const uptimeMinutes = Math.round(uptimeSeconds / 60);
        const uptimeDisplay = uptimeMinutes > 0 ? `${uptimeMinutes}分` : `${uptimeSeconds}秒`;
        
        const healthMessage = `🟢 **システム状態: 正常**\n\n` +
          `📊 **システム情報:**\n` +
          `• 稼働時間: ${uptimeDisplay}\n` +
          `• メモリ使用量: ${data.memory.heapUsed}MB / ${data.memory.heapTotal}MB\n` +
          `• CPU応答時間: ${data.cpuResponseTime.toFixed(2)}ms\n` +
          `• ウォームアップ状態: ${data.isWarmedUp ? '✅ 完了' : '⏳ 準備中'}\n\n` +
          `⏰ 最終チェック: <!date^${Math.floor(data.timestamp / 1000)}^{time}|${new Date(data.timestamp).toLocaleTimeString()}>`;
        
        await sendEphemeralMessage(
          client,
          body.channel_id,
          body.user_id,
          healthMessage
        );
      } else {
        await sendEphemeralMessage(
          client,
          body.channel_id,
          body.user_id,
          `🔴 **システム状態: 異常**\n\n` +
          `❌ ヘルスチェックに失敗しました。\n` +
          `エラー: ${healthResult.error}\n\n` +
          `管理者に連絡してください。`
        );
      }
    } catch (error) {
      console.error('Health check command error:', error);
      await sendEphemeralMessage(
        client,
        body.channel_id,
        body.user_id,
        `🔴 **システム状態: 不明**\n\n` +
        `❌ ヘルスチェックの実行中にエラーが発生しました。\n` +
        `管理者に連絡してください。`
      );
    }
  },
  (args) => ({ 
    client: args[0].client, 
    userId: args[0].body.user_id, 
    channelId: args[0].body.channel_id 
  }),
  'システム状態の確認中にエラーが発生しました。'
);
