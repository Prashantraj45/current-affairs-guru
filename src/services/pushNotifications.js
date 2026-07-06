import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';

const expo = new Expo();

export async function sendDailyPushNotifications({ date, topicCount }) {
  try {
    const users = await User.find({ pushTokens: { $exists: true, $ne: [] } }).select('pushTokens');
    const allTokens = users.flatMap((u) => u.pushTokens).filter(Expo.isExpoPushToken);

    if (!allTokens.length) return;

    const messages = allTokens.map((to) => ({
      to,
      title: "Today's Current Affairs",
      body: `${topicCount} topics ready for ${date}`,
      data: { url: 'cag://feed' },
      sound: 'default',
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    console.log(`[push] Sent to ${allTokens.length} devices for ${date}`);
  } catch (err) {
    console.error('[push] Failed:', err.message);
  }
}
