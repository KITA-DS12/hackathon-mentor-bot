/**
 * FirestoreService のテスト
 */
import { FirestoreService } from '../../src/services/firestore.js';
import { Firestore } from '@google-cloud/firestore';

// Firestoreをモック
jest.mock('@google-cloud/firestore');

describe('FirestoreService', () => {
  let firestoreService;
  let mockFirestore;
  let mockCollection;
  let mockDoc;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDoc = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      id: 'doc123'
    };
    
    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      add: jest.fn(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn()
    };
    
    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
    
    Firestore.mockImplementation(() => mockFirestore);
    firestoreService = new FirestoreService();
  });

  describe('createQuestion', () => {
    it('should create a new question document', async () => {
      const questionData = {
        userId: 'U123456',
        content: 'テスト質問',
        category: '技術的な問題'
      };
      
      mockCollection.add.mockResolvedValue({ id: 'question123' });

      const result = await firestoreService.createQuestion(questionData);

      expect(mockFirestore.collection).toHaveBeenCalledWith('questions');
      expect(mockCollection.add).toHaveBeenCalledWith({
        ...questionData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(result).toBe('question123');
    });

    it('should handle creation errors', async () => {
      const questionData = { userId: 'U123456', content: 'テスト質問' };
      mockCollection.add.mockRejectedValue(new Error('Firestore error'));

      await expect(firestoreService.createQuestion(questionData)).rejects.toThrow('Firestore error');
    });
  });

  describe('getQuestion', () => {
    it('should get question by ID', async () => {
      const questionData = {
        userId: 'U123456',
        content: 'テスト質問'
      };
      
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'question123',
        data: () => questionData
      });

      const result = await firestoreService.getQuestion('question123');

      expect(mockFirestore.collection).toHaveBeenCalledWith('questions');
      expect(mockCollection.doc).toHaveBeenCalledWith('question123');
      expect(mockDoc.get).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'question123',
        ...questionData
      });
    });

    it('should return null for non-existent question', async () => {
      mockDoc.get.mockResolvedValue({
        exists: false
      });

      const result = await firestoreService.getQuestion('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateQuestion', () => {
    it('should update question data', async () => {
      const updateData = { status: 'in_progress' };
      mockDoc.update.mockResolvedValue();

      await firestoreService.updateQuestion('question123', updateData);

      expect(mockFirestore.collection).toHaveBeenCalledWith('questions');
      expect(mockCollection.doc).toHaveBeenCalledWith('question123');
      expect(mockDoc.update).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('createMentor', () => {
    it('should create a new mentor document', async () => {
      const mentorData = {
        userId: 'U123456',
        name: 'テストメンター',
        availability: 'available'
      };
      
      mockDoc.set.mockResolvedValue();

      await firestoreService.createMentor(mentorData);

      expect(mockFirestore.collection).toHaveBeenCalledWith('mentors');
      expect(mockCollection.doc).toHaveBeenCalledWith('U123456');
      expect(mockDoc.set).toHaveBeenCalledWith({
        ...mentorData,
        registeredAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('getMentor', () => {
    it('should get mentor by user ID', async () => {
      const mentorData = {
        userId: 'U123456',
        name: 'テストメンター'
      };
      
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => mentorData
      });

      const result = await firestoreService.getMentor('U123456');

      expect(mockFirestore.collection).toHaveBeenCalledWith('mentors');
      expect(mockCollection.doc).toHaveBeenCalledWith('U123456');
      expect(result).toEqual(mentorData);
    });

    it('should return null for non-existent mentor', async () => {
      mockDoc.get.mockResolvedValue({
        exists: false
      });

      const result = await firestoreService.getMentor('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllMentors', () => {
    it('should get all mentors', async () => {
      const mentorsData = [
        { userId: 'U123', name: 'メンター1' },
        { userId: 'U456', name: 'メンター2' }
      ];
      
      mockCollection.get.mockResolvedValue({
        docs: mentorsData.map((data, index) => ({
          id: `mentor${index}`,
          data: () => data
        }))
      });

      const result = await firestoreService.getAllMentors();

      expect(mockFirestore.collection).toHaveBeenCalledWith('mentors');
      expect(mockCollection.get).toHaveBeenCalled();
      expect(result).toEqual(mentorsData);
    });

    it('should return empty array when no mentors', async () => {
      mockCollection.get.mockResolvedValue({
        docs: []
      });

      const result = await firestoreService.getAllMentors();

      expect(result).toEqual([]);
    });
  });

  describe('getAvailableMentors', () => {
    it('should get only available mentors', async () => {
      const availableMentors = [
        { userId: 'U123', name: 'メンター1', availability: 'available' }
      ];
      
      mockCollection.get.mockResolvedValue({
        docs: availableMentors.map((data, index) => ({
          id: `mentor${index}`,
          data: () => data
        }))
      });

      const result = await firestoreService.getAvailableMentors();

      expect(mockFirestore.collection).toHaveBeenCalledWith('mentors');
      expect(mockCollection.where).toHaveBeenCalledWith('availability', '==', 'available');
      expect(mockCollection.get).toHaveBeenCalled();
      expect(result).toEqual(availableMentors);
    });
  });

  describe('updateMentor', () => {
    it('should update mentor data', async () => {
      const updateData = { availability: 'busy' };
      mockDoc.update.mockResolvedValue();

      await firestoreService.updateMentor('U123456', updateData);

      expect(mockFirestore.collection).toHaveBeenCalledWith('mentors');
      expect(mockCollection.doc).toHaveBeenCalledWith('U123456');
      expect(mockDoc.update).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('deleteMentor', () => {
    it('should delete mentor document', async () => {
      mockDoc.delete.mockResolvedValue();

      await firestoreService.deleteMentor('U123456');

      expect(mockFirestore.collection).toHaveBeenCalledWith('mentors');
      expect(mockCollection.doc).toHaveBeenCalledWith('U123456');
      expect(mockDoc.delete).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle Firestore connection errors', async () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(firestoreService.getMentor('U123456')).rejects.toThrow('Connection failed');
    });

    it('should handle document operation errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Document read failed'));

      await expect(firestoreService.getMentor('U123456')).rejects.toThrow('Document read failed');
    });
  });
});