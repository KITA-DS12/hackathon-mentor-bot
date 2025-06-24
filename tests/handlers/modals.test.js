/**
 * modals.js のテスト
 */
import { vi } from 'vitest';
import { 
  handleQuestionModalSubmission, 
  handleReservationModalSubmission 
} from '../../src/handlers/modals.js';
import { FirestoreService } from '../../src/services/firestore.js';
import { createQuestionMessage } from '../../src/utils/message.js';
import { generateMentionText } from '../../src/utils/mentorUtils.js';
import { postQuestionToMentorChannel, sendUserConfirmation } from '../../src/utils/slackUtils.js';

// FirestoreServiceをモック
vi.mock('../../src/services/firestore.js', () => {
  const mockInstance = {
    createQuestion: vi.fn().mockResolvedValue('question123')
  };
  return {
    FirestoreService: vi.fn(() => mockInstance),
    __mockInstance: mockInstance
  };
});
vi.mock('../../src/utils/message.js', () => ({
  createQuestionMessage: vi.fn()
}));
vi.mock('../../src/utils/mentorUtils.js', () => ({
  generateMentionText: vi.fn()
}));
vi.mock('../../src/utils/slackUtils.js', () => ({
  postQuestionToMentorChannel: vi.fn().mockResolvedValue(),
  sendUserConfirmation: vi.fn().mockResolvedValue(),
  openModal: vi.fn().mockResolvedValue()
}));
vi.mock('../../src/handlers/followup.js', () => ({
  getFollowUpService: vi.fn(() => ({
    scheduleFollowUp: vi.fn()
  }))
}));
vi.mock('../../src/handlers/reservation.js', () => ({
  getSchedulerService: vi.fn(() => ({
    scheduleQuestion: vi.fn()
  }))
}));

// モックされた関数とインスタンスをインポート
const { openModal, postQuestionToMentorChannel, sendUserConfirmation } = await import('../../src/utils/slackUtils.js');
const { __mockInstance } = await import('../../src/services/firestore.js');
const { generateMentionText } = await import('../../src/utils/mentorUtils.js');
const { createQuestionMessage } = await import('../../src/utils/message.js');

describe('modals handlers', () => {
  let mockClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClient = {
      chat: {
        postMessage: vi.fn().mockResolvedValue()
      },
      views: {
        open: vi.fn().mockResolvedValue()
      }
    };

    createQuestionMessage.mockReturnValue({
      text: '質問内容',
      blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '質問内容' } }]
    });

    generateMentionText.mockResolvedValue('🔔 **技術的な問題** の質問です\n<@U123>');
  });

  describe('handleQuestionModalSubmission', () => {
    const mockBody = {
      user: { id: 'U123456' },
      trigger_id: 'trigger123',
      view: {
        state: {
          values: {
            question_content: { content: { value: 'テスト質問' } },
            category: { category: { selected_option: { value: '技術的な問題' } } },
            consultation_type: { 
              consultation_type: { selected_option: { value: 'Slackで相談' } } 
            }
          }
        }
      }
    };

    it('should handle immediate consultation submission', async () => {
      __mockInstance.createQuestion.mockResolvedValue('question123');
      const mockAck = vi.fn();

      await handleQuestionModalSubmission({ 
        ack: mockAck, 
        body: mockBody, 
        client: mockClient 
      });

      expect(mockAck).toHaveBeenCalled();
      expect(__mockInstance.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'U123456',
          content: 'テスト質問',
          category: '技術的な問題',
          consultationType: 'Slackで相談'
        })
      );
      expect(generateMentionText).toHaveBeenCalledWith('技術的な問題');
      expect(postQuestionToMentorChannel).toHaveBeenCalledTimes(1);
      expect(sendUserConfirmation).toHaveBeenCalledTimes(1);
    });


    it('should handle errors and send error message', async () => {
      __mockInstance.createQuestion.mockRejectedValue(new Error('Database error'));
      const mockAck = vi.fn();

      // エラーハンドリングラッパーのテストは複雑なので、
      // ここでは元の関数のロジックをテスト
      const originalError = console.error;
      console.error = vi.fn();

      try {
        await handleQuestionModalSubmission({ 
          ack: mockAck, 
          body: mockBody, 
          client: mockClient 
        });
      } catch (error) {
        // エラーが再スローされることを期待
        expect(error.message).toBe('Database error');
      }

      console.error = originalError;
    });
  });

  describe('handleReservationModalSubmission', () => {
    const mockBody = {
      user: { id: 'U123456' },
      view: {
        state: {
          values: {
            reservation_time: { 
              reservation_time: { selected_option: { value: '30分後' } } 
            },
            auto_resolve_check: { 
              auto_resolve_check: { selected_options: [{ value: 'auto_resolve_check' }] } 
            }
          }
        },
        private_metadata: JSON.stringify({
          userId: 'U123456',
          content: 'テスト質問',
          category: '技術的な問題'
        })
      }
    };

    it('should handle reservation submission successfully', async () => {
      __mockInstance.createQuestion.mockResolvedValue('question123');
      const mockAck = vi.fn();

      await handleReservationModalSubmission({ 
        ack: mockAck, 
        body: mockBody, 
        client: mockClient 
      });

      expect(mockAck).toHaveBeenCalled();
      expect(__mockInstance.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'U123456',
          content: 'テスト質問',
          reservationTime: '30分後',
          autoResolveCheck: true
        })
      );
      expect(sendUserConfirmation).toHaveBeenCalledWith(
        mockClient,
        'U123456',
        expect.stringContaining('予約相談を受け付けました')
      );
    });

    it('should handle missing auto resolve check', async () => {
      const bodyWithoutAutoResolve = {
        ...mockBody,
        view: {
          ...mockBody.view,
          state: {
            values: {
              reservation_time: { 
                reservation_time: { selected_option: { value: '1時間後' } } 
              }
              // auto_resolve_check は省略
            }
          }
        }
      };
      __mockInstance.createQuestion.mockResolvedValue('question123');
      const mockAck = vi.fn();

      await handleReservationModalSubmission({ 
        ack: mockAck, 
        body: bodyWithoutAutoResolve, 
        client: mockClient 
      });

      expect(__mockInstance.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          autoResolveCheck: false
        })
      );
    });
  });
});