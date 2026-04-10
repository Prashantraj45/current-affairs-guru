import mongoose from 'mongoose';
import Entry from '../models/Entry.js';
import Memory from '../models/Memory.js';
import MonthlyInsight from '../models/MonthlyInsight.js';

function monthFromDate(date) {
  return String(date || '').slice(0, 7);
}

function aggregateStrings(values = [], limit = 12) {
  const bucket = new Map();
  values.filter(Boolean).forEach((value) => {
    bucket.set(value, (bucket.get(value) || 0) + 1);
  });
  return [...bucket.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

export async function refreshMonthlyInsights(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return null;

  const regex = new RegExp(`^${month}-\\d{2}$`);
  const entries = await Entry.find({ date: regex }, { date: 1, insights: 1 }).sort({ date: 1 });

  const trends = aggregateStrings(entries.flatMap((entry) => entry.insights?.trends || []));
  const recurringThemes = aggregateStrings(
    entries.flatMap((entry) => entry.insights?.recurringThemes || [])
  );
  const strategyNotes = aggregateStrings(
    entries.flatMap((entry) => entry.insights?.strategyNotes || []),
    16
  );
  const highPriorityDomains = aggregateStrings(
    entries.flatMap((entry) => entry.insights?.highPriorityDomains || []),
    10
  );
  const sourceDates = entries.map((entry) => entry.date);

  const payload = {
    month,
    trends,
    recurringThemes,
    strategyNotes,
    highPriorityDomains,
    sourceDates,
    updatedAt: new Date(),
  };

  return MonthlyInsight.findOneAndUpdate({ month }, payload, { upsert: true, new: true });
}

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
    await refreshMonthlyInsights(monthFromDate(today));
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

export async function getMonthlyInsights(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return null;
  let doc = await MonthlyInsight.findOne({ month });
  if (!doc) doc = await refreshMonthlyInsights(month);
  return doc;
}

export async function listMonthlyInsights() {
  return MonthlyInsight.find({}, { month: 1, updatedAt: 1 }).sort({ month: -1 });
}
