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

const COLORS = { R:"#d32f2f", B:"#212121", O:"#ffcc80", Y:"#ffeb3b", G:"#4caf50", S:"#9e9e9e", P:"#9c27b0", W:"#ffffff", C:"#00bcd4", D:"#795548", ".":"transparent" };

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
    el.innerHTML = `<canvas id="cvs-${key}" width="64" height="64"></canvas><h4 style="margin:5px 0; color:#2c3e50">${c.name}</h4><div style="font-size:12px; margin-bottom:5px; color:#ff7675; font-weight:bold;">HP:${c.hp} / MP:${c.mp}</div><div style="font-size:11px; color:#636e72;">${c.desc}</div>`;
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
    guide.style.color = data.phase === "ATTACK" ? "#d63031" : "#0984e3";
  } else {
    guide.innerText = "⌛ 相手の行動を待っています...";
    guide.style.color = "#636e72";
  }

  const banner = document.getElementById("center-attack-banner");
  if(data.phase === "DEFENSE" && data.pendingAttack && isMyTurn) {
    document.getElementById("alert-card-name").innerText = data.pendingAttack.card.name;
    document.getElementById("alert-power-val").innerText = data.pendingAttack.card.power;
    banner.style.display = "block";
  } else banner.style.display = "none";

  if(myD && myD.hand) renderHand(myD.hand);
}

// 属性・種類のバッジとカラフル描画
function renderHand(handCards) {
  const c = document.getElementById("hand-container"); c.innerHTML = "";
  handCards.forEach(card => {
    const el = document.createElement("div");
    const elemClass = `elem-${card.element || 'none'}`;
    const typeClass = `type-${card.type}`;
    el.className = `card ${elemClass} ${typeClass}`;

    let badgeClass = "bg-none";
    if (card.type === "heal") badgeClass = "bg-heal";
    else if (card.element && card.element !== "none") badgeClass = `bg-${card.element}`;

    el.innerHTML = `
      <span class="elem-badge ${badgeClass}">${card.category}</span>
      <div style="font-weight:bold; margin:3px 0; font-size:13px; color:#2c3e50;">${card.name}</div>
      <div style="color:#2c3e50; font-weight:bold;">${card.type==='defense'?'軽減':'威力'}:${card.power}</div>
      <div style="font-size:12px; color:#0984e3; font-weight:bold; margin-top:2px;">MP:${card.mp}</div>
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
  const color = data.playerNumber === myPlayerNumber ? "#0984e3" : "#d63031";
  cb.innerHTML += `<div><strong style="color:${color}">${data.sender}:</strong> ${data.message}</div>`;
  cb.scrollTop = cb.scrollHeight;
});
