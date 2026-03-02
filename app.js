import express from "express";
import env from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import errorHandler from "./middleware/errorHandler.js";
import connectDB from "./database/dbConnect.js";
import routes from "./routes/index.js";
import { notFoundError } from "./middleware/errorHandler.js";


env.config();

const app = express();

app.set("trust proxy", 1);


// HTTPS redirect (optional)
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
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors(),);
app.use(compression());

app.get("/", (req, res) => {
  res.status(200).send("OK");
});
// Routes
app.use("/api", routes);


// 404
app.use(notFoundError);


// Error Handler
app.use(errorHandler);


// DB
connectDB();


// ✅ ONLY export app
export default app;
