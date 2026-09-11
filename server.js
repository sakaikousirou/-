const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("プレイヤーが接続しました:", socket.id);

  if (!waitingPlayer) {
    waitingPlayer = socket;
    socket.emit("status", "対戦相手を探しています...");
  } else {
    const roomName = `room_${waitingPlayer.id}_${socket.id}`;
    const player1 = waitingPlayer;
    const player2 = socket;
    waitingPlayer = null;

    player1.join(roomName);
    player2.join(roomName);

    player1.emit("gameStart", { room: roomName, playerNumber: 1, myTurn: true });
    player2.emit("gameStart", { room: roomName, playerNumber: 2, myTurn: false });

    console.log(`対戦開始: ${roomName}`);
  }

  socket.on("playCard", (data) => {
    socket.to(data.room).emit("enemyAction", data);
  });

  socket.on("disconnect", () => {
    console.log("切断されました:", socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
