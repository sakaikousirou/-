const socket = io();

let currentRoom = null;
let myPlayerNumber = null;
let myHand = [];
let currentTurn = 1;

// ドット絵データ（鈴木ゴンザレス・ウィザード・ローグ）
const PIXEL_DATA = {
  suzuki: [
    "....RRRR....",
    "...RRRRRR...",
    "...RROORR...",
    "...OOOOOO...",
    "..RRRRRRRR..",
    "..RRRRRRRR..",
    "..RRRRRRRR..",
    "...RR..RR...",
    "...BB..BB..."
  ],
  wizard: [
    "....BBBB....",
    "...BBBBBB...",
    "..BBBBBBBB..",
    "...OOOOOO...",
    "..YYYYYYYY..",
    "..YYYYYYYY..",
    "..YYYYYYYY..",
    "...YY..YY...",
    "...BB..BB..."
  ],
  rogue: [
    "....GGGG....",
    "...GGGGGG...",
    "...GGOOGG...",
    "...OOOOOO...",
    "..GGGGGGGG..",
    "..GGGGGGGG..",
    "..GGGGGGGG..",
    "...GG..GG...",
    "...BB..BB..."
  ]
};

const COLOR_MAP = {
  "R": "#d32f2f", // 赤 (鈴木ゴンザレス)
  "O": "#ffcc80", // 肌色
  "B": "#212121", // 黒/服
  "Y": "#7b1fa2", // 紫 (ウィザード)
  "G": "#388e3c", // 緑 (ローグ)
  ".": "transparent"
};

// Canvasにドット絵を描画する関数
function drawPixelArt(canvasId, charKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pixels = PIXEL_DATA[charKey] || PIXEL_DATA.suzuki;
  const pixelSize = 7;
  const offsetX = (canvas.width - 12 * pixelSize) / 2;
  const offsetY = (canvas.height - 9 * pixelSize) / 2;

  pixels.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char !== ".") {
        ctx.fillStyle = COLOR_MAP[char] || "#fff";
        ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
      }
    }
  });
}

// キャラ選択画面の描画
socket.on("selectCharacterPhase", (data) => {
  currentRoom = data.room;
  myPlayerNumber = data.playerNumber;

  document.getElementById("status-msg").style.display = "none";
  document.getElementById("select-screen").style.display = "block";

  const container = document.getElementById("char-list");
  container.innerHTML = "";

  Object.keys(data.characters).forEach(key => {
    const char = data.characters[key];
    const card = document.createElement("div");
    card.className = "char-card";
    card.onclick = () => selectChar(key);

    card.innerHTML = `
      <canvas id="canvas-select-${key}" class="pixel-art" width="70" height="70"></canvas>
      <div style="font-weight:bold; margin-top:5px;">${char.name}</div>
      <div style="font-size:0.8rem; color:#aaa;">HP:${char.hp} / MP:${char.mp}</div>
      <div style="font-size:0.7rem; color:#ddd; margin-top:4px;">${char.desc}</div>
    `;
    container.appendChild(card);
    setTimeout(() => drawPixelArt(`canvas-select-${key}`, key), 50);
  });
});

function selectChar(charKey) {
  socket.emit("selectCharacter", { room: currentRoom, playerNumber: myPlayerNumber, charKey });
  document.getElementById("select-screen").innerHTML = "<h3 style='color:#00e676;'>相手の選択を待っています...</h3>";
}

// ゲーム開始
socket.on("gameStart", (data) => {
  document.getElementById("select-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  updateState(data);
});

// 状態更新
socket.on("gameStateUpdate", (data) => {
  if (data.log) {
    const logBox = document.getElementById("log-box");
    logBox.innerHTML += `<div>${data.log}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
  }
  updateState(data);
});

function updateState(data) {
  currentTurn = data.currentTurn;
  const p1 = data.players[1];
  const p2 = data.players[2];

  // プレイヤー1情報
  document.getElementById("p1-name").innerText = p1.char || "P1";
  document.getElementById("p1-hp").innerText = p1.hp;
  document.getElementById("p1-mp").innerText = p1.mp;
  document.getElementById("p1-hp-fill").style.width = `${Math.max(0, (p1.hp / 60) * 100)}%`;
  document.getElementById("p1-mp-fill").style.width = `${Math.min(100, (p1.mp / 30) * 100)}%`;
  drawPixelArt("p1-canvas", p1.charKey || "suzuki");

  // プレイヤー2情報
  document.getElementById("p2-name").innerText = p2.char || "P2";
  document.getElementById("p2-hp").innerText = p2.hp;
  document.getElementById("p2-mp").innerText = p2.mp;
  document.getElementById("p2-hp-fill").style.width = `${Math.max(0, (p2.hp / 60) * 100)}%`;
  document.getElementById("p2-mp-fill").style.width = `${Math.min(100, (p2.mp / 30) * 100)}%`;
  drawPixelArt("p2-canvas", p2.charKey || "suzuki");

  // 手札更新
  const myData = data.players[myPlayerNumber];
  if (myData && myData.hand) {
    myHand = myData.hand;
    renderHand(myData.mp);
  }

  // ターン案内
  if (currentTurn === myPlayerNumber) {
    document.getElementById("status-msg").innerText = "あなたのターンです！技を選んでください";
    document.getElementById("status-msg").style.color = "#00e676";
  } else {
    document.getElementById("status-msg").innerText = "相手のターンです...";
    document.getElementById("status-msg").style.color = "#ff9800";
  }
}

function renderHand(myMp) {
  const container = document.getElementById("hand-list");
  container.innerHTML = "";

  myHand.forEach(card => {
    const isMyTurn = (currentTurn === myPlayerNumber);
    const canAfford = (myMp >= card.mp);
    const disabled = !isMyTurn || !canAfford;

    const div = document.createElement("div");
    div.className = `card-item ${disabled ? "disabled" : ""}`;
    if (!disabled) {
      div.onclick = () => playCard(card.instanceId);
    }

    div.innerHTML = `
      <div class="card-cat">${card.category}</div>
      <div class="card-name">${card.name}</div>
      <div>威:${card.power}</div>
      <div class="card-cost">MP ${card.mp}</div>
    `;
    container.appendChild(div);
  });
}

function playCard(cardInstanceId) {
  if (currentTurn !== myPlayerNumber) return;
  socket.emit("playCard", { room: currentRoom, playerNumber: myPlayerNumber, cardInstanceId });
}

function passTurn() {
  if (currentTurn !== myPlayerNumber) return;
  socket.emit("passTurn", { room: currentRoom, playerNumber: myPlayerNumber });
}

socket.on("timerUpdate", (sec) => {
  document.getElementById("timer-display").innerText = `残り時間: ${sec}秒`;
});

socket.on("errorMsg", (msg) => {
  alert(msg);
});
