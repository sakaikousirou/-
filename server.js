const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// キャラクター定義（HPと初期MP）
const CHARACTERS = {
  suzuki: { name: "鈴木ゴンザレス", hp: 60, mp: 10, desc: "高HPのパワー型ファイター" },
  wizard: { name: "ウィザード", hp: 40, mp: 25, desc: "初期MPが高く魔法が得意" },
  rogue: { name: "ローグ", hp: 50, mp: 15, desc: "バランスの取れたテクニシャン" }
};

// 【全50種以上】技カードマスターデータ（画像の内容を全復元）
const CARD_MASTER = [
  // --- 【基本攻撃 15種】(消費MP: 1〜3) ---
  { id: "w01", name: "ジャブ", type: "attack", power: 5, mp: 1, category: "基本攻撃", desc: "威5 手軽な素早いパンチ(MP1)" },
  { id: "w02", name: "ローキック", type: "attack", power: 7, mp: 1, category: "基本攻撃", desc: "威7 脚を狙うローキック(MP1)" },
  { id: "w03", name: "ストレート", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 重いまっすぐな拳(MP1)" },
  { id: "w04", name: "クナイ投げ", type: "attack", power: 8, mp: 2, category: "基本攻撃", desc: "威8 遠距離からクナイを投げる(MP2)" },
  { id: "w05", name: "飛蹴り", type: "attack", power: 8, mp: 2, category: "基本攻撃", desc: "威8 飛び上がって蹴り込む(MP2)" },
  { id: "w06", name: "しっぺ", type: "attack", power: 3, mp: 0, category: "基本攻撃", desc: "威3 MP無消費のささやかな攻撃(MP0)" },
  { id: "w07", name: "カンチョー", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 虚をつく不意打ち(MP1)" },
  { id: "w08", name: "アッパーカット", type: "attack", power: 9, mp: 2, category: "基本攻撃", desc: "威9 顎を突き上げる拳(MP2)" },
  { id: "w09", name: "エルボー", type: "attack", power: 7, mp: 1, category: "基本攻撃", desc: "威7 強烈な肘打ち(MP1)" },
  { id: "w10", name: "チョップ", type: "attack", power: 5, mp: 1, category: "基本攻撃", desc: "威5 振り下ろす手刀(MP1)" },
  { id: "w11", name: "膝かけ", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 体勢を崩す膝攻撃(MP1)" },
  { id: "w12", name: "足払い", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 足元をすくう蹴り(MP1)" },
  { id: "w13", name: "膝蹴 composition", name: "膝蹴り", type: "attack", power: 8, mp: 2, category: "基本攻撃", desc: "威8 腹部への強烈な膝(MP2)" },
  { id: "w14", name: "ネコパンチ", type: "attack", power: 4, mp: 1, category: "基本攻撃", desc: "威4 連射のきく軽いパンチ(MP1)" },
  { id: "w15", name: "つっつき", type: "attack", power: 3, mp: 0, category: "基本攻撃", desc: "威3 ノーコストのつつく攻撃(MP0)" },

  // --- 【強攻撃 15種】(消費MP: 4〜8) ---
  { id: "s01", name: "まわし蹴り", type: "attack", power: 14, mp: 4, category: "強攻撃", desc: "威14 豪快な回し蹴り(MP4)" },
  { id: "s02", name: "一本背負い", type: "attack", power: 16, mp: 5, category: "強攻撃", desc: "威16 相手を背負って投げる(MP5)" },
  { id: "s03", name: "飛膝蹴り", type: "attack", power: 20, mp: 6, category: "強攻撃", desc: "威20 飛び上がって放つ大技(MP6)" },
  { id: "s04", name: "居合切り", type: "attack", power: 15, mp: 4, category: "強攻撃", desc: "威15 一瞬の一閃(MP4)" },
  { id: "s05", name: "常闇突き", type: "attack", power: 22, mp: 7, category: "強攻撃", desc: "威22 闇を纏った強烈な突進(MP7)" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 18, mp: 5, category: "強攻撃", desc: "威18 両足での飛び蹴り(MP5)" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 21, mp: 7, category: "強攻撃", desc: "威21 振り回して投げ飛ばす(MP7)" },
  { id: "s08", name: "必殺ラリアット", type: "attack", power: 19, mp: 6, category: "強攻撃", desc: "威19 豪腕の一撃(MP6)" },
  { id: "s09", name: "胴まわし回転蹴り", type: "attack", power: 19, mp: 6, category: "強攻撃", desc: "威19 華麗な大技(MP6)" },
  { id: "s10", name: "爆殺パンチ", type: "attack", power: 23, mp: 8, category: "強攻撃", desc: "威23 爆発的な威力の拳(MP8)" },
  { id: "s11", name: "竜巻砕き", type: "attack", power: 17, mp: 5, category: "強攻撃", desc: "威17 旋風を巻き起こす撃ち(MP5)" },
  { id: "s12", name: "落撃", type: "attack", power: 25, mp: 8, category: "強攻撃", desc: "威25 上空からの急降下攻撃(MP8)" },
  { id: "s13", name: "必殺疾風突き", type: "attack", power: 18, mp: 5, category: "強攻撃", desc: "威18 風のような連続突進(MP5)" },
  { id: "s14", name: "天空脚", type: "attack", power: 18, mp: 5, category: "強攻撃", desc: "威18 天高くからの蹴り(MP5)" },
  { id: "s15", name: "カウンターアタック", type: "attack", power: 20, mp: 6, category: "強攻撃", desc: "威20 相手の隙を突く強打(MP6)" },

  // --- 【魔法】(消費MP: 3〜12) ---
  { id: "m01", name: "グランドクロス", type: "attack", power: 28, mp: 9, category: "魔法", desc: "威28 聖なる十字の光(MP9)" },
  { id: "m02", name: "野火炎", type: "attack", power: 15, mp: 4, category: "魔法", desc: "威15 燃えさかる炎(MP4)" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 35, mp: 12, category: "魔法", desc: "威35 究極の超爆炎(MP12)" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 15, mp: 4, category: "魔法", desc: "威15 落雷攻撃(MP4)" },
  { id: "m05", name: "ファイアボール", type: "attack", power: 18, mp: 5, category: "魔法", desc: "威18 火の玉を放つ(MP5)" },
  { id: "m06", name: "アイスコフィン", type: "attack", power: 18, mp: 5, category: "魔法", desc: "威18 氷の棺で閉じ込める(MP5)" },
  { id: "m07", name: "ウインドカッター", type: "attack", power: 14, mp: 4, category: "魔法", desc: "威14 鋭い風の刃(MP4)" },
  { id: "m08", name: "アースクエイク", type: "attack", power: 20, mp: 6, category: "魔法", desc: "威20 地震を引き起こす(MP6)" },
  { id: "m09", name: "ライトニングボルト", type: "attack", power: 16, mp: 5, category: "魔法", desc: "威16 稲妻を落とす(MP5)" },
  { id: "m10", name: "キュア", type: "heal", power: 15, mp: 4, category: "魔法", desc: "HP15回復(MP4)" },
  { id: "m11", name: "ハイキュア", type: "heal", power: 30, mp: 8, category: "魔法", desc: "HP30回復(MP8)" }
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
      // 時間切れ時はターン交代（MP+5回復して交代）
      switchTurn(game, room, "⏰ 時間切れ！ ターンがスキップされました。");
    }
  }, 1000);
}

function switchTurn(game, room, baseLog = "") {
  // ターンプレイヤーを交代
  game.currentTurn = game.currentTurn === 1 ? 2 : 1;
  const nextPlayer = game.players[game.currentTurn];

  // 【仕様】毎ターン MP が 5 回復する！
  nextPlayer.mp += 5;

  const log = baseLog + ` ➡️ ${nextPlayer.char} のターン！ (MPが5回復して ${nextPlayer.mp} になりました)`;

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
        1: { id: p1.id, char: null, hp: 50, mp: 10, hand: generateHand(), ready: false },
        2: { id: p2.id, char: null, hp: 50, mp: 10, hand: generateHand(), ready: false }
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

    // 自分のターンでない場合は弾く
    if (game.currentTurn !== playerNumber) return;

    const player = game.players[playerNumber];
    const opponentNumber = playerNumber === 1 ? 2 : 1;
    const opponent = game.players[opponentNumber];

    const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (idx === -1) return;

    const card = player.hand[idx];

    // 【仕様
