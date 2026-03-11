import express from "express";
import { indiaStates } from "../config/indiaStates.js";

export const stateRoute = express.Router();

stateRoute.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: indiaStates.length,
    data: indiaStates
  });
});

