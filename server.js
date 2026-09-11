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

// 技マスターデータ（基本攻撃15 / 強攻撃15 / 防御40 / 魔法20）
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

  // --- 防御技 (40種) ---
  { id: "d01", name: "ガード", type: "defense", power: 5, mp: 0, category: "防御" },
  { id: "d02", name: "パリィ", type: "defense", power: 8, mp: 1, category: "防御" },
  { id: "d03", name: "盾受け", type: "defense", power: 10, mp: 1, category: "防御" },
  { id: "d04", name: "回避", type: "defense", power: 7, mp: 0, category: "防御" },
  { id: "d05", name: "見切り", type: "defense", power: 12, mp: 2, category: "防御" },
  { id: "d06", name: "鉄壁の構え", type: "defense", power: 15, mp: 2, category: "防御" },
  { id: "d07", name: "緊急回避", type: "defense", power: 9, mp: 1, category: "防御" },
  { id: "d08", name: "金剛立ち", type: "defense", power: 20, mp: 3, category: "防御" },
  { id: "d09", name: "受け流し", type: "defense", power: 11, mp: 1, category: "防御" },
  { id: "d10", name: "クロスガード", type: "defense", power: 13, mp: 2, category: "防御" },
  { id: "d11", name: "マジックバリア", type: "defense", power: 14, mp: 2, category: "防御" },
  { id: "d12", name: "バックステップ", type: "defense", power: 6, mp: 0, category: "防御" },
  { id: "d13", name: "身構える", type: "defense", power: 8, mp: 1, category: "防御" },
  { id: "d14", name: "大盾の構え", type: "defense", power: 18, mp: 3, category: "防御" },
  { id: "d15", name: "鏡の盾", type: "defense", power: 22, mp: 4, category: "防御" },
  { id: "d16", name: "聖なるバリア", type: "defense", power: 25, mp: 4, category: "防御" },
  { id: "d17", name: "影分身", type: "defense", power: 16, mp: 2, category: "防御" },
  { id: "d18", name: "カウンターシールド", type: "defense", power: 17, mp: 3, category: "防御" },
  { id: "d19", name: "アースウォール", type: "defense", power: 21, mp: 3, category: "防御" },
  { id: "d20", name: "アイスシールド", type: "defense", power: 19, mp: 3, category: "防御" },
  { id: "d21", name: "ファイアウォール", type: "defense", power: 18, mp: 3, category: "防御" },
  { id: "d22", name: "風のベール", type: "defense", power: 15, mp: 2, category: "防御" },
  { id: "d23", name: "光の護法陣", type: "defense", power: 28, mp: 5, category: "防御" },
  { id: "d24", name: "暗黒の障壁", type: "defense", power: 26, mp: 5, category: "防御" },
  { id: "d25", name: "仁王立ち", type: "defense", power: 30, mp: 6, category: "防御" },
  { id: "d26", name: "不動の姿勢", type: "defense", power: 24, mp: 4, category: "防御" },
  { id: "d27", name: "衝撃吸収", type: "defense", power: 12, mp: 2, category: "防御" },
  { id: "d28", name: "煙幕", type: "defense", power: 10, mp: 1, category: "防御" },
  { id: "d29", name: "鋼の肉体", type: "defense", power: 23, mp: 4, category: "防御" },
  { id: "d30", name: "絶対防御", type: "defense", power: 35, mp: 8, category: "防御" },
  { id: "d31", name: "エナジーシールド", type: "defense", power: 20, mp: 3, category: "防御" },
  { id: "d32", name: "トールシールド", type: "defense", power: 27, mp: 5, category: "防御" },
  { id: "d33", name: "スライディング回避", type: "defense", power: 7, mp: 0, category: "防御" },
  { id: "d34", name: "武器受け", type: "defense", power: 14, mp: 2, category: "防御" },
  { id: "d35", name: "結界破り対策", type: "defense", power: 29, mp: 5, category: "防御" },
  { id: "d36", name: "イージスの盾", type: "defense", power: 32, mp: 7, category: "防御" },
  { id: "d37", name: "プロテス", type: "defense", power: 16, mp: 2, category: "防御" },
  { id: "d38", name: "マバリア", type: "defense", power: 17, mp: 3, category: "防御" },
  { id: "d39", name: "神聖領域", type: "defense", power: 38, mp: 9, category: "防御" },
  { id: "d40", name: "究極の防壁", type: "defense", power: 40, mp: 10, category: "防御" },

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

// 手札12枚生成
function generateHand() {
  return Array.from({ length: 12 }, getRandomCard);
}

let waitingPlayer = null;
const games = {};

function resolveAttack(game, room, defenderCard = null) {
  const pending = game.pendingAttack;
  if (!pending) return;

  const attacker = game.players[pending.attacker];
  const defenderNum = pending.attacker === 1 ? 2 : 1;
  const defender = game.players[defenderNum];

  let blockPower = 0;
  let log = "";

  if (defenderCard) {
    blockPower = defenderCard.power;
    const finalDamage = Math.max(0, pending.card.power - blockPower);
    defender.hp = Math.max(0, defender.hp - finalDamage);
    log = `⚔️ ${attacker.char} の「${pending.card.name}」！ 🛡️ ${defender.char} は「${defenderCard.name}」で防御！ 💥 ${defender.char} に ${finalDamage} ダメージ！ (軽減: ${blockPower})`;
  } else {
    const finalDamage = pending.card.power;
    defender.hp = Math.max(0, defender.hp - finalDamage);
    log = `⚔️ ${attacker.char} の「${pending.card.name}」！ 💥 ${defender.char} に ${finalDamage} ダメージ！ (ノーガード)`;
  }

  game.pendingAttack = null;

  if (defender.hp <= 0) {
    if (game.timerInterval) clearInterval(game.timerInterval);
    io.to(room).emit("gameStateUpdate", {
      log: log + ` 💀 ${defender.char} は倒れた！ ${attacker.char} の勝利！`,
      winner: pending.attacker,
      players: game.players,
      phase: "END",
      pendingAttack: null
    });
    delete games[room];
    return;
  }

  // 攻撃解決後、防御側が新しい攻撃者となりターン交代 (MP+5回復)
  game.phase = "ATTACK";
  game.currentTurn = defenderNum;
  defender.mp += 5;

  const fullLog = log + ` ➡️ ${defender.char} の攻撃ターン！ (MP+5回復 → 現在MP: ${defender.mp})`;

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
        // 防御ターンの時間切れはノーガードで即解決
        resolveAttack(game, room, null);
      } else {
        // 攻撃ターンの時間切れはスキップ
        const attacker = game.players[game.currentTurn];
        const nextTurn = game.currentTurn === 1 ? 2 : 1;
        game.currentTurn = nextTurn;
        const nextPlayer = game.players[nextTurn];
        nextPlayer.mp += 5;

        io.to(room).emit("gameStateUpdate", {
          log: `⏰ ${attacker.char} は時間切れ！ ➡️ ${nextPlayer.char} の攻撃ターン！ (MP+5回復 → 現在MP: ${nextPlayer.mp})`,
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

    if (game.currentTurn !== playerNumber) return;

    const player = game.players[playerNumber];
    const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (idx === -1) return;

    const card = player.hand[idx];

    if (player.mp < card.mp) {
      socket.emit("errorMsg", `MPが足りません！ (必要MP: ${card.mp} / 現在MP: ${player.mp})`);
      return;
    }

    if (game.phase === "ATTACK") {
      if (card.type === "defense") {
        socket.emit("errorMsg", "攻撃ターンです！攻撃カードまたは回復魔法を選択してください。");
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
        opponent.mp += 5;

        io.to(room).emit("gameStateUpdate", {
          log: `✨ ${player.char} は「${card.name}」で HP${card.power} 回復！ ➡️ ${opponent.char} の攻撃ターン！ (MP+5回復 → 現在MP: ${opponent.mp})`,
          players: game.players,
          currentTurn: game.currentTurn,
          phase: "ATTACK",
          pendingAttack: null
        });
        startTimer(game, room);
      } else {
        // 攻撃宣言 ➔ 相手の防御ターンへ
        const defenderNumber = playerNumber === 1 ? 2 : 1;
        const defender = game.players[defenderNumber];

        game.pendingAttack = { attacker: playerNumber, card: card };
        game.phase = "DEFENSE";
        game.currentTurn = defenderNumber;

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
        socket.emit("errorMsg", "防御ターンです！防御カードを選択するか「パス」してください。");
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
      // 防御側が「パス」を押すとノーガードで攻撃を受ける
      resolveAttack(game, room, null);
    } else {
      // 攻撃側が「パス」を押すと攻撃スキップ
      const player = game.players[playerNumber];
      const opponentNumber = playerNumber === 1 ? 2 : 1;
      const opponent = game.players[opponentNumber];

      game.currentTurn = opponentNumber;
      opponent.mp += 5;

      io.to(room).emit("gameStateUpdate", {
        log: `🍃 ${player.char} は攻撃をパスしました。 ➡️ ${opponent.char} の攻撃ターン！ (MP+5回復 → 現在MP: ${opponent.mp})`,
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
