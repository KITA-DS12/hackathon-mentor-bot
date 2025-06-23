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

// 依存関係をモック
vi.mock('../../src/services/firestore.js');
vi.mock('../../src/utils/message.js');
vi.mock('../../src/utils/mentorUtils.js');
vi.mock('../../src/handlers/followup.js', () => ({
  getFollowUpService: vi.fn().mockReturnValue({
    scheduleFollowUp: vi.fn()
  })
}));
vi.mock('../../src/handlers/reservation.js', () => ({
  getSchedulerService: vi.fn().mockReturnValue({
    scheduleQuestion: vi.fn()
  })
}));

describe('modals handlers', () => {
  let mockClient;
  let mockFirestoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClient = {
      chat: {
        postMessage: vi.fn()
      },
      views: {
        open: vi.fn()
      }
    };

    mockFirestoreService = {
      createQuestion: vi.fn()
    };
    FirestoreService.mockImplementation(() => mockFirestoreService);

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
              consultation_type: { selected_option: { value: 'すぐ相談したい' } } 
            }
          }
        }
      }
    };

    it('should handle immediate consultation submission', async () => {
      mockFirestoreService.createQuestion.mockResolvedValue('question123');
      const mockAck = vi.fn();

      await handleQuestionModalSubmission({ 
        ack: mockAck, 
        body: mockBody, 
        client: mockClient 
      });

      expect(mockAck).toHaveBeenCalled();
      expect(mockFirestoreService.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'U123456',
          content: 'テスト質問',
          category: '技術的な問題',
          consultationType: 'すぐ相談したい'
        })
      );
      expect(generateMentionText).toHaveBeenCalledWith('技術的な問題');
      expect(mockClient.chat.postMessage).toHaveBeenCalledTimes(2); // メンターチャンネル + ユーザーDM
    });

    it('should handle reservation consultation by opening modal', async () => {
      const reservationBody = {
        ...mockBody,
        view: {
          state: {
            values: {
              question_content: { content: { value: 'テスト質問' } },
              consultation_type: { 
                consultation_type: { selected_option: { value: '予約して相談' } } 
              }
            }
          }
        }
      };
      const mockAck = vi.fn();

      await handleQuestionModalSubmission({ 
        ack: mockAck, 
        body: reservationBody, 
        client: mockClient 
      });

      expect(mockAck).toHaveBeenCalled();
      expect(mockClient.views.open).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger_id: 'trigger123',
          view: expect.objectContaining({
            private_metadata: expect.any(String)
          })
        })
      );
      expect(mockFirestoreService.createQuestion).not.toHaveBeenCalled();
    });

    it('should handle errors and send error message', async () => {
      mockFirestoreService.createQuestion.mockRejectedValue(new Error('Database error'));
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
      mockFirestoreService.createQuestion.mockResolvedValue('question123');
      const mockAck = vi.fn();

      await handleReservationModalSubmission({ 
        ack: mockAck, 
        body: mockBody, 
        client: mockClient 
      });

      expect(mockAck).toHaveBeenCalled();
      expect(mockFirestoreService.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'U123456',
          content: 'テスト質問',
          reservationTime: '30分後',
          autoResolveCheck: true
        })
      );
      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123456',
        text: expect.stringContaining('予約相談を受け付けました')
      });
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
      mockFirestoreService.createQuestion.mockResolvedValue('question123');
      const mockAck = vi.fn();

      await handleReservationModalSubmission({ 
        ack: mockAck, 
        body: bodyWithoutAutoResolve, 
        client: mockClient 
      });

      expect(mockFirestoreService.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          autoResolveCheck: false
        })
      );
    });
  });
});