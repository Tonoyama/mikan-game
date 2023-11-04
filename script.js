// Matter.jsの設定
const { Engine, Render, World, Bodies, Body, Events } = Matter;

// エンジンとレンダラーの作成
const engine = Engine.create();
const render = Render.create({
  element: document.getElementById("gameContainer"),
  engine: engine,
  canvas: document.getElementById("gameCanvas"),
  options: {
    width: 800,
    height: 600,
    wireframes: false, // 画像を使用する場合はfalseに設定
  },
});

// 地面と壁の追加
const ground = Bodies.rectangle(400, 590, 810, 60, { isStatic: true });
const leftWall = Bodies.rectangle(10, 300, 60, 600, { isStatic: true });
const rightWall = Bodies.rectangle(790, 300, 60, 600, { isStatic: true });

World.add(engine.world, [ground, leftWall, rightWall]);

// オレンジオブジェクトの配列
let oranges = [];
// オレンジの基準サイズ（画像のピクセル半径に合わせて調整する）
const baseSize = 40;
const scales = [0.5, 0.7, 1];
const images = ["setoka.png", "kiyomi.png", "kanpei.png"];

// スコアの初期値
let score = 0;
updateScore(0);

// スコアを表示するための関数
function updateScore(points) {
  score += points;
  document.getElementById("score").innerText = score;
}

// 各オレンジのポイント
const orangePoints = {
  "setoka.png": 1,
  "kiyomi.png": 2,
  "kanpei.png": 3,
};

function createOrange(x, y, sizeIndex) {

  // 画像サイズに基づいて物理的な半径を調整
  let radius = baseSize * scales[sizeIndex];
  let orange = Bodies.circle(x, y, radius, {
    restitution: 0.9, // 弾力性
    render: {
      sprite: {
        texture: images[sizeIndex],
        xScale: scales[sizeIndex],
        yScale: scales[sizeIndex],
      },
    },
  });

  orange.sizeIndex = sizeIndex; // サイズインデックスをオレンジに追加
  oranges.push(orange); // 配列に追加
  World.add(engine.world, orange);
}

// ゲームオーバーラインの高さをキャンバスの上からの距離で修正
const gameOverHeight = 50; // この値はゲームのデザインに応じて調整する
let gameOverLineY = gameOverHeight;
console.log(gameOverLineY);

// オレンジが生成される初期のy座標をゲームオーバーラインよりも低く設定
const orangeSpawnY = 100


// ゲームオーバーの関数
function gameOver() {
  // エンジンの更新を止める
  Matter.Engine.clear(engine);
  Matter.Render.stop(render);

  // ゲームオーバーのメッセージとリスタートボタンを表示
  document.getElementById("gameOverContainer").style.display = "block";
}

// リスタートの関数
function restartGame() {
  // ページをリロードすることでゲームをリセット
  window.location.reload();
}

// ゲームオーバーのチェックを行う関数
Matter.Events.on(engine, "beforeUpdate", function (event) {
  oranges.forEach(function (orange) {
    let radius = orange.circleRadius;
    if (orange.position.y - radius < gameOverLineY) {
      // オレンジの底部がゲームオーバーラインを超えたら
      gameOver();
    }
  });
});

// ゲームオーバーラインとオレンジの出現位置の描画
Matter.Events.on(render, "afterRender", function () {
  const context = render.context;
  
  // ゲームオーバーラインの描画
  context.beginPath();
  context.moveTo(0, gameOverLineY);
  context.lineTo(render.options.width, gameOverLineY);
  context.strokeStyle = "#ff0000"; // 赤色でゲームオーバーラインを描画
  context.lineWidth = 2;
  context.stroke();

  // オレンジの出現位置の描画
  context.beginPath();
  context.moveTo(0, orangeSpawnY);
  context.lineTo(render.options.width, orangeSpawnY);
  context.strokeStyle = "#ffa500"; // オレンジ色で出現位置の線を描画
  context.lineWidth = 2;
  context.stroke();
});

// マウスクリックでオレンジを生成
render.canvas.addEventListener("mousedown", function (event) {
  const mousePosition = {
    x: event.clientX - render.canvas.getBoundingClientRect().left,
    y: orangeSpawnY, // オレンジが生成されるy座標
  };

  const sizeIndex = Math.floor(Math.random() * scales.length); // scales.lengthを使用してランダムに選択

  createOrange(mousePosition.x, mousePosition.y, sizeIndex);
});

// 衝突イベント
Events.on(engine, "collisionStart", function (event) {
  event.pairs.forEach(function (pair) {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    // オレンジ同士の衝突をチェック
    if (oranges.includes(bodyA) && oranges.includes(bodyB)) {
      // 同じサイズのオレンジかどうかをチェック
      if (bodyA.sizeIndex === bodyB.sizeIndex) {
        const sizeIndex = bodyA.sizeIndex;

        // 最大サイズのオレンジには合体しないようにする
        if (sizeIndex < scales.length - 1) {
          const newSizeIndex = sizeIndex + 1; // 一つ大きいサイズ
          const newPosX = (bodyA.position.x + bodyB.position.x) / 2;
          const newPosY = (bodyA.position.y + bodyB.position.y) / 2;

          // 既存のオレンジを取り除く
          World.remove(engine.world, bodyA);
          World.remove(engine.world, bodyB);

          // 配列からも取り除く
          oranges = oranges.filter(function (orange) {
            return orange !== bodyA && orange !== bodyB;
          });

          updateScore(orangePoints[images[sizeIndex]]);
          createOrange(newPosX, newPosY, newSizeIndex);
        }
      }
    }
  });
});

// エンジンとレンダラーの実行
Engine.run(engine);
Render.run(render);
