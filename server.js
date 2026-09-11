const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const CHARACTERS = {
  suzuki: { name: "鈴木ゴンザレス", hp: 130, maxHp: 130, desc: "高耐久タンク" },
  wizard: { name: "ウィザード", hp: 80, maxHp: 80, desc: "低HP・魔法特化" },
  rogue: { name: "ローグ", hp: 100, maxHp: 100, desc: "バランス型" }
};

// カードマスター (全80種 + 防御属性追加)
const CARD_MASTER = [
  // 防御系カード
  { id: "d01", name: "木の盾", type: "defend", power: 8, category: "防御", desc: "ダメージを8軽減" },
  { id: "d02", name: "鉄の盾", type: "defend", power: 15, category: "防御", desc: "ダメージを15軽減" },
  { id: "d03", name: "騎士の盾", type: "defend", power: 22, category: "防御", desc: "ダメージを22軽減" },
  { id: "d04", name: "イージスの盾", type: "defend", power: 35, category: "防御", desc: "ダメージを35軽減" },
  { id: "d05", name: "魔法障壁", type: "defend", power: 18, category: "防御", desc: "ダメージを18軽減" },

  // 弱攻撃 10種
  { id: "w01", name: "ジャブ", type: "attack", power: 8, category: "弱攻撃", desc: "素早いパンチ(威8)" },
  { id: "w02", name: "ローキック", type: "attack", power: 10, category: "弱攻撃", desc: "足を刈る(威10)" },
  { id: "w03", name: "ストレート", type: "attack", power: 12, category: "弱攻撃", desc: "まっすぐ放つ(威12)" },
  { id: "w04", name: "クナイ投げ", type: "double_attack", power: 7, category: "弱攻撃", desc: "2連撃(7×2)" },
  { id: "w05", name: "カンチョー", type: "status_confuse", power: 6, category: "弱攻撃", desc: "威6 + 混乱(2T)" },
  { id: "w06", name: "アッパーカット", type: "attack", power: 14, category: "弱攻撃", desc: "顎を狙う(威14)" },
  { id: "w07", name: "エルボー", type: "attack", power: 11, category: "弱攻撃", desc: "肘撃ち(威11)" },
  { id: "w08", name: "砂かけ", type: "status_confuse", power: 5, category: "弱攻撃", desc: "威5 + 混乱(2T)" },
  { id: "w09", name: "ネコパンチ", type: "double_attack", power: 5, category: "弱攻撃", desc: "2連撃(5×2)" },
  { id: "w10", name: "膝蹴り", type: "attack", power: 13, category: "弱攻撃", desc: "膝叩き込み(威13)" },

  // 強攻撃 10種
  { id: "s01", name: "まわし蹴り", type: "attack", power: 18, category: "強攻撃", desc: "回転蹴り(威18)" },
  { id: "s02", name: "一本背負い", type: "attack", power: 22, category: "強攻撃", desc: "投げ技(威22)" },
  { id: "s03", name: "飛翔膝蹴り", type: "attack", power: 26, category: "強攻撃", desc: "跳躍大技(威26)" },
  { id: "s04", name: "袈裟斬り", type: "attack", power: 20, category: "強攻撃", desc: "鋭い一閃(威20)" },
  { id: "s05", name: "地獄突き", type: "attack", power: 30, category: "強攻撃", desc: "急所突き(威30)" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 24, category: "強攻撃", desc: "飛び蹴り(威24)" },
  { id: "s07", name: "必殺ラッシュ", type: "double_attack", power: 16, category: "強攻撃", desc: "2連撃(16×2)" },
  { id: "s08", name: "爆殺パンチ", type: "attack", power: 32, category: "強攻撃", desc: "渾身の拳(威32)" },
  { id: "s09", name: "崩拳", type: "attack", power: 35, category: "強攻撃", desc: "突進拳(威35)" },
  { id: "s10", name: "カウンター", type: "counter", power: 0, category: "強攻撃", desc: "全反射カウンター" },

  // 魔法 15種
  { id: "m01", name: "グランドクロス", type: "attack", power: 28, category: "魔法", desc: "聖なる閃光(威28)" },
  { id: "m02", name: "獄炎波", type: "status_burn", power: 16, category: "魔法", desc: "威16 + やけど(3T)" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 38, category: "魔法", desc: "超絶魔法(威38)" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 18, category: "魔法", desc: "落雷(威18)" },
  { id: "m05", name: "アイスコフィン", type: "status_freeze", power: 12, category: "魔法", desc: "威12 + こおり(1T)" },
  { id: "m06", name: "メテオストライク", type: "attack", power: 45, category: "魔法", desc: "隕石落とし(威45)" },
  { id: "m07", name: "アブソリュートゼロ", type: "status_freeze", power: 20, category: "魔法", desc: "威20 + こおり(1T)" },
  { id: "m08", name: "インフェルノ", type: "status_burn", power: 22, category: "魔法", desc: "威22 + やけど(3T)" },
  { id: "m09", name: "カオスブラスト", type: "status_confuse", power: 22, category: "魔法", desc: "威22 + 混乱(2T)" },
  { id: "m10", name: "ラグナロク", type: "attack", power: 50, category: "魔法", desc: "神々の黄昏(威50)" },
  { id: "m11", name: "魔力覚醒", type: "buff_magic", power: 0, category: "魔法", desc: "次回魔法威力2倍" },
  { id: "m12", name: "ヒール", type: "heal", power: 15, category: "魔法", desc: "HP15回復" },
  { id: "m13", name: "ハイヒール", type: "heal", power: 30, category: "魔法", desc: "HP30回復" },
  { id: "m14", name: "フルヒール", type: "heal", power: 50, category: "魔法", desc: "HP50超回復" },
  { id: "m15", name: "治癒の風", type: "heal", power: 20, category: "魔法", desc: "HP20回復" }
];

function getRandomCard() {
  const card = CARD_MASTER[Math.floor(Math.random() * CARD_MASTER.length)];
  return { ...card, instanceId: Math.random().toString(36).substring(2, 9) };
}

function generateHand() {
  return Array.from({ length: 7 }, getRandomCard);
}

function createDefaultStatus() {
  return { burn: 0, freeze: 0, confused: 0, counter: false, magicUp: false };
}

let waitingPlayer = null;
const games = {};

function startTimer(game, room) {
  if (game.timerInterval) clearInterval(game.timerInterval);
  game.timer = 15;
  io.to(room).emit("timerUpdate", game.timer);

  game.timerInterval = setInterval(() => {
    game.timer--;
    io.to(room).emit("timerUpdate", game.timer);

    if (game.timer <= 0) {
      clearInterval(game.timerInterval);
      // 時間切れ自動パス処理
      handleTimeout(game, room);
    }
  }, 1000);
}

function handleTimeout(game, room) {
  let log = "⏰ 時間切れ！ 自動的にパスされました。";

  if (game.phase === "ATTACK") {
    // 攻撃タイムアウト：攻撃権交代
    game.attacker = game.attacker === 1 ? 2 : 1;
    game.phase = "ATTACK";
    game.currentAttackCard = null;
    checkTurnStartStatus(game, room, log);
  } else if (game.phase === "DEFEND") {
    // 防御タイムアウト：ノーガードでダメージ受ける
    applyDamage(game, room, 0, log);
  }
}

function checkTurnStartStatus(game, room, prevLog = "") {
  const currentAttacker = game.players[game.attacker];
  let log = prevLog;

  // やけどダメージ
  if (currentAttacker.status.burn > 0) {
    currentAttacker.hp = Math.max(0, currentAttacker.hp - 8);
    currentAttacker.status.burn--;
    log += ` 🔥${currentAttacker.char}はやけどで8ダメージ！`;
  }

  if (currentAttacker.hp <= 0) {
    const winner = game.attacker === 1 ? 2 : 1;
    io.to(room).emit("gameStateUpdate", { log: log + ` 💀${currentAttacker.char}は倒れた！`, winner, players: game.players });
    delete games[room];
    return;
  }

  // こおり（行動不能）
  if (currentAttacker.status.freeze > 0) {
    currentAttacker.status.freeze--;
    log += ` 🧊${currentAttacker.char}は凍っていて動けない！ターンパス。`;
    game.attacker = game.attacker === 1 ? 2 : 1;
    game.phase = "ATTACK";
    io.to(room).emit("gameStateUpdate", { log, players: game.players, phase: game.phase, attacker: game.attacker });
    startTimer(game, room);
    return;
  }

  io.to(room).emit("gameStateUpdate", { log, players: game.players, phase: game.phase, attacker: game.attacker, currentAttackCard: null });
  startTimer(game, room);
}

function applyDamage(game, room, defensePower, baseLog) {
  const defenderNum = game.attacker === 1 ? 2 : 1;
  const defender = game.players[defenderNum];
  const attacker = game.players[game.attacker];
  const card = game.currentAttackCard;

  let atkPower = card.power;
  if (card.type === "double_attack") atkPower *= 2;

  // カウンターチェック
  if (defender.status.counter) {
    defender.status.counter = false;
    attacker.hp = Math.max(0, attacker.hp - atkPower);
    let log = baseLog + ` 🛡️【カウンター発動】！ ${atkPower} ダメージを攻撃側に全反射！`;

    checkGameOver(game, room, log);
    return;
  }

  let finalDmg = Math.max(0, atkPower - defensePower);
  defender.hp = Math.max(0, defender.hp - finalDmg);

  let log = baseLog + ` 💥 ${defender.char} に ${finalDmg} ダメージ！ (軽減: ${defensePower})`;

  // 状態異常付与 (ガードで0にならなかった場合)
  if (finalDmg > 0) {
    if (card.type === "status_burn") { defender.status.burn = 3; log += " 🔥やけど付与！"; }
    if (card.type === "status_freeze") { defender.status.freeze = 1; log += " 🧊こおり付与！"; }
    if (card.type === "status_confuse") { defender.status.confused = 2; log += " 🌀混乱付与！"; }
  }

  // 次の攻撃ターンへ交代
  game.attacker = defenderNum;
  game.phase = "ATTACK";
  game.currentAttackCard = null;

  checkGameOver(game, room, log);
}

function checkGameOver(game, room, log) {
  if (game.players[1].hp <= 0 || game.players[2].hp <= 0) {
    const winner = game.players[1].hp > 0 ? 1 : 2;
    if (game.timerInterval) clearInterval(game.timerInterval);
    io.to(room).emit("gameStateUpdate", { log, winner, players: game.players });
    delete games[room];
  } else {
    checkTurnStartStatus(game, room, log);
  }
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
        1: { id: p1.id, char: null, hp: 100, maxHp: 100, hand: generateHand(), status: createDefaultStatus(), ready: false },
        2: { id: p2.id, char: null, hp: 100, maxHp: 100, hand: generateHand(), status: createDefaultStatus(), ready: false }
      },
      attacker: 1,
      phase: "ATTACK",
      currentAttackCard: null,
      timer: 15,
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
    game.players[playerNumber].maxHp = charInfo.maxHp;
    game.players[playerNumber].ready = true;

    if (game.players[1].ready && game.players[2].ready) {
      io.to(room).emit("gameStart", {
        room,
        players: game.players,
        attacker: 1,
        phase: "ATTACK"
      });
      startTimer(game, room);
    }
  });

  socket.on("playCard", (data) => {
    const { room, playerNumber, cardInstanceId } = data;
    const game = games[room];
    if (!game) return;

    const player = game.players[playerNumber];
    const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (idx === -1) return;

    // 攻撃フェーズ
    if (game.phase === "ATTACK" && game.attacker === playerNumber) {
      const card = player.hand.splice(idx, 1)[0];
      player.hand.push(getRandomCard());

      // 回復カード・バフカードの即時発動処理
      if (card.type === "heal") {
        player.hp = Math.min(player.maxHp, player.hp + card.power);
        const log = `${player.char} の「${card.name}」！ HPが ${card.power} 回復！`;
        game.attacker = playerNumber === 1 ? 2 : 1;
        checkTurnStartStatus(game, room, log);
        return;
      }
      if (card.type === "buff_magic") {
        player.status.magicUp = true;
        const log = `${player.char} の「${card.name}」！ 次回魔法威力2倍！`;
        game.attacker = playerNumber === 1 ? 2 : 1;
        checkTurnStartStatus(game, room, log);
        return;
      }

      // 攻撃カードを提示して防御フェーズへ
      game.currentAttackCard = card;
      game.phase = "DEFEND";
      const log = `⚔️ ${player.char} の「${card.name}」攻撃！ (威力: ${card.power})`;

      io.to(room).emit("gameStateUpdate", {
        log,
        players: game.players,
        phase: game.phase,
        attacker: game.attacker,
        currentAttackCard: card
      });
      startTimer(game, room);
    }
    // 防御フェーズ
    else if (game.phase === "DEFEND" && game.attacker !== playerNumber) {
      const card = player.hand.splice(idx, 1)[0];
      player.hand.push(getRandomCard());

      let defPower = card.power || 0;
      let log = `🛡️ ${player.char} は「${card.name}」で防御！`;

      applyDamage(game, room, defPower, log);
    }
  });

  socket.on("passTurn", (data) => {
    const { room, playerNumber } = data;
    const game = games[room];
    if (!game) return;

    if (game.phase === "ATTACK" && game.attacker === playerNumber) {
      game.attacker = playerNumber === 1 ? 2 : 1;
      const log = `🍃 攻撃をパスしました。`;
      checkTurnStartStatus(game, room, log);
    } else if (game.phase === "DEFEND" && game.attacker !== playerNumber) {
      const log = `💥 防御せず攻撃を受けました！`;
      applyDamage(game, room, 0, log);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
