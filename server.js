const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 個性豊かで賑やかなキャラクター全10体
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

// --- 全235枚のカードマスター自動生成ロジック ---
function buildCardMaster() {
  const cards = [];

  // ① 普通攻撃（50個）
  const normalAttacks = [
    "ジャブ", "ストレート", "ローキック", "ハイキック", "エルボー", "膝蹴り", "チョップ", "ドロップキック", "フック", "アッパー",
    "スライディング", "ヘッドバット", "体当たり", "踏みつけ", "急所突き", "スラッシュ", "連続パンチ", "回し蹴り", "掌打", "飛蹴り",
    "胴払い", "兜割り", "飛翔拳", "烈空脚", "突き手", "タックル", "肩投げ", "背負い投げ", "関節留め", "崩し撃ち",
    "閃光突き", "疾風パンチ", "猛虎拳", "飛燕脚", "崩拳", "震脚", "覇王拳", "金剛拳", "破岩撃", "流星パンチ",
    "烈火撃", "怒涛撃", "連撃", "突進", "強襲", "一閃", "影縫い", "斬撃", "打撃", "必殺拳"
  ];
  normalAttacks.forEach((name, i) => {
    cards.push({ id: `att_n_${i+1}`, name, type: "attack", element: "none", power: 8 + (i % 15) * 2, mp: 2 + Math.floor((i % 15) / 2), category: "普通攻撃" });
  });

  // ② 普通防御（50個）
  const normalDefenses = [
    "ガード", "パリィ", "盾受け", "回避Step", "見切り", "鉄壁の構え", "緊急回避", "金剛立ち", "受け流し", "クロスガード",
    "バックステップ", "身構える", "大盾の構え", "衝撃吸収", "スライディング回避", "武器受け", "プロテス", "仁王立ち", "不動の姿勢", "鋼の肉体",
    "受け止め", "見切り回避", "盾の壁", "シールドアップ", "ブロッキング", "アボイド", "ダッヂ", "ディフレクト", "カウンターガード", "ボディブロック",
    "防御姿勢", "完全防御", "衝撃緩和", "身かわし", "危険察知", "受け流し術", "受け身", "姿勢制御", "重心固定", "鉄の構え",
    "シェルガード", "アーマー受け", "衝撃分散", "ガードクラッシュ対策", "ディフェンスステップ", "パリィマスター", "極・見切り", "絶対ガード", "鉄壁陣", "ガーディアン"
  ];
  normalDefenses.forEach((name, i) => {
    cards.push({ id: `def_n_${i+1}`, name, type: "defense", element: "none", power: 5 + (i % 20) * 2, mp: 1 + Math.floor((i % 20) / 2), category: "普通防御" });
  });

  // 属性定義（火・水・草・雷・風）
  const elements = [
    { key: "fire", name: "火", god: "火神" },
    { key: "water", name: "水", god: "水神" },
    { key: "grass", name: "草", god: "樹神" },
    { key: "thunder", name: "雷", god: "雷神" },
    { key: "wind", name: "風", god: "風神" }
  ];

  // ③ 属性攻撃（各属性10個 × 5 ＝ 50個）
  const elemAttacks = {
    fire: ["イグニス", "プロメテウス", "フレイム", "灼熱", "ヴォルカノ", "紅蓮", "業火", "火炎", "マグマ", "ヒノカグツチ"],
    water: ["アクア", "ポセイドン", "ネプチューン", "激流", "氷結", "清流", "水龍", "海神", "タイダル", "リヴァイアサン"],
    grass: ["ガイア", "ユグドラシル", "ソーラー", "森羅", "樹界", "リーフ", "大地", "ヴァルハラ", "フローラ", "エルヴン"],
    thunder: ["ゼウス", "トール", "サンダー", "紫電", "雷光", "インドラ", "ボルト", "電撃", "雷鳴", "ケラウノス"],
    wind: ["シルフィード", "ヴェロシティ", "疾風", "嵐神", "サイクロン", "テンペスト", "ガイル", "ウインド", "ブラスト", "ヴォルテックス"]
  };
  const attackTypes = ["ブレイズ", "ウェーブ", "ウィップ", "ストライク", "カッター", "ブレイク", "キャノン", "スラッシュ", "バースト", "ノヴァ"];

  elements.forEach(elem => {
    const list = elemAttacks[elem.key];
    for (let i = 0; i < 10; i++) {
      cards.push({ id: `att_${elem.key}_${i+1}`, name: `${elem.god}・${list[i]}${attackTypes[i]}`, type: "attack", element: elem.key, power: 12 + i * 3, mp: 3 + Math.floor(i * 0.8), category: `${elem.name}属性攻撃` });
    }
  });

  // ④ 属性防御（各属性15個 × 5 ＝ 75個）
  const elemDefenses = {
    fire: ["炎壁", "イグニスシールド", "プロテクトフレア", "業火陣", "フレイムベール", "火神の盾", "マグマウォール", "紅蓮障壁", "ヒートディフェンス", "灼熱結界", "バーニングバリア", "火神の加護", "フレイムガード", "煉獄の構え", "極・炎壁"],
    water: ["水壁", "アクアバリア", "ポセイドンウォール", "清流陣", "アクアベール", "水神の盾", "アイスウォール", "激流障壁", "ハイドロディフェンス", "水流結界", "タイダルバリア", "水神の加護", "アクアガード", "氷結の構え", "極・水壁"],
    grass: ["木甲", "ガイアシールド", "世界樹結界", "森羅陣", "リーフベール", "樹神の盾", "アースウォール", "大地の障壁", "フローラディフェンス", "樹界結界", "ソーラーバリア", "樹神の加護", "ガイアガード", "自然の構え", "極・木甲"],
    thunder: ["電撃壁", "ボルトシールド", "ゼウスバリア", "紫光陣", "サンダーベール", "雷神の盾", "プラズマウォール", "放電障壁", "ライトニングディフェンス", "雷鳴結界", "スパークバリア", "雷神の加護", "ボルトガード", "帯電の構え", "極・電壁"],
    wind: ["竜巻壁", "シルフベール", "疾風陣", "嵐神結界", "ウインドベール", "風神の盾", "サイクロンウォール", "真空障壁", "エアロディフェンス", "暴風結界", "ブラストバリア", "風神の加護", "シルフガード", "流風の構え", "極・風壁"]
  };

  elements.forEach(elem => {
    const list = elemDefenses[elem.key];
    for (let i = 0; i < 15; i++) {
      cards.push({ id: `def_${elem.key}_${i+1}`, name: `${elem.god}「${list[i]}」`, type: "defense", element: elem.key, power: 8 + i * 2, mp: 2 + Math.floor(i * 0.5), category: `${elem.name}属性防御` });
    }
  });

  // ⑤ 回復（10個）
  const healNames = ["ポーション", "キュア", "ハイヒール", "生命の泉", "世界樹の雫", "神の恵み", "リカバリー", "女神の祝福", "全快の聖水", "エルリクサー"];
  healNames.forEach((name, i) => {
    cards.push({ id: `heal_${i+1}`, name, type: "heal", element: "none", power: 10 + i * 4, mp: 2 + Math.floor(i * 1.2), category: "回復魔法" });
  });

  return cards;
}

const CARD_MASTER = buildCardMaster();

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
