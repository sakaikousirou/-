const socket = io();
let currentRoom = null;
let myPlayerNumber = null;

const PIXEL_DATA = {
  suzuki: ["...RRRR...","..RRRRRR..",".RROOOORR.",".OOOOOOOO.","..RRRRRR..",".RR.RR.RR.","..RRRRRR..","...RRRR...","...BBBB..."],
  wizard: ["...PPPP...","..PPPPPP..","..PPOOPP..",".OOOOOOOO.","..PPPPPP..",".YY.PP.YY.","..PPPPPP..","...PPPP...","...BBBB..."],
  rogue:  ["...GGGG...","..GGGGGG..","..GGOOGG..",".OOOOOOOO.","..GGGGGG..",".BB.GG.BB.","..GGGGGG..","...GGGG...","...BBBB..."],
  knight: ["...SSSS...","..SSSSSS..","..SSOOSS..",".OOOOOOOO.","..SSSSSS..",".CC.SS.CC.","..SSSSSS..","...SSSS...","...SSSS..."],
  ninja:  ["...BBBB...","..BBBBBB..","..BBOOBB..",".OOOOOOOO.","..BBBBBB..",".RR.BB.RR.","..BBBBBB..","...BBBB...","...BBBB..."],
  berserker:["...RRRR...","..RBBBRR..","..RROORR..",".OOOOOOOO.","..RRRRRR..",".BB.RR.BB.","..RRRRRR..","...RRRR...","...BBBB..."],
  paladin: ["...WWWW...","..WWWWWW..","..WWOOWW..",".OOOOOOOO.","..WWWWWW..",".YY.WW.YY.","..WWWWWW..","...WWWW...","...WWWW..."],
  necromancer:["...PPPP...","..PPBBPP..","..PBOOBP..",".OOOOOOOO.","..PPPPPP..",".GG.PP.GG.","..PPPPPP..","...PPPP...","...BBBB..."],
  archer: ["...GGGG...","..GGGGGG..","..GGOOGG..",".OOOOOOOO.","..GGGGGG..",".YY.GG.YY.","..GGGGGG..","...GGGG...","...DDDD..."],
  monk:   ["...YYYY...","..YYYYYY..","..YYOOYY..",".OOOOOOOO.","..YYYYYY..",".RR.YY.RR.","..YYYYYY..","...YYYY...","...BBBB..."]
};

const COLORS = { R:"#ff4757", B:"#2f3640", O:"#ffdd59", Y:"#ffa502", G:"#2ed573", S:"#a4b0be", P:"#a55eea", W:"#ffffff", C:"#00d2d3", D:"#747d8c", ".":"transparent" };

function drawPixelArt(canvasId, charKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pixels = PIXEL_DATA[charKey] || PIXEL_DATA.suzuki;
  const size = 8, ox = (canvas.width - 10*size)/2, oy = (canvas.height - 9*size)/2;
  pixels.forEach((row, y) => {
    for(let x=0; x<row.length; x++) {
      if(row[x] !== ".") { ctx.fillStyle = COLORS[row[x]]; ctx.fillRect(ox + x*size, oy + y*size, size, size); }
    }
  });
}

function showToast(msg) {
  const t = document.getElementById("toast-msg");
  t.innerText = msg; t.style.display = "block";
  setTimeout(() => t.style.display = "none", 2500);
}

socket.on("errorMsg", showToast);

socket.on("selectCharacterPhase", (data) => {
  currentRoom = data.room; myPlayerNumber = data.playerNumber;
  document.getElementById("char-select-screen").style.display = "block";
  const grid = document.getElementById("char-grid");
  grid.innerHTML = "";
  Object.keys(data.characters).forEach(key => {
    const c = data.characters[key];
    const el = document.createElement("div"); el.className = "char-card";
    el.innerHTML = `<canvas id="cvs-${key}" width="64" height="64"></canvas><h4 style="margin:5px 0; color:#fff">${c.name}</h4><div style="font-size:12px; margin-bottom:5px; color:#ff4757; font-weight:bold;">HP:${c.hp} / MP:${c.mp}</div><div style="font-size:11px; color:#a4b0be;">${c.desc}</div>`;
    el.onclick = () => { socket.emit("selectCharacter", { room: currentRoom, playerNumber: myPlayerNumber, charKey: key }); document.getElementById("char-select-screen").style.display = "none"; document.getElementById("game-screen").style.display = "block"; };
    grid.appendChild(el);
    setTimeout(() => drawPixelArt(`cvs-${key}`, key), 50);
  });
});

socket.on("gameStart", updateView);
socket.on("timerUpdate", sec => document.getElementById("timer-val").innerText = sec);
socket.on("gameStateUpdate", (data) => {
  updateView(data);
  if(data.log) { const lb = document.getElementById("log-box"); lb.innerHTML += `<div>${data.log}</div>`; lb.scrollTop = lb.scrollHeight; }
});

function updateView(data) {
  const isMyTurn = (data.currentTurn === myPlayerNumber);
  const myD = data.players[myPlayerNumber], enD = data.players[myPlayerNumber===1?2:1];
  
  if(myD) { document.getElementById("my-name").innerText = myD.char; document.getElementById("my-hp").innerText = myD.hp; document.getElementById("my-mp").innerText = myD.mp; drawPixelArt("my-canvas", myD.charKey); }
  if(enD) { document.getElementById("enemy-name").innerText = enD.char; document.getElementById("enemy-hp").innerText = enD.hp; document.getElementById("enemy-mp").innerText = enD.mp; drawPixelArt("enemy-canvas", enD.charKey); }

  const guide = document.getElementById("turn-guide-text");
  if(isMyTurn) {
    guide.innerText = data.phase === "ATTACK" ? "⚔️ あなたの攻撃ターン！" : "🛡️ あなたの防御ターン！";
    guide.style.color = data.phase === "ATTACK" ? "#ff4757" : "#1e90ff";
  } else {
    guide.innerText = "⌛ 相手の行動を待っています...";
    guide.style.color = "#a4b0be";
  }

  const banner = document.getElementById("center-attack-banner");
  const isDefensePhase = (data.phase === "DEFENSE" && isMyTurn);

  if(isDefensePhase && data.pendingAttack) {
    document.getElementById("alert-card-name").innerText = data.pendingAttack.card.name;
    document.getElementById("alert-power-val").innerText = data.pendingAttack.card.power;
    banner.style.display = "block";
  } else banner.style.display = "none";

  if(myD && myD.hand) renderHand(myD.hand, isDefensePhase, myD.mp);
}

// 相手の攻撃時には使用可能な防御カードを大きく発光させる
function renderHand(handCards, isDefensePhase = false, myMp = 0) {
  const c = document.getElementById("hand-container"); c.innerHTML = "";
  handCards.forEach(card => {
    const el = document.createElement("div");
    const elemClass = `elem-${card.element || 'none'}`;
    const typeClass = `type-${card.type}`;
    
    // 防御フェーズかつMPが足りている防御カードか判定
    const isDefendable = isDefensePhase && card.type === "defense" && card.mp <= myMp;

    el.className = `card ${elemClass} ${typeClass} ${isDefendable ? 'highlight-defend' : ''}`;

    let badgeClass = "bg-none-att";
    if (card.type === "heal") badgeClass = "bg-heal";
    else if (card.type === "defense" && card.element === "none") badgeClass = "bg-none-def";
    else if (card.element && card.element !== "none") badgeClass = `bg-${card.element}`;

    const statLabel = card.type === "defense" ? `<span class="stat-defense">🛡️${card.power}</span>` : `<span class="stat-power">⚔️${card.power}</span>`;

    el.innerHTML = `
      ${isDefendable ? '<div class="defend-tag">🛡️ これでガード！</div>' : ''}
      <span class="elem-badge ${badgeClass}">${card.category}</span>
      <div style="font-weight:bold; margin:4px 0; font-size:12px; color:#ffffff; height:34px; display:flex; align-items:center; justify-content:center; line-height:1.2;">${card.name}</div>
      <div class="card-stats">
        ${statLabel}
        <span class="stat-mp">💧MP ${card.mp}</span>
      </div>
    `;
    el.onclick = () => socket.emit("playCard", { room: currentRoom, playerNumber: myPlayerNumber, cardInstanceId: card.instanceId });
    c.appendChild(el);
  });
}

document.getElementById("pass-btn").onclick = () => socket.emit("passTurn", { room: currentRoom, playerNumber: myPlayerNumber });

// チャット機能
document.getElementById("chat-send").onclick = () => {
  const input = document.getElementById("chat-input");
  if(input.value.trim() !== "") {
    socket.emit("sendChat", { room: currentRoom, playerNumber: myPlayerNumber, message: input.value });
    input.value = "";
  }
};
document.getElementById("chat-input").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    document.getElementById("chat-send").click();
  }
});
socket.on("receiveChat", (data) => {
  const cb = document.getElementById("chat-messages");
  const color = data.playerNumber === myPlayerNumber ? "#70a1ff" : "#ff4757";
  cb.innerHTML += `<div><strong style="color:${color}">${data.sender}:</strong> ${data.message}</div>`;
  cb.scrollTop = cb.scrollHeight;
});

// 勝敗判定ポップアップ
socket.on("gameOver", (data) => {
  const isWinner = (data.winner === myPlayerNumber);
  showResultModal(isWinner);
});

function showResultModal(isWinner) {
  let modal = document.getElementById("result-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "result-modal";
    modal.className = "result-overlay";
    document.body.appendChild(modal);
  }

  const titleText = isWinner ? "🎉 相手に勝ちました！" : "💀 敗北しました…";
  const titleClass = isWinner ? "win-title" : "lose-title";

  modal.innerHTML = `
    <div class="result-title ${titleClass}">${titleText}</div>
    <button class="result-btn" onclick="location.reload()">もう一度遊ぶ</button>
  `;
  modal.style.display = "flex";
}
