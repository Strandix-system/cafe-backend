import express from "express";
import indiaStates from "../config/indiaStates.js";
import cafeItemCategories from "../config/category.js"

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: indiaStates.length,
    data: indiaStates
  });
});
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: cafeItemCategories.length,
    data: cafeItemCategories
  });
});

export default router;