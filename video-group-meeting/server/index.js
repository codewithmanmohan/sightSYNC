const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3001;
const path = require("path");

let socketList = {};

app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

// Route
app.get("/ping", (req, res) => {
  res
    .send({
      success: true,
    })
    .status(200);
});
const c = "Internet Error!";

// Socket
io.on("connection", (socket) => {
  console.log(`New User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("User disconnected:\n", socket.id, c);

    delete socketList[socket.id];
  });

  socket.on("BE-check-user", ({ roomId, userName }) => {
    let error = false;

    io.of("/")
      .in(roomId)
      .allSockets()
      .then((clients) => {
        clients.forEach((client) => {
          if (socketList[client] === userName) {
            error = true;
          }
        });
        socket.emit("FE-error-user-exist", { error });
      })
      .catch((err) => {
        console.error("Error checking user:", err);
      });
  });

  socket.on("BE-join-room", ({ roomId, userName }) => {
    socket.join(roomId);
    socketList[socket.id] = { userName, video: true, audio: true };

    io.of("/")
      .in(roomId)
      .allSockets()
      .then((clients) => {
        const users = [];
        clients.forEach((client) => {
          users.push({ userId: client, info: socketList[client] });
        });
        socket.broadcast.to(roomId).emit("FE-user-join", users);
      })
      .catch((err) => {
        io.sockets.in(roomId).emit("FE-error-user-exist", { err: true });
      });
  });

  socket.on("BE-call-user", ({ userToCall, from, signal }) => {
    io.to(userToCall).emit("FE-receive-call", {
      signal,
      from,
      info: socketList[socket.id],
    });
  });

  socket.on("BE-accept-call", ({ signal, to }) => {
    io.to(to).emit("FE-call-accepted", {
      signal,
      answerId: socket.id,
    });
  });

  socket.on("BE-send-message", ({ roomId, msg, sender }) => {
    io.sockets.in(roomId).emit("FE-receive-message", { msg, sender });
  });

  socket.on("BE-leave-room", ({ roomId, leaver }) => {
    delete socketList[socket.id];
    socket.broadcast
      .to(roomId)
      .emit("FE-user-leave", { userId: socket.id, userName: [socket.id] });
    socket.leave(roomId);
  });

  socket.on("BE-toggle-camera-audio", ({ roomId, switchTarget }) => {
    if (switchTarget === "video") {
      socketList[socket.id].video = !socketList[socket.id].video;
    } else {
      socketList[socket.id].audio = !socketList[socket.id].audio;
    }
    socket.broadcast
      .to(roomId)
      .emit("FE-toggle-camera", { userId: socket.id, switchTarget });
  });
});

http.listen(PORT, () => {
  console.log(`Connected : ${PORT}`);
});
