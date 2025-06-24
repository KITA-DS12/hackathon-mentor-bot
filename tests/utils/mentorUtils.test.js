/**
 * mentorUtils.js のテスト
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  createMentionString, 
  generateMentionText, 
  extractMentorData 
} from '../../src/utils/mentorUtils.js';
import { FirestoreService } from '../../src/services/firestore.js';

// FirestoreServiceをモック
vi.mock('../../src/services/firestore.js', () => {
  const mockInstance = {
    getAvailableMentors: vi.fn(),
    getAllMentors: vi.fn()
  };
  return {
    FirestoreService: vi.fn(() => mockInstance),
    __mockInstance: mockInstance
  };
});

// モックインスタンスをインポート
const { __mockInstance } = await import('../../src/services/firestore.js');

describe('mentorUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMentionString', () => {
    it('should create mention string from mentors list', () => {
      const mentors = [
        { userId: 'U123' },
        { userId: 'U456' },
        { userId: 'U789' }
      ];

      const result = createMentionString(mentors);

      expect(result).toBe('<@U123> <@U456> <@U789>');
    });

    it('should handle empty mentors list', () => {
      const result = createMentionString([]);

      expect(result).toBe('');
    });
  });

  describe('generateMentionText', () => {
    it('should generate mention text with all mentors', async () => {
      __mockInstance.getAllMentors.mockResolvedValue([
        { userId: 'U123' },
        { userId: 'U456' }
      ]);

      const result = await generateMentionText('技術的な問題');

      expect(result).toBe('🔔 *技術的な問題* の質問です\n<@U123> <@U456>');
      expect(__mockInstance.getAllMentors).toHaveBeenCalledTimes(1);
    });

    it('should handle no mentors at all', async () => {
      __mockInstance.getAllMentors.mockResolvedValue([]);

      const result = await generateMentionText('技術的な問題');

      expect(result).toBe('🔔 新しい質問が投稿されました（登録メンターなし）');
    });

    it('should handle firestore errors', async () => {
      __mockInstance.getAllMentors.mockRejectedValue(new Error('Database error'));

      const result = await generateMentionText('技術的な問題');

      expect(result).toBe('🔔 新しい質問が投稿されました');
      expect(console.error).toHaveBeenCalledWith('Error generating mention text:', expect.any(Error));
    });
  });

  describe('extractMentorData', () => {
    it('should extract mentor data from modal values', () => {
      const values = {
        mentor_name: { name: { value: 'テストメンター' } },
        mentor_bio: { bio: { value: '経験豊富なエンジニア' } },
        initial_availability: { 
          availability: { 
            selected_option: { value: 'available' } 
          } 
        }
      };
      const userId = 'U123456';
      const userName = 'test.user';

      const result = extractMentorData(values, userId, userName);

      expect(result).toEqual({
        userId: 'U123456',
        userName: 'test.user',
        name: 'テストメンター',
        bio: '経験豊富なエンジニア',
        availability: 'available',
        registeredAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should handle missing bio', () => {
      const values = {
        mentor_name: { name: { value: 'テストメンター' } },
        initial_availability: { 
          availability: { 
            selected_option: { value: 'available' } 
          } 
        }
      };
      const userId = 'U123456';
      const userName = 'test.user';

      const result = extractMentorData(values, userId, userName);

      expect(result.bio).toBe('');
    });
  });
});