const socket = io();

let currentRoom = null;
let myPlayerNumber = null;
let isMyTurn = false;
let myHand = [];

const statusText = document.getElementById("status-text");
const charSelectContainer = document.getElementById("char-select-container");
const charCardsDiv = document.getElementById("char-cards");
const gameContainer = document.getElementById("game-container");
const cardsGrid = document.getElementById("cards-grid");
const turnIndicator = document.getElementById("turn-indicator");
const logDiv = document.getElementById("log");

const myHpBar = document.getElementById("my-hp-bar");
const myHpText = document.getElementById("my-hp-text");
const enemyHpBar = document.getElementById("enemy-hp-bar");
const enemyHpText = document.getElementById("enemy-hp-text");
const myName = document.getElementById("my-name");
const enemyName = document.getElementById("enemy-name");
const myStatusBadge = document.getElementById("my-status-badge");
const enemyStatusBadge = document.getElementById("enemy-status-badge");

socket.on("status", (msg) => statusText.textContent = msg);

socket.on("selectCharacterPhase", (data) => {
  currentRoom = data.room;
  statusText.textContent = "対戦相手が見つかりました！キャラを選んでください。";
  charSelectContainer.style.display = "block";

  charCardsDiv.innerHTML = "";
  Object.keys(data.characters).forEach(key => {
    const c = data.characters[key];
    const div = document.createElement("div");
    div.className = "char-card";
    div.innerHTML = `<h4 style="color:#f1c40f;">${c.name}</h4><p style="font-size:12px; margin:5px 0;">HP: ${c.hp}</p><p style="font-size:10px; color:#aaa;">${c.desc}</p>`;
    div.onclick = () => {
      myPlayerNumber = myPlayerNumber || (charCardsDiv.dataset.selected ? 2 : 1);
      socket.emit("selectCharacter", { room: currentRoom, playerNumber: myPlayerNumber, charKey: key });
      charSelectContainer.style.display = "none";
      statusText.textContent = "相手のキャラ選択を待っています...";
    };
    charCardsDiv.appendChild(div);
  });
});

socket.on("gameStart", (data) => {
  const isP1 = !myHand.length;
  myPlayerNumber = isP1 ? 1 : myPlayerNumber;

  const myState = myPlayerNumber === 1 ? data.p1State : data.p2State;
  const enemyState = myPlayerNumber === 1 ? data.p2State : data.p1State;

  isMyTurn = (myPlayerNumber === 1);
  statusText.textContent = `試合開始！ あなた: ${myState.char} VS 相手: ${enemyState.char}`;
  gameContainer.style.display = "flex";

  myName.textContent = `${myState.char} (あなた)`;
  enemyName.textContent = `${enemyState.char} (相手)`;

  updatePlayerUI(myState, true);
  updatePlayerUI(enemyState, false);

  myHand = myState.hand;
  renderHand();
  updateTurn();
});

function updatePlayerUI(playerState, isMe) {
  const pct = Math.max(0, (playerState.hp / playerState.maxHp) * 100);
  const bar = isMe ? myHpBar : enemyHpBar;
  const txt = isMe ? myHpText : enemyHpText;
  const badge = isMe ? myStatusBadge : enemyStatusBadge;

  bar.style.width = pct + "%";
  txt.textContent = `${playerState.hp} / ${playerState.maxHp}`;

  let stText = "";
  if (playerState.status.burn > 0) stText += ` 🔥やけど(${playerState.status.burn})`;
  if (playerState.status.freeze > 0) stText += ` 🧊こおり`;
  if (playerState.status.confused > 0) stText += ` 🌀混乱(${playerState.status.confused})`;
  if (playerState.status.counter) stText += ` 🛡️カウンター`;
  if (playerState.status.magicUp) stText += ` ✨魔力2倍`;

  badge.textContent = stText;
}

function updateTurn() {
  turnIndicator.textContent = isMyTurn ? "【あなたのターン】" : "【相手のターン】";
  turnIndicator.className = "turn-indicator " + (isMyTurn ? "my-turn" : "enemy-turn");
}

function renderHand() {
  cardsGrid.innerHTML = "";
  myHand.forEach(card => {
    const el = document.createElement("div");
    el.className = `card ${!isMyTurn ? "disabled" : ""}`;
    el.innerHTML = `
      <div>
        <span class="cat-${card.category}">${card.category}</span>
        <div style="font-weight:bold; font-size:13px; margin-top:4px;">${card.name}</div>
        <div style="font-size:10px; color:#aaa;">${card.desc}</div>
      </div>
      <div style="text-align:right; font-size:12px; color:#f39c12; font-weight:bold;">${card.power > 0 ? card.power : ''}</div>
    `;
    if (isMyTurn) el.onclick = () => socket.emit("playCard", { room: currentRoom, playerNumber: myPlayerNumber, cardInstanceId: card.instanceId });
    cardsGrid.appendChild(el);
  });
}

socket.on("gameStateUpdate", (data) => {
  if (data.log) {
    const p = document.createElement("div");
    p.textContent = data.log;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  const me = data.players[myPlayerNumber];
  const enemy = data.players[myPlayerNumber === 1 ? 2 : 1];

  updatePlayerUI(me, true);
  updatePlayerUI(enemy, false);

  myHand = me.hand;
  isMyTurn = (data.turn === myPlayerNumber);

  renderHand();
  updateTurn();

  if (data.winner) {
    turnIndicator.textContent = data.winner === myPlayerNumber ? "🏆 あなたの勝利！" : "💀 相手の勝利...";
  }
});
