import { Firestore, FieldValue } from '@google-cloud/firestore';
import { config } from '../config/index.js';
import { RetryUtils } from '../utils/retryUtils.js';

export { FieldValue };

// Firestoreインスタンスをグローバルで共有（シングルトン）
let firestoreInstance = null;

export class FirestoreService {
  constructor() {
    if (!firestoreInstance) {
      console.log(`[${Date.now()}] Creating new Firestore instance with project: ${config.google.projectId}`);
      firestoreInstance = new Firestore({
        projectId: config.google.projectId,
      });
      console.log(`[${Date.now()}] Firestore instance created`);
    } else {
      console.log(`[${Date.now()}] Reusing existing Firestore instance`);
    }
    this.db = firestoreInstance;
  }

  async createQuestion(questionData) {
    try {
      console.log(`[${Date.now()}] Firestore: Starting to save question...`);
      
      // タイムアウトを設定してFirestore操作を実行
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore operation timeout')), 10000); // 10秒タイムアウト
      });
      
      const operationPromise = this.db.collection('questions').add({
        ...questionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const docRef = await Promise.race([operationPromise, timeoutPromise]);
      console.log(`[${Date.now()}] Firestore: Question saved successfully with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error(`[${Date.now()}] Firestore: Failed to save question:`, error);
      throw error;
    }
  }

  async getQuestion(questionId) {
    try {
      const doc = await this.db.collection('questions').doc(questionId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting question:', error);
      throw error;
    }
  }

  async getQuestionByMessageTs(channelId, messageTs) {
    try {
      console.log(`Searching for question with messageTs: ${messageTs} in channel: ${channelId}`);
      const querySnapshot = await this.db.collection('questions')
        .where('messageTs', '==', messageTs)
        .where('sourceChannelId', '==', channelId)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        console.log('No question found with messageTs');
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      console.log(`Found question by messageTs: ${doc.id}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting question by messageTs:', error);
      return null;
    }
  }

  async updateQuestion(questionId, updateData) {
    try {
      // タイムアウトを設定してFirestore操作を実行
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore update timeout')), 5000); // 5秒タイムアウト
      });
      
      const operationPromise = this.db
        .collection('questions')
        .doc(questionId)
        .update({
          ...updateData,
          updatedAt: new Date(),
        });
      
      await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
      console.error(`[${Date.now()}] Firestore: Failed to update question ${questionId}:`, error);
      throw error;
    }
  }

  async addStatusHistory(questionId, status, userId) {
    return RetryUtils.retryFirestoreOperation(async () => {
      const statusEntry = {
        status,
        timestamp: new Date(),
        user: userId,
      };

      await this.db
        .collection('questions')
        .doc(questionId)
        .update({
          statusHistory: FieldValue.arrayUnion(statusEntry),
          status,
          updatedAt: new Date(),
        });
    });
  }

  async getMentorAvailability(userId) {
    try {
      const doc = await this.db.collection('mentors').doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data();
    } catch (error) {
      console.error('Error getting mentor availability:', error);
      throw error;
    }
  }

  async updateMentorAvailability(userId, availability) {
    try {
      await this.db.collection('mentors').doc(userId).set(
        {
          userId,
          availability,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating mentor availability:', error);
      throw error;
    }
  }

  async getQuestionsForMentor(mentorId, status = null) {
    try {
      let query = this.db
        .collection('questions')
        .where('assignedMentors', 'array-contains', mentorId)
        .orderBy('createdAt', 'desc');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting questions for mentor:', error);
      throw error;
    }
  }

  async getQuestionsByStatus(status) {
    try {
      const snapshot = await this.db
        .collection('questions')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting questions by status:', error);
      throw error;
    }
  }

  async getAllQuestions() {
    try {
      const snapshot = await this.db
        .collection('questions')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all questions:', error);
      throw error;
    }
  }

  async getAllMentors() {
    try {
      const snapshot = await this.db.collection('mentors').get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all mentors:', error);
      throw error;
    }
  }

  async createOrUpdateMentor(userId, mentorData) {
    try {
      await this.db
        .collection('mentors')
        .doc(userId)
        .set(
          {
            ...mentorData,
            updatedAt: new Date(),
          },
          { merge: true }
        );
    } catch (error) {
      console.error('Error creating/updating mentor:', error);
      throw error;
    }
  }

  async getMentor(userId) {
    try {
      const doc = await this.db.collection('mentors').doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting mentor:', error);
      throw error;
    }
  }

  async getAvailableMentors() {
    try {
      const snapshot = await this.db
        .collection('mentors')
        .where('availability', '==', 'available')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting available mentors:', error);
      throw error;
    }
  }

  async createMentor(mentorData) {
    try {
      const { userId, ...data } = mentorData;
      await this.db
        .collection('mentors')
        .doc(userId)
        .set({
          ...data,
          userId,
          registeredAt: data.registeredAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
        });
      return userId;
    } catch (error) {
      console.error('Error creating mentor:', error);
      throw error;
    }
  }

  async updateMentor(userId, updateData) {
    try {
      await this.db
        .collection('mentors')
        .doc(userId)
        .update({
          ...updateData,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating mentor:', error);
      throw error;
    }
  }

  async deleteMentor(userId) {
    try {
      await this.db.collection('mentors').doc(userId).delete();
    } catch (error) {
      console.error('Error deleting mentor:', error);
      throw error;
    }
  }
}
