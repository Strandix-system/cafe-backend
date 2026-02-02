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
app.use(cors());
app.use(compression());

const server = http.createServer(app);

app.use("/api", routes);

// 404
app.use(notFoundError);

connectDB();

app.use(errorHandler);
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
