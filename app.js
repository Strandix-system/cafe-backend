import express from "express";
import env from "dotenv";
import http from "http";
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

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://main.d13qtkfj0o1mlk.amplifyapp.com",
    "https://d1d2jk7siuhc65.cloudfront.net",
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});


app.use(compression());

const server = http.createServer(app);

app.get("/", (req, res) => {
  res.status(200).send("Cafe Backend running");
});

app.use("/api", routes);

// 404
app.use(notFoundError);

connectDB();

app.use(errorHandler);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
