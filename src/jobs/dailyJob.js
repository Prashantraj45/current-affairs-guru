import 'dotenv/config';
import { connectDB, runDailyJob } from '../services/scheduler.js';

async function main() {
  try {
    await connectDB();
    await runDailyJob();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
