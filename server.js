const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let waitingUser = null;

io.on("connection", socket => {
  console.log("Connected:", socket.id);

  if (waitingUser) {
    // Pair users
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    waitingUser.emit("ready", { caller: true });
    socket.emit("ready", { caller: false });

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on("offer", offer => {
    socket.partner?.emit("offer", offer);
  });

  socket.on("answer", answer => {
    socket.partner?.emit("answer", answer);
  });

  socket.on("ice", candidate => {
    socket.partner?.emit("ice", candidate);
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("peer-left");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on 3000");
});
