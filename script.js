// Matter.jsの設定
const { Engine, Render, World, Bodies, Body, Events } = Matter;

// 定数と設定
const CANVAS_WIDTH = 800; // キャンバス(箱)の幅
// キャンバスの高さをブラウザの表示領域の3/4に設定
const CANVAS_HEIGHT =
  window.innerWidth < 768
    ? window.innerHeight * 1.5
    : window.innerHeight * 0.75;

const GROUND_HEIGHT_RATIO = 0.03; // 地面の高さをキャンバス高さの10%とする
const WALL_THICKNESS_RATIO = 0.04; // 壁の厚さ
const ORANGE_SPAWN_Y_RATIO = 0.08; // スポーン位置をキャンバス高さの8%とする
const GAME_OVER_HEIGHT_RATIO = 0.16; // ゲームオーバーラインの位置をキャンバス高さの16%とする

const GROUND_HEIGHT = CANVAS_HEIGHT * GROUND_HEIGHT_RATIO;
const WALL_THICKNESS = CANVAS_HEIGHT * WALL_THICKNESS_RATIO;
const ORANGE_SPAWN_Y = CANVAS_HEIGHT * ORANGE_SPAWN_Y_RATIO;
const GAME_OVER_HEIGHT = CANVAS_HEIGHT * GAME_OVER_HEIGHT_RATIO;

const BASE_SIZE = 50; // オレンジの基準サイズ（画像のピクセル半径に合わせて調整する）
const ORANGE_TIMEOUT = 2000;
const NEW_ORANGE_DELAY = 600;
const IMAGE_PATH = "static/images/citrus/"; // かんきつの画像の共通パス
const scales = [0.5, 0.8, 1.0, 1.3, 1.5, 1.8, 2, 2.5, 3, 3.3, 3.8];
const images = [
  `${IMAGE_PATH}kanpei.png`,
  `${IMAGE_PATH}kiyomi.png`,
  `${IMAGE_PATH}iyokan.png`,
  `${IMAGE_PATH}kashino28.png`,
  `${IMAGE_PATH}natsumi.png`,
  `${IMAGE_PATH}kawati.png`,
  `${IMAGE_PATH}setoka.png`,
  `${IMAGE_PATH}harehime.png`,
  `${IMAGE_PATH}ponkan.png`,
  `${IMAGE_PATH}siranui.png`,
  `${IMAGE_PATH}unsyu.png`,
];
const orangePoints = {
  [`${IMAGE_PATH}kanpei.png`]: 1,
  [`${IMAGE_PATH}kiyomi.png`]: 3,
  [`${IMAGE_PATH}iyokan.png`]: 6,
  [`${IMAGE_PATH}kashino28.png`]: 10,
  [`${IMAGE_PATH}natsumi.png`]: 15,
  [`${IMAGE_PATH}kawati.png`]: 21,
  [`${IMAGE_PATH}setoka.png`]: 28,
  [`${IMAGE_PATH}harehime.png`]: 36,
  [`${IMAGE_PATH}ponkan.png`]: 45,
  [`${IMAGE_PATH}siranui.png`]: 55,
  [`${IMAGE_PATH}unsyu.png`]: 100,
};

const citrus_name = [
  "甘平・愛媛Queenスプラッシュ",
  "清見（きよみ）",
  "伊予柑（いよかん）",
  "愛媛果試第28号（紅まどんな）",
  "カラ・南津海（なつみ）",
  "河内晩柑（かわちばんかん）",
  "せとか",
  "はれひめ",
  "ポンカン",
  "不知火（しらぬい）",
  "温州みかん",
];

const CITRUS_BAR_IMAGE_PATH = "static/images/citrus_bar/"; // かんきつバーの画像の共通パス

const citrus_bar_images = [
  `${CITRUS_BAR_IMAGE_PATH}1.png`,
  `${CITRUS_BAR_IMAGE_PATH}2.png`,
  `${CITRUS_BAR_IMAGE_PATH}3.png`,
  `${CITRUS_BAR_IMAGE_PATH}4.png`,
  `${CITRUS_BAR_IMAGE_PATH}5.png`,
  `${CITRUS_BAR_IMAGE_PATH}6.png`,
  `${CITRUS_BAR_IMAGE_PATH}7.png`,
  `${CITRUS_BAR_IMAGE_PATH}8.png`,
  `${CITRUS_BAR_IMAGE_PATH}9.png`,
  `${CITRUS_BAR_IMAGE_PATH}10.png`,
  `${CITRUS_BAR_IMAGE_PATH}11.png`,
];

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
  {
    isStatic: true,
    render: {
      fillStyle: "#ffedd5", // 地面の色を茶色に変更
    },
  }
);

const leftWall = Bodies.rectangle(
  WALL_THICKNESS, // x位置を調整
  CANVAS_HEIGHT / 2,
  WALL_THICKNESS * 2, // 壁の厚さを2倍に
  CANVAS_HEIGHT,
  {
    isStatic: true,
    render: {
      fillStyle: "#ffedd5", // 左の壁の色
    },
  }
);

const rightWall = Bodies.rectangle(
  CANVAS_WIDTH,
  CANVAS_HEIGHT / 2,
  WALL_THICKNESS,
  CANVAS_HEIGHT,
  {
    isStatic: true,
    render: {
      fillStyle: "#ffedd5", // 右の壁の色
    },
  }
);

World.add(engine.world, [ground, leftWall, rightWall]);

let loadedImages = [];

function preloadImages() {
  citrus_bar_images.forEach((imgUrl, index) => {
    const image = new Image();
    image.src = imgUrl;
    loadedImages[index] = image;
  });
}

// ゲーム初期化時に呼び出し
preloadImages();

// オレンジオブジェクトの配列
let oranges = [];

// スコアの初期値
let score = 0;
updateScore(0);

// スコアを表示するための関数
function updateScore(points) {
  score += points;
  // ゲームオーバー時の最終スコア表示を更新
  document.getElementById("finalScore").innerText = score;
  // ゲーム中のスコア表示を更新 (ゲーム画面内)
  document.getElementById("scoreDisplay").innerText =
    "獲得スコア: " + score + "点";
}

function getRandomSizeIndex() {
  const weightedIndices = [0, 0, 1, 1, 2, 3, 4];
  return weightedIndices[Math.floor(Math.random() * weightedIndices.length)];
}

let maxOrangeSizeIndex = 0; // 最大のオレンジサイズインデックスを追跡

function createOrange(x, y, sizeIndex, isStatic = false) {
  let radius = BASE_SIZE * scales[sizeIndex];
  let orange = Bodies.circle(x, y, radius, {
    isStatic: isStatic,
    restitution: 0.3,
    render: {
      sprite: {
        texture: images[sizeIndex],
        xScale: scales[sizeIndex],
        yScale: scales[sizeIndex],
      },
    },
  });

  orange.sizeIndex = sizeIndex;

  // 最大サイズインデックスの更新
  if (sizeIndex > maxOrangeSizeIndex) {
    maxOrangeSizeIndex = sizeIndex;
  }

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

    // document.getElementById("gameOverContainer").style.display = "block";

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

  // 最大のsizeIndexを持つオレンジを見つける
  let maxSizeIndex = -1;
  oranges.forEach((orange) => {
    if (orange.sizeIndex > maxSizeIndex) {
      maxSizeIndex = orange.sizeIndex;
    }
  });

  updateCitrusNameDisplay(maxSizeIndex);

  if (maxSizeIndex >= 0) {
    const image = loadedImages[maxSizeIndex];

    if (image && image.complete) {
      // 画像の元のアスペクト比を維持しながら描画サイズを設定
      const aspectRatio = image.width / image.height;
      const drawHeight = BASE_SIZE * 11;
      const drawWidth = drawHeight * aspectRatio;
      const drawPosX = WALL_THICKNESS - drawWidth / 2;
      const groundHeight = render.canvas.height;
      const drawPosY = groundHeight - drawHeight - GROUND_HEIGHT;

      context.drawImage(image, drawPosX, drawPosY, drawWidth, drawHeight);
    }
  }
});

// maxSizeIndex に基づいてテキストを更新する関数
function updateCitrusNameDisplay(maxSizeIndex) {
  const citrusNameDisplay = document.getElementById('citrusNameDisplay');
  if (maxSizeIndex >= 0 && maxSizeIndex < citrus_name.length) {
    citrusNameDisplay.textContent = citrus_name[maxSizeIndex] + "まで収穫できた！";
  } else {
    citrusNameDisplay.textContent = '柑橘の名前';
  }
}

// ゲーム初期化時に待機するオレンジを作成
function createInitialOrange() {
  const x = render.options.width / 2; // キャンバスの中央
  const sizeIndex = getRandomSizeIndex(); // ランダムなサイズ
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

function handleInteraction(clientX, clientY) {
  const currentTime = Date.now();
  const canvasRect = render.canvas.getBoundingClientRect();

  // キャンバスの実際のスケールを計算（CSSでの拡大縮小を考慮）
  const scaleX = render.canvas.width / canvasRect.width;
  const scaleY = render.canvas.height / canvasRect.height;

  // 位置をスケールに合わせて調整
  const relativeX = (clientX - canvasRect.left) * scaleX;
  const relativeY = (clientY - canvasRect.top) * scaleY;

  // 待機中のオレンジを解放する
  if (oranges.length > 0) {
    const waitingOrange = oranges.find((orange) => orange.isStatic);
    if (waitingOrange) {
      // 解放されたオレンジの位置を設定する
      Body.setStatic(waitingOrange, false);
      Body.setPosition(waitingOrange, {
        x: relativeX,
        y: waitingOrange.position.y,
      });
    }
  }

  // 新しいオレンジを生成する
  if (currentTime - lastOrangeCreationTime >= NEW_ORANGE_DELAY) {
    lastOrangeCreationTime = currentTime;

    setTimeout(() => {
      const nextOrangeX = render.options.width / 2; // 画面の中央
      const nextOrangeY = ORANGE_SPAWN_Y; // 事前に定義されたY座標
      const sizeIndex = getRandomSizeIndex();
      createOrange(nextOrangeX, nextOrangeY, sizeIndex, true);
    }, NEW_ORANGE_DELAY);
  }
}

render.canvas.addEventListener(
  "touchstart",
  function (event) {
    // デフォルトのスクロールやズームを防ぐ
    event.preventDefault();

    // 最初のタッチイベントを取得
    const touch = event.touches[0];

    // 共通のインタラクション処理を呼び出す
    handleInteraction(touch.clientX, touch.clientY);
  },
  { passive: false }
);

render.canvas.addEventListener("mousedown", function (event) {
  // 共通のインタラクション処理を呼び出す
  handleInteraction(event.clientX, event.clientY);
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
