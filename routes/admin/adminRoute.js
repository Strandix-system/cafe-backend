import express from "express";
import controller from "../../src/admin/controller.js";
import { validate } from "../../middleware/validate.js";
import { tokenVerification } from "../../middleware/auth.js";
import { allowRoles } from "../../middleware/permission.js";
import {
  createAdminValidator,
  updateAdminValidator,
  deleteAdminValidator,
  listAdminsValidator,
} from "../../validations/authValidation.js";

const router = express.Router();

router.post(
  "/create-admin",
  tokenVerification,
  allowRoles("superadmin"),
  validate(createAdminValidator),
  controller.createAdmin
);

router.put(
  "/update-admin/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(updateAdminValidator),
  controller.updateAdmin
);

router.delete(
  "/delete-admin/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(deleteAdminValidator),
  controller.deleteAdmin
);

router.get(
  "/admins",
  tokenVerification,
  allowRoles("superadmin"),
  validate(listAdminsValidator),
  controller.listAdmins
);

export default router;




// import express from "express";
// import { tokenVerification } from "../../middleware/auth.js";
// import { allowRoles } from "../../middleware/permission.js";
// import controller from "../../src/admin/controller.js";
// import {createAdminValidator,updateAdminValidator,deleteAdminValidator} from "../../validations/authValidation.js"

// const router = express.Router();

// router.post(
//   "/create-admin",
//   tokenVerification,
//   allowRoles("superadmin"),
//   createAdminValidator,
//   controller.createAdmin
// );
// router.put(
//   "/update-admin/:id",
//   tokenVerification,
//   allowRoles("superadmin"),
//   updateAdminValidator,
//   controller.updateAdmin
// );
// router.delete(
//   "/delete-admin/:id",
//   tokenVerification,
//   allowRoles("superadmin"),
//   deleteAdminValidator,
//   controller.deleteAdmin
// );
// router.get(
//   "/get-users",
//   tokenVerification,
//   allowRoles("superadmin"),
//   controller.listAdmins
// );

// export default router;
