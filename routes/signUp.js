import express from "express";
import signUpController from "../src/signUp/controller.js";

const router = express.Router();

router.post("/create-order", signUpController.createOrder);
router.post("/verify-payment", signUpController.verifyPayment);

export default router;