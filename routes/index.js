import express from "express";
import authRoute from "./authRoute.js";
import adminUserRoute from "./admin/adminRoute.js";
import stateRoute from "./stateRoute.js"
import menuRoute from "./menuRoute.js"
import layoutRoute from "./layoutRoute.js";
import cafeItemCategories from "../config/category.js"
import profileRoute from "./profileRoute.js";
import customerRoute from "./customerRoute.js";
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
}
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// Proper GET route for categories
router.get("/get-categories", (req, res) => {
  res.json({
    success: true,
    data: cafeItemCategories,
  });
});

export default router;
