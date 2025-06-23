import { Firestore } from '@google-cloud/firestore';
import { config } from '../config/index.js';

export class FirestoreService {
  constructor() {
    this.db = new Firestore({
      projectId: config.google.projectId,
    });
  }

  async createQuestion(questionData) {
    try {
      const docRef = await this.db.collection('questions').add({
        ...questionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating question:', error);
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

  async updateQuestion(questionId, updateData) {
    try {
      await this.db
        .collection('questions')
        .doc(questionId)
        .update({
          ...updateData,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  async addStatusHistory(questionId, status, userId) {
    try {
      const statusEntry = {
        status,
        timestamp: new Date(),
        user: userId,
      };

      await this.db
        .collection('questions')
        .doc(questionId)
        .update({
          statusHistory: this.db.FieldValue.arrayUnion(statusEntry),
          status,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error adding status history:', error);
      throw error;
    }
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
        .where('assignedMentor', '==', mentorId)
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

  async getAllMentors() {
    try {
      const snapshot = await this.db.collection('mentors').get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all mentors:', error);
      throw error;
    }
  }

  async setMentorSchedule(userId, date, timeSlots) {
    try {
      const mentorRef = this.db.collection('mentors').doc(userId);
      const doc = await mentorRef.get();

      let schedule = [];
      if (doc.exists && doc.data().schedule) {
        schedule = doc.data().schedule.filter((item) => item.day !== date);
      }

      schedule.push({
        day: date,
        timeSlots: timeSlots,
      });

      await mentorRef.set(
        {
          userId,
          schedule,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error setting mentor schedule:', error);
      throw error;
    }
  }

  async getMentorSchedule(userId) {
    try {
      const doc = await this.db.collection('mentors').doc(userId).get();
      if (!doc.exists) {
        return [];
      }
      return doc.data().schedule || [];
    } catch (error) {
      console.error('Error getting mentor schedule:', error);
      throw error;
    }
  }

  async createOrUpdateMentor(userId, mentorData) {
    try {
      await this.db.collection('mentors').doc(userId).set(
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

  async getMentorsBySpecialty(specialty) {
    try {
      const snapshot = await this.db
        .collection('mentors')
        .where('specialties', 'array-contains', specialty)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting mentors by specialty:', error);
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
