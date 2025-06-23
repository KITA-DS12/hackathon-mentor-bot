/**
 * mentorUtils.js のテスト
 */
import { 
  createMentionString, 
  generateMentionText, 
  extractMentorData 
} from '../../src/utils/mentorUtils.js';
import { FirestoreService } from '../../src/services/firestore.js';

// FirestoreServiceをモック
jest.mock('../../src/services/firestore.js');

describe('mentorUtils', () => {
  let mockFirestoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestoreService = {
      getAvailableMentors: jest.fn(),
      getAllMentors: jest.fn()
    };
    FirestoreService.mockImplementation(() => mockFirestoreService);
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

    it('should limit mentions to maxMentions', () => {
      const mentors = [
        { userId: 'U123' },
        { userId: 'U456' },
        { userId: 'U789' }
      ];

      const result = createMentionString(mentors, 2);

      expect(result).toBe('<@U123> <@U456>');
    });

    it('should handle empty mentors list', () => {
      const result = createMentionString([]);

      expect(result).toBe('');
    });
  });

  describe('generateMentionText', () => {
    it('should generate mention text with available mentors', async () => {
      const availableMentors = [
        { userId: 'U123' },
        { userId: 'U456' }
      ];
      mockFirestoreService.getAvailableMentors.mockResolvedValue(availableMentors);

      const result = await generateMentionText('技術的な問題');

      expect(result).toBe('🔔 **技術的な問題** の質問です\n<@U123> <@U456>');
      expect(mockFirestoreService.getAvailableMentors).toHaveBeenCalledTimes(1);
    });

    it('should fallback to all mentors when no available mentors', async () => {
      const allMentors = [
        { userId: 'U123' },
        { userId: 'U456' }
      ];
      mockFirestoreService.getAvailableMentors.mockResolvedValue([]);
      mockFirestoreService.getAllMentors.mockResolvedValue(allMentors);

      const result = await generateMentionText('技術的な問題');

      expect(result).toBe('🔔 新しい質問です\n<@U123> <@U456>');
      expect(mockFirestoreService.getAvailableMentors).toHaveBeenCalledTimes(1);
      expect(mockFirestoreService.getAllMentors).toHaveBeenCalledTimes(1);
    });

    it('should handle no mentors at all', async () => {
      mockFirestoreService.getAvailableMentors.mockResolvedValue([]);
      mockFirestoreService.getAllMentors.mockResolvedValue([]);

      const result = await generateMentionText('技術的な問題');

      expect(result).toBe('🔔 新しい質問が投稿されました（登録メンターなし）');
    });

    it('should handle firestore errors', async () => {
      mockFirestoreService.getAvailableMentors.mockRejectedValue(new Error('Database error'));

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