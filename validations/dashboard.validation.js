import Joi from "joi";

const objectId = Joi.string().hex().length(24);
const date = Joi.date().iso();

const dashboardStatsValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
  }),
};

const dashboardSalesValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
    startDate: date.optional(),
    endDate: date.optional(),
  }),
};

const dashboardItemPerformanceValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
  }),
};

const dashboardPeakTimeValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
    startDate: date.optional(),
    endDate: date.optional(),
  }),
};

const dashboardTablePerformanceValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
  }),
};

const dashboardTopCustomersValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
    sortBy: Joi.string().valid("order", "orders", "amount").optional(),
  }),
};

const dashboardTopCafesValidator = {
  query: Joi.object({
    sortBy: Joi.string().valid("order", "orders", "amount", "rating").optional(),
  }),
};

const dashboardPlatformSalesValidator = {
  query: Joi.object({
    startDate: date.optional(),
    endDate: date.optional(),
  }),
};

const dashboardAdminAnalyticsValidator = {
  query: Joi.object({
    adminId: objectId.optional(),
    startDate: date.optional(),
    endDate: date.optional(),
    sortBy: Joi.string().valid("order", "amount").optional(),
  }),
};

export {
  dashboardStatsValidator,
  dashboardSalesValidator,
  dashboardItemPerformanceValidator,
  dashboardPeakTimeValidator,
  dashboardTablePerformanceValidator,
  dashboardTopCustomersValidator,
  dashboardTopCafesValidator,
  dashboardPlatformSalesValidator,
  dashboardAdminAnalyticsValidator,
};
