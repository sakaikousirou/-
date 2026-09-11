const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const CHARACTERS = {
  suzuki: { name: "鈴木ゴンザレス", hp: 130, maxHp: 130, desc: "圧倒的タフネスを誇る謎の男" },
  wizard: { name: "ウィザード", hp: 80, maxHp: 80, desc: "低HP・高火力魔法型" },
  rogue: { name: "ローグ", hp: 100, maxHp: 100, desc: "標準バランス型" }
};

const CARD_MASTER = [
  // 【弱攻撃 15種】
  { id: "w01", name: "ジャブ", type: "attack", power: 5, category: "弱攻撃", desc: "素早いパンチ(威力5)" },
  { id: "w02", name: "ローキック", type: "attack", power: 7, category: "弱攻撃", desc: "相手の足を刈る(威力7)" },
  { id: "w03", name: "ストレート", type: "attack", power: 6, category: "弱攻撃", desc: "まっすぐ放つ(威力6)" },
  { id: "w04", name: "クナイ投げ", type: "double_attack", power: 4, category: "弱攻撃", desc: "2回連続攻撃(4×2)" },
  { id: "w05", name: "前蹴り", type: "attack", power: 6, category: "弱攻撃", desc: "距離をとる蹴り(威力6)" },
  { id: "w06", name: "しっぺ", type: "attack", power: 3, category: "弱攻撃", desc: "地味に痛い(威力3)" },
  { id: "w07", name: "カンチョー", type: "status_confuse", power: 5, category: "弱攻撃", desc: "威5 + 相手を混乱(2T)" },
  { id: "w08", name: "アッパーカット", type: "attack", power: 8, category: "弱攻撃", desc: "顎を狙い打つ(威力8)" },
  { id: "w09", name: "エルボー", type: "attack", power: 7, category: "弱攻撃", desc: "肘で削る(威力7)" },
  { id: "w10", name: "チョップ", type: "attack", power: 5, category: "弱攻撃", desc: "手刀を打ち下ろす(威力5)" },
  { id: "w11", name: "砂かけ", type: "status_confuse", power: 3, category: "弱攻撃", desc: "威3 + 相手を混乱(2T)" },
  { id: "w12", name: "頭突き", type: "attack", power: 8, category: "弱攻撃", desc: "頑丈な頭部で打撃(威力8)" },
  { id: "w13", name: "膝蹴り", type: "attack", power: 7, category: "弱攻撃", desc: "近接からの膝(威力7)" },
  { id: "w14", name: "ネコパンチ", type: "double_attack", power: 3, category: "弱攻撃", desc: "2回連続パンチ(3×2)" },
  { id: "w15", name: "つっつき", type: "attack", power: 3, category: "弱攻撃", desc: "指先で突く(威力3)" },

  // 【強攻撃 15種】
  { id: "s01", name: "まわし蹴り", type: "attack", power: 12, category: "強攻撃", desc: "強力な回転蹴り(威力12)" },
  { id: "s02", name: "一本背負い", type: "attack", power: 16, category: "強攻撃", desc: "豪快な投げ技(威力16)" },
  { id: "s03", name: "飛翔膝蹴り", type: "attack", power: 20, category: "強攻撃", desc: "跳躍からの大技(威力20)" },
  { id: "s04", name: "袈裟斬り", type: "attack", power: 14, category: "強攻撃", desc: "鋭い一閃(威力14)" },
  { id: "s05", name: "地獄突き", type: "attack", power: 22, category: "強攻撃", desc: "急所を突く極大技(威力22)" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 18, category: "強攻撃", desc: "両足での飛び蹴り(威力18)" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 21, category: "強攻撃", desc: "ぶん回して投げる(威力21)" },
  { id: "s08", name: "必殺ラッシュ", type: "double_attack", power: 12, category: "強攻撃", desc: "怒涛の2連撃(12×2)" },
  { id: "s09", name: "胴まわし回転蹴り", type: "attack", power: 19, category: "強攻撃", desc: "アクロバティック技(威力19)" },
  { id: "s10", name: "爆殺パンチ", type: "attack", power: 23, category: "強攻撃", desc: "渾身の一撃(威力23)" },
  { id: "s11", name: "頭骨砕き", type: "attack", power: 17, category: "強攻撃", desc: "上空からの振り下ろし(威力17)" },
  { id: "s12", name: "崩拳", type: "attack", power: 25, category: "強攻撃", desc: "気合の突進拳(威力25)" },
  { id: "s13", name: "竜巻旋風脚", type: "double_attack", power: 9, category: "強攻撃", desc: "旋風の2連撃(9×2)" },
  { id: "s14", name: "烈空脚", type: "double_attack", power: 8, category: "強攻撃", desc: "空中2連蹴り(8×2)" },
  { id: "s15", name: "カウンターアタック", type: "counter", power: 0, category: "強攻撃", desc: "次の物理攻撃を跳ね返す" },

  // 【魔法 50種】
  { id: "m01", name: "グランドクロス", type: "attack", power: 28, category: "魔法", desc: "聖なる十字の閃光(威力28)" },
  { id: "m02", name: "獄炎波", type: "status_burn", power: 15, category: "魔法", desc: "威15 + 相手をやけど(3T)" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 35, category: "魔法", desc: "超絶大魔法(威力35)" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 15, category: "魔法", desc: "落雷を見舞う(威力15)" },
  { id: "m05", name: "ファイアボール", type: "status_burn", power: 8, category: "魔法", desc: "威8 + 相手をやけど(3T)" },
  { id: "m06", name: "アイスコフィン", type: "status_freeze", power: 10, category: "魔法", desc: "威10 + 相手をこおり(1T)" },
  { id: "m07", name: "ウインドカッター", type: "attack", power: 14, category: "魔法", desc: "風の刃で切り裂く(威力14)" },
  { id: "m08", name: "アースクエイク", type: "attack", power: 20, category: "魔法", desc: "大地を揺らす(威力20)" },
  { id: "m09", name: "ライトニングボルト", type: "attack", power: 16, category: "魔法", desc: "直撃の電撃(威力16)" },
  { id: "m10", name: "メテオストライク", type: "attack", power: 40, category: "魔法", desc: "隕石を落とす超極大技(威力40)" },
  { id: "m11", name: "ダークマター", type: "attack", power: 30, category: "魔法", desc: "暗黒の球体(威力30)" },
  { id: "m12", name: "ホーリーバースト", type: "attack", power: 26, category: "魔法", desc: "神聖な爆発(威力26)" },
  { id: "m13", name: "毒霧", type: "status_burn", power: 10, category: "魔法", desc: "威10 + 継続ダメージ(3T)" },
  { id: "m14", name: "アブソリュートゼロ", type: "status_freeze", power: 18, category: "魔法", desc: "威18 + 相手をこおり(1T)" },
  { id: "m15", name: "インフェルノ", type: "status_burn", power: 20, category: "魔法", desc: "威20 + 相手をやけど(3T)" },
  { id: "m16", name: "シャインスパーク", type: "attack", power: 24, category: "魔法", desc: "眩い閃光(威力24)" },
  { id: "m17", name: "ヴォイドブレイク", type: "attack", power: 29, category: "魔法", desc: "虚無の力で破壊(威力29)" },
  { id: "m18", name: "重力崩壊", type: "attack", power: 33, category: "魔法", desc: "押しつぶす重力(威力33)" },
  { id: "m19", name: "カオスブラスト", type: "status_confuse", power: 20, category: "魔法", desc: "威20 + 相手を混乱(2T)" },
  { id: "m20", name: "サイコショック", type: "status_confuse", power: 12, category: "魔法", desc: "威12 + 相手を混乱(2T)" },
  { id: "m21", name: "デスバインド", type: "status_freeze", power: 15, category: "魔法", desc: "威15 + 相手をこおり(1T)" },
  { id: "m22", name: "ソニックブーム", type: "attack", power: 13, category: "魔法", desc: "衝撃波(威力13)" },
  { id: "m23", name: "プラズマボール", type: "attack", power: 19, category: "魔法", desc: "プラズマの塊(威力19)" },
  { id: "m24", name: "スターダスト", type: "attack", power: 25, category: "魔法", desc: "星屑の降り注ぎ(威力25)" },
  { id: "m25", name: "スーパーノヴァ", type: "attack", power: 38, category: "魔法", desc: "超新星爆発(威力38)" },
  { id: "m26", name: "ラグナロク", type: "attack", power: 42, category: "魔法", desc: "神々の黄昏(威力42)" },
  { id: "m27", name: "アポカリプス", type: "attack", power: 45, category: "魔法", desc: "終末の光(威力45)" },
  { id: "m28", name: "ドラゴフレイム", type: "status_burn", power: 16, category: "魔法", desc: "威16 + 相手をやけど(3T)" },
  { id: "m29", name: "フリージングレイ", type: "status_freeze", power: 10, category: "魔法", desc: "威10 + 相手をこおり(1T)" },
  { id: "m30", name: "ボルテックス", type: "attack", power: 18, category: "魔法", desc: "渦巻く水流(威力18)" },
  { id: "m31", name: "ペトロブレス", type: "status_freeze", power: 8, category: "魔法", desc: "威8 + 相手をこおり(1T)" },
  { id: "m32", name: "シャドウボム", type: "attack", power: 17, category: "魔法", desc: "影の爆弾(威力17)" },
  { id: "m33", name: "ディヴァインレイ", type: "attack", power: 22, category: "魔法", desc: "神の光線(威力22)" },
  { id: "m34", name: "スマイト", type: "attack", power: 19, category: "魔法", desc: "聖なる一撃(威力19)" },
  { id: "m35", name: "ジャッジメント", type: "attack", power: 36, category: "魔法", desc: "審判の刻(威力36)" },
  { id: "m36", name: "裁きの雷", type: "attack", power: 28, category: "魔法", desc: "天からの雷罰(威力28)" },
  { id: "m37", name: "マジックミラー", type: "counter", power: 0, category: "魔法", desc: "次の攻撃を跳ね返す" },
  { id: "m38", name: "ブラッドサック", type: "attack", power: 15, category: "魔法", desc: "血を吸い取る(威力15)" },
  { id: "m39", name: "破滅の輪光", type: "attack", power: 34, category: "魔法", desc: "滅びの環(威力34)" },
  { id: "m40", name: "魔力覚醒", type: "buff_magic", power: 0, category: "魔法", desc: "次の魔法威力2倍" },
  { id: "m41", name: "ヒール", type: "heal", power: 10, category: "魔法", desc: "HPを10回復" },
  { id: "m42", name: "ハイヒール", type: "heal", power: 20, category: "魔法", desc: "HPを20回復" },
  { id: "m43", name: "フルヒール", type: "heal", power: 40, category: "魔法", desc: "HPを40超回復" },
  { id: "m44", name: "回復の光", type: "heal", power: 18, category: "魔法", desc: "HPを18回復" },
  { id: "m45", name: "聖なる祈り", type: "heal", power: 28, category: "魔法", desc: "HPを28大回復" },
  { id: "m46", name: "恵みの雨", type: "heal", power: 15, category: "魔法", desc: "HPを15回復" },
  { id: "m47", name: "奇跡の雫", type: "heal", power: 25, category: "魔法", desc: "HPを25大回復" },
  { id: "m48", name: "生命の息吹", type: "heal", power: 30, category: "魔法", desc: "HPを30大回復" },
  { id: "m49", name: "天使の抱擁", type: "heal", power: 35, category: "魔法", desc: "HPを35特大回復" },
  { id: "m50", name: "治癒の風", type: "heal", power: 12, category: "魔法", desc: "HPを12回復" }
];

function getRandomCard() {
  const card = CARD_MASTER[Math.floor(Math.random() * CARD_MASTER.length)];
  return { ...card, instanceId: Math.random().toString(36).substring(2, 9) };
}

function generateHand() {
  return Array.from({ length: 8 }, getRandomCard);
}

function createDefaultStatus() {
  return { burn: 0, freeze: 0, confused: 0, counter: false, magicUp: false };
}

let waitingPlayer = null;
const games = {};

function startTurn(game, room, nextPlayerNum) {
  const player = game.players[nextPlayerNum];
  let logMsg = "";

  if (player.status.burn > 0) {
    player.hp = Math.max(0, player.hp - 6);
    player.status.burn--;
    logMsg += `🔥 ${player.char} はやけどで 6 ダメージを受けた！ `;
  }

  if (player.hp <= 0) {
    const winner = nextPlayerNum === 1 ? 2 : 1;
    io.to(room).emit("gameStateUpdate", { log: logMsg + `💀 ${player.char} は倒れた！`, winner, players: game.players, turn: 0 });
    delete games[room];
    return;
  }

  if (player.status.freeze > 0) {
    player.status.freeze--;
    logMsg += `🧊 ${player.char} は凍りついて動けない！ ターンがスキップされます。`;
    game.turn = nextPlayerNum === 1 ? 2 : 1;
    io.to(room).emit("gameStateUpdate", { log: logMsg, players: game.players, turn: game.turn });
    startTurn(game, room, game.turn);
    return;
  }

  game.turn = nextPlayerNum;
  io.to(room).emit("gameStateUpdate", { log: logMsg, players: game.players, turn: game.turn });
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
      turn: 1
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
        turn: 1
      });
    }
  });

  socket.on("playCard", (data) => {
    const { room, playerNumber, cardInstanceId } = data;
    const game = games[room];
    if (!game || game.turn !== playerNumber) return;

    const me = game.players[playerNumber];
    const enemyNumber = playerNumber === 1 ? 2 : 1;
    const enemy = game.players[enemyNumber];

    const idx = me.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (idx === -1) return;

    const card = me.hand.splice(idx, 1)[0];
    me.hand.push(getRandomCard());

    let target = enemy;
    let targetIsSelf = false;
    let log = "";

    if (me.status.confused > 0) {
      me.status.confused--;
      if (Math.random() < 0.5) {
        target = me;
        targetIsSelf = true;
        log += `🌀【混乱】${me.char} は混乱して自分を狙った！ `;
      }
    }

    let power = card.power;
    if (card.category === "魔法" && me.status.magicUp) {
      power *= 2;
      me.status.magicUp = false;
      log += `✨【魔力覚醒】魔法威力2倍！ `;
    }

    if (card.type === "attack" || card.type === "double_attack") {
      const hits = card.type === "double_attack" ? 2 : 1;
      const totalDmg = power * hits;

      if (!targetIsSelf && target.status.counter) {
        target.status.counter = false;
        me.hp = Math.max(0, me.hp - totalDmg);
        log += `🛡️ ${target.char} の【カウンター】！ ${me.char} に ${totalDmg} ダメージを跳ね返した！`;
      } else {
        target.hp = Math.max(0, target.hp - totalDmg);
        log += `${me.char} の「${card.name}」(${hits > 1 ? hits + "連撃" : "攻撃"})！ ${target.char} に ${totalDmg} ダメージ！`;
      }
    } else if (card.type === "counter") {
      me.status.counter = true;
      log += `🛡️ ${me.char} は「${card.name}」を構えた！ 次の攻撃を跳ね返す！`;
    } else if (card.type === "buff_magic") {
      me.status.magicUp = true;
      log += `✨ ${me.char} は「${card.name}」を発動！ 次の魔法が威力2倍！`;
    } else if (card.type === "status_freeze") {
      target.hp = Math.max(0, target.hp - power);
      target.status.freeze = 1;
      log += `🧊 ${me.char} の「${card.name}」！ ${target.char} に ${power} ダメージ ＆ こおり(1T)付与！`;
    } else if (card.type === "status_burn") {
      target.hp = Math.max(0, target.hp - power);
      target.status.burn = 3;
      log += `🔥 ${me.char} の「${card.name}」！ ${target.char} に ${power} ダメージ ＆ やけど(3T)付与！`;
    } else if (card.type === "status_confuse") {
      target.hp = Math.max(0, target.hp - power);
      target.status.confused = 2;
      log += `🌀 ${me.char} の「${card.name}」！ ${target.char} に ${power} ダメージ ＆ 混乱(2T)付与！`;
    } else if (card.type === "heal") {
      me.hp = Math.min(me.maxHp, me.hp + power);
      log += `💖 ${me.char} の「${card.name}」！ HPが ${power} 回復！`;
    }

    if (enemy.hp <= 0) {
      io.to(room).emit("gameStateUpdate", { log, winner: playerNumber, players: game.players, turn: 0 });
      delete games[room];
      return;
    }
    if (me.hp <= 0) {
      io.to(room).emit("gameStateUpdate", { log, winner: enemyNumber, players: game.players, turn: 0 });
      delete games[room];
      return;
    }

    startTurn(game, room, enemyNumber);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
