import express from 'express';

import adminUserRoute from './admin/adminRoute.js';
import authRoute from './authRoute.js';
import { categoryRoutes } from './categoryRoute.js';
import customerRoute from './customerRoute.js';
import demoRoute from './demoRoute.js';
import { issueReportedRoute } from './issueReported.route.js';
import layoutRoute from './layoutRoute.js';
import { menuRoutes } from './menuRoute.js';
import notificationRoute from './notification.route.js';
import orderRoute from './orderRoute.js';
import { portfolioRoute } from './portfolio.route.js';
import profileRoute from './profileRoute.js';
import qrRoute from './qrRoute.js';
import { signUpRoutes } from './signUp.js';
import stateRoute from './stateRoute.js';
const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/admin',
    route: adminUserRoute,
  },
  {
    path: '/get-states',
    route: stateRoute,
  },
  {
    path: '/profile',
    route: profileRoute,
  },
  {
    path: '/menu',
    route: menuRoutes,
  },
  {
    path: '/layout',
    route: layoutRoute,
  },
  {
    path: '/customer',
    route: customerRoute,
  },
  {
    path: '/category',
    route: categoryRoutes,
  },
  {
    path: '/qr',
    route: qrRoute,
  },
  {
    path: '/order',
    route: orderRoute,
  },
  {
    path: '/signup',
    route: signUpRoutes,
  },
  {
    path: '/demo',
    route: demoRoute,
  },
  {
    path: '/issue-reported',
    route: issueReportedRoute,
  },
  {
    path: '/portfolio',
    route: portfolioRoute,
  },
  {
    path: '/notification',
    route: notificationRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
export default router;
