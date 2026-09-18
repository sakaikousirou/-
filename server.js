const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// publicディレクトリを静的ファイルとして公開
app.use(express.static("public"));

const CHARACTERS = {
  suzuki:      { name: "鈴木ゴンザレス",       hp: 70, mp: 12, desc: "腕っぷし一つで生き抜く伝説の覆面レスラー" },
  wizard:      { name: "魔法中年ヤマダ",       hp: 45, mp: 30, desc: "腰痛に悩むが魔力は一流のオジサン" },
  rogue:       { name: "コソ泥のタカシ",       hp: 55, mp: 18, desc: "逃げ足の速さと小賢しさが武器のパシリ" },
  knight:      { name: "絶対防衛・自宅警備員", hp: 80, mp: 10, desc: "絶対に部屋から出ない鉄壁の引きこもり" },
  ninja:       { name: "ゲーミング忍者",       hp: 50, mp: 20, desc: "七色に光る手裏剣を投げる現代の忍" },
  berserker:   { name: "プロテイン貴族",       hp: 85, mp: 8,  desc: "筋肉こそ全て。考えるのが苦手でMP回復が遅い" },
  paladin:     { name: "聖騎士（派遣社員）",   hp: 75, mp: 15, desc: "時給1200円で働く盾。定時で帰る" },
  necromancer: { name: "ぼっち死霊術師",       hp: 40, mp: 35, desc: "友達がいないので骨を呼び出してお喋りする" },
  archer:      { name: "スナイパーお婆ちゃん", hp: 50, mp: 22, desc: "老眼だが弓の腕は百発百中のベテラン" },
  monk:        { name: "ステゴロ破戒僧・タツ", hp: 65, mp: 16, desc: "「神に祈る暇があるなら拳を鍛えろ」が信条" }
};

// --- 全235枚のカードマスター自動生成ロジック ---
function buildCardMaster() {
  const cards = [];
  const normalAttacks = ["ジャブ", "ストレート", "ローキック", "ハイキック", "エルボー", "膝蹴り", "チョップ", "ドロップキック", "フック", "アッパー", "スライディング", "ヘッドバット", "体当たり", "踏みつけ", "急所突き", "スラッシュ", "連続パンチ", "回し蹴り", "掌打", "飛蹴り", "胴払い", "兜割り", "飛翔拳", "烈空脚", "突き手", "タックル", "肩投げ", "背負い投げ", "関節留め", "崩し撃ち", "閃光突き", "疾風パンチ", "猛虎拳", "飛燕脚", "崩拳", "震脚", "覇王拳", "金剛拳", "破岩撃", "流星パンチ", "烈火撃", "怒涛撃", "連撃", "突進", "強襲", "一閃", "影縫い", "斬撃", "打撃", "必殺拳"];
  normalAttacks.forEach((name, i) => cards.push({ id: `att_n_${i+1}`, name, type: "attack", element: "none", power: 8 + (i % 15) * 2, mp: 0, category: "普通攻撃" }));
  
  const normalDefenses = ["ガード", "パリィ", "盾受け", "回避Step", "見切り", "鉄壁の構え", "緊急回避", "金剛立ち", "受け流し", "クロスガード", "バックステップ", "身構える", "大盾の構え", "衝撃吸収", "スライディング回避", "武器受け", "プロテス", "仁王立ち", "不動の姿勢", "鋼の肉体", "受け止め", "見切り回避", "盾の壁", "シールドアップ", "ブロッキング", "アボイド", "ダッヂ", "ディフレクト", "カウンターガード", "ボディブロック", "防御姿勢", "完全防御", "衝撃緩和", "身かわし", "危険察知", "受け流し術", "受け身", "姿勢制御", "重心固定", "鉄の構え", "シェルガード", "アーマー受け", "衝撃分散", "ガードクラッシュ対策", "ディフェンスステップ", "パリィマスター", "極・見切り", "絶対ガード", "鉄壁陣", "ガーディアン"];
  normalDefenses.forEach((name, i) => cards.push({ id: `def_n_${i+1}`, name, type: "defense", element: "none", power: 5 + (i % 20) * 2, mp: 0, category: "普通防御" }));
  
  const elements = [{ key: "fire", name: "火", god: "火神" }, { key: "water", name: "水", god: "水神" }, { key: "grass", name: "草", god: "樹神" }, { key: "thunder", name: "雷", god: "雷神" }, { key: "wind", name: "風", god: "風神" }];
  const elemAttacks = { fire: ["イグニス", "プロメテウス", "フレイム", "灼熱", "ヴォルカノ", "紅蓮", "業火", "火炎", "マグマ", "ヒノカグツチ"], water: ["アクア", "ポセイドン", "ネプチューン", "激流", "氷結", "清流", "水龍", "海神", "タイダル", "リヴァイアサン"], grass: ["ガイア", "ユグドラシル", "ソーラー", "森羅", "樹界", "リーフ", "大地", "ヴァルハラ", "フローラ", "エルヴン"], thunder: ["ゼウス", "トール", "サンダー", "紫電", "雷光", "インドラ", "ボルト", "電撃", "雷鳴", "ケラウノス"], wind: ["シルフィード", "ヴェロシティ", "疾風", "嵐神", "サイクロン", "テンペスト", "ガイル", "ウインド", "ブラスト", "ヴォルテックス"] };
  const attackTypes = ["ブレイズ", "ウェーブ", "ウィップ", "ストライク", "カッター", "ブレイク", "キャノン", "スラッシュ", "バースト", "ノヴァ"];
  
  elements.forEach(elem => { const list = elemAttacks[elem.key]; for (let i = 0; i < 10; i++) cards.push({ id: `att_${elem.key}_${i+1}`, name: `${elem.god}・${list[i]}${attackTypes[i]}`, type: "attack", element: elem.key, power: 12 + i * 3, mp: 3 + Math.floor(i * 0.8), category: `${elem.name}属性攻撃` }); });
  
  const elemDefenses = { fire: ["炎壁", "イグニスシールド", "プロテクトフレア", "業火陣", "フレイムベール", "火神の盾", "マグマウォール", "紅蓮障壁", "ヒートディフェンス", "灼熱結界", "バーニングバリア", "火神の加護", "フレイムガード", "煉獄の構え", "極・炎壁"], water: ["水壁", "アクアバリア", "ポセイドンウォール", "清流陣", "アクアベール", "水神の盾", "アイスウォール", "激流障壁", "ハイドロディフェンス", "水流結界", "タイダルバリア", "水神の加護", "アクアガード", "氷結の構え", "極・水壁"], grass: ["木甲", "ガイアシールド", "世界樹結界", "森羅陣", "リーフベール", "樹神の盾", "アースウォール", "大地の障壁", "フローラディフェンス", "樹界結界", "ソーラーバリア", "樹神の加護", "ガイアガード", "自然の構え", "極・木甲"], thunder: ["電撃壁", "ボルトシールド", "ゼウスバリア", "紫光陣", "サンダーベール", "雷神の盾", "プラズマウォール", "放電障壁", "ライトニングディフェンス", "雷鳴結界", "スパークバリア", "雷神の加護", "ボルトガード", "帯電の構え", "極・電壁"], wind: ["竜巻壁", "シルフベール", "疾風陣", "嵐神結界", "ウインドベール", "風神の盾", "サイクロンウォール", "真空障壁", "エアロディフェンス", "暴風結界", "ブラストバリア", "風神の加護", "シルフガード", "流風の構え", "極・風壁"] };
  elements.forEach(elem => { const list = elemDefenses[elem.key]; for (let i = 0; i < 15; i++) cards.push({ id: `def_${elem.key}_${i+1}`, name: `${elem.god}「${list[i]}」`, type: "defense", element: elem.key, power: 8 + i * 2, mp: 2 + Math.floor(i * 0.5), category: `${elem.name}属性防御` }); });
  
  const healNames = ["ポーション", "キュア", "ハイヒール", "生命の泉", "世界樹の雫", "神の恵み", "リカバリー", "女神の祝福", "全快の聖水", "エルリクサー"];
  healNames.forEach((name, i) => cards.push({ id: `heal_${i+1}`, name, type: "heal", element: "none", power: 10 + i * 4, mp: 2 + Math.floor(i * 1.2), category: "回復魔法" }));
  return cards;
}

const CARD_MASTER = buildCardMaster();

function getRandomCard() {
  const card = CARD_MASTER[Math.floor(Math.random() * CARD_MASTER.length)];
  return { ...card, instanceId: Math.random().toString(36).substring(2, 9) };
}
function generateHand() { return Array.from({ length: 12 }, getRandomCard); }

const games = {}; // ルーム管理

// ----------------------------------------------------
// 勝敗結果をGAS（スプレッドシート）へ送信する処理
// ----------------------------------------------------
async function sendResultToGAS(roomName, mode, winnerName, loserName) {
  const url = "https://script.google.com/macros/s/AKfycbwM5Jpbf1_p8xATbGxad31UhuoidGfyzXaURVo83vLVUGSfhl0_fUm33FHXDNzyQCQmWQ/exec";
  const data = { room: roomName, mode: mode, winner: winnerName, loser: loserName };
  try {
    // Node 18以上ならfetchがデフォルトで利用可能
    if (typeof fetch !== "undefined") {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      console.log(`[GAS送信成功] ${roomName} / 勝利: ${winnerName}`);
    }
  } catch (error) {
    console.error("[GAS送信エラー]", error);
  }
}

// ----------------------------------------------------
// 攻撃解決
// ----------------------------------------------------
function resolveAttack(game, room, defenderCard = null) {
  const pending = game.pendingAttack;
  if (!pending) return;
  const attacker = game.players[pending.attacker];
  const defender = game.players[pending.target];

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
    log = `⚔️ ${attacker.char}「${pending.card.name}」 ➔ ${defender.char} に直撃！ ${finalDamage} ダメージ！`;
  }
  
  if (defender.hp <= 0) {
    defender.hp = 0;
    defender.isDead = true;
    log += ` 💀 ${defender.char} は倒れた！`;
  }
  
  game.pendingAttack = null;

  const teamAAlive = game.teamA.some(pNum => !game.players[pNum].isDead);
  const teamBAlive = game.teamB.some(pNum => !game.players[pNum].isDead);

  if (!teamAAlive || !teamBAlive) {
    if (game.timerInterval) clearInterval(game.timerInterval);
    const winnerTeam = teamAAlive ? "A" : "B";
    const winnerNames = (teamAAlive ? game.teamA : game.teamB).map(n => game.players[n].char).join(" & ");
    const loserNames = (!teamAAlive ? game.teamA : game.teamB).map(n => game.players[n].char).join(" & ");
    
    game.phase = "END";
    game.winnerTeam = winnerTeam;
    
    io.to(room).emit("gameStateUpdate", { log: log + ` 🏆 チーム${winnerTeam}の勝利！`, winnerTeam, players: game.players, phase: "END", pendingAttack: null });
    io.to(room).emit("gameOver", { winnerTeam });
    
    sendResultToGAS(room, game.mode, winnerNames, loserNames);
    return;
  }

  advanceTurn(game, room, log);
}

function advanceTurn(game, room, log = "") {
  let nextIdx = (game.currentTurnIndex + 1) % game.turnOrder.length;
  while (game.players[game.turnOrder[nextIdx]].isDead) {
    nextIdx = (nextIdx + 1) % game.turnOrder.length;
  }
  
  game.currentTurnIndex = nextIdx;
  game.currentTurn = game.turnOrder[nextIdx];
  game.phase = "ATTACK";
  game.players[game.currentTurn].mp += 3;

  io.to(room).emit("gameStateUpdate", { log: log + ` ➡️ ${game.players[game.currentTurn].char} の攻撃ターン！ (MP+3)`, players: game.players, currentTurn: game.currentTurn, phase: game.phase, pendingAttack: null });
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
        advanceTurn(game, room, "⏰ 時間切れ！");
      }
    }
  }, 1000);
}

io.on("connection", (socket) => {
  socket.on("joinRoom", (data) => {
    const { roomNumber, mode } = data;
    const roomName = `Room${roomNumber}`;
    const maxPlayers = mode === "2v2" ? 4 : 2;

    if (!games[roomName]) {
      games[roomName] = { 
        mode: mode, 
        players: {}, 
        teamA: [], teamB: [], 
        sockets: {},
        turnOrder: [], currentTurnIndex: 0, currentTurn: 1, 
        phase: "WAITING", pendingAttack: null, timer: 20, timerInterval: null 
      };
    }
    const game = games[roomName];

    if (Object.keys(game.players).length >= maxPlayers) {
      return socket.emit("errorMsg", "このルームは満員です。");
    }

    const playerNumber = Object.keys(game.players).length + 1;
    socket.join(roomName);
    game.sockets[playerNumber] = socket.id;
    game.players[playerNumber] = { 
      id: socket.id, team: (playerNumber % 2 !== 0) ? "A" : "B",
      charKey: "suzuki", char: null, hp: 60, maxHp: 60, mp: 10, isDead: false, hand: generateHand(), ready: false 
    };

    if (playerNumber % 2 !== 0) game.teamA.push(playerNumber);
    else game.teamB.push(playerNumber);

    socket.emit("status", `ルーム ${roomNumber} に参加しました（現在 ${playerNumber}/${maxPlayers}人）`);
    socket.emit("playerInfo", { room: roomName, playerNumber });

    if (Object.keys(game.players).length === maxPlayers) {
      game.phase = "SELECT";
      if (mode === "2v2") game.turnOrder = [1, 2, 3, 4];
      else game.turnOrder = [1, 2];

      Object.keys(game.sockets).forEach(pNum => {
        io.to(game.sockets[pNum]).emit("selectCharacterPhase", { room: roomName, playerNumber: parseInt(pNum), characters: CHARACTERS, mode: mode });
      });
    }
  });

  socket.on("selectCharacter", (data) => {
    const game = games[data.room];
    if (!game) return;
    const charInfo = CHARACTERS[data.charKey];
    game.players[data.playerNumber] = { ...game.players[data.playerNumber], charKey: data.charKey, char: charInfo.name, hp: charInfo.hp, maxHp: charInfo.hp, mp: charInfo.mp, ready: true };
    
    const allReady = Object.values(game.players).every(p => p.ready);
    if (allReady && game.phase === "SELECT") {
      game.phase = "ATTACK";
      game.currentTurn = game.turnOrder[0];
      io.to(data.room).emit("gameStart", { room: data.room, players: game.players, currentTurn: game.currentTurn, phase: "ATTACK", pendingAttack: null });
      startTimer(game, data.room);
    }
  });

  socket.on("playCard", (data) => {
    const game = games[data.room];
    if (!game || game.currentTurn !== data.playerNumber || game.players[data.playerNumber].isDead) return;
    const player = game.players[data.playerNumber];
    const idx = player.hand.findIndex(c => c.instanceId === data.cardInstanceId);
    if (idx === -1) return;
    const card = player.hand[idx];

    if (player.mp < card.mp) return socket.emit("errorMsg", "MP不足！");

    if (game.phase === "ATTACK") {
      if (card.type === "defense") return socket.emit("errorMsg", "今は攻撃ターンです！");
      
      let targetNum = data.targetPlayerNumber; 
      if (!targetNum) {
        const enemyTeam = player.team === "A" ? game.teamB : game.teamA;
        targetNum = enemyTeam.find(n => !game.players[n].isDead);
      }

      player.mp -= card.mp; player.hand.splice(idx, 1); player.hand.push(getRandomCard());

      if (card.type === "heal") {
        const targetPlayer = game.players[targetNum];
        targetPlayer.hp = Math.min(targetPlayer.maxHp, targetPlayer.hp + card.power);
        advanceTurn(game, data.room, `✨ ${player.char} が ${targetPlayer.char} のHPを ${card.power} 回復！`);
      } else {
        game.pendingAttack = { attacker: data.playerNumber, card: card, target: targetNum };
        game.phase = "DEFENSE"; 
        game.currentTurn = targetNum;
        io.to(data.room).emit("gameStateUpdate", { log: `⚔️ ${player.char} が ${game.players[targetNum].char} に「${card.name}」を使用！`, players: game.players, currentTurn: game.currentTurn, phase: "DEFENSE", pendingAttack: game.pendingAttack });
        startTimer(game, data.room);
      }
    } else if (game.phase === "DEFENSE") {
      if (card.type !== "defense") return socket.emit("errorMsg", "今は防御カードしか使えません！");
      player.mp -= card.mp; player.hand.splice(idx, 1); player.hand.push(getRandomCard());
      resolveAttack(game, data.room, card);
    }
  });

  socket.on("passTurn", (data) => {
    const game = games[data.room];
    if (!game || game.currentTurn !== data.playerNumber || game.players[data.playerNumber].isDead) return;
    
    if (game.phase === "DEFENSE") {
      resolveAttack(game, data.room, null);
    } else {
      advanceTurn(game, data.room, `🍃 ${game.players[data.playerNumber].char} は何もしなかった。`);
    }
  });

  socket.on("sendChat", (data) => {
    const game = games[data.room];
    if (!game) return;

    const senderPlayer = game.players[data.playerNumber];
    if (game.phase === "END" && game.winnerTeam !== senderPlayer.team) {
      return socket.emit("errorMsg", "敗者はチャットできません...🤫");
    }

    const sender = senderPlayer.char || `プレイヤー${data.playerNumber}`;
    socket.broadcast.to(data.room).emit("receiveChat", { sender, message: data.message });
    socket.emit("receiveChat", { sender, message: data.message, isSelf: true });
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});
