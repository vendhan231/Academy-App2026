import { processNotificationQueue } from './notificationService';

if (!process.env.MONGODB_URI?.trim()) {
  throw new Error('The WhatsApp queue worker requires MONGODB_URI so jobs persist across processes.');
}

console.info('Vendhan WhatsApp queue worker started.');
await processNotificationQueue();
const timer = setInterval(() => {
  void processNotificationQueue();
}, 15_000);

timer.unref?.();

const shutdown = () => {
  clearInterval(timer);
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
