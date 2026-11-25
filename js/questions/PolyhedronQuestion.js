
// POLYHEDRON: JavaFX-style constant-speed rotation.

function validPolyhedron(q) {
  return q.type === 'POLYHEDRON'
    && typeof q.answer === 'string'
    && [...q.answer].length >= 4
    && [...q.answer].length <= 8;
}

function setupPolyhedron(answer, host) {

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 205;
  canvas.className = 'poly-canvas';
  host.append(canvas);

  const ctx = canvas.getContext('2d');

  const letters = shuffle([...answer]);
  const n = letters.length;

  // ========================================
  // 頂点座標
  // ========================================

  const cubeV = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1]
  ];

  const cubeF = [
    [4, 5, 6, 7],
    [1, 0, 3, 2],
    [0, 4, 7, 3],
    [5, 1, 2, 6],
    [3, 7, 6, 2],
    [0, 1, 5, 4]
  ];

  const tetraV = [
    [1, 1, 1],
    [-1, -1, 1],
    [-1, 1, -1],
    [1, -1, -1]
  ];

  const tetraF = [
    [0, 2, 1],
    [0, 1, 3],
    [0, 3, 2],
    [1, 2, 3]
  ];

  const octV = [
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1]
  ];

  const octF = [
    [0, 4, 2],
    [0, 3, 4],
    [0, 5, 3],
    [0, 2, 5],
    [1, 2, 4],
    [1, 4, 3],
    [1, 5, 2],
    [1, 3, 5]
  ];

  // ========================================
  // 立体のサイズを統一
  // ========================================

  const rawVertices =
    n === 4 ? tetraV :
      n >= 7 ? octV :
        cubeV;

  const radius = Math.max(
    ...rawVertices.map(([x, y, z]) =>
      Math.hypot(x, y, z)
    )
  );

  const vertices = rawVertices.map(([x, y, z]) => [
    x / radius,
    y / radius,
    z / radius
  ]);

  const faces =
    n === 4 ? tetraF :
      n >= 7 ? octF :
        cubeF;

  // ========================================
  // 回転アニメーション設定
  // ========================================

  // 14秒で1周期
  const ROTATION_PERIOD_MS = 14000;

  // 1周期あたりの回転数
  const ROTATION_X = 2;
  const ROTATION_Y = 6;
  const ROTATION_Z = 1;

  // ========================================
  // 登場アニメーション設定
  // ========================================

  // 登場時間：0.5秒
  const ENTRANCE_DURATION = 500;

  // 登場開始時の拡大率：400%
  const ENTRANCE_START_SCALE = 4;

  // 拡大の中心座標
  const CENTER_X = 300;
  const CENTER_Y = 103;

  const start = performance.now();
  let frame = 0;

  const draw = now => {

    if (!host.isConnected) {
      return;
    }

    // ========================================
    // 回転角度（線形補間）
    // ========================================

    const elapsed = now - start;

    const phase =
      (((elapsed % ROTATION_PERIOD_MS)
        + ROTATION_PERIOD_MS)
        % ROTATION_PERIOD_MS)
      / ROTATION_PERIOD_MS;

    // イージングなし・一定速度
    const rx = phase * ROTATION_X * 2 * Math.PI;
    const ry = phase * ROTATION_Y * 2 * Math.PI;
    const rz = phase * ROTATION_Z * 2 * Math.PI;

    const cx = Math.cos(rx);
    const sx = Math.sin(rx);

    const cy = Math.cos(ry);
    const sy = Math.sin(ry);

    const cz = Math.cos(rz);
    const sz = Math.sin(rz);

    // ========================================
    // 3D回転
    // ========================================

    // 回転行列 Rx * Ry * Rz
    // 頂点には Z → Y → X の順に適用

    const transform = ([x, y, z]) => {

      // Z軸回転
      const x1 = x * cz - y * sz;
      const y1 = x * sz + y * cz;

      // Y軸回転
      const x2 = x1 * cy + z * sy;
      const z2 = -x1 * sy + z * cy;

      // X軸回転
      return [
        x2,
        y1 * cx - z2 * sx,
        y1 * sx + z2 * cx
      ];
    };

    // 回転のみ適用
    // 登場時の拡大率は頂点座標に適用しない
    const pts = vertices.map(transform);

    // ========================================
    // 正投影
    // ========================================

    const project = ([x, y, z]) => [
      CENTER_X + x * 72,
      CENTER_Y + y * 72
    ];

    // ========================================
    // 登場アニメーション
    // ========================================

    const entranceElapsed = Math.min(
      Math.max(now - start, 0),
      ENTRANCE_DURATION
    );

    const t = entranceElapsed / ENTRANCE_DURATION;

    // イージングなし・線形補間
    const scale =
      ENTRANCE_START_SCALE
      + (1 - ENTRANCE_START_SCALE) * t;

    // ========================================
    // Canvas描画開始
    // ========================================

    // 前フレームを消去
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.save();

    // ========================================
    // キューブ全体を拡大
    // ========================================

    // 中心位置を基準に拡大する
    // 面・文字・輪郭線すべてに適用
    ctx.translate(CENTER_X, CENTER_Y);
    ctx.scale(scale, scale);
    ctx.translate(-CENTER_X, -CENTER_Y);

    // ========================================
    // 面の奥行き順
    // ========================================

    const polygons = faces.map((face, i) => ({
      i,
      face,
      depth:
        face.reduce(
          (a, v) => a + pts[v][2],
          0
        ) / face.length
    })).sort((a, b) => a.depth - b.depth);

    // ========================================
    // 面の描画
    // ========================================

    for (const { i, face } of polygons) {

      const pp = face.map(v => project(pts[v]));

      ctx.beginPath();

      pp.forEach(([x, y], j) => {
        if (j) {
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
        }
      });

      ctx.closePath();

      ctx.fillStyle = '#d3d3d3';
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.miterLimit = 2;
      ctx.strokeStyle = '#191970';
      ctx.stroke();

      // ========================================
      // 面に文字を貼り付ける
      // ========================================

      const glyph = letters[i] || '';

      if (glyph) {

        const isTriangle = face.length === 3;

        const p3 = face.map(v => pts[v]);

        const center = p3.reduce(
          (acc, v) => [
            acc[0] + v[0] / p3.length,
            acc[1] + v[1] / p3.length,
            acc[2] + v[2] / p3.length
          ],
          [0, 0, 0]
        );

        const sub = (a, b) => [
          a[0] - b[0],
          a[1] - b[1],
          a[2] - b[2]
        ];

        const dot = (a, b) =>
          a[0] * b[0]
          + a[1] * b[1]
          + a[2] * b[2];

        const normalize = v => {
          const m = Math.hypot(...v) || 1;
          return v.map(x => x / m);
        };

        // ========================================
        // 面内の横方向
        // ========================================

        const u = normalize(
          sub(p3[1], p3[0])
        );

        // ========================================
        // 面内の縦方向
        // ========================================

        const toward = sub(
          p3[isTriangle ? 2 : 3],
          p3[0]
        );

        const projection = dot(toward, u);

        const v = normalize(
          toward.map(
            (x, j) => x - projection * u[j]
          )
        );

        // ========================================
        // 文字の投影
        // ========================================

        const c2 = project(center);

        const projectedU = project(
          center.map((x, j) => x + u[j])
        );

        const projectedV = project(
          center.map((x, j) => x + v[j])
        );

        const ux = projectedU[0] - c2[0];
        const uy = projectedU[1] - c2[1];

        const vx = projectedV[0] - c2[0];
        const vy = projectedV[1] - c2[1];

        // ========================================
        // Safari対応：通常サイズで文字を描画
        // ========================================

        const textSize = 0.6;

        // 極小フォントを避けるための基準サイズ
        const FONT_SIZE = 48;

        // 元の文字サイズを維持する縮小率
        const fontScale = textSize / FONT_SIZE;

        ctx.save();

        // 面の外には文字を描画しない
        ctx.clip();

        // 文字を面の向きに合わせて変形
        ctx.transform(
          ux * fontScale,
          uy * fontScale,
          vx * fontScale,
          vy * fontScale,
          c2[0],
          c2[1]
        );

        ctx.fillStyle = '#191970';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = `${FONT_SIZE}px NotoJP, sans-serif`;

        ctx.fillText(
          glyph,
          0,
          0,
          FONT_SIZE * 1.05
        );

        ctx.restore();

      }
    }

    // ========================================
    // Canvas描画終了
    // ========================================

    // 全体拡大の変換を解除
    ctx.restore();

    // 次のフレーム
    frame = requestAnimationFrame(draw);
  };

  frame = requestAnimationFrame(draw);

  // 描画終了時の後片付け
  state.visualCleanup = () => {
    cancelAnimationFrame(frame);
  };
}

// ========================================
// POLYHEDRON問題
// ========================================

class PolyhedronQuestion extends BaseQuestion {

  render() {
    this.startVisual = createVisualTypingUI(
      this.question,
      this.container
    );
  }

  startAnimation() {
    if (this.startVisual) {
      this.startVisual();
      this.startVisual = null;
    }
  }
}
