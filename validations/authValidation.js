import Joi from "joi";

/**
 * Register (superadmin)
 */
const registerValidator = {
  body: Joi.object().keys({
    email: Joi.string()
      .email()
      .min(5)
      .max(2000)
      .trim()
      .required(),

    password: Joi.string()
      .min(6)
      .max(30)
      .required(),

    role: Joi.string()
      .valid("superadmin")
      .default("superadmin"),
  }).unknown(true),
};

/**
 * Login
 */
const loginValidator = {
  body: Joi.object().keys({
    email: Joi.string()
      .email()
      .min(5)
      .max(2000)
      .trim()
      .required(),

    password: Joi.string()
      .min(6)
      .max(30)
      .required(),
  }).unknown(true),
};

/**
 * Logout
 * (Token comes from header, body not required)
 */
const logoutValidator = {
  headers: Joi.object({
    authorization: Joi.string().required(),
  }).unknown(true),
};
const createAdminValidator = {
  body: Joi.object().keys({
    firstName: Joi.string()
      .empty()
      .min(1)
      .max(1000)
      .trim()
      .required(),

    lastName: Joi.string()
      .empty()
      .min(1)
      .max(1000)
      .trim()
      .required(),

    cafeName: Joi.string()
      .empty()
      .min(1)
      .max(1000)
      .trim()
      .required(),

    email: Joi.string()
      .empty()
      .min(5)
      .max(2000)
      .trim()
      .email()
      .required(),

    password: Joi.string()
      .min(6)
      .max(30)
      .required(),
  }).unknown(true),
};

/**
 * Update Admin
 */
const updateAdminValidator = {
  params: Joi.object().keys({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),

  body: Joi.object().keys({
    firstName: Joi.string()
      .empty()
      .min(1)
      .max(1000)
      .trim(),

    lastName: Joi.string()
      .empty()
      .min(1)
      .max(1000)
      .trim(),

    cafeName: Joi.string()
      .empty()
      .min(1)
      .max(1000)
      .trim(),

    email: Joi.string()
      .empty()
      .min(5)
      .max(2000)
      .trim()
      .email(),

    password: Joi.string()
      .min(6)
      .max(30),
  }).unknown(true),
};

/**
 * Delete Admin
 */
const deleteAdminValidator = {
  params: Joi.object().keys({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};

/**
 * List Admins (Pagination)
 */
const listAdminsValidator = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string().empty().trim(), // e.g. createdAt:desc
  }),
};

export {
  registerValidator,
  loginValidator,
  logoutValidator,
  createAdminValidator,
  updateAdminValidator,
  deleteAdminValidator,
  listAdminsValidator
};




// import Joi from "joi";

// const signUpValidator = {
//     body: Joi.object().keys({
//         platform: Joi.string().empty().max(300).trim(),
//         role: Joi.string().empty().valid('rider', 'driver').trim(),
//         phoneNumber: Joi.string().empty().length(10).pattern(/^[0-9]+$/).trim().required(),
//         fcmToken: Joi.string().empty().max(1000).trim(),
//         countryCode: Joi.string().empty().trim()
//     }).unknown(true)
// };

// const driverSignUpValidator = {
//     body: Joi.object().keys({
//         platform: Joi.string().empty().max(300).trim(),
//         role: Joi.string().empty().valid('rider', 'driver').trim(),
//         phoneNumber: Joi.string().empty().length(10).pattern(/^[0-9]+$/).trim().required(),
//         fcmToken: Joi.string().empty().max(1000).trim(),
//         countryCode: Joi.string().empty().trim(),
//         firstName: Joi.string().empty().max(1000).trim().required(),
//         lastName: Joi.string().empty().max(1000).trim().required(),
//         email: Joi.string().empty().min(5).max(2000).trim().email().required(),
//     }).unknown(true)
// };

// const sendOtp = {
//     body: Joi.object().keys({
//         type: Joi.string().empty().valid('phone', 'email').trim(),
//         sendTo: Joi.string().empty().length(10).pattern(/^[0-9]+$/).trim().required(),
//     })
// };

// const updateProfile = {
//     body: Joi.object().keys({
//         firstName: Joi.string().empty().min(1).max(1000).trim(),
//         lastName: Joi.string().empty().min(1).max(1000).trim(),
//         email: Joi.string().empty().min(5).max(2000).trim().email(),
//         phoneNumber: Joi.string().empty().length(10).pattern(/^[0-9]+$/).trim(),
//     }).unknown(true)
// };

// export {
//     signUpValidator,
//     sendOtp,
//     updateProfile,
//     driverSignUpValidator
// };