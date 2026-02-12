import http from "http";

import app from "./app.js";
import { initSocket } from "./socket.js";


const port = process.env.PORT || 8080;

const server = http.createServer(app);

initSocket(server);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
