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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    "https://main.d13qtkfj0o1mlk.amplifyapp.com",
    "https://d1d2jk7siuhc65.cloudfront.net"
  ],
  credentials: true,
}));

app.options("*", cors());
app.use(helmet());

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
