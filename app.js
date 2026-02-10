import express from "express";
import env from "dotenv";
// import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import errorHandler from "./middleware/errorHandler.js";
import connectDB from "./database/dbConnect.js";
import routes from "./routes/index.js";
import { notFoundError } from "./middleware/errorHandler.js";

env.config();

const port = process.env.PORT || 8080;
const app = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(compression());

app.use("/api", routes);

app.use(notFoundError);

connectDB();

app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});