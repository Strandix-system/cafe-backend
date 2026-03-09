import { signUpService } from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import { pick } from "../../utils/pick.js";
import { ApiError } from "../../utils/apiError.js";
export const signUpController = {

  // :one: Create Subscription
  createSubscription: async (req, res, next) => {
    try {
      const result = await signUpService.createSubscription(req.body);
      return sendSuccessResponse(res, 200, "subscription created successfully.", result);
    } catch (error) {
      next(error);
    }
  },
  // :two: Verify Subscription Payment
  verifySubscription: async (req, res, next) => {
    try {
      const result = await signUpService.verifySubscriptionAndCreateUser(req.body);
      return sendSuccessResponse(res, 200, "subscription verified and user created successfully.", result);
    } catch (error) {
      next(error);
    }
  },
  checkEmail: async (req, res, next) => {
    try {
      const { email, phoneNumber } = req.body;
      if (!email) {
        throw new ApiError(400, "email is required");
      }
      const result = await signUpService.checkEmailExists(email, phoneNumber);
      return sendSuccessResponse(res, 200, "Email is Valid", result);
    } catch (error) {
      next(error)
    }
  },
  getTransactions: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["status", "adminId", "search", "fromDate", "toDate",]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate",]);
       let userId = null;
      // ADMIN → only his transactions
      if (req.user.role === "admin") {
        filter.user = req.user._id;
        userId = req.user._id;
      }

      // SUPERADMIN → transactions of selected admin
      if (req.user.role === "superadmin") {
        if (filter.adminId) {
          filter.user = filter.adminId;
          userId = filter.adminId;
        }

        delete filter.adminId;
      }
      // PASS FULL USER OBJECT (IMPORTANT)
      const transactions = await signUpService.getTransactions(
        filter,
        options,
        userId
      );
      return sendSuccessResponse(res, 200, "Transactions fetched successfully", transactions);
    } catch (error) {
      next(error);
    }
  },
  getAllPlans: async (req, res, next) => {
    try {
      const plans = await signUpService.getAllPlansService();
      return sendSuccessResponse(res, 200, "Plans fetched successfully", plans);
    } catch (error) {
      next(error);
    }
  },
  renewSubscription: async (req, res, next) => {
    try {
      const subscription = await signUpService.renewSubscription(req.user._id);
      return sendSuccessResponse(res, 200, "Renew subscription created successfully", subscription);
    } catch (error) {
      next(error);
    }
  },
  verifyRenewSubscription: async (req, res, next) => {
    try {
      const result = await signUpService.verifyRenewSubscription(req.body, req.user);
      return sendSuccessResponse(res, 200, "Subscription renewed successfully", result);
    } catch (error) {
      next(error);
    }
  },
};
