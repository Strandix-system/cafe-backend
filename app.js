import express from "express";
import "express-async-errors";
import env from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { webhookRoutes } from "./routes/webhookRoute.js";
import { errorHandler, notFoundError } from "./middleware/errorHandler.js";
import connectDB from "./database/dbConnect.js";
import routes from "./routes/index.js";
import { tokenVerification } from "./middleware/auth.js";
import { blockExpiredSubscription } from "./middleware/checkSubscription.js";

env.config();

export const app = express();

app.set("trust proxy", 1);

app.use((req, res, next) => {

  if (
    req.headers["x-forwarded-proto"] &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(
      "https://" + req.headers.host + req.url
    );
  }

  next();
});

app.use(helmet());
app.use("/api", webhookRoutes);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://aeternis.in",
      "https://admin.aeternis.in",
      "https://portfolio.aeternis.in",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    // origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  }),
);
app.use(compression());

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.use("/api/admin", tokenVerification, blockExpiredSubscription);
app.use("/api", routes);

app.use(notFoundError);

app.use(errorHandler);

connectDB();


