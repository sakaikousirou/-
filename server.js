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

// 【全80種類】カードマスターデータ（基本15種＋強15種＋魔法50種）
const CARD_MASTER = [
  // --- 基本攻撃（15種） ---
  { id: "w01", name: "ジャブ", type: "attack", power: 5, mp: 1, category: "基本攻撃", desc: "威5 手軽なパンチ(MP1)" },
  { id: "w02", name: "ローキック", type: "attack", power: 7, mp: 1, category: "基本攻撃", desc: "威7 足元を狙う蹴り(MP1)" },
  { id: "w03", name: "ストレート", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 まっすぐな拳(MP1)" },
  { id: "w04", name: "クナイ投げ", type: "attack", power: 4, mp: 1, category: "基本攻撃", desc: "威4 手軽な遠射(MP1)" },
  { id: "w05", name: "飛蹴り", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 跳躍からの蹴り(MP1)" },
  { id: "w06", name: "しっぺ", type: "attack", power: 3, mp: 0, category: "基本攻撃", desc: "威3 ノーコスト攻撃(MP0)" },
  { id: "w07", name: "カンチョー", type: "attack", power: 5, mp: 1, category: "基本攻撃", desc: "威5 虚をつく奇襲(MP1)" },
  { id: "w08", name: "アッパーカット", type: "attack", power: 8, mp: 2, category: "基本攻撃", desc: "威8 顎を穿つ拳(MP2)" },
  { id: "w09", name: "エルボー", type: "attack", power: 7, mp: 1, category: "基本攻撃", desc: "威7 強烈な肘打ち(MP1)" },
  { id: "w10", name: "チョップ", type: "attack", power: 5, mp: 1, category: "基本攻撃", desc: "威5 手刀打ち(MP1)" },
  { id: "w11", name: "膝かけ", type: "attack", power: 3, mp: 0, category: "基本攻撃", desc: "威3 崩し攻撃(MP0)" },
  { id: "w12", name: "影走り", type: "attack", power: 7, mp: 1, category: "基本攻撃", desc: "威7 敏捷な一撃(MP1)" },
  { id: "w13", name: "膝蹴り", type: "attack", power: 6, mp: 1, category: "基本攻撃", desc: "威6 腹部への膝(MP1)" },
  { id: "w14", name: "ネコパンチ", type: "attack", power: 3, mp: 0, category: "基本攻撃", desc: "威3 連射パンチ(MP0)" },
  { id: "w15", name: "つつき", type: "attack", power: 3, mp: 0, category: "基本攻撃", desc: "威3 ノーコスト(MP0)" },

  // --- 強攻撃（15種） ---
  { id: "s01", name: "まわし蹴り", type: "attack", power: 12, mp: 3, category: "強攻撃", desc: "威12 強烈な回し蹴り(MP3)" },
  { id: "s02", name: "一本背負い", type: "attack", power: 16, mp: 4, category: "強攻撃", desc: "威16 豪快な投げ(MP4)" },
  { id: "s03", name: "飛膝蹴り", type: "attack", power: 20, mp: 5, category: "強攻撃", desc: "威20 飛び膝蹴り(MP5)" },
  { id: "s04", name: "居合切り", type: "attack", power: 14, mp: 3, category: "強攻撃", desc: "威14 一閃の一撃(MP3)" },
  { id: "s05", name: "常闇突き", type: "attack", power: 22, mp: 6, category: "強攻撃", desc: "威22 闇を纏う突進(MP6)" },
  { id: "s06", name: "ドロップキック", type: "attack", power: 18, mp: 5, category: "強攻撃", desc: "威18 必殺飛び蹴り(MP5)" },
  { id: "s07", name: "ジャイアントスイング", type: "attack", power: 21, mp: 6, category: "強攻撃", desc: "威21 大豪快投げ(MP6)" },
  { id: "s08", name: "必殺ラリアット", type: "attack", power: 12, mp: 3, category: "強攻撃", desc: "威12 豪腕のラリアット(MP3)" },
  { id: "s09", name: "胴まわし回転蹴り", type: "attack", power: 19, mp: 5, category: "強攻撃", desc: "威19 回転大技(MP5)" },
  { id: "s10", name: "爆殺パンチ", type: "attack", power: 23, mp: 7, category: "強攻撃", desc: "威23 爆発的な拳(MP7)" },
  { id: "s11", name: "竜巻砕き", type: "attack", power: 17, mp: 4, category: "強攻撃", desc: "威17 風を纏う撃打(MP4)" },
  { id: "s12", name: "落撃", type: "attack", power: 25, mp: 8, category: "強攻撃", desc: "威25 空中からの全開撃(MP8)" },
  { id: "s13", name: "必殺疾風突き", type: "attack", power: 9, mp: 2, category: "強攻撃", desc: "威9 神速の突き(MP2)" },
  { id: "s14", name: "天空脚", type: "attack", power: 18, mp: 5, category: "強攻撃", desc: "威18 天空からの蹴り(MP5)" },
  { id: "s15", name: "カウンターアタック", type: "attack", power: 15, mp: 4, category: "強攻撃", desc: "威15 反撃の一撃(MP4)" },

  // --- 魔法（50種） ---
  { id: "m01", name: "グランドクロス", type: "attack", power: 28, mp: 9, category: "魔法", desc: "威28 聖なる十字(MP9)" },
  { id: "m02", name: "野火炎", type: "attack", power: 15, mp: 4, category: "魔法", desc: "威15 野山を焼く炎(MP4)" },
  { id: "m03", name: "ギガフレア", type: "attack", power: 35, mp: 12, category: "魔法", desc: "威35 絶大なる爆炎(MP12)" },
  { id: "m04", name: "サンダーボルト", type: "attack", power: 15, mp: 4, category: "魔法", desc: "威15 雷撃(MP4)" },
  { id: "m05", name: "ファイアボール", type: "attack", power: 8, mp: 2, category: "魔法", desc: "威8 火の玉(MP2)" },
  { id: "m06", name: "アイスコフィン", type: "attack", power: 18, mp: 5, category: "魔法", desc: "威18 氷棺(MP5)" },
  { id: "m07", name: "ウインドカッター", type: "attack", power: 14, mp: 4, category: "魔法", desc: "威14 風の刃(MP4)" },
  { id: "m08", name: "アースクエイク", type: "attack", power: 20, mp: 6, category: "魔法", desc: "威20 大地震(MP6)" },
  { id: "m09", name: "ライトニングボルト", type: "attack", power: 16, mp: 5, category: "魔法", desc: "威16 稲妻(MP5)" },
  { id: "m10", name: "ウォーターブレス", type: "attack", power: 12, mp: 3, category: "魔法", desc: "威12 水流撃(MP3)" },
  { id: "m11", name: "メガファイア", type: "attack", power: 22, mp: 7, category: "魔法", desc: "威22 大火炎(MP7)" },
  { id: "m12", name: "フリーズ", type: "attack", power: 13, mp: 4, category: "魔法", desc: "威13 氷結(MP4)" },
  { id: "m13", name: "ホーリー",
