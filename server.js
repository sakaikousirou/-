const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// キャラクター定義（ナイトを鈴木ゴンザレスに変更）
const CHARACTERS = {
  suzuki: { name: "鈴木ゴンザレス", hp: 130, maxHp: 130, desc: "圧倒的タフネスを誇る謎の男" },
  wizard: { name: "ウィザード", hp: 80, maxHp: 80, desc: "低HP・高火力魔法型" },
  rogue: { name: "ローグ", hp: 100, maxHp: 100, desc: "標準バランス型" }
};

// 大量追加カードマスター（計80種）
const CARD_MASTER = [
  // 【弱攻撃 15種】
  { id: "w01", name: "ジャブ", type: "attack", power: 5, category: "弱攻撃", desc: "素早いパンチ(威力5)" },
  { id: "w02", name: "ローキック", type: "attack", power: 7, category: "弱攻撃", desc: "相手の足を刈る(威力7)" },
  { id: "w03", name: "ストレート", type: "attack", power: 6, category: "弱攻撃", desc: "まっすぐ放つ(威力6)" },
  { id: "w04", name: "クナイ投げ", type: "attack", power: 8, category: "弱攻撃", desc: "牽制のクナイ(威力8)" },
  { id: "w05", name: "前蹴り", type: "attack", power: 6, category: "弱攻撃", desc: "距離をとる蹴り(威力6)" },
  { id: "w06", name: "しっぺ", type: "attack", power: 3, category: "弱攻撃", desc: "地味に痛い(威力3)" },
  { id: "w07", name: "カンチョー", type: "attack", power: 9, category: "弱攻撃", desc: "油断を突く一撃(威力9)" },
  { id: "w08", name: "アッパーカット", type: "attack", power: 8, category: "弱攻撃", desc: "顎を狙い打つ(威力8)" },
  { id: "w09", name: "エルボー", type: "attack", power: 7, category: "弱攻撃", desc: "肘で削る(威力7)" },
  { id: "w10", name: "チョップ", type: "attack", power: 5, category: "弱攻撃", desc: "手刀を打ち下ろす(威力5)" },
  { id: "w11", name: "砂かけ", type: "attack", power: 4, category: "弱攻撃", desc: "目くらまし攻撃(威力4)" },
  { id: "w12", name: "頭突き", type: "attack", power: 8, category: "弱攻撃", desc: "頑丈な頭部で打撃(威力8)" },
  { id: "w13", name: "膝蹴り", type: "attack", power: 7, category: "弱攻撃", desc: "近接からの膝(威力7)" },
  { id: "w14", name: "ネコパンチ", type: "attack", power: 4, category: "弱攻撃", desc: "連打で刻む(威力4)" },
  { id: "w15", name: "つっつき", type: "attack", power: 3, category: "弱攻撃", desc: "指先で突く(威力3)" },

  // 【強攻撃 15種】
  { id: "s01", name: "まわし蹴り", type: "attack", power: 12, category: "強攻撃", desc: "強力な回転蹴り(威力12)" },
  { id: "s02", name: "一本背負い", type: "attack", power: 16, category: "強攻撃", desc: "豪快な投げ技(威力16)" },
  { id: "s03", name: "飛翔膝蹴り", type: "attack", power: 20, category: "強攻撃", desc: "跳躍からの大技(威力20)" },
  { id: "s04", name: "袈裟斬り", type: "attack", power: 14, category: "強攻撃", desc: "鋭い一閃(威力14)" },
  { id: "s05", name: "地獄突き", type: "attack", power: 22, category: "強攻撃", desc: "急所を突く極大技(威力22)" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 18, category: "強攻撃", desc: "両足での飛び蹴り(威力18)" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 21, category: "強攻撃", desc: "ぶん回して投げる(威力21)" },
  { id: "s08", name: "必殺ラッシュ", type: "attack", power: 24, category: "強攻撃", desc: "怒涛の連続攻撃(威力24)" },
  { id: "s09", name: "胴まわし回転蹴り", type: "attack", power: 19, category: "強攻撃", desc: "アクロバティック技(威力19)" },
  { id: "s10", name: "爆殺パンチ", type: "attack", power: 23, category: "強攻撃", desc: "渾身の一撃(威力23)" },
  { id: "s11", name: "頭骨砕き", type: "attack", power: 17, category: "強攻撃", desc: "上空からの振り下ろし(威力17)" },
  { id: "s12", name: "崩拳", type: "attack", power: 25, category: "強攻撃", desc: "気合の突進拳(威力25)" },
  { id: "s13", name: "竜巻旋風脚", type: "attack", power: 18, category: "強攻撃", desc: "風を纏う蹴り(威力18)" },
  { id: "s14", name: "烈空脚", type: "attack", power: 16, category: "強攻撃", desc: "空中で連続蹴り(威力16)" },
  { id: "s15", name: "滅殺拳", type: "attack", power: 26, category: "強攻撃", desc: "フィニッシュブロウ(威力26)" },

  // 【魔法 50種】
  // 攻撃魔法 (40種)
  { id: "m01", name: "グランドクロス", type: "attack", power: 28, category: "魔法", desc: "聖なる十字の閃光(威力28)" },
  { id: "m02", name: "獄炎波", type: "attack", power: 22, category: "魔法", desc: "地獄の炎で焼く(威力22)" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 35, category: "魔法", desc: "超絶大魔法(威力35)" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 15, category: "魔法", desc: "落雷を見舞う(威力15)" },
  { id: "m05", name: "ファイアボール", type: "attack", power: 12, category: "魔法", desc: "火の玉を放つ(威力12)" },
  { id: "m06", name: "アイスコフィン", type: "attack", power: 18, category: "魔法", desc: "氷の棺で閉じ込める(威力18)" },
  { id: "m07", name: "ウインドカッター", type: "attack", power: 14, category: "魔法", desc: "風の刃で切り裂く(威力14)" },
  { id: "m08", name: "アースクエイク", type: "attack", power: 20, category: "魔法", desc: "大地を揺らす(威力20)" },
  { id: "m09", name: "ライトニングボルト", type: "attack", power: 16, category: "魔法", desc: "直撃の電撃(威力16)" },
  { id: "m10", name: "メテオストライク", type: "attack", power: 40, category: "魔法", desc: "隕石を落とす超極大技(威力40)" },
  { id: "m11", name: "ダークマター", type: "attack", power: 30, category: "魔法", desc: "暗黒の球体(威力30)" },
  { id: "m12", name: "ホーリーバースト", type: "attack", power: 26, category: "魔法", desc: "神聖な爆発(威力26)" },
  { id: "m13", name: "毒霧", type: "attack", power: 10, category: "魔法", desc: "蝕む毒ガス(威力10)" },
  { id: "m14", name: "アブソリュートゼロ", type: "attack", power: 32, category: "魔法", desc: "絶対零度の世界(威力32)" },
  { id: "m15", name: "インフェルノ", type: "attack", power: 27, category: "魔法", desc: "業火の炎(威力27)" },
  { id: "m16", name: "シャインスパーク", type: "attack", power: 24, category: "魔法", desc: "眩い閃光(威力24)" },
  { id: "m17", name: "ヴォイドブレイク", type: "attack", power: 29, category: "魔法", desc: "虚無の力で破壊(威力29)" },
  { id: "m18", name: "重力崩壊", type: "attack", power: 33, category: "魔法", desc: "押しつぶす重力(威力33)" },
  { id: "m19", name: "カオスブラスト", type: "attack", power: 31, category: "魔法", desc: "混沌の衝動(威力31)" },
  { id: "m20", name: "サイコショック", type: "attack", power: 17, category: "魔法", desc: "精神に響く衝撃(威力17)" },
  { id: "m21", name: "デスバインド", type: "attack", power: 21, category: "魔法", desc: "死の束縛(威力21)" },
  { id: "m22", name: "ソニックブーム", type: "attack", power: 13, category: "魔法", desc: "衝撃波(威力13)" },
  { id: "m23", name: "プラズマボール", type: "attack", power: 19, category: "魔法", desc: "プラズマの塊(威力19)" },
  { id: "m24", name: "スターダスト", type: "attack", power: 25, category: "魔法", desc: "星屑の降り注ぎ(威力25)" },
  { id: "m25", name: "スーパーノヴァ", type: "attack", power: 38, category: "魔法", desc: "超新星爆発(威力38)" },
  { id: "m26", name: "ラグナロク", type: "attack", power: 42, category: "魔法", desc: "神々の黄昏(威力42)" },
  { id: "m27", name: "アポカリプス", type: "attack", power: 45, category: "魔法", desc: "終末の光(威力45)" },
  { id: "m28", name: "ドラゴフレイム", type: "attack", power: 23, category: "魔法", desc: "竜のブレス(威力23)" },
  { id: "m29", name: "フリージングレイ", type: "attack", power: 16, category: "魔法", desc: "冷凍光線(威力16)" },
  { id: "m30", name: "ボルテックス", type: "attack", power: 18, category: "魔法", desc: "渦巻く水流(威力18)" },
  { id: "m31", name: "ペトロブレス", type: "attack", power: 15, category: "魔法", desc: "石化の吐息(威力15)" },
  { id: "m32", name: "シャドウボム", type: "attack", power: 17, category: "魔法", desc: "影の爆弾(威力17)" },
  { id: "m33", name: "ディヴァインレイ", type: "attack", power: 22, category: "魔法", desc: "神の光線(威力22)" },
  { id: "m34", name: "スマイト", type: "attack", power: 19, category: "魔法", desc: "聖なる一撃(威力19)" },
  { id: "m35", name: "ジャッジメント", type: "attack", power: 36, category: "魔法", desc: "審判の刻(威力36)" },
  { id: "m36", name: "裁きの雷", type: "attack", power: 28, category: "魔法", desc: "天からの雷罰(威力28)" },
  { id: "m37", name: "幻影刃", type: "attack", power: 14, category: "魔法", desc: "実体のない刃(威力14)" },
  { id: "m38", name: "ブラッドサック", type: "attack", power: 15, category: "魔法", desc: "血を吸い取る(威力15)" },
  { id: "m39", name: "破滅の輪光", type: "attack", power: 34, category: "魔法", desc: "滅びの環(威力34)" },
  { id: "m40", name: "邪眼", type: "attack", power: 11, category: "魔法", desc: "呪いの視線(威力11)" },

  // 回復魔法 (10種)
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

let waitingPlayer = null;
const games = {};

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
        1: { id: p1.id, char: null, hp: 100, maxHp: 100, hand: generateHand(), ready: false },
        2: { id: p2.id, char: null, hp: 100, maxHp: 100, hand: generateHand(), ready: false }
      },
      turn: 1
    };

    io.to(roomName).emit("selectCharacterPhase", { room: roomName, characters: CHARACTERS });
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
      const p1 = game.players[1];
      const p2 = game.players[2];

      io.to(room).emit("gameStart", {
        room,
        p1State: { char: p1.char, hp: p1.hp, maxHp: p1.maxHp, hand: p1.hand },
        p2State: { char: p2.char, hp: p2.hp, maxHp: p2.maxHp, hand: p2.hand }
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

    let log = "";
    if (card.type === "attack") {
      enemy.hp = Math.max(0, enemy.hp - card.power);
      log = `${me.char}(P${playerNumber}) の「${card.name}」！ ${enemy.char} に ${card.power} ダメージ！`;
    } else {
      me.hp = Math.min(me.maxHp, me.hp + card.power);
      log = `${me.char}(P${playerNumber}) の「${card.name}」！ HPが ${card.power} 回復！`;
    }

    if (enemy.hp <= 0) {
      io.to(room).emit("gameStateUpdate", { log, winner: playerNumber, players: game.players, turn: 0 });
      delete games[room];
      return;
    }

    game.turn = enemyNumber;
    io.to(room).emit("gameStateUpdate", { log, players: game.players, turn: game.turn });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
