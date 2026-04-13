import express from 'express';

import adminUserRoute from './admin/adminRoute.js';
import authRoute from './authRoute.js';
import { categoryRoutes } from './categoryRoute.js';
import customerRoute from './customerRoute.js';
import demoRoute from './demoRoute.js';
import { inventoryRouter } from './inventory.route.js';
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

router.use('/auth', authRoute);
router.use('/admin', adminUserRoute);
router.use('/get-states', stateRoute);
router.use('/profile', profileRoute);
router.use('/menu', menuRoutes);
router.use('/layout', layoutRoute);
router.use('/customer', customerRoute);
router.use('/category', categoryRoutes);
router.use('/qr', qrRoute);
router.use('/order', orderRoute);
router.use('/signup', signUpRoutes);
router.use('/demo', demoRoute);
router.use('/issue-reported', issueReportedRoute);
router.use('/portfolio', portfolioRoute);
router.use('/notification', notificationRoute);
router.use('/inventory', inventoryRouter);

export default router;
