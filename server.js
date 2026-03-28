import http from 'http';

import app from './app.js';
import { notificationCleanup } from './notification.cleanup.cron.js';
import { initSocket } from './socket.js';
import { subscriptionNotifier } from './subscription.expire.cron.js';

const port = process.env.PORT || 8080;

const server = http.createServer(app);

initSocket(server);
subscriptionNotifier.initSubscriptionNotificationScheduler();
notificationCleanup.initNotificationCleanupScheduler();

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
