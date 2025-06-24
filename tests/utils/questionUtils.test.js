/**
 * questionUtils.js のテスト
 */
import { 
  extractQuestionData, 
  extractReservationData, 
  isReservationConsultation 
} from '../../src/utils/questionUtils.js';
import { QUESTION_STATUS, CONSULTATION_TYPES } from '../../src/config/constants.js';

describe('questionUtils', () => {
  describe('extractQuestionData', () => {
    it('should extract question data from modal values', () => {
      const values = {
        question_content: { content: { value: 'テスト質問' } },
        category: { category: { selected_option: { value: '技術的な問題' } } },
        urgency: { urgency: { selected_option: { value: '🔴至急' } } },
        consultation_type: { consultation_type: { selected_option: { value: 'すぐ相談したい' } } },
        current_situation: { current_situation: { value: '試したこと' } },
        related_links: { related_links: { value: 'https://example.com' } },
        error_message: { error_message: { value: 'Error: test' } }
      };
      const userId = 'U123456';

      const result = extractQuestionData(values, userId);

      expect(result).toEqual({
        userId: 'U123456',
        content: 'テスト質問',
        category: '技術的な問題',
        urgency: '🔴至急',
        consultationType: 'すぐ相談したい',
        currentSituation: '試したこと',
        relatedLinks: 'https://example.com',
        errorMessage: 'Error: test',
        status: QUESTION_STATUS.WAITING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        statusHistory: expect.arrayContaining([
          expect.objectContaining({
            status: QUESTION_STATUS.WAITING,
            user: userId,
            timestamp: expect.any(Date)
          })
        ])
      });
    });

    it('should use default values when optional fields are missing', () => {
      const values = {
        question_content: { content: { value: 'テスト質問' } }
      };
      const userId = 'U123456';

      const result = extractQuestionData(values, userId);

      expect(result.category).toBe('技術的な問題');
      expect(result.urgency).toBe('🟡普通');
      expect(result.consultationType).toBe('すぐ相談したい');
      expect(result.currentSituation).toBe('');
      expect(result.relatedLinks).toBe('');
      expect(result.errorMessage).toBe('');
    });
  });

  describe('extractReservationData', () => {
    it('should extract and merge reservation data', () => {
      const values = {
        reservation_time: { 
          reservation_time: { 
            selected_option: { value: '30分後' } 
          } 
        },
        auto_resolve_check: { 
          auto_resolve_check: { 
            selected_options: [{ value: 'auto_resolve_check' }] 
          } 
        }
      };
      const questionData = {
        userId: 'U123456',
        content: 'テスト質問'
      };

      const result = extractReservationData(values, questionData);

      expect(result).toEqual({
        userId: 'U123456',
        content: 'テスト質問',
        reservationTime: '30分後',
        autoResolveCheck: true
      });
    });

    it('should handle missing auto resolve check', () => {
      const values = {
        reservation_time: { 
          reservation_time: { 
            selected_option: { value: '1時間後' } 
          } 
        }
      };
      const questionData = { userId: 'U123456' };

      const result = extractReservationData(values, questionData);

      expect(result.autoResolveCheck).toBe(false);
    });
  });

  describe('isReservationConsultation', () => {
    it('should return true for reservation consultation', () => {
      const questionData = {
        consultationType: CONSULTATION_TYPES.RESERVATION
      };

      expect(isReservationConsultation(questionData)).toBe(true);
    });

    it('should return false for immediate consultation', () => {
      const questionData = {
        consultationType: 'すぐ相談したい'
      };

      expect(isReservationConsultation(questionData)).toBe(false);
    });
  });
});