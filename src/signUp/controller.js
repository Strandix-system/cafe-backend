import { pick } from '../../utils/pick.js';
import { sendSuccessResponse } from '../../utils/response.js';

import { signUpService } from './service.js';
export const signUpController = {
  createSubscription: async (req, res) => {
    const { planId } = req.body || {};
    const result = await signUpService.createSubscription(req.user._id, planId);
    sendSuccessResponse(res, 200, 'Subscription created successfully.', result);
  },

  verifySubscription: async (req, res) => {
    const result = await signUpService.verifySubscription(req.body, req.user);
    sendSuccessResponse(
      res,
      200,
      'Subscription verified successfully.',
      result,
    );
  },
  checkEmail: async (req, res) => {
    const { email, phoneNumber } = req.body;
    await signUpService.checkEmail(email, phoneNumber);
    sendSuccessResponse(res, 200, 'Email is Valid');
  },
  getTransactions: async (req, res) => {
    const filter = pick(req.query, [
      'status',
      'userId',
      'search',
      'fromDate',
      'toDate',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    let userId = null;

    if (req.user.role === 'admin') {
      filter.user = req.user._id;
      userId = req.user._id;
    }

    if (req.user.role === 'superadmin') {
      if (filter.userId) {
        filter.user = filter.userId;
        userId = filter.userId;
      }

      delete filter.userId;
    }

    const transactions = await signUpService.getTransactions(
      filter,
      options,
      userId,
    );
    sendSuccessResponse(
      res,
      200,
      'Transactions fetched successfully',
      transactions,
    );
  },
  getAllPlans: async (req, res) => {
    const plans = await signUpService.getAllPlansService();
    sendSuccessResponse(res, 200, 'Plans fetched successfully', plans);
  },
  renewSubscription: async (req, res) => {
    const subscription = await signUpService.renewSubscription(req.user._id);
    sendSuccessResponse(
      res,
      200,
      'Renew subscription created successfully',
      subscription,
    );
  },
  verifyRenewSubscription: async (req, res) => {
    const result = await signUpService.verifyRenewSubscription(
      req.body,
      req.user,
    );
    sendSuccessResponse(res, 200, 'Subscription renewed successfully', result);
  },
  registerUser: async (req, res) => {
    const result = await signUpService.registerUserWithTrial(req.body);
    sendSuccessResponse(
      res,
      201,
      'User registered successfully. 14 days free trial started.',
      result,
    );
  },
};

export default signUpController;
