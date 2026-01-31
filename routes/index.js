import express from "express";
import authRoute from "./authRoute.js";
import adminUserRoute from "./admin/adminRoute.js";
import stateRoute from "./stateRoute.js"
import menuRoute from "./menuRoute.js"
import layoutRoutes from "./layoutRoute.js";

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
    path: "/menu",
    route: menuRoute,
  },
  {
    path:"/layout",
    route:layoutRoutes,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
