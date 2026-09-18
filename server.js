const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ツッコミどころ満載のキャラクター全10体
const CHARACTERS = {
  suzuki:     { name: "鈴木ゴンザレス",       hp: 70, mp: 12, desc: "腕っぷし一つで生き抜く伝説の覆面レスラー" },
  wizard:     { name: "魔法中年ヤマダ",       hp: 45, mp: 30, desc: "腰痛に悩むが魔力は一流のオジサン" },
  rogue:      { name: "コソ泥のタカシ",       hp: 55, mp: 18, desc: "逃げ足の速さと小賢しさが武器のパシリ" },
  knight:     { name: "絶対防衛・自宅警備員", hp: 80, mp: 10, desc: "絶対に部屋から出ない鉄壁の引きこもり" },
  ninja:      { name: "ゲーミング忍者",       hp: 50, mp: 20, desc: "七色に光る手裏剣を投げる現代の忍" },
  berserker:  { name: "プロテイン貴族",       hp: 85, mp: 8,  desc: "筋肉こそ全て。考えるのが苦手でMP回復が遅い" },
  paladin:    { name: "聖騎士（派遣社員）",   hp: 75, mp: 15, desc: "時給1200円で働く盾。定時で帰る" },
  necromancer:{ name: "ぼっち死霊術師",       hp: 40, mp: 35, desc: "友達がいないので骨を呼び出してお喋りする" },
  archer:     { name: "スナイパーお婆ちゃん", hp: 50, mp: 22, desc: "老眼だが弓の腕は百発百中のベテラン" },
  monk:       { name: "ステゴロ破戒僧・タツ", hp: 65, mp: 16, desc: "「神に祈る暇があるなら拳を鍛えろ」が信条" }
};

// 全90種類のカードマスター完全復活！
const CARD_MASTER = [
  // --- 基本攻撃 (15種) ---
  { id: "w01", name: "ジャブ", type: "attack", power: 8, mp: 2, category: "基本攻撃" },
  { id: "w02", name: "ローキック", type: "attack", power: 10, mp: 2, category: "基本攻撃" },
  { id: "w03", name: "ストレート", type: "attack", power: 11, mp: 3, category: "基本攻撃" },
  { id: "w04", name: "クナイ投げ", type: "attack", power: 9, mp: 2, category: "基本攻撃" },
  { id: "w05", name: "飛蹴り", type: "attack", power: 12, mp: 3, category: "基本攻撃" },
  { id: "w06", name: "しっぺ", type: "attack", power: 6, mp: 1, category: "基本攻撃" },
  { id: "w07", name: "カンチョー", type: "attack", power: 8, mp: 2, category: "基本攻撃" },
  { id: "w08", name: "アッパーカット", type: "attack", power: 14, mp: 4, category: "基本攻撃" },
  { id: "w09", name: "エルボー", type: "attack", power: 11, mp: 3, category: "基本攻撃" },
  { id: "w10", name: "チョップ", type: "attack", power: 9, mp: 2, category: "基本攻撃" },
  { id: "w11", name: "膝かけ", type: "attack", power: 7, mp: 1, category: "基本攻撃" },
  { id: "w12", name: "影走り", type: "attack", power: 13, mp: 3, category: "基本攻撃" },
  { id: "w13", name: "膝蹴り", type: "attack", power: 12, mp: 3, category: "基本攻撃" },
  { id: "w14", name: "ネコパンチ", type: "attack", power: 6, mp: 1, category: "基本攻撃" },
  { id: "w15", name: "つつき", type: "attack", power: 5, mp: 1, category: "基本攻撃" },

  // --- 強攻撃 (15種) ---
  { id: "s01", name: "まわし蹴り", type: "attack", power: 20, mp: 5, category: "強攻撃" },
  { id: "s02", name: "一本背負い", type: "attack", power: 24, mp: 6, category: "強攻撃" },
  { id: "s03", name: "飛膝蹴り", type: "attack", power: 28, mp: 7, category: "強攻撃" },
  { id: "s04", name: "居合切り", type: "attack", power: 22, mp: 5, category: "強攻撃" },
  { id: "s05", name: "常闇突き", type: "attack", power: 32, mp: 8, category: "強攻撃" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 26, mp: 6, category: "強攻撃" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 30, mp: 8, category: "強攻撃" },
  { id: "s08", name: "必殺ラリアット", type: "attack", power: 21, mp: 5, category: "強攻撃" },
  { id: "s09", name: "胴まわし回転蹴り", type: "attack", power: 27, mp: 7, category: "強攻撃" },
  { id: "s10", name: "爆殺パンチ", type: "attack", power: 34, mp: 9, category: "強攻撃" },
  { id: "s11", name: "竜巻砕き", type: "attack", power: 25, mp: 6, category: "強攻撃" },
  { id: "s12", name: "落撃", type: "attack", power: 38, mp: 10, category: "強攻撃" },
  { id: "s13", name: "必殺疾風突き", type: "attack", power: 18, mp: 4, category: "強攻撃" },
  { id: "s14", name: "天空脚", type: "attack", power: 26, mp: 6, category: "強攻撃" },
  { id: "s15", name: "カウンターアタック", type: "attack", power: 23, mp: 5, category: "強攻撃" },

  // --- 防御技 (40種：最大防御値35) ---
  { id: "d01", name: "ガード", type: "defense", power: 5, mp: 1, category: "防御" },
  { id: "d02", name: "パリィ", type: "defense", power: 8, mp: 2, category: "防御" },
  { id: "d03", name: "盾受け", type: "defense", power: 10, mp: 2, category: "防御" },
  { id: "d04", name: "回避", type: "defense", power: 7, mp: 1, category: "防御" },
  { id: "d05", name: "見切り", type: "defense", power: 12, mp: 3, category: "防御" },
  { id: "d06", name: "鉄壁の構え", type: "defense", power: 15, mp: 4, category: "防御" },
  { id: "d07", name: "緊急回避", type: "defense", power: 9, mp: 2, category: "防御" },
  { id: "d08", name: "金剛立ち", type: "defense", power: 20, mp: 5, category: "防御" },
  { id: "d09", name: "受け流し", type: "defense", power: 11, mp: 3, category: "防御" },
  { id: "d10", name: "クロスガード", type: "defense", power: 13, mp: 3, category: "防御" },
  { id: "d11", name: "マジックバリア", type: "defense", power: 14, mp: 4, category: "防御" },
  { id: "d12", name: "バックステップ", type: "defense", power: 6, mp: 1, category: "防御" },
  { id: "d13", name: "身構える", type: "defense", power: 8, mp: 2, category: "防御" },
  { id: "d14", name: "大盾の構え", type: "defense", power: 18, mp: 5, category: "防御" },
  { id: "d15", name: "鏡の盾", type: "defense", power: 22, mp: 6, category: "防御" },
  { id: "d16", name: "聖なるバリア", type: "defense", power: 25, mp: 7, category: "防御" },
  { id: "d17", name: "影分身", type: "defense", power: 16, mp: 4, category: "防御" },
  { id: "d18", name: "カウンターシールド", type: "defense", power: 17, mp: 4, category: "防御" },
  { id: "d19", name: "アースウォール", type: "defense", power: 21, mp: 5, category: "防御" },
  { id: "d20", name: "アイスシールド", type: "defense", power: 19, mp: 5, category: "防御" },
  { id: "d21", name: "ファイアウォール", type: "defense", power: 18, mp: 4, category: "防御" },
  { id: "d22", name: "風のベール", type: "defense", power: 15, mp: 4, category: "防御" },
  { id: "d23", name: "光の護法陣", type: "defense", power: 28, mp: 7, category: "防御" },
  { id: "d24", name: "暗黒の障壁", type: "defense", power: 26, mp: 7, category: "防御" },
  { id: "d25", name: "仁王立ち", type: "defense", power: 30, mp: 8, category: "防御" },
  { id: "d26", name: "不動の姿勢", type: "defense", power: 24, mp: 6, category: "防御" },
  { id: "d27", name: "衝撃吸収", type: "defense", power: 12, mp: 3, category: "防御" },
  { id: "d28", name: "煙幕", type: "defense", power: 10, mp: 2, category: "防御" },
  { id: "d29", name: "鋼の肉体", type: "defense", power: 23, mp: 6, category: "防御" },
  { id: "d30", name: "絶対防御", type: "defense", power: 32, mp: 8, category: "防御" },
  { id: "d31", name: "エナジーシールド", type: "defense", power: 20, mp: 5, category: "防御" },
  { id: "d32", name: "トールシールド", type: "defense", power: 27, mp: 7, category: "防御" },
  { id: "d33", name: "スライディング回避", type: "defense", power: 7, mp: 1, category: "防御" },
  { id: "d34", name: "武器受け", type: "defense", power: 14, mp: 3, category: "防御" },
  { id: "d35", name: "結界破り対策", type: "defense", power: 29, mp: 7, category: "防御" },
  { id: "d36", name: "イージスの盾", type: "defense", power: 31, mp: 8, category: "防御" },
  { id: "d37", name: "プロテス", type: "defense", power: 16, mp: 4, category: "防御" },
  { id: "d38", name: "マバリア", type: "defense", power: 17, mp: 4, category: "防御" },
  { id: "d39", name: "神聖領域", type: "defense", power: 34, mp: 9, category: "防御" },
  { id: "d40", name: "究極の防壁", type: "defense", power: 35, mp: 9, category: "防御" },

  // --- 魔法 (20種) ---
  { id: "m01", name: "グランドクロス", type: "attack", power: 32, mp: 9, category: "魔法" },
  { id: "m02", name: "野火炎", type: "attack", power: 18, mp: 4, category: "魔法" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 45, mp: 14, category: "魔法" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 18, mp: 4, category: "魔法" },
  { id: "m05", name: "ファイアボール", type: "attack", power: 12, mp: 3, category: "魔法" },
  { id: "m06", name: "アイスコフィン", type: "attack", power: 22, mp: 5, category: "魔法" },
  { id: "m07", name: "ウインドカッター", type: "attack", power: 16, mp: 4, category: "魔法" },
  { id: "m08", name: "アースクエイク", type: "attack", power: 25, mp: 6, category: "魔法" },
  { id: "m09", name: "ライトニングボルト", type: "attack", power: 20, mp: 5, category: "魔法" },
  { id: "m10", name: "ウォーターブレス", type: "attack", power: 15, mp: 3, category: "魔法" },
  { id: "m11", name: "メガファイア", type: "attack", power: 28, mp: 7, category: "魔法" },
  { id: "m12", name: "フリーズ", type: "attack", power: 16, mp: 4, category: "魔法" },
  { id: "m13", name: "ホーリー", type: "attack", power: 30, mp: 8, category: "魔法" },
  { id: "m14", name: "ダークネス", type: "attack", power: 28, mp: 7, category: "魔法" },
  { id: "m15", name: "ポイズン", type: "attack", power: 14, mp: 3, category: "魔法" },
  { id: "m16", name: "ストーム", type: "attack", power: 24, mp: 6, category: "魔法" },
  { id: "m17", name: "メテオシャワー", type: "attack", power: 38, mp: 11, category: "魔法" },
  { id: "m18", name: "キュア", type: "heal", power: 15, mp: 4, category: "魔法" },
  { id: "m19", name: "ハイキュア", type: "heal", power: 28, mp: 8, category: "魔法" },
  { id: "m20", name: "ヒールポーション", type: "heal", power: 10, mp: 2, category: "魔法" }
];

function getRandomCard() {
  const card = CARD_MASTER[Math.floor(Math.random() * CARD_MASTER.length)];
  return { ...card, instanceId: Math.random().toString(36).substring(2, 9) };
}

function generateHand() {
  return Array.from({ length: 12 }, getRandomCard);
}

let waitingPlayer = null;
const games = {};

function resolveAttack(game, room, defenderCard = null) {
  const pending = game.pendingAttack;
  if (!pending) return;
  const attackerNum = pending.attacker;
  const defenderNum = attackerNum === 1 ? 2 : 1;
  const attacker = game.players[attackerNum];
  const defender = game.players[defenderNum];

  let blockPower = 0;
  let log = "";

  if (defenderCard) {
    blockPower = defenderCard.power;
    const finalDamage = Math.max(0, pending.card.power - blockPower);
    defender.hp = Math.max(0, defender.hp - finalDamage);
    log = `⚔️ ${attacker.char}「${pending.card.name}」 ➔ 🛡️ ${defender.char}「${defenderCard.name}」！ ${finalDamage} ダメージ (軽減:${blockPower})`;
  } else {
    const finalDamage = pending.card.power;
    defender.hp = Math.max(0, defender.hp - finalDamage);
    log = `⚔️ ${attacker.char}「${pending.card.name}」直撃！ ${finalDamage} ダメージ！`;
  }
  game.pendingAttack = null;

  if (defender.hp <= 0) {
    if (game.timerInterval) clearInterval(game.timerInterval);
    io.to(room).emit("gameStateUpdate", { log: log + ` 💀 ${defender.char} 倒れた！ ${attacker.char} の勝利！`, winner: attackerNum, players: game.players, phase: "END", pendingAttack: null });
    delete games[room];
    return;
  }
  game.phase = "ATTACK";
  game.currentTurn = defenderNum;
  defender.mp += 3;
  io.to(room).emit("gameStateUpdate", { log: log + ` ➡️ ${defender.char} の攻撃ターン！ (MP+3)`, players: game.players, currentTurn: game.currentTurn, phase: game.phase, pendingAttack: null });
  startTimer(game, room);
}

function startTimer(game, room) {
  if (game.timerInterval) clearInterval(game.timerInterval);
  game.timer = 20;
  io.to(room).emit("timerUpdate", game.timer);
  game.timerInterval = setInterval(() => {
    game.timer--;
    io.to(room).emit("timerUpdate", game.timer);
    if (game.timer <= 0) {
      clearInterval(game.timerInterval);
      if (game.phase === "DEFENSE") resolveAttack(game, room, null);
      else {
        const nextTurn = game.currentTurn === 1 ? 2 : 1;
        game.currentTurn = nextTurn;
        game.players[nextTurn].mp += 3;
        io.to(room).emit("gameStateUpdate", { log: `⏰ 時間切れ！ ➡️ ${game.players[nextTurn].char} の攻撃ターン！ (MP+3)`, players: game.players, currentTurn: game.currentTurn, phase: "ATTACK", pendingAttack: null });
        startTimer(game, room);
      }
    }
  }, 1000);
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
    p1.join(roomName); p2.join(roomName);
    games[roomName] = { players: { 1: { id: p1.id, charKey: "suzuki", char: null, hp: 60, mp: 10, hand: generateHand(), ready: false }, 2: { id: p2.id, charKey: "suzuki", char: null, hp: 60, mp: 10, hand: generateHand(), ready: false } }, currentTurn: 1, phase: "ATTACK", pendingAttack: null, timer: 20, timerInterval: null };
    p1.emit("selectCharacterPhase", { room: roomName, playerNumber: 1, characters: CHARACTERS });
    p2.emit("selectCharacterPhase", { room: roomName, playerNumber: 2, characters: CHARACTERS });
  }

  socket.on("selectCharacter", (data) => {
    const game = games[data.room];
    if (!game) return;
    const charInfo = CHARACTERS[data.charKey];
    game.players[data.playerNumber] = { ...game.players[data.playerNumber], charKey: data.charKey, char: charInfo.name, hp: charInfo.hp, mp: charInfo.mp, ready: true };
    if (game.players[1].ready && game.players[2].ready) {
      io.to(data.room).emit("gameStart", { room: data.room, players: game.players, currentTurn: 1, phase: "ATTACK", pendingAttack: null });
      startTimer(game, data.room);
    }
  });

  socket.on("playCard", (data) => {
    const game = games[data.room];
    if (!game || game.currentTurn !== data.playerNumber) return;
    const player = game.players[data.playerNumber];
    const idx = player.hand.findIndex(c => c.instanceId === data.cardInstanceId);
    if (idx === -1) return;
    const card = player.hand[idx];
    if (player.mp < card.mp) return socket.emit("errorMsg", "MP不足！");

    if (game.phase === "ATTACK") {
      if (card.type === "defense") return socket.emit("errorMsg", "攻撃ターンです！");
      player.mp -= card.mp; player.hand.splice(idx, 1); player.hand.push(getRandomCard());
      if (card.type === "heal") {
        player.hp += card.power; game.currentTurn = data.playerNumber === 1 ? 2 : 1; game.players[game.currentTurn].mp += 3;
        io.to(data.room).emit("gameStateUpdate", { log: `✨ ${player.char} HP${card.power}回復！`, players: game.players, currentTurn: game.currentTurn, phase: "ATTACK" });
        startTimer(game, data.room);
      } else {
        game.pendingAttack = { attacker: data.playerNumber, card: card };
        game.phase = "DEFENSE"; game.currentTurn = data.playerNumber === 1 ? 2 : 1;
        io.to(data.room).emit("gameStateUpdate", { log: `⚔️ ${player.char} の「${card.name}」！`, players: game.players, currentTurn: game.currentTurn, phase: "DEFENSE", pendingAttack: game.pendingAttack });
        startTimer(game, data.room);
      }
    } else if (game.phase === "DEFENSE") {
      if (card.type !== "defense") return socket.emit("errorMsg", "防御ターンです！");
      player.mp -= card.mp; player.hand.splice(idx, 1); player.hand.push(getRandomCard());
      resolveAttack(game, data.room, card);
    }
  });

  socket.on("passTurn", (data) => {
    const game = games[data.room];
    if (!game || game.currentTurn !== data.playerNumber) return;
    if (game.phase === "DEFENSE") resolveAttack(game, data.room, null);
    else {
      game.currentTurn = data.playerNumber === 1 ? 2 : 1; game.players[game.currentTurn].mp += 3;
      io.to(data.room).emit("gameStateUpdate", { log: `🍃 ${game.players[data.playerNumber].char} パス。`, players: game.players, currentTurn: game.currentTurn, phase: "ATTACK" });
      startTimer(game, data.room);
    }
  });

  socket.on("sendChat", (data) => {
    const game = games[data.room];
    if (!game) return;
    const sender = game.players[data.playerNumber].char || "プレイヤー";
    io.to(data.room).emit("receiveChat", { sender, message: data.message, isSelf: false, playerNumber: data.playerNumber });
  });
});

server.listen(process.env.PORT || 3000);
