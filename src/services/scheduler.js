import { FirestoreService } from './firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { config } from '../config/index.js';
import { RESERVATION_TIMES } from '../config/constants.js';

const firestoreService = new FirestoreService();

export class SchedulerService {
  constructor(slackClient) {
    this.client = slackClient;
    this.scheduledJobs = new Map();
  }

  scheduleQuestion(questionId, questionData) {
    const { reservationTime, autoResolveCheck } = questionData;

    let delayMinutes = 0;

    if (typeof RESERVATION_TIMES[reservationTime] === 'number') {
      delayMinutes = RESERVATION_TIMES[reservationTime];
    } else if (reservationTime === '明日午前') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 明日の9時
      delayMinutes = Math.floor((tomorrow - now) / (1000 * 60));
    }

    if (delayMinutes <= 0) {
      this.processReservation(questionId);
      return;
    }

    const timeoutId = setTimeout(
      async () => {
        if (autoResolveCheck) {
          await this.checkAutoResolve(questionId);
        } else {
          await this.processReservation(questionId);
        }
      },
      delayMinutes * 60 * 1000
    );

    this.scheduledJobs.set(questionId, timeoutId);
  }

  async checkAutoResolve(questionId) {
    try {
      const question = await firestoreService.getQuestion(questionId);
      if (!question) return;

      // 自力解決確認メッセージを送信
      await this.client.chat.postMessage({
        channel: question.userId,
        text: '予約時間になりました。問題は自力で解決できましたか？',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '予約時間になりました。問題は自力で解決できましたか？',
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
                action_id: 'mark_resolved',
                value: questionId,
                style: 'primary',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '❓ まだ質問したいです',
                },
                action_id: 'send_to_mentor',
                value: questionId,
              },
            ],
          },
        ],
      });

      // 5分後に自動でメンターに送信
      setTimeout(
        async () => {
          const updatedQuestion =
            await firestoreService.getQuestion(questionId);
          if (updatedQuestion && updatedQuestion.status === 'waiting') {
            await this.processReservation(questionId);
          }
        },
        5 * 60 * 1000
      );
    } catch (error) {
      console.error('Error in auto resolve check:', error);
      await this.processReservation(questionId);
    }
  }

  async processReservation(questionId) {
    try {
      const question = await firestoreService.getQuestion(questionId);
      if (!question) return;

      // メンターチャンネルに質問を投稿
      const questionMessage = createQuestionMessage(question, questionId);

      await this.client.chat.postMessage({
        channel: config.app.mentorChannelId,
        text: `⏰ 予約された質問です`,
        ...questionMessage,
      });

      // 質問者に通知
      await this.client.chat.postMessage({
        channel: question.userId,
        text: '予約された質問をメンターに送信しました。返答をお待ちください。',
      });

      this.scheduledJobs.delete(questionId);
    } catch (error) {
      console.error('Error processing reservation:', error);
    }
  }

  cancelScheduledQuestion(questionId) {
    const timeoutId = this.scheduledJobs.get(questionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledJobs.delete(questionId);
    }
  }

  async markAsResolved(questionId, userId) {
    try {
      await firestoreService.updateQuestion(questionId, {
        status: 'completed',
        resolvedBy: userId,
        resolvedAt: new Date(),
      });

      await this.client.chat.postMessage({
        channel: userId,
        text: '質問を自力解決済みとしてマークしました。お疲れ様でした！',
      });

      this.cancelScheduledQuestion(questionId);
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  }
}
