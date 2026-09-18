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

const CARD_MASTER = [
  // 攻撃 (赤)
  { id: "w01", name: "ジャブ", type: "attack", power: 8, mp: 2, category: "基本攻撃" },
  { id: "w02", name: "ローキック", type: "attack", power: 10, mp: 2, category: "基本攻撃" },
  { id: "w05", name: "飛蹴り", type: "attack", power: 12, mp: 3, category: "基本攻撃" },
  { id: "s01", name: "まわし蹴り", type: "attack", power: 20, mp: 5, category: "強攻撃" },
  { id: "s05", name: "常闇突き", type: "attack", power: 32, mp: 8, category: "強攻撃" },
  { id: "s08", name: "落撃", type: "attack", power: 38, mp: 10, category: "強攻撃" },
  // 防御 (青)
  { id: "d01", name: "ガード", type: "defense", power: 5, mp: 1, category: "防御" },
  { id: "d05", name: "見切り", type: "defense", power: 12, mp: 3, category: "防御" },
  { id: "d08", name: "大盾の構え", type: "defense", power: 18, mp: 5, category: "防御" },
  { id: "d11", name: "光の護法陣", type: "defense", power: 28, mp: 7, category: "防御" },
  { id: "d15", name: "究極の防壁", type: "defense", power: 35, mp: 9, category: "防御" },
  // 魔法 (黄)
  { id: "m01", name: "ファイアボール", type: "magic", power: 12, mp: 3, category: "魔法" },
  { id: "m03", name: "アイスコフィン", type: "magic", power: 22, mp: 5, category: "魔法" },
  { id: "m07", name: "ギガフレア", type: "magic", power: 45, mp: 14, category: "魔法" },
  { id: "m08", name: "キュア", type: "heal", power: 15, mp: 4, category: "魔法" }
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
