import Joi from "joi";

const raiseIssueValidator = {
  body: Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
  }),
};

const getIssueTicketsValidator = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    status: Joi.string()
      .trim()
      .valid("pending", "in_progress", "resolve")
      .optional(),
    ticketId: Joi.string().trim().optional(),
    adminId: Joi.string().hex().length(24).optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const updateIssueStatusValidator = {
  params: Joi.object({
    ticketId: Joi.string().trim().required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .trim()
      .valid("pending", "in_progress", "resolve")
      .required(),
  }),
};

export {
  raiseIssueValidator,
  getIssueTicketsValidator,
  updateIssueStatusValidator,
};
