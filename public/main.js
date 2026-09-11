const socket = io();

let currentRoom = null;
let myPlayerNumber = null;

// エラー/警告トースト表示
function showToast(msg) {
  const toast = document.getElementById("toast-msg");
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 2500);
}

socket.on("status", (msg) => {
  console.log(msg);
});

socket.on("errorMsg", (msg) => {
  showToast(msg);
});

// キャラクター選択フェーズ
socket.on("selectCharacterPhase", (data) => {
  currentRoom = data.room;
  myPlayerNumber = data.playerNumber;

  document.getElementById("char-select-screen").style.display = "block";
  document.getElementById("game-screen").style.display = "none";

  const grid = document.getElementById("char-grid");
  grid.innerHTML = "";

  Object.keys(data.characters).forEach((key) => {
    const c = data.characters[key];
    const el = document.createElement("div");
    el.className = "char-card";
    el.innerHTML = `
      <h3>${c.name}</h3>
      <div>HP: ${c.hp} / MP: ${c.mp}</div>
      <small style="color:#aaa;">${c.desc}</small>
    `;
    el.onclick = () => {
      socket.emit("selectCharacter", {
        room: currentRoom,
        playerNumber: myPlayerNumber,
        charKey: key
      });
      document.getElementById("char-select-screen").style.display = "none";
      document.getElementById("game-screen").style.display = "block";
    };
    grid.appendChild(el);
  });
});

// ゲーム開始
socket.on("gameStart", (data) => {
  updateGameView(data);
});

// タイマー更新
socket.on("timerUpdate", (sec) => {
  document.getElementById("timer-val").innerText = sec;
});

// ゲーム状態更新
socket.on("gameStateUpdate", (data) => {
  updateGameView(data);
  if (data.log) {
    const logBox = document.getElementById("log-box");
    logBox.innerHTML += `<div>${data.log}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
  }
});

// 画面の更新メインロジック
function updateGameView(data) {
  const isMyTurn = (data.currentTurn === myPlayerNumber);
  const myData = data.players[myPlayerNumber];
  const enemyNumber = myPlayerNumber === 1 ? 2 : 1;
  const enemyData = data.players[enemyNumber];

  // 1. 自分と相手のステータス描画
  if (myData) {
    document.getElementById("my-name").innerText = myData.char || "選択中...";
    document.getElementById("my-hp").innerText = myData.hp;
    document.getElementById("my-mp").innerText = myData.mp;
  }
  if (enemyData) {
    document.getElementById("enemy-name").innerText = enemyData.char || "選択中...";
    document.getElementById("enemy-hp").innerText = enemyData.hp;
    document.getElementById("enemy-mp").innerText = enemyData.mp;
  }

  // 2. ターンガイドテキストの更新
  const guideText = document.getElementById("turn-guide-text");
  if (isMyTurn) {
    if (data.phase === "ATTACK") {
      guideText.innerText = "⚔️ あなたの攻撃ターン！（攻撃・魔法カードを選択）";
      guideText.style.color = "#ffcc00";
    } else {
      guideText.innerText = "🛡️ あなたの防御ターン！（防御カードを選択して防御）";
      guideText.style.color = "#00d2ff";
    }
  } else {
    guideText.innerText = "⌛ 相手の行動を待っています...";
    guideText.style.color = "#aaa";
  }

  // 3. 画面中央の攻撃予告バナー表示
  const banner = document.getElementById("center-attack-banner");
  if (data.phase === "DEFENSE" && data.pendingAttack) {
    if (data.currentTurn === myPlayerNumber) {
      document.getElementById("alert-card-name").innerText = data.pendingAttack.card.name;
      document.getElementById("alert-power-val").innerText = data.pendingAttack.card.power;
      banner.style.display = "block";
    } else {
      banner.style.display = "none";
    }
  } else {
    banner.style.display = "none";
  }

  // 4. 手札描画とハイライト（光る処理）
  if (myData && myData.hand) {
    renderHand(myData.hand, isMyTurn, data.phase);
  }
}

// 手札を描画
function renderHand(handCards, isMyTurn, phase) {
  const container = document.getElementById("hand-container");
  container.innerHTML = "";

  handCards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";

    // 自分のターン中に使えるカードを光らせる
    if (isMyTurn) {
      if (phase === "ATTACK" && (card.type === "attack" || card.type === "heal")) {
        cardEl.classList.add("glow-attack");
      } else if (phase === "DEFENSE" && card.type === "defense") {
        cardEl.classList.add("glow-defense");
      }
    }

    cardEl.innerHTML = `
      <div style="font-size:11px; color:#aaa;">${card.category}</div>
      <div style="font-weight:bold; margin:3px 0;">${card.name}</div>
      <div style="color:#ffcc00;">${card.type === 'defense' ? '軽減' : '威力'}: ${card.power}</div>
      <div style="color:#00d2ff; font-size:12px;">MP: ${card.mp}</div>
    `;

    cardEl.onclick = () => {
      socket.emit("playCard", {
        room: currentRoom,
        playerNumber: myPlayerNumber,
        cardInstanceId: card.instanceId
      });
    };

    container.appendChild(cardEl);
  });
}

// パスボタン
document.getElementById("pass-btn").onclick = () => {
  socket.emit("passTurn", {
    room: currentRoom,
    playerNumber: myPlayerNumber
  });
};
