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
  // オレンジの基準サイズ（画像のピクセル半径に合わせて調整する）
  const baseSize = 40;

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

// ゲームオーバーのラインの高さ。キャンバスの上からの距離。
const gameOverHeight = 500;
// オレンジが生成される初期のy座標。キャンバスの上部からの距離。
const orangeSpawnY = 600;

// ゲームオーバーラインがキャンバスの下部に近いほど値が大きく、オレンジの生成位置が上部に近いほど値が小さい。
// 従って、ゲームオーバーラインの値がオレンジの生成位置の値よりも大きくないといけない。
if (gameOverHeight >= orangeSpawnY) {
  throw new Error("The orange spawn height must be below the game over height.");
}


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

Matter.Events.on(render, "afterRender", function () {
  const context = render.context;
  context.beginPath();
  context.moveTo(0, render.options.height - gameOverHeight);
  context.lineTo(render.options.width, render.options.height - gameOverHeight);
  context.strokeStyle = "#ff0000"; // 赤色に設定
  context.lineWidth = 2; // 線の幅を設定
  context.stroke();
});


// エンジンの更新処理にゲームオーバーのチェックを追加
Matter.Events.on(engine, "beforeUpdate", function (event) {
  oranges.forEach(function (orange) {
    // オレンジの半径を取得
    let radius = orange.circleRadius;

      // オレンジの底部が赤い線を超えたかをチェック（オレンジの中心位置 + 半径）
      console.log(orange.position.y);
      console.log(radius);
      console.log(gameOverHeight);
    if (orange.position.y + radius > gameOverHeight) {
      gameOver();
    }
  });
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
