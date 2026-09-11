// 手札描画関数 (ターンやフェーズに応じて光るクラスを付与)
function renderHand(handCards, isMyTurn, phase) {
  const handContainer = document.getElementById("hand-container");
  handContainer.innerHTML = "";

  handCards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card");

    // --- 条件に応じてカードを光らせる ---
    if (isMyTurn) {
      if (phase === "DEFENSE" && card.type === "defense") {
        // 防御ターン：防御カードだけ青く光る
        cardEl.classList.add("glow-defense");
      } else if (phase === "ATTACK" && (card.type === "attack" || card.type === "heal")) {
        // 攻撃ターン：攻撃カード・魔法カードが赤/金に光る
        cardEl.classList.add("glow-attack");
      }
    }

    // カード内容の記述
    cardEl.innerHTML = `
      <div class="card-category">${card.category}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-power">${card.type === 'defense' ? '軽減' : '威力'}: ${card.power}</div>
      <div class="card-mp">消費MP: ${card.mp}</div>
    `;

    cardEl.onclick = () => {
      socket.emit("playCard", {
        room: currentRoom,
        playerNumber: myPlayerNumber,
        cardInstanceId: card.instanceId
      });
    };

    handContainer.appendChild(cardEl);
  });
}

// ゲーム状態の更新受信処理
socket.on("gameStateUpdate", (data) => {
  const isMyTurn = (data.currentTurn === myPlayerNumber);

  // 1. 手札の更新（光る処理を反映）
  const myData = data.players[myPlayerNumber];
  if (myData && myData.hand) {
    renderHand(myData.hand, isMyTurn, data.phase);
  }

  // 2. 画面中央の攻撃威力バナーの表示切り替え
  const banner = document.getElementById("center-attack-banner");
  if (data.phase === "DEFENSE" && data.pendingAttack) {
    // 自分が防御側の時だけ中央にデカデカと表示
    if (data.currentTurn === myPlayerNumber) {
      document.getElementById("alert-card-name").innerText = data.pendingAttack.card.name;
      document.getElementById("alert-power-val").innerText = data.pendingAttack.card.power;
      banner.style.display = "block";
    } else {
      banner.style.display = "none";
    }
  } else {
    banner.style.display = "none";
  }
});
