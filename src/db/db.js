import mongoose from 'mongoose';
import Entry from '../models/Entry.js';
import Memory from '../models/Memory.js';

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

export async function saveEntry(entry) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await Entry.findOneAndUpdate(
      { date: today },
      { date: today, topics: entry.topics || [], insights: entry.insights || {}, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`Entry saved: ${result.topics.length} topics`);
    return result;
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
}

export async function getEntry(date) {
  try {
    return await Entry.findOne({ date });
  } catch (error) {
    console.error('Error getting entry:', error);
    return null;
  }
}

export async function getAllEntries() {
  try {
    return await Entry.find().sort({ date: -1 });
  } catch (error) {
    console.error('Error getting all entries:', error);
    return [];
  }
}

// Lightweight projection for history list — no heavy content fields
export async function getHistoryEntries() {
  try {
    return await Entry.find(
      {},
      { date: 1, 'topics.id': 1, 'topics.title': 1, 'topics.category': 1, 'topics.importance': 1 }
    ).sort({ date: -1 });
  } catch (error) {
    console.error('Error getting history entries:', error);
    return [];
  }
}

export async function getLatestEntry() {
  try {
    return await Entry.findOne().sort({ date: -1 });
  } catch (error) {
    console.error('Error getting latest entry:', error);
    return null;
  }
}

export async function entryExists(date) {
  try {
    const entry = await Entry.findOne({ date });
    return entry !== null;
  } catch (error) {
    console.error('Error checking entry:', error);
    return false;
  }
}

export async function writeREADME(insights) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await Memory.findOneAndUpdate(
      { type: 'system_memory' },
      { type: 'system_memory', date: today, ...insights, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('Memory updated');
  } catch (error) {
    console.error('Error writing memory:', error);
    throw error;
  }
}

export async function readREADME() {
  try {
    const memory = await Memory.findOne({ type: 'system_memory' });
    if (!memory) {
      return {
        trends: [],
        recurringThemes: [],
        strategyNotes: ['Focus on Environment, Polity, and Economy for upcoming exam'],
        highPriorityDomains: ['Environment & Climate', 'Polity & Governance', 'Economy & Reports', 'International Relations', 'Science & Tech']
      };
    }
    return {
      trends: memory.trends || [],
      recurringThemes: memory.recurringThemes || [],
      strategyNotes: memory.strategyNotes || [],
      highPriorityDomains: memory.highPriorityDomains || []
    };
  } catch (error) {
    console.error('Error reading memory:', error);
    return null;
  }
}
