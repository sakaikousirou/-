const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// キャラクター定義
const CHARACTERS = {
  suzuki: { name: "鈴木ゴンザレス", hp: 60, mp: 10, desc: "高HP＆パワフルなレスラー" },
  wizard: { name: "ウィザード", hp: 40, mp: 25, desc: "高MPで魔法攻撃が得意" },
  rogue: { name: "ローグ", hp: 50, mp: 15, desc: "攻守バランスの取れた盗賊" }
};

// 技マスターデータ（基本攻撃15種 / 強攻撃15種 / 魔法20種）
const CARD_MASTER = [
  // --- 基本攻撃 (15種) ---
  { id: "w01", name: "ジャブ", type: "attack", power: 5, mp: 1, category: "基本攻撃" },
  { id: "w02", name: "ローキック", type: "attack", power: 7, mp: 1, category: "基本攻撃" },
  { id: "w03", name: "ストレート", type: "attack", power: 6, mp: 1, category: "基本攻撃" },
  { id: "w04", name: "クナイ投げ", type: "attack", power: 4, mp: 1, category: "基本攻撃" },
  { id: "w05", name: "飛蹴り", type: "attack", power: 6, mp: 1, category: "基本攻撃" },
  { id: "w06", name: "しっぺ", type: "attack", power: 3, mp: 0, category: "基本攻撃" },
  { id: "w07", name: "カンチョー", type: "attack", power: 5, mp: 1, category: "基本攻撃" },
  { id: "w08", name: "アッパーカット", type: "attack", power: 8, mp: 2, category: "基本攻撃" },
  { id: "w09", name: "エルボー", type: "attack", power: 7, mp: 1, category: "基本攻撃" },
  { id: "w10", name: "チョップ", type: "attack", power: 5, mp: 1, category: "基本攻撃" },
  { id: "w11", name: "膝かけ", type: "attack", power: 3, mp: 0, category: "基本攻撃" },
  { id: "w12", name: "影走り", type: "attack", power: 7, mp: 1, category: "基本攻撃" },
  { id: "w13", name: "膝蹴り", type: "attack", power: 6, mp: 1, category: "基本攻撃" },
  { id: "w14", name: "ネコパンチ", type: "attack", power: 3, mp: 0, category: "基本攻撃" },
  { id: "w15", name: "つつき", type: "attack", power: 3, mp: 0, category: "基本攻撃" },

  // --- 強攻撃 (15種) ---
  { id: "s01", name: "まわし蹴り", type: "attack", power: 12, mp: 3, category: "強攻撃" },
  { id: "s02", name: "一本背負い", type: "attack", power: 16, mp: 4, category: "強攻撃" },
  { id: "s03", name: "飛膝蹴り", type: "attack", power: 20, mp: 5, category: "強攻撃" },
  { id: "s04", name: "居合切り", type: "attack", power: 14, mp: 3, category: "強攻撃" },
  { id: "s05", name: "常闇突き", type: "attack", power: 22, mp: 6, category: "強攻撃" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 18, mp: 5, category: "強攻撃" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 21, mp: 6, category: "強攻撃" },
  { id: "s08", name: "必殺ラリアット", type: "attack", power: 12, mp: 3, category: "強攻撃" },
  { id: "s09", name: "胴まわし回転蹴り", type: "attack", power: 19, mp: 5, category: "強攻撃" },
  { id: "s10", name: "爆殺パンチ", type: "attack", power: 23, mp: 7, category: "強攻撃" },
  { id: "s11", name: "竜巻砕き", type: "attack", power: 17, mp: 4, category: "強攻撃" },
  { id: "s12", name: "落撃", type: "attack", power: 25, mp: 8, category: "強攻撃" },
  { id: "s13", name: "必殺疾風突き", type: "attack", power: 9, mp: 2, category: "強攻撃" },
  { id: "s14", name: "天空脚", type: "attack", power: 18, mp: 5, category: "強攻撃" },
  { id: "s15", name: "カウンターアタック", type: "attack", power: 15, mp: 4, category: "強攻撃" },

  // --- 魔法 (20種) ---
  { id: "m01", name: "グランドクロス", type: "attack", power: 28, mp: 9, category: "魔法" },
  { id: "m02", name: "野火炎", type: "attack", power: 15, mp: 4, category: "魔法" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 35, mp: 12, category: "魔法" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 15, mp: 4, category: "魔法" },
  { id: "m05", name: "ファイアボール", type: "attack", power: 8, mp: 2, category: "魔法" },
  { id: "m06", name: "アイスコフィン", type: "attack", power: 18, mp: 5, category: "魔法" },
  { id: "m07", name: "ウインドカッター", type: "attack", power: 14, mp: 4, category: "魔法" },
  { id: "m08", name: "アースクエイク", type: "attack", power: 20, mp: 6, category: "魔法" },
  { id: "m09", name: "ライトニングボルト", type: "attack", power: 16, mp: 5, category: "魔法" },
  { id: "m10", name: "ウォーターブレス", type: "attack", power: 12, mp: 3, category: "魔法" },
  { id: "m11", name: "メガファイア", type: "attack", power: 22, mp: 7, category: "魔法" },
  { id: "m12", name: "フリーズ", type: "attack", power: 13, mp: 4, category: "魔法" },
  { id: "m13", name: "ホーリー", type: "attack", power: 26, mp: 8, category: "魔法" },
  { id: "m14", name: "ダークネス", type: "attack", power: 24, mp: 7, category: "魔法" },
  { id: "m15", name: "ポイズン", type: "attack", power: 10, mp: 3, category: "魔法" },
  { id: "m16", name: "ストーム", type: "attack", power: 19, mp: 6, category: "魔法" },
  { id: "m17", name: "メテオシャワー", type: "attack", power: 30, mp: 10, category: "魔法" },
  { id: "m18", name: "キュア", type: "heal", power: 15, mp: 4, category: "魔法" },
  { id: "m19", name: "ハイキュア", type: "heal", power: 30, mp: 8, category: "魔法" },
  { id: "m20", name: "ヒールポーション", type: "heal", power: 10, mp: 2, category: "魔法" }
];

function getRandomCard() {
  const card = CARD_MASTER[Math.floor(Math.random() * CARD_MASTER.length)];
  return { ...card, instanceId: Math.random().toString(36).substring(2, 9) };
}

function generateHand() {
  return Array.from({ length: 6 }, getRandomCard);
}

let waitingPlayer = null;
const games = {};

function startTimer(game, room) {
  if (game.timerInterval) clearInterval(game.timerInterval);
  game.timer = 20;
  io.to(room).emit("timerUpdate", game.timer);

  game.timerInterval = setInterval(() => {
    game.timer--;
    io.to(room).emit("timerUpdate", game.timer);

    if (game.timer <= 0) {
      clearInterval(game.timerInterval);
      switchTurn(game, room, "⏰ 時間切れ！ ターンがスキップされました。");
    }
  }, 1000);
}

function switchTurn(game, room, baseLog = "") {
  game.currentTurn = game.currentTurn === 1 ? 2 : 1;
  const nextPlayer = game.players[game.currentTurn];

  // 毎ターン MP が 5 回復
  nextPlayer.mp += 5;

  const log = baseLog + ` ➡️ ${nextPlayer.char} のターン！ (MP+5回復 → 現在MP: ${nextPlayer.mp})`;

  io.to(room).emit("gameStateUpdate", {
    log,
    players: game.players,
    currentTurn: game.currentTurn
  });

  startTimer(game, room);
}

io.on("connection", (socket) => {
  if (!waitingPlayer) {
    waitingPlayer = socket;
    socket.emit("status", "対戦相手を探しています...");
  } else {
    const roomName = `room_${waitingPlayer.id}_${socket.id}`;
    const p1 = waitingPlayer;
    const p2 = socket;
    waitingPlayer = null;

    p1.join(roomName);
    p2.join(roomName);

    games[roomName] = {
      players: {
        1: { id: p1.id, charKey: "suzuki", char: null, hp: 60, mp: 10, hand: generateHand(), ready: false },
        2: { id: p2.id, charKey: "suzuki", char: null, hp: 60, mp: 10, hand: generateHand(), ready: false }
      },
      currentTurn: 1,
      timer: 20,
      timerInterval: null
    };

    p1.emit("selectCharacterPhase", { room: roomName, playerNumber: 1, characters: CHARACTERS });
    p2.emit("selectCharacterPhase", { room: roomName, playerNumber: 2, characters: CHARACTERS });
  }

  socket.on("selectCharacter", (data) => {
    const { room, playerNumber, charKey } = data;
    const game = games[room];
    if (!game) return;

    const charInfo = CHARACTERS[charKey];
    game.players[playerNumber].charKey = charKey;
    game.players[playerNumber].char = charInfo.name;
    game.players[playerNumber].hp = charInfo.hp;
    game.players[playerNumber].mp = charInfo.mp;
    game.players[playerNumber].ready = true;

    if (game.players[1].ready && game.players[2].ready) {
      io.to(room).emit("gameStart", { room, players: game.players, currentTurn: 1 });
      startTimer(game, room);
    }
  });

  socket.on("playCard", (data) => {
    const { room, playerNumber, cardInstanceId } = data;
    const game = games[room];
    if (!game) return;

    if (game.currentTurn !== playerNumber) return;

    const player = game.players[playerNumber];
    const opponentNumber = playerNumber === 1 ? 2 : 1;
    const opponent = game.players[opponentNumber];

    const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (idx === -1) return;

    const card = player.hand[idx];

    if (player.mp < card.mp) {
      socket.emit("errorMsg", `MPが足りません！ (必要MP: ${card.mp} / 現在MP: ${player.mp})`);
      return;
    }

    player.mp -= card.mp;
    player.hand.splice(idx, 1);
    player.hand.push(getRandomCard());

    let actionLog = "";

    if (card.type === "heal") {
      player.hp += card.power;
      actionLog = `✨ ${player.char} は「${card.name}」で HP${card.power} 回復！`;
    } else {
      opponent.hp = Math.max(0, opponent.hp - card.power);
      actionLog = `⚔️ ${player.char} の「${card.name}」！ ${opponent.char} に ${card.power} ダメージ！`;
    }

    if (opponent.hp <= 0) {
      if (game.timerInterval) clearInterval(game.timerInterval);
      io.to(room).emit("gameStateUpdate", {
        log: actionLog + ` 💀 ${opponent.char} は倒れた！ ${player.char} の勝利！`,
        winner: playerNumber,
        players: game.players
      });
      delete games[room];
      return;
    }

    switchTurn(game, room, actionLog);
  });

  socket.on("passTurn", (data) => {
    const { room, playerNumber } = data;
    const game = games[room];
    if (!game) return;

    if (game.currentTurn === playerNumber) {
      const player = game.players[playerNumber];
      switchTurn(game, room, `🍃 ${player.char} はパスしました。`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
