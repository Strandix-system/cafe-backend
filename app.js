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

app.set("trust proxy", 1);

app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(
      "https://" + req.headers.host + req.url
    );
  }
  next();
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    "https://main.d13qtkfj0o1mlk.amplifyapp.com",
    "https://cafe.strandixsystem.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));



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
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
