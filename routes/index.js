import express from "express";
import authRoute from "./authRoute.js";
import adminUserRoute from "./admin/adminRoute.js";
import stateRoute from "./stateRoute.js"
import { menuRoutes } from "./menuRoute.js"
import layoutRoute from "./layoutRoute.js";
import profileRoute from "./profileRoute.js";
import customerRoute from "./customerRoute.js";
import { categoryRoutes } from "./categoryRoute.js";
import orderRoute from "./orderRoute.js";
import qrRoute from "./qrRoute.js";
import demoRoute from "./demoRoute.js";
import { issueReportedRoute } from "./issueReportedRoute.js";
import { portfolioRoute } from "./portfolioRoute.js";

import { signUpRoutes } from "./signUp.js";
const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/admin",
    route: adminUserRoute,
  },
  {
    path: "/get-states",
    route: stateRoute,
  },
  {
    path: "/profile",
    route: profileRoute
  },
  {
    path: "/menu",
    route: menuRoutes,
  },
  {
    path: "/layout",
    route: layoutRoute,
  },
  {
    path: "/customer",
    route: customerRoute,
  }, {
    path: "/category",
    route: categoryRoutes,
  },
  {
    path: "/qr",
    route: qrRoute,
  },
  {
    path: "/order",
    route: orderRoute,
  },
  {
    path: "/signup",
    route: signUpRoutes,
  },
  {
    path: "/demo",
    route: demoRoute,
  },
  {
    path: "/issue-reported",
    route: issueReportedRoute,
  },
  {
    path: "/portfolio",
    route: portfolioRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
export default router;
