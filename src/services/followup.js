import { FirestoreService } from './firestore.js';
import { QUESTION_STATUS } from '../config/constants.js';

const firestoreService = new FirestoreService();

export class FollowUpService {
  constructor(slackClient) {
    this.client = slackClient;
    this.followUpJobs = new Map();
  }

  scheduleFollowUp(questionId, userId) {
    // 30分後のフォローアップ
    const firstFollowUp = setTimeout(
      async () => {
        await this.sendFollowUpMessage(questionId, userId, 'first');
      },
      30 * 60 * 1000
    );

    // 2時間後のフォローアップ
    const secondFollowUp = setTimeout(
      async () => {
        await this.sendFollowUpMessage(questionId, userId, 'second');
      },
      2 * 60 * 60 * 1000
    );

    this.followUpJobs.set(questionId, {
      first: firstFollowUp,
      second: secondFollowUp,
    });
  }

  async sendFollowUpMessage(questionId, userId, type) {
    try {
      const question = await firestoreService.getQuestion(questionId);
      if (!question || question.status === QUESTION_STATUS.COMPLETED) {
        this.cancelFollowUp(questionId);
        return;
      }

      const timeLabel = type === 'first' ? '30分' : '2時間';
      const message = `質問から${timeLabel}が経過しました。問題は解決しましたか？`;

      await this.client.chat.postMessage({
        channel: userId,
        text: message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*元の質問:* ${question.content.substring(0, 100)}${question.content.length > 100 ? '...' : ''}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '✅ 解決しました',
                },
                action_id: 'followup_resolved',
                value: questionId,
                style: 'primary',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '❓ まだ未解決です',
                },
                action_id: 'followup_unresolved',
                value: questionId,
              },
            ],
          },
        ],
      });

      // 未解決の場合のメンター通知（2回目のフォローアップのみ）
      if (type === 'second') {
        await this.notifyMentorOfUnresolvedQuestion(questionId, question);
      }
    } catch (error) {
      console.error('Error sending follow-up message:', error);
    }
  }

  async notifyMentorOfUnresolvedQuestion(questionId, question) {
    try {
      if (!question.assignedMentor) {
        return;
      }

      await this.client.chat.postMessage({
        channel: question.assignedMentor,
        text: `⚠️ フォローアップ: 2時間経過しても未解決の質問があります`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⚠️ *フォローアップ通知*\n質問者: <@${question.userId}>\n2時間経過しても未解決の状態です。`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*質問内容:*\n${question.content}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '質問を確認',
                },
                action_id: 'check_details',
                value: questionId,
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error notifying mentor of unresolved question:', error);
    }
  }

  cancelFollowUp(questionId) {
    const jobs = this.followUpJobs.get(questionId);
    if (jobs) {
      if (jobs.first) clearTimeout(jobs.first);
      if (jobs.second) clearTimeout(jobs.second);
      this.followUpJobs.delete(questionId);
    }
  }

  async markAsResolvedFromFollowUp(questionId, userId) {
    try {
      await firestoreService.updateQuestion(questionId, {
        status: QUESTION_STATUS.COMPLETED,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolvedVia: 'followup',
      });

      await this.client.chat.postMessage({
        channel: userId,
        text: '質問を解決済みとしてマークしました。お疲れ様でした！',
      });

      this.cancelFollowUp(questionId);
    } catch (error) {
      console.error('Error marking as resolved from follow-up:', error);
    }
  }

  async handleUnresolvedFromFollowUp(questionId, userId) {
    try {
      const question = await firestoreService.getQuestion(questionId);
      if (!question) return;

      await this.client.chat.postMessage({
        channel: userId,
        text: 'ご回答ありがとうございます。引き続きサポートいたします。必要であれば改めてメンターに相談してください。',
      });

      // メンターに再通知（担当メンターがいる場合）
      if (question.assignedMentor) {
        await this.client.chat.postMessage({
          channel: question.assignedMentor,
          text: `📢 <@${userId}>の質問がまだ未解決です。追加サポートが必要かもしれません。`,
        });
      }
    } catch (error) {
      console.error('Error handling unresolved from follow-up:', error);
    }
  }
}
