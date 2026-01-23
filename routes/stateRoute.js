import express from "express";
import indiaStates from "../config/indiaStates.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: indiaStates.length,
    data: indiaStates
  });
});

export default router;