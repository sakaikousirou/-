const socket = io();

let myPlayerNumber = null;
let currentRoom = null;
let selectedPendingCard = null; 
let latestGameData = null;

// UI要素の取得
const joinScreen = document.getElementById("join-screen");
const charSelectScreen = document.getElementById("char-select-screen");
const battleScreen = document.getElementById("battle-screen");
const statusMsg = document.getElementById("status-msg");
const charGrid = document.getElementById("char-grid");
const battleField = document.getElementById("battle-field");
const handContainer = document.getElementById("hand-container");
const logBox = document.getElementById("log-box");
const chatMessages = document.getElementById("chat-messages");
const turnIndicator = document.getElementById("turn-indicator");
const timerDisplay = document.getElementById("timer-display");
const toastMsg = document.getElementById("toast-msg");
const targetModal = document.getElementById("target-modal");
const targetList = document.getElementById("target-list");

// 1. ルーム入室
document.getElementById("btn-1v1").onclick = () => joinRoom("1v1");
document.getElementById("btn-2v2").onclick = () => joinRoom("2v2");

function joinRoom(mode) {
  const roomNum = document.getElementById("room-select").value;
  socket.emit("joinRoom", { roomNumber: roomNum, mode: mode });
  document.getElementById("btn-1v1").disabled = true;
  document.getElementById("btn-2v2").disabled = true;
  statusMsg.innerText = "通信中...";
}

socket.on("status", (msg) => statusMsg.innerText = msg);
socket.on("errorMsg", (msg) => showToast(msg));

// 2. キャラ選択画面
socket.on("selectCharacterPhase", (data) => {
  currentRoom = data.room;
  myPlayerNumber = data.playerNumber;
  joinScreen.style.display = "none";
  charSelectScreen.style.display = "block";
  
  charGrid.innerHTML = "";
  Object.keys(data.characters).forEach(key => {
    const char = data.characters[key];
    const card = document.createElement("div");
    card.className = "char-card";
    card.innerHTML = `
      <div style="font-size: 30px;">👤</div>
      <div style="font-weight: bold; margin-top: 5px; font-size:14px; color: #1e272e;">${char.name}</div>
      <div style="font-size: 12px; color: #d63031;">HP: ${char.hp}</div>
      <div style="font-size: 12px; color: #0984e3;">MP: ${char.mp}</div>
      <div style="font-size: 10px; color: #636e72; margin-top: 5px;">${char.desc}</div>
    `;
    card.onclick = () => {
      socket.emit("selectCharacter", { room: currentRoom, playerNumber: myPlayerNumber, charKey: key });
      charGrid.innerHTML = "<h3>他のプレイヤーが選ぶのを待っています...</h3>";
    };
    charGrid.appendChild(card);
  });
});

// 3. バトル開始＆画面更新
socket.on("gameStart", (data) => { latestGameData = data; updateBattleUI(data); });
socket.on("gameStateUpdate", (data) => {
  latestGameData = data;
  updateBattleUI(data);
  if (data.log) addLog(data.log);
});

function updateBattleUI(data) {
  charSelectScreen.style.display = "none";
  battleScreen.style.display = "block";

  const players = data.players;
  battleField.innerHTML = "";
  
  // プレイヤー情報表示 (2人〜4人)
  Object.values(players).forEach(p => {
    const box = document.createElement("div");
    box.className = "player-box " + (p.isDead ? "dead" : "");
    if (p.isDead) box.style.opacity = "0.5";
    
    let teamColor = p.team === "A" ? "#0984e3" : "#d63031"; // 青と赤
    box.style.borderColor = teamColor;

    box.innerHTML = `
      <h4 style="margin:0; color:${teamColor};">Team ${p.team}</h4>
      <div style="font-weight: bold; font-size: 18px;">${p.char} ${p.id === socket.id ? "(あなた)" : ""}</div>
      <div style="color: #d63031; font-weight:900; font-size: 18px;">HP: ${p.hp}</div>
      <div style="color: #0984e3; font-weight:900; font-size: 18px;">MP: ${p.mp}</div>
    `;
    battleField.appendChild(box);
  });

  // 手札の描画
  const myData = players[myPlayerNumber];
  handContainer.innerHTML = "";
  
  if (!myData.isDead) {
    myData.hand.forEach(card => {
      const cardDiv = document.createElement("div");
      cardDiv.className = `card elem-${card.element} type-${card.type}`;
      
      let statColor = card.type === "defense" ? "stat-defense" : card.type === "heal" ? "stat-heal" : "stat-power";
      let statIcon = card.type === "defense" ? "🛡️" : card.type === "heal" ? "✨" : "⚔️";

      cardDiv.innerHTML = `
        <div class="elem-badge bg-${card.element === 'none' ? (card.type === 'attack' ? 'none-att' : 'none-def') : card.element}">${card.category}</div>
        <div style="font-size: 14px; margin: 5px 0;">${card.name}</div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 10px;">
          <span class="${statColor}">${statIcon}${card.power}</span>
          <span class="stat-mp">💧MP ${card.mp}</span>
        </div>
      `;
      
      if (data.phase === "DEFENSE" && data.currentTurn === myPlayerNumber && card.type === "defense") {
        cardDiv.classList.add("highlight-defend");
        const tag = document.createElement("div");
        tag.className = "defend-tag";
        tag.innerText = "ガード推奨!";
        cardDiv.appendChild(tag);
      }

      cardDiv.onclick = () => handleCardClick(card, data);
      handContainer.appendChild(cardDiv);
    });
  } else {
    handContainer.innerHTML = "<h3>あなたは倒れました...💀</h3>";
  }

  // ターンの表示
  if (data.phase === "END") {
    turnIndicator.innerHTML = `🏆 チーム ${data.winnerTeam} の勝利！`;
  } else if (data.phase === "DEFENSE") {
    turnIndicator.innerHTML = `⚠️ ${players[data.currentTurn].char} は防御してください！`;
  } else {
    turnIndicator.innerHTML = `⚔️ ${players[data.currentTurn].char} の攻撃ターン！`;
  }
}

// 4. ターゲット（対象）選択処理
function handleCardClick(card, gameData) {
  if (gameData.currentTurn !== myPlayerNumber) return showToast("あなたのターンではありません！");
  
  if (gameData.phase === "DEFENSE") {
    socket.emit("playCard", { room: currentRoom, playerNumber: myPlayerNumber, cardInstanceId: card.instanceId });
    return;
  }

  // 攻撃 or 回復はターゲット選択
  if (card.type === "attack" || card.type === "heal") {
    selectedPendingCard = card;
    openTargetModal(gameData.players);
  }
}

function openTargetModal(players) {
  targetList.innerHTML = "";
  Object.keys(players).forEach(pNum => {
    const p = players[pNum];
    if (p.isDead) return; // 倒れた人には使えない
    
    const btn = document.createElement("button");
    btn.className = "result-btn";
    btn.style.margin = "5px 0";
    btn.style.padding = "10px";
    btn.style.fontSize = "16px";
    btn.style.width = "100%";
    
    // チーム色に合わせる
    if (p.team === "A") btn.style.background = "linear-gradient(135deg, #74b9ff, #0984e3)";
    else btn.style.background = "linear-gradient(135deg, #ff7675, #d63031)";

    btn.innerHTML = `Team ${p.team}: ${p.char} ${parseInt(pNum) === myPlayerNumber ? "(自分)" : ""}`;
    
    btn.onclick = () => {
      socket.emit("playCard", {
        room: currentRoom,
        playerNumber: myPlayerNumber,
        cardInstanceId: selectedPendingCard.instanceId,
        targetPlayerNumber: parseInt(pNum)
      });
      targetModal.style.display = "none";
      selectedPendingCard = null;
    };
    targetList.appendChild(btn);
  });
  targetModal.style.display = "block";
}

document.getElementById("cancel-target").onclick = () => {
  targetModal.style.display = "none";
  selectedPendingCard = null;
};

// 5. タイマーとパス
socket.on("timerUpdate", (time) => timerDisplay.textContent = `残り時間: ${time}秒`);
document.getElementById("pass-btn").onclick = () => {
  socket.emit("passTurn", { room: currentRoom, playerNumber: myPlayerNumber });
};

// 6. ログ・チャット
function addLog(msg) {
  const p = document.createElement("div");
  p.style.padding = "6px 0";
  p.style.borderBottom = "1px dashed #ccc";
  p.innerText = msg;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}

socket.on("receiveChat", (data) => {
  const p = document.createElement("div");
  p.style.marginBottom = "5px";
  p.innerHTML = `<strong style="color:${data.isSelf ? '#0984e3' : '#d63031'}">${data.sender}:</strong> ${data.message}`;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

document.getElementById("chat-send").onclick = () => {
  const input = document.getElementById("chat-input");
  if (input.value.trim() !== "") {
    socket.emit("sendChat", { room: currentRoom, playerNumber: myPlayerNumber, message: input.value });
    input.value = "";
  }
};
document.getElementById("chat-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") document.getElementById("chat-send").click();
});

// 7. 勝敗結果の演出
socket.on("gameOver", (data) => {
  const overlay = document.getElementById("result-overlay");
  const text = document.getElementById("result-text");
  
  // チャットができるように背景だけ出す（ボタン類は隠さないように透明度高め）
  overlay.style.display = "flex";
  overlay.style.background = "rgba(10, 10, 15, 0.7)";
  overlay.style.pointerEvents = "none"; // 背後のチャットを触れるようにする
  overlay.querySelector(".result-btn").style.pointerEvents = "auto";
  
  const myTeam = latestGameData.players[myPlayerNumber].team;
  if (data.winnerTeam === myTeam) {
    text.innerText = "🎉 YOU WIN !! 🎉";
    text.className = "result-title win-title";
  } else {
    text.innerText = "💀 YOU LOSE... 💀";
    text.className = "result-title lose-title";
  }
});

function showToast(msg) {
  toastMsg.innerText = msg;
  toastMsg.style.display = "block";
  setTimeout(() => toastMsg.style.display = "none", 3000);
}
