const socket = io();

let currentRoom = null;
let myPlayerNumber = null;
let isMyTurn = false;

const statusText = document.getElementById("status-text");
const gameArea = document.getElementById("game-area");
const logDiv = document.getElementById("log");

function addLog(msg) {
  const p = document.createElement("p");
  p.textContent = msg;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

socket.on("status", (msg) => {
  statusText.textContent = msg;
});

socket.on("gameStart", (data) => {
  currentRoom = data.room;
  myPlayerNumber = data.playerNumber;
  isMyTurn = data.myTurn;

  statusText.textContent = `対戦相手が見つかりました！ あなたは プレイヤー ${myPlayerNumber} です。`;
  gameArea.style.display = "block";

  addLog(`--- 試合開始 (あなたは プレイヤー ${myPlayerNumber}) ---`);
  if (isMyTurn) {
    addLog("【あなたのターンです】カードを選んでください。");
  } else {
    addLog("【相手のターンです】相手の行動を待っています...");
  }
});

function sendAction(cardName) {
  if (!currentRoom) return;

  addLog(`あなた が 「${cardName}」 を出しました。`);
  
  socket.emit("playCard", {
    room: currentRoom,
    player: myPlayerNumber,
    cardName: cardName
  });
}

socket.on("enemyAction", (data) => {
  addLog(`相手（プレイヤー${data.player}） が 「${data.cardName}」 を出してきました！`);
});