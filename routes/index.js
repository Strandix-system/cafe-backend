import express from "express";
import authRoute from "./authRoute.js";
import adminUserRoute from "./admin/adminRoute.js";
import stateRoute from "./stateRoute.js"
import menuRoute from "./menuRoute.js"
import layoutRoute from "./layoutRoute.js";
import profileRoute from "./profileRoute.js";
import customerRoute from "./customerRoute.js";
import categoryRoute from "./categoryRoute.js";
import orderRoute from "./orderRoute.js";
import qrRoute from "./qrRoute.js";
import signUp from "./signUp.js";
import demoRoute from "./demoRoute.js";
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
    route: menuRoute,
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
    route: categoryRoute,
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
    route: signUp,
  },
  {
    path: "/demo",
    route : demoRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
export default router;