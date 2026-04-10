import mongoose from 'mongoose';
import Entry from '../models/Entry.js';
import Memory from '../models/Memory.js';

// Connect to MongoDB
export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in environment variables');
    }
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
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
      {
        date: today,
        ...entry,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log('Entry saved successfully');
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

export async function writeREADME(data) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await Memory.findOneAndUpdate(
      { type: 'system_memory' },
      {
        type: 'system_memory',
        date: today,
        ...data,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log('README updated successfully');
    return result;
  } catch (error) {
    console.error('Error writing README:', error);
    throw error;
  }
}

export async function readREADME() {
  try {
    const memory = await Memory.findOne({ type: 'system_memory' });
    if (!memory) {
      return {
        date: new Date().toISOString().split('T')[0],
        version: 'v1',
        summary: 'System initialized',
        high_priority_domains: [
          'Environment & Climate',
          'Polity & Governance',
          'Economy & Reports',
          'International Relations',
          'Science & Tech'
        ],
        key_trends: [],
        recurring_topics: [],
        static_focus_areas: [
          'Environment & Climate',
          'Polity & Governance',
          'Economy & Reports',
          'International Relations',
          'Science & Tech'
        ],
        exam_strategy_notes: [],
        data_quality_notes: 'Initial run'
      };
    }
    return memory;
  } catch (error) {
    console.error('Error reading README:', error);
    return null;
  }
}
