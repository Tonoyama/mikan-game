// Matter.jsの設定
const { Engine, Render, World, Bodies, Body, Events } = Matter;

// 定数と設定
const CANVAS_WIDTH = 800; // キャンバス(箱)の幅
const CANVAS_HEIGHT = 600; // キャンバス(箱)の高さ
const GROUND_HEIGHT = 60; // 地面の高さ
const WALL_THICKNESS = 60; // 壁の厚さ
const BASE_SIZE = 40; // オレンジの基準サイズ（画像のピクセル半径に合わせて調整する）
const ORANGE_SPAWN_Y = 50; // オレンジが生成される初期のy座標
const GAME_OVER_HEIGHT = 100; // ゲームオーバーラインの高さ
const ORANGE_TIMEOUT = 2000;
const NEW_ORANGE_DELAY = 300;
const scales = [0.5, 0.7, 1];
const images = [
  "static/images/kanpei.png",
  "static/images/kiyomi.png",
  "static/images/kanpei.png",
];
const orangePoints = {
  "static/images/setoka.png": 1,
  "static/images/kiyomi.png": 2,
  "static/images/kanpei.png": 3,
};

// エンジンとレンダラーの作成
const engine = Engine.create();
const render = Render.create({
  element: document.getElementById("gameContainer"),
  engine: engine,
  canvas: document.getElementById("gameCanvas"),
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false, // 画像を使用する場合はfalseに設定
  },
});

// 地面と壁の追加
const ground = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT - GROUND_HEIGHT / 2,
  CANVAS_WIDTH + 10,
  GROUND_HEIGHT,
  { isStatic: true }
);
const leftWall = Bodies.rectangle(
  WALL_THICKNESS / 2,
  CANVAS_HEIGHT / 2,
  WALL_THICKNESS,
  CANVAS_HEIGHT,
  { isStatic: true }
);
const rightWall = Bodies.rectangle(
  CANVAS_WIDTH - WALL_THICKNESS / 2,
  CANVAS_HEIGHT / 2,
  WALL_THICKNESS,
  CANVAS_HEIGHT,
  { isStatic: true }
);
World.add(engine.world, [ground, leftWall, rightWall]);

// オレンジオブジェクトの配列
let oranges = [];

// スコアの初期値
let score = 0;
updateScore(0);

// スコアを表示するための関数
function updateScore(points) {
  score += points;
  document.getElementById("score").innerText = score;
}

function createOrange(x, y, sizeIndex, isStatic = false) {
  let radius = BASE_SIZE * scales[sizeIndex];
  let orange = Bodies.circle(x, y, radius, {
    isStatic: isStatic,
    restitution: 0.7,
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

let gameOverLineY = GAME_OVER_HEIGHT;

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

    // オレンジが動的で、底部がゲームオーバーラインを超えたかチェック
    if (!orange.isStatic && orange.position.y - radius < gameOverLineY) {
      // オレンジにタイムアウトプロパティがなければ設定する
      if (!orange.timeout) {
        orange.timeout = now;
      }

      // オレンジがゲームオーバーラインを超えてから2秒以上経過したかチェック
      if (now - orange.timeout >= ORANGE_TIMEOUT) {
        gameOver();
      }
    } else {
      // オレンジが動的、またはゲームオーバーラインより下にあればタイムアウトをリセット
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
  createOrange(x, ORANGE_SPAWN_Y, sizeIndex, true); // trueを追加してオレンジを静的にする
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
let lastOrangeCreationTime = 0;

render.canvas.addEventListener("mousedown", function (event) {
  const currentTime = Date.now();
  // 待機中のオレンジを解放する
  if (oranges.length > 0) {
    const waitingOrange = oranges.find((orange) => orange.isStatic);
    if (waitingOrange) {
      // 解放されたオレンジの位置をクリックしたX座標に設定する
      Body.setStatic(waitingOrange, false);
      Body.setPosition(waitingOrange, {
        x: event.clientX - render.canvas.getBoundingClientRect().left,
        y: waitingOrange.position.y,
      });
    }
  }

  // 前回のオレンジ生成から十分な時間が経過していれば、新しいオレンジを生成する
  if (currentTime - lastOrangeCreationTime >= NEW_ORANGE_DELAY) {
    lastOrangeCreationTime = currentTime;

    setTimeout(() => {
      const nextOrangeX = render.options.width / 2; // 画面の中央
      const nextOrangeY = ORANGE_SPAWN_Y; // 事前に定義されたY座標
      createOrange(
        nextOrangeX,
        nextOrangeY,
        Math.floor(Math.random() * scales.length),
        true
      );
    }, NEW_ORANGE_DELAY);
  }
});

var ponSound = new Audio("static/sound/pon.mp3");

// 衝突イベント
Events.on(engine, "collisionStart", function (event) {
  event.pairs.forEach(function (pair) {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    if (oranges.includes(bodyA) && oranges.includes(bodyB)) {
      // 同じサイズのオレンジが衝突した場合
      if (bodyA.sizeIndex === bodyB.sizeIndex) {
        // サイズを一つ大きくする
        const sizeIndex = bodyA.sizeIndex;
        if (sizeIndex < scales.length - 1) {
          const newSizeIndex = sizeIndex + 1; // 一つ大きいサイズ
          const newPosX = (bodyA.position.x + bodyB.position.x) / 2;
          const newPosY = (bodyA.position.y + bodyB.position.y) / 2;

          // 既存のオレンジを削除
          oranges = oranges.filter(
            (orange) => orange !== bodyA && orange !== bodyB
          );
          World.remove(engine.world, [bodyA, bodyB]);

          // 新しいサイズのオレンジを生成
          createOrange(newPosX, newPosY, newSizeIndex);
          updateScore(orangePoints[images[sizeIndex]]);
          
          // 音を鳴らす
          ponSound.play();
        }
      }
    }
  });
});

// エンジンとレンダラーの実行
Engine.run(engine);
Render.run(render);
