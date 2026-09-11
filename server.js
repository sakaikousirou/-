const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// キャラクター全10体定義
const CHARACTERS = {
  suzuki:     { name: "鈴木ゴンザレス", hp: 70, mp: 12, desc: "高HP＆パワフルなレスラー" },
  wizard:     { name: "ウィザード",     hp: 45, mp: 30, desc: "高MPで強力な魔法が得意" },
  rogue:      { name: "ローグ",         hp: 55, mp: 18, desc: "攻守バランスの取れた盗賊" },
  knight:     { name: "ナイト",         hp: 80, mp: 10, desc: "鉄壁の耐久力を誇る聖騎士" },
  ninja:      { name: "忍者",           hp: 50, mp: 20, desc: "高威力の技とトリッキーな戦術家" },
  berserker:  { name: "バーサーカー",   hp: 85, mp: 8,  desc: "超攻撃的だがMP回復が遅い狂戦士" },
  paladin:    { name: "パラディン",     hp: 75, mp: 15, desc: "防御と回復を兼ね備える光の騎士" },
  necromancer:{ name: "ネクロマンサー", hp: 40, mp: 35, desc: "圧倒的MPで大魔法を連発" },
  archer:     { name: "アーチャー",     hp: 50, mp: 22, desc: "低消費MPの連続攻撃が得意" },
  monk:       { name: "モンク",         hp: 65, mp: 16, desc: "気合いで自己回復と体術を繰り出す" }
};

// 技マスターデータ (防御最大値35)
const CARD_MASTER = [
  // --- 基本攻撃 ---
  { id: "w01", name: "ジャブ", type: "attack", power: 8, mp: 2, category: "基本攻撃" },
  { id: "w02", name: "ローキック", type: "attack", power: 10, mp: 2, category: "基本攻撃" },
  { id: "w03", name: "ストレート", type: "attack", power: 11, mp: 3, category: "基本攻撃" },
  { id: "w04", name: "クナイ投げ", type: "attack", power: 9, mp: 2, category: "基本攻撃" },
  { id: "w05", name: "飛蹴り", type: "attack", power: 12, mp: 3, category: "基本攻撃" },
  { id: "w06", name: "アッパーカット", type: "attack", power: 14, mp: 4, category: "基本攻撃" },
  { id: "w07", name: "エルボー", type: "attack", power: 11, mp: 3, category: "基本攻撃" },
  { id: "w08", name: "影走り", type: "attack", power: 13, mp: 3, category: "基本攻撃" },

  // --- 強攻撃 ---
  { id: "s01", name: "まわし蹴り", type: "attack", power: 20, mp: 5, category: "強攻撃" },
  { id: "s02", name: "一本背負い", type: "attack", power: 24, mp: 6, category: "強攻撃" },
  { id: "s03", name: "飛膝蹴り", type: "attack", power: 28, mp: 7, category: "強攻撃" },
  { id: "s04", name: "居合切り", type: "attack", power: 22, mp: 5, category: "強攻撃" },
  { id: "s05", name: "常闇突き", type: "attack", power: 32, mp: 8, category: "強攻撃" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 26, mp: 6, category: "強攻撃" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 30, mp: 8, category: "強攻撃" },
  { id: "s08", name: "落撃", type: "attack", power: 38, mp: 10, category: "強攻撃" },

  // --- 防御技 (最大防御値 35) ---
  { id: "d01", name: "ガード", type: "defense", power: 5, mp: 1, category: "防御" },
  { id: "d02", name: "パリィ", type: "defense", power: 8, mp: 2, category: "防御" },
  { id: "d03", name: "盾受け", type: "defense", power: 10, mp: 2, category: "防御" },
  { id: "d04", name: "回避", type: "defense", power: 7, mp: 1, category: "防御" },
  { id: "d05", name: "見切り", type: "defense", power: 12, mp: 3, category: "防御" },
  { id: "d06", name: "鉄壁の構え", type: "defense", power: 15, mp: 4, category: "防御" },
  { id: "d07", name: "金剛立ち", type: "defense", power: 20, mp: 5, category: "防御" },
  { id: "d08", name: "大盾の構え", type: "defense", power: 18, mp: 5, category: "防御" },
  { id: "d09", name: "鏡の盾", type: "defense", power: 22, mp: 6, category: "防御" },
  { id: "d10", name: "聖なるバリア", type: "defense", power: 25, mp: 7, category: "防御" },
  { id: "d11", name: "光の護法陣", type: "defense", power: 28, mp: 7, category: "防御" },
  { id: "d12", name: "仁王立ち", type: "defense", power: 30, mp: 8, category: "防御" },
  { id: "d13", name: "絶対防御", type: "defense", power: 32, mp: 8, category: "防御" },
  { id: "d14", name: "神聖領域", type: "defense", power: 34, mp: 9, category: "防御" },
  { id: "d15", name: "究極の防壁", type: "defense", power: 35, mp: 9, category: "防御" },

  // --- 魔法 / 回復 ---
  { id: "m01", name: "ファイアボール", type: "attack", power: 12, mp: 3, category: "魔法" },
  { id: "m02", name: "サンダーボルト", type: "attack", power: 18, mp: 4, category: "魔法" },
  { id: "m03", name: "アイスコフィン", type: "attack", power: 22, mp: 5, category: "魔法" },
  { id: "m04", name: "メガファイア", type: "attack", power: 28, mp: 7, category: "魔法" },
  { id: "m05", name: "グランドクロス", type: "attack", power: 32, mp: 9, category: "魔法" },
  { id: "m06", name: "メテオシャワー", type: "attack", power: 38, mp: 11, category: "魔法" },
  { id: "m07", name: "ギガフレア", type: "attack", power: 45, mp: 14, category: "魔法" },
  { id: "m08", name: "キュア", type: "heal", power: 15, mp: 4, category: "魔法" },
  { id: "m09", name: "ハイキュア", type: "heal", power: 28, mp: 8, category: "魔法" }
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
    io.to(room).emit("gameStateUpdate", {
      log: log + ` 💀 ${defender.char} 倒れた！ ${attacker.char} の勝利！`,
      winner: attackerNum,
      players: game.players,
      phase: "END",
      pendingAttack: null
    });
    delete games[room];
    return;
  }

  // ターン交代 (ターン開始時にMP+3)
  game.phase = "ATTACK";
  game.currentTurn = defenderNum;
  defender.mp += 3;

  const fullLog = log + ` ➡️ ${defender.char} の攻撃ターン！ (MP+3)`;

  io.to(room).emit("gameStateUpdate", {
    log: fullLog,
    players: game.players,
    currentTurn: game.currentTurn,
    phase: game.phase,
    pendingAttack: null
  });

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
      if (game.phase === "DEFENSE") {
        resolveAttack(game, room, null);
      } else {
        const nextTurn = game.currentTurn === 1 ? 2 : 1;
        game.currentTurn = nextTurn;
        const nextPlayer = game.players[nextTurn];
        nextPlayer.mp += 3;

        io.to(room).emit("gameStateUpdate", {
          log: `⏰ 時間切れ！ ➡️ ${nextPlayer.char} の攻撃ターン！ (MP+3)`,
          players: game.players,
          currentTurn: game.currentTurn,
          phase: "ATTACK",
          pendingAttack: null
        });
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

    p1.join(roomName);
    p2.join(roomName);

    games[roomName] = {
      players: {
        1: { id: p1.id, charKey: "suzuki", char: null, hp: 60, mp: 10, hand: generateHand(), ready: false },
        2: { id: p2.id, charKey: "suzuki", char: null, hp: 60, mp: 10, hand: generateHand(), ready: false }
      },
      currentTurn: 1,
      phase: "ATTACK",
      pendingAttack: null,
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
      io.to(room).emit("gameStart", {
        room,
        players: game.players,
        currentTurn: 1,
        phase: "ATTACK",
        pendingAttack: null
      });
      startTimer(game, room);
    }
  });

  socket.on("playCard", (data) => {
    const { room, playerNumber, cardInstanceId } = data;
    const game = games[room];
    if (!game) return;

    if (game.currentTurn !== playerNumber) {
      socket.emit("errorMsg", "相手のターン中です！");
      return;
    }

    const player = game.players[playerNumber];
    const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (idx === -1) {
      socket.emit("errorMsg", "カードが見つかりません。");
      return;
    }

    const card = player.hand[idx];

    if (player.mp < card.mp) {
      socket.emit("errorMsg", `MP不足！ (必要MP: ${card.mp} / 所持MP: ${player.mp})`);
      return;
    }

    if (game.phase === "ATTACK") {
      if (card.type === "defense") {
        socket.emit("errorMsg", "攻撃ターンです！攻撃・魔法カードを選んでください。");
        return;
      }

      player.mp -= card.mp;
      player.hand.splice(idx, 1);
      player.hand.push(getRandomCard());

      if (card.type === "heal") {
        player.hp += card.power;
        const opponentNumber = playerNumber === 1 ? 2 : 1;
        const opponent = game.players[opponentNumber];
        game.currentTurn = opponentNumber;
        opponent.mp += 3;

        io.to(room).emit("gameStateUpdate", {
          log: `✨ ${player.char} は「${card.name}」で HP${card.power} 回復！ ➡️ ${opponent.char} のターン！`,
          players: game.players,
          currentTurn: game.currentTurn,
          phase: "ATTACK",
          pendingAttack: null
        });
        startTimer(game, room);
      } else {
        const defenderNumber = playerNumber === 1 ? 2 : 1;
        const defender = game.players[defenderNumber];

        game.pendingAttack = { attacker: playerNumber, card: card };
        game.phase = "DEFENSE";
        game.currentTurn = defenderNumber; // 防御側へターン変更

        io.to(room).emit("gameStateUpdate", {
          log: `⚔️ ${player.char} の「${card.name}」(威力:${card.power})！ 🛡️ ${defender.char} の防御ターン！`,
          players: game.players,
          currentTurn: game.currentTurn,
          phase: "DEFENSE",
          pendingAttack: game.pendingAttack
        });
        startTimer(game, room);
      }

    } else if (game.phase === "DEFENSE") {
      if (card.type !== "defense") {
        socket.emit("errorMsg", "防御ターンです！防御カードを選んでください。");
        return;
      }

      player.mp -= card.mp;
      player.hand.splice(idx, 1);
      player.hand.push(getRandomCard());

      resolveAttack(game, room, card);
    }
  });

  socket.on("passTurn", (data) => {
    const { room, playerNumber } = data;
    const game = games[room];
    if (!game) return;

    if (game.currentTurn !== playerNumber) return;

    if (game.phase === "DEFENSE") {
      // 防御カードを使わず直接ダメージを受ける
      resolveAttack(game, room, null);
    } else {
      const player = game.players[playerNumber];
      const opponentNumber = playerNumber === 1 ? 2 : 1;
      const opponent = game.players[opponentNumber];

      game.currentTurn = opponentNumber;
      opponent.mp += 3;

      io.to(room).emit("gameStateUpdate", {
        log: `🍃 ${player.char} パス。 ➡️ ${opponent.char} の攻撃ターン！`,
        players: game.players,
        currentTurn: game.currentTurn,
        phase: "ATTACK",
        pendingAttack: null
      });
      startTimer(game, room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
