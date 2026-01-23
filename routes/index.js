import express from "express";
import authRoute from "./authRoute.js";
// import userRoute from "./userRoute.js";
import adminUserRoute from "./admin/adminRoute.js";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  // {
  //   path: "/user",
  //   route: userRoute,
  // },
  {
    path: "/admin",
    route: adminUserRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
