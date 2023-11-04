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

function createOrange(x, y, sizeIndex, isStatic = false) {
  let radius = baseSize * scales[sizeIndex];
  let orange = Bodies.circle(x, y, radius, {
    isStatic: isStatic,
    restitution: 0.9,
    render: {
      sprite: {
        texture: images[sizeIndex],
        xScale: scales[sizeIndex],
        yScale: scales[sizeIndex],
      },
    },
  });

  orange.sizeIndex = sizeIndex;
  oranges.push(orange);
  World.add(engine.world, orange);
}

// ゲームオーバーラインの高さをキャンバスの上からの距離で修正
const gameOverHeight = 50; // この値はゲームのデザインに応じて調整する
let gameOverLineY = gameOverHeight;
console.log(gameOverLineY);

// オレンジが生成される初期のy座標をゲームオーバーラインよりも低く設定
const orangeSpawnY = 100;

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
  const now = Date.now();

  oranges.forEach(function (orange) {
    let radius = orange.circleRadius;

    // オレンジの底部がゲームオーバーラインを超えたかチェック
    if (orange.position.y - radius < gameOverLineY) {
      // オレンジにタイムアウトプロパティがなければ設定する
      if (!orange.timeout) {
        orange.timeout = now;
      }

      // オレンジがゲームオーバーラインを超えてから2秒以上経過したかチェック
      if (now - orange.timeout >= 2000) {
        gameOver();
      }
    } else {
      // オレンジがゲームオーバーラインより下にあればタイムアウトをリセット
      delete orange.timeout;
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
  context.strokeStyle = "#ffa500"; // 赤色でゲームオーバーラインを描画
  context.lineWidth = 2;
  context.stroke();
});

// ゲーム初期化時に待機するオレンジを作成
function createInitialOrange() {
  const x = render.options.width / 2; // キャンバスの中央
  const sizeIndex = Math.floor(Math.random() * scales.length); // ランダムなサイズ
  createOrange(x, orangeSpawnY, sizeIndex, true); // trueを追加してオレンジを静的にする
}

// 初期オレンジの静的状態を解除する関数
function releaseOrange() {
  if (oranges.length > 0) {
    Body.setStatic(oranges[0], false); // 最初のオレンジを動的にする
  }
}

// ゲーム開始時に中央にオレンジを配置して待機させる
createInitialOrange();

// マウスクリックでオレンジを生成
render.canvas.addEventListener("mousedown", function (event) {
  // クリックした位置のx座標を取得
  const mouseX = event.clientX - render.canvas.getBoundingClientRect().left;

  // まずは待機中のオレンジ（もしあれば）を動的に変更する
  if (oranges.length > 0) {
    const waitingOrange = oranges.find(orange => orange.isStatic); // 待機中のオレンジを検索
    if (waitingOrange) {
      // 待機中のオレンジの位置をクリックしたx座標に変更
      Body.setPosition(waitingOrange, { x: mouseX, y: waitingOrange.position.y });
      // オレンジを動的にする
      Body.setStatic(waitingOrange, false);
    }
  }

  // 次に、新しいオレンジを生成して静的状態で待機させる
  createOrange(render.options.width / 2, orangeSpawnY, Math.floor(Math.random() * scales.length), true);
});

var ponSound = new Audio("pon.mp3");

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

          ponSound.play();

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
