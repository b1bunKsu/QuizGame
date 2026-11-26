
// Phase 12: Canvas effects adjusted against the JavaFX EffectView implementation.

function validEffect(q) {
    return q.type === 'EFFECT' &&
        typeof q.hint === 'string' &&
        q.hint.length > 0 &&
        acceptedAnswers(q).some(a => a.length > 0 && [...a].length <= 8);
}

function createRotatingEffect({ ctx, W, H, letters }) {
    const angles = letters.map(() => Math.random() * Math.PI * 2);
    const directions = letters.map(() => Math.random() < .5 ? -1 : 1);
    const rotationPeriods = letters.map(() => 6 + Math.random() * 3);
    const scalePeriods = letters.map(() => 3 + Math.random() * 6);
    const rotationOffsets = rotationPeriods.map(p => Math.random() * p);
    const scaleOffsets = scalePeriods.map(p => Math.random() * p * 2);

    return function drawRotating(t) {
        const cell = Math.min(92, 680 / Math.max(1, letters.length));

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.min(92, cell)}px NotoJP, sans-serif`;

        letters.forEach((ch, i) => {
            const angle = angles[i] +
                directions[i] * Math.PI * 2 *
                (t + rotationOffsets[i]) / rotationPeriods[i];

            const phase = ((t + scaleOffsets[i]) %
                (2 * scalePeriods[i])) / scalePeriods[i];

            const scale = .5 + 3 * Math.abs(1 - phase);
            const x = W / 2 +
                (i - (letters.length - 1) / 2) * cell;

            ctx.save();
            ctx.translate(x, H / 2);
            ctx.rotate(angle);
            ctx.scale(scale, scale);

            ctx.lineJoin = 'round';
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#111';
            ctx.fillStyle = '#fff';

            ctx.strokeText(ch, 0, 0);
            ctx.fillText(ch, 0, 0);
            ctx.restore();
        });
    };
}

function createMosaicEffect({ ctx, W, H, host, textSize, drawText }) {
    const source = document.createElement('canvas');
    source.width = W;
    source.height = H;
    const sx = source.getContext('2d');
    // A fresh, per-question source is essential: never reuse a previous question's
    // mosaic bitmap. Render the current hint again when its font becomes available.
    let mosaicSourceReady = false;

    function prepareMosaicSource() {
        sx.clearRect(0, 0, W, H);
        drawText(sx, textSize, '#d36aff', false);
        mosaicSourceReady = true;
    }
    prepareMosaicSource();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            if (host.isConnected) {
                prepareMosaicSource();
            }
        });
    }

    return function drawMosaic(t) {
        // Always rebuild the source for this question. Sampling a tiny image with
        // drawImage can lose thin glyphs entirely, especially on repeated questions.
        if (!mosaicSourceReady) {
            prepareMosaicSource();
        }

        const sizes = [26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1];
        const block = sizes[
            Math.min(sizes.length - 1, Math.floor(t))
        ];

        // Draw crisp source pixels and compute the average coverage for each block.
        // This guarantees that a visible glyph cannot disappear due to downsampling.
        const pixels = sx.getImageData(0, 0, W, H).data;
        ctx.fillStyle = '#d36aff';

        for (let y = 0; y < H; y += block) {
            for (let x = 0; x < W; x += block) {
                let coverage = 0;

                const xEnd = Math.min(W, x + block);
                const yEnd = Math.min(H, y + block);

                for (let py = y; py < yEnd; py++) {
                    for (let px = x; px < xEnd; px++) {
                        coverage += pixels[(py * W + px) * 4 + 3];
                    }
                }

                const alpha = coverage /
                    (255 * (xEnd - x) * (yEnd - y));

                if (alpha > 0) {
                    ctx.globalAlpha = Math.min(1, alpha * 1.8);
                    ctx.fillRect(
                        x, y,
                        xEnd - x,
                        yEnd - y
                    );
                }
            }
        }

        ctx.globalAlpha = 1;
    };
}

function createZoomOutEffect({ ctx, W, H, textSize, drawText }) {
    return function drawZoomOut(t) {
        // Start heavily enlarged, then reveal the complete readable text by 14 seconds.
        // Linear easing: scale decreases at a constant rate.
        const u = Math.min(1, t / 14);

        // 12倍から1倍まで直線的に縮小
        const scale = 12 - 11 * u;

        // Render glyphs directly at the current zoom instead of magnifying a
        // 760x180 bitmap. Canvas rasterizes the font at output resolution,
        // preventing blocky pixels when the text is enlarged.
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.translate(-W / 2, -H / 2);

        drawText(ctx, textSize, '#d36aff', false);

        ctx.restore();
    };
}

function createSlidingPuzzleEffect({ ctx, W, H, hint, letters }) {
    // Real 18x6 sliding puzzle: multiple empty cells, 300 parallel swap steps,
    // then replay the swaps backwards (as in the original JavaFX EffectView).
    const cols = 18, rows = 6, count = cols * rows;
    const puzzleW = 600, puzzleH = 180;
    const tw = puzzleW / cols, th = puzzleH / rows;
    const puzzleX = (W - puzzleW) / 2;
    const puzzleY = (H - puzzleH) / 2;

    const RARE_RATE = 0.3;
    const BLANK_COUNT = Math.random() < RARE_RATE ? 2 : 1;

    const SHUFFLE_COUNT = 300;
    const SHUFFLE_ATTEMPTS = 30;
    const pool = Array.from({ length: count }, (_, i) => i)
        .filter(i => Math.floor(i / cols) > 0 && Math.floor(i / cols) < rows - 1 && i % cols > 0 && i % cols < cols - 1);
    const finalCells = Array.from({ length: BLANK_COUNT }, () =>
        pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const missing = new Set(finalCells);
    const distance = (a, b) => Math.abs(a % cols - b % cols) +
        Math.abs(Math.floor(a / cols) - Math.floor(b / cols));

    function generateScramble() {
        const cells = Array.from({ length: count }, (_, i) => missing.has(i) ? -1 : i);
        const blanks = [...finalCells];
        const previous = blanks.map(() => -1);
        const visits = Array(count).fill(0);
        const tileMoves = Array(count).fill(0);
        const moves = [];
        for (const b of blanks) visits[b]++;
        for (let step = 0; step < SHUFFLE_COUNT; step++) {
            const batch = [];
            const used = new Set();
            // Backtrack if two blanks compete for the same source tile.
            function choose(k) {
                if (k === blanks.length) return true;
                const to = blanks[k];
                const candidates = [to - cols, to + cols, to - 1, to + 1].filter(from =>
                    from >= 0 && from < count && distance(from, to) === 1 && cells[from] >= 0 && !used.has(from));
                const ranked = candidates.map(from => {
                    const tile = cells[from];
                    const weight = (distance(tile, to) > distance(tile, from) ? 2.5 : 0.6) /
                        Math.sqrt((1 + tileMoves[tile]) * (1 + visits[from])) * (from === previous[k] ? 0.05 : 1);
                    return { from, key: -Math.log(Math.max(Number.MIN_VALUE, Math.random())) / weight };
                }).sort((a, b) => a.key - b.key);
                for (const { from } of ranked) {
                    used.add(from);
                    batch.push({ tile: cells[from], from, to });
                    if (choose(k + 1)) return true;
                    batch.pop(); used.delete(from);
                }
                return false;
            }
            if (!choose(0)) return null;
            batch.forEach(({ tile, from, to }, k) => {
                cells[to] = tile; cells[from] = -1;
                previous[k] = to; blanks[k] = from;
                tileMoves[tile]++; visits[from]++;
            });
            moves.push(batch);
        }
        const score = cells.reduce((sum, tile, cell) => sum + (tile < 0 ? 0 : distance(tile, cell) + (tile !== cell ? 3 : 0)), 0);
        return { cells, moves, score };
    }
    let best = null;
    for (let i = 0; i < SHUFFLE_ATTEMPTS; i++) {
        const result = generateScramble();
        if (result && (!best || result.score > best.score)) best = result;
    }
    if (!best) throw new Error('Unable to generate sliding puzzle');
    const cellToTile = best.cells;
    const reverseMoves = best.moves.reverse().map(batch => batch.map(({ tile, from, to }) => ({ tile, from: to, to: from })));
    const tileToCell = Array(count).fill(-1);
    cellToTile.forEach((tile, cell) => { if (tile >= 0) tileToCell[tile] = cell; });

    const puzzleSource = document.createElement('canvas');
    puzzleSource.width = puzzleW;
    puzzleSource.height = puzzleH;
    const ps = puzzleSource.getContext('2d');

    ps.font = `${Math.min(100, Math.floor(520 / Math.max(1, letters.length)))}px NotoJP, sans-serif`;
    ps.textAlign = 'center';
    ps.textBaseline = 'middle';
    ps.fillStyle = '#fff';
    ps.strokeStyle = '#111';
    ps.lineWidth = 3;
    ps.lineJoin = 'round';

    ps.strokeText(hint, puzzleW / 2, puzzleH / 2, 520);
    ps.fillText(hint, puzzleW / 2, puzzleH / 2, 520);

    const durationFor = i => i < 151 ? .03 : i < 261 ? .055 : i < 286 ? .11 : i < 297 ? 0.22 : 0.5

    let moveIndex = 0;
    let moveStart = 0;
    let activeMove = null;
    let completedAt = null;

    function drawSliding(t) {
        if (moveStart === 0) {
            moveStart = t;
        }

        // Advance complete moves even when requestAnimationFrame skips a frame.
        while (moveIndex < reverseMoves.length) {
            const duration = durationFor(moveIndex);

            if (t - moveStart < duration) {
                break;
            }

            for (const { tile, from, to } of reverseMoves[moveIndex]) {
                cellToTile[from] = -1;
                cellToTile[to] = tile;
                tileToCell[tile] = to;
            }

            moveStart += duration;
            moveIndex++;
        }

        activeMove = null;

        if (moveIndex < reverseMoves.length) {
            activeMove = reverseMoves[moveIndex].map(move => ({
                ...move,
                progress: Math.min(1, (t - moveStart) / durationFor(moveIndex))
            }));
        } else if (completedAt === null) {
            completedAt = t;
        }

        // Source is an intact text image split into fixed tiles; only adjacent tiles move.
        for (let tile = 0; tile < count; tile++) {
            if (missing.has(tile)) {
                continue;
            }

            const cell = tileToCell[tile];
            let x = (cell % cols) * tw;
            let y = Math.floor(cell / cols) * th;

            const moving = activeMove?.find(move => move.tile === tile);
            if (moving) {
                const f = moving.from;
                const d = moving.to;

                const u = moving.progress * moving.progress *
                    (3 - 2 * moving.progress);

                x = ((f % cols) + ((d % cols) - (f % cols)) * u) * tw;
                y = (Math.floor(f / cols) +
                    (Math.floor(d / cols) - Math.floor(f / cols)) * u) * th;
            }

            ctx.drawImage(
                puzzleSource,
                (tile % cols) * tw,
                Math.floor(tile / cols) * th,
                tw, th,
                puzzleX + x,
                puzzleY + y,
                tw, th
            );
        }

        if (completedAt !== null) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, (t - completedAt) / .5);

            for (const finalCell of finalCells) {
                ctx.drawImage(
                    puzzleSource,
                    (finalCell % cols) * tw,
                    Math.floor(finalCell / cols) * th,
                    tw, th,
                    puzzleX + (finalCell % cols) * tw,
                    puzzleY + Math.floor(finalCell / cols) * th,
                    tw, th
                );

            }

            ctx.restore();
        }
    }

    return drawSliding;
}

function createWaterWaveEffect({ ctx, W, H, host, textSize, drawText }) {
    // 波紋の干渉：各波の位置・波長・速度を独立させる。
    const DURATION = 17;
    const AMPLITUDE = 32;
    const WAVE_COUNT = 4;
    const FREQUENCY = 1;
    const SPEED = 1;
    const ATTENUATION = 440;
    const PIXELS = W * H;
    const source = document.createElement('canvas');
    source.width = W;
    source.height = H;
    const sx = source.getContext('2d');
    const output = ctx.createImageData(W, H);
    let alpha;
    function prepareSource() {
        sx.clearRect(0, 0, W, H);
        drawText(sx, textSize, '#d36aff', false);
        const pixels = sx.getImageData(0, 0, W, H).data;
        alpha = new Uint8ClampedArray(PIXELS);
        for (let n = 0; n < PIXELS; n++) alpha[n] = pixels[n * 4 + 3];
    }
    prepareSource();
    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            if (host.isConnected) prepareSource();
        });
    }

    // sin(a+b) の加法定理を利用し、位置依存の項は初期化時に計算する。
    // 毎フレームの三角関数は波紋ごとに2回だけ。
    const waves = Array.from({ length: WAVE_COUNT }, (_, j) => {
        const cx = Math.random() * W;
        const cy = Math.random() * (H + 120) - 60;
        const wavelength = 40 + Math.random() * 100;
        const k = (2 * Math.PI / wavelength) * FREQUENCY;
        const amplitude = AMPLITUDE * (0.5 + Math.random());
        const omega = (3 + j * 1.5) * SPEED;
        const xs = new Float32Array(PIXELS), xc = new Float32Array(PIXELS);
        const ys = new Float32Array(PIXELS), yc = new Float32Array(PIXELS);
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const n = y * W + x;
                const dx = x - cx, dy = y - cy;
                const r = Math.hypot(dx, dy) + .001;
                const phase = r * k + j * 3.7;
                const weight = amplitude * .85 * Math.exp(-r / ATTENUATION) / r;
                const s = Math.sin(phase) * weight, c = Math.cos(phase) * weight;
                xs[n] = dx * s; xc[n] = dx * c;
                ys[n] = dy * s; yc[n] = dy * c;
            }
        }
        return { omega, xs, xc, ys, yc, sin: 0, cos: 1 };
    });
    const data = output.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 211; data[i + 1] = 106; data[i + 2] = 255;
    }
    return function drawWaterWave(t) {
        const strength = Math.max(0, 1 - t / DURATION);
        if (strength === 0) {
            ctx.drawImage(source, 0, 0);
            return;
        }
        for (const wave of waves) {
            wave.sin = Math.sin(-t * wave.omega);
            wave.cos = Math.cos(-t * wave.omega);
        }
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const n = y * W + x;
                let dx = 0, dy = 0;
                for (const wave of waves) {
                    dx += wave.xs[n] * wave.cos + wave.xc[n] * wave.sin;
                    dy += wave.ys[n] * wave.cos + wave.yc[n] * wave.sin;
                }
                const u = x + dx * strength, v = y + dy * strength;
                let a = 0;
                if (u >= 0 && u < W - 1 && v >= 0 && v < H - 1) {
                    const ix = Math.floor(u), iy = Math.floor(v);
                    const fx = u - ix, fy = v - iy, p = iy * W + ix;
                    a = alpha[p] * (1 - fx) * (1 - fy) +
                        alpha[p + 1] * fx * (1 - fy) +
                        alpha[p + W] * (1 - fx) * fy +
                        alpha[p + W + 1] * fx * fy;
                }
                data[n * 4 + 3] = a;
            }
        }
        ctx.putImageData(output, 0, 0);
    };
}

function createDynamicPrismEffect({ ctx, W, H, host, textSize, drawText, shardCtx = ctx }) {

    // ========================================
    // ガラス破壊演出
    // ========================================



    const SHATTER_ENABLED = true;

    // ガラスが割れるまでの待機時間（秒）
    const SHATTER_WAIT = 0.5;

    let shatterSoundPlayed = false;

    // ひび割れが広がる時間
    const SHATTER_SPREAD_TIME = 0.25;

    // 発光が消えるまでの時間（秒）
    const SHATTER_FLASH_DURATION = 0.2;

    // 発光の強さ
    const SHATTER_FLASH_OPACITY = 0.2;

    // 発光色
    const SHATTER_FLASH_COLOR = '#DDEEFF';

    const SHARDS_ENABLED = true;
    const SHARD_COUNT = 48;
    const SHARD_MIN_SIZE = 4;
    const SHARD_MAX_SIZE = 16;
    const SHARD_MIN_SPEED = 100;
    const SHARD_MAX_SPEED = 500;
    const SHARD_LIFETIME = 0.8;
    const SHARD_GRAVITY = 980;
    const SHARD_ROTATION_SPEED = 10;
    const SHARD_ZOOM = 1.7;
    const SHARD_UPWARD_SPEED = 45;
    const SHARD_DIRECTION_SPREAD = 0.8;
    const SHARD_FADE_POWER = 1.3;
    const SHARD_EDGE_WIDTH = 0.8;

    // ========================================
    // 調整用定数
    // ========================================

    const DURATION = 17;
    const DECAY_POWER = 1.0;

    // ガラス片の分割
    const COLS = 21;
    const ROWS = 7;
    const SITE_JITTER_X = 0.375;
    const SITE_JITTER_Y = 0.32;

    // 屈折による位置のずれ
    const REFRACTION_X = 20;
    const REFRACTION_Y = 20;

    // 拡大・縮小
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 2;
    const ZOOM_SPEED = 0.7;

    // 回転
    const MAX_ROTATION = 0.9;

    // 動作速度
    const MOTION_SPEED = 1.0;
    const SPEED_MIN = 0.6;
    const SPEED_MAX = 1.8;
    const Y_SPEED_RATIO = 0.8;

    // 描画設定
    const TEXT_COLOR = '#75E6FF';

    const SHOW_BOUNDARIES = true;
    const SHOW_OUTER_BOUNDARY = false;
    const EDGE_EPSILON = 0.0001;
    const BOUNDARY_COLOR = '#000000';
    const BOUNDARY_WIDTH = 1;
    const BOUNDARY_OPACITY = 0.25;

    // ひび割れのフェードアウト設定
    const BOUNDARY_FADE_START = 0;
    const BOUNDARY_FADE_DURATION = 17;

    // 文字が出現するタイミング
    const TEXT_APPEAR_START = SHATTER_ENABLED
        ? SHATTER_WAIT
        + SHATTER_SPREAD_TIME
        + SHATTER_FLASH_DURATION
        : 0;

    // 文字のフェードイン時間（秒）
    const TEXT_FADE_IN_DURATION = 0;

    const TAU = Math.PI * 2;

    const random = (min, max) =>
        min + Math.random() * (max - min);

    // ========================================
    // 元の文字画像
    // ========================================

    const source = document.createElement('canvas');

    source.width = W;
    source.height = H;

    const sx = source.getContext('2d');

    function prepareSource() {
        sx.clearRect(0, 0, W, H);
        drawText(sx, textSize, TEXT_COLOR, false);
    }

    prepareSource();

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            if (host.isConnected) {
                prepareSource();
            }
        });
    }

    // ========================================
    // ボロノイ分割の母点を生成
    // ========================================

    const sites = [];

    const cellW = W / COLS;
    const cellH = H / ROWS;

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {

            sites.push({
                x: (x + 0.5) * cellW
                    + random(-SITE_JITTER_X, SITE_JITTER_X) * cellW,

                y: (y + 0.5) * cellH
                    + random(-SITE_JITTER_Y, SITE_JITTER_Y) * cellH
            });

        }
    }

    // ========================================
    // 多角形を垂直二等分線で切断
    // ========================================

    function cutPolygon(poly, a, b) {

        const nx = b.x - a.x;
        const ny = b.y - a.y;

        const k = (
            b.x * b.x + b.y * b.y
            - a.x * a.x - a.y * a.y
        ) / 2;

        const result = [];

        for (let i = 0; i < poly.length; i++) {

            const p = poly[i];
            const q = poly[(i + 1) % poly.length];

            const d = p[0] * nx + p[1] * ny - k;
            const e = q[0] * nx + q[1] * ny - k;

            if (d <= 0) {
                result.push(p);
            }

            if ((d <= 0) !== (e <= 0)) {

                const t = d / (d - e);

                result.push([
                    p[0] + t * (q[0] - p[0]),
                    p[1] + t * (q[1] - p[1])
                ]);
            }
        }

        return result;
    }

    // ========================================
    // 各ガラス片の生成
    // ========================================

    const cells = sites.map((site, index) => {

        let polygon = [
            [0, 0],
            [W, 0],
            [W, H],
            [0, H]
        ];

        for (let j = 0; j < sites.length; j++) {

            if (j === index) continue;
            if (polygon.length === 0) break;

            polygon = cutPolygon(
                polygon,
                site,
                sites[j]
            );
        }

        const path = new Path2D();

        polygon.forEach((p, i) => {
            if (i === 0) {
                path.moveTo(p[0], p[1]);
            } else {
                path.lineTo(p[0], p[1]);
            }
        });

        path.closePath();

        // ========================================
        // 外周を除いた境界線パス
        // ========================================

        const edgePath = new Path2D();

        for (let i = 0; i < polygon.length; i++) {

            const p = polygon[i];
            const q = polygon[(i + 1) % polygon.length];

            const isLeft =
                Math.abs(p[0]) < EDGE_EPSILON &&
                Math.abs(q[0]) < EDGE_EPSILON;

            const isRight =
                Math.abs(p[0] - W) < EDGE_EPSILON &&
                Math.abs(q[0] - W) < EDGE_EPSILON;

            const isTop =
                Math.abs(p[1]) < EDGE_EPSILON &&
                Math.abs(q[1]) < EDGE_EPSILON;

            const isBottom =
                Math.abs(p[1] - H) < EDGE_EPSILON &&
                Math.abs(q[1] - H) < EDGE_EPSILON;

            const isOuter =
                isLeft || isRight || isTop || isBottom;

            if (!SHOW_OUTER_BOUNDARY && isOuter) {
                continue;
            }

            edgePath.moveTo(p[0], p[1]);
            edgePath.lineTo(q[0], q[1]);
        }

        return {
            x: site.x,
            y: site.y,
            path,
            edgePath,

            phase: random(0, TAU),

            speed: random(
                SPEED_MIN,
                SPEED_MAX
            ),

            rotation: random(
                -MAX_ROTATION,
                MAX_ROTATION
            ),

            shatterDelay: SHATTER_WAIT,
        };
    });

    // ========================================
    // 境界線を一つのパスに統合
    // ========================================

    const boundaryPath = new Path2D();

    for (const v of cells) {
        boundaryPath.addPath(v.edgePath);
    }

    // ========================================
    // エフェクト描画
    // ========================================

    // 飛散する破片は問題ごとに生成する。
    const shards = SHATTER_ENABLED && SHARDS_ENABLED
        ? Array.from({ length: SHARD_COUNT }, () => {
            const v = cells[Math.floor(Math.random() * cells.length)];
            const angle = Math.atan2(v.y - H / 2, v.x - W / 2)
                + random(-SHARD_DIRECTION_SPREAD, SHARD_DIRECTION_SPREAD);
            const speed = random(SHARD_MIN_SPEED, SHARD_MAX_SPEED);
            const radius = random(SHARD_MIN_SIZE, SHARD_MAX_SIZE);
            const sides = Math.random() < 0.5 ? 3 : 4;
            const path = new Path2D();
            for (let i = 0; i < sides; i++) {
                const a = TAU * i / sides;
                const r = radius * random(0.55, 1.4);
                const x = Math.cos(a) * r, y = Math.sin(a) * r;
                if (i === 0) path.moveTo(x, y);
                else path.lineTo(x, y);
            }
            path.closePath();
            return {
                x: v.x, y: v.y, delay: v.shatterDelay, radius, path,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - SHARD_UPWARD_SPEED,
                angle: random(0, TAU),
                spin: random(-SHARD_ROTATION_SPEED, SHARD_ROTATION_SPEED)
            };
        }) : [];

    function drawShards(elapsed) {
        for (const v of shards) {
            const u = elapsed - v.delay;
            if (u < 0 || u >= SHARD_LIFETIME) continue;
            const p = u / SHARD_LIFETIME;
            const scale = 1 + p * SHARD_ZOOM;
            shardCtx.save();
            shardCtx.translate(v.x + v.vx * u,
                v.y + v.vy * u + 0.5 * SHARD_GRAVITY * u * u);
            shardCtx.rotate(v.angle + v.spin * u);
            shardCtx.scale(scale, scale);
            shardCtx.globalAlpha = Math.pow(1 - p, SHARD_FADE_POWER);
            const g = shardCtx.createLinearGradient(-v.radius, -v.radius, v.radius, v.radius);
            g.addColorStop(0, 'rgba(255,255,255,.95)');
            g.addColorStop(.45, 'rgba(176,226,245,.35)');
            g.addColorStop(1, 'rgba(99,155,180,.65)');
            shardCtx.fillStyle = g;
            shardCtx.fill(v.path);
            shardCtx.strokeStyle = 'rgba(255,255,255,.9)';
            shardCtx.lineWidth = SHARD_EDGE_WIDTH;
            shardCtx.stroke(v.path);
            shardCtx.restore();
        }
    }

    function drawDynamicPrism(t, elapsed = t, introHeld = false) {

        // ガラス破壊音
        if (
            SHATTER_ENABLED &&
            !shatterSoundPlayed &&
            elapsed >= SHATTER_WAIT
        ) {
            shatterSoundPlayed = true;
            SoundManager.playSe("crack");
        }

        const strength = Math.pow(
            Math.max(0, 1 - Math.max(0, t - TEXT_APPEAR_START) / DURATION),
            DECAY_POWER
        );

        // ヒント文字のフェードイン
        const textAlpha = TEXT_FADE_IN_DURATION <= 0
            ? (t >= TEXT_APPEAR_START ? 1 : 0)
            : Math.min(1, Math.max(0,
                (t - TEXT_APPEAR_START) / TEXT_FADE_IN_DURATION));

        // ひび割れのフェードアウト
        const boundaryAlpha = BOUNDARY_OPACITY * (
            1 - Math.min(
                1,
                Math.max(
                    0,
                    (Math.max(0, t - TEXT_APPEAR_START) - BOUNDARY_FADE_START)
                    / BOUNDARY_FADE_DURATION
                )
            )
        );

        // 文字の完全復元
        if (strength === 0) {

            ctx.drawImage(source, 0, 0);

            // ひび割れはフェードアウトさせる
            if (SHOW_BOUNDARIES && boundaryAlpha > 0) {

                ctx.save();

                ctx.globalAlpha = boundaryAlpha;
                ctx.strokeStyle = BOUNDARY_COLOR;
                ctx.lineWidth = BOUNDARY_WIDTH;

                ctx.stroke(boundaryPath);

                ctx.restore();
            }

            drawShards(elapsed);
            return;
        }

        for (const v of cells) {

            const phase =
                t * MOTION_SPEED * v.speed + v.phase;

            // 屈折による位置のずれ
            const dx =
                REFRACTION_X * strength
                * Math.sin(phase);

            const dy =
                REFRACTION_Y * strength
                * Math.cos(phase * Y_SPEED_RATIO);

            // 回転
            const angle =
                v.rotation * strength;

            // 拡大・縮小
            const wave =
                Math.sin(phase * ZOOM_SPEED);

            const logZoom = wave >= 0
                ? wave * Math.log(MAX_ZOOM)
                : -wave * Math.log(MIN_ZOOM);

            const zoom =
                Math.exp(strength * logZoom);

            // ガラス片内部を描画
            ctx.save();

            // ヒント文字の不透明度
            ctx.globalAlpha = introHeld ? 0 : textAlpha;

            ctx.clip(v.path);

            ctx.translate(
                v.x + dx,
                v.y + dy
            );

            ctx.rotate(angle);

            ctx.scale(zoom, zoom);

            ctx.drawImage(
                source,
                -v.x,
                -v.y
            );

            ctx.restore();

        }

        // ========================================
        // ガラス破壊・境界線描画
        // ========================================

        const shatterEnd = TEXT_APPEAR_START;

        // ガラス破壊演出中かどうか
        const isShattering =
            SHATTER_ENABLED && elapsed < shatterEnd;

        // 通常時は全境界線を使用
        let visiblePath = boundaryPath;

        if (isShattering) {

            visiblePath = new Path2D();

            for (const v of cells) {

                const crackElapsed = elapsed - v.shatterDelay;

                if (crackElapsed < 0) continue;

                // 割れた部分のひび割れを追加
                visiblePath.addPath(v.edgePath);

                // 割れた瞬間の発光
                const flash = Math.max(
                    0,
                    1 - crackElapsed / SHATTER_FLASH_DURATION
                );

                if (flash > 0) {

                    ctx.save();

                    ctx.globalAlpha =
                        flash * SHATTER_FLASH_OPACITY;

                    ctx.fillStyle = SHATTER_FLASH_COLOR;

                    ctx.fill(v.path);

                    ctx.restore();
                }
            }
        }

        // ========================================
        // 境界線描画・フェードアウト
        // ========================================

        if (SHOW_BOUNDARIES && boundaryAlpha > 0) {

            ctx.save();

            ctx.globalAlpha = boundaryAlpha;
            ctx.strokeStyle = BOUNDARY_COLOR;
            ctx.lineWidth = BOUNDARY_WIDTH;

            ctx.stroke(visiblePath);

            ctx.restore();
        }
        drawShards(elapsed);
    }
    drawDynamicPrism.introDuration = TEXT_APPEAR_START;
    return drawDynamicPrism;
}

function selectEffect() {
    const effects = ['ROTATING', 'MOSAIC', 'ZOOM_OUT', 'SLIDING_PUZZLE', 'DYNAMIC_PRISM'];
    const forced = gameExtension.effectChoice?.() ?? 'RANDOM';
    return effects.includes(forced) ? forced : effects[Math.floor(Math.random() * effects.length)];
}

function setupEffect(hint, host, selected = selectEffect(), holdIntro = false) {
    const factories = {
        ROTATING: createRotatingEffect,
        MOSAIC: createMosaicEffect,
        ZOOM_OUT: createZoomOutEffect,
        SLIDING_PUZZLE: createSlidingPuzzleEffect,
        DYNAMIC_PRISM: createDynamicPrismEffect
    };
    // ガラスエフェクトのみ問題板全体を使用
    const isFullBoard = selected === 'DYNAMIC_PRISM';

    const W = isFullBoard ? host.clientWidth : 760;
    const H = isFullBoard ? host.clientHeight : 180;

    const canvas = document.createElement('canvas');

    canvas.width = W;
    canvas.height = H;
    canvas.className = 'effect-canvas';

    if (isFullBoard) {

        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;

        canvas.style.maxWidth = 'none';
        canvas.style.maxHeight = 'none';

        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';

        canvas.style.pointerEvents = 'none';
    }

    host.append(canvas);

    const ctx = canvas.getContext('2d');
    const letters = [...hint];
    const textSize = Math.min(100, Math.floor(660 / Math.max(1, letters.length)));

    function drawText(context, size, color = '#fff', outline = true) {
        context.save();
        context.font = `${size}px NotoJP, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = color;
        context.lineJoin = 'round';
        context.lineWidth = 3;
        context.strokeStyle = '#111';

        if (outline) {
            context.strokeText(hint, W / 2, H / 2, 700);
        }

        context.fillText(hint, W / 2, H / 2, 700);
        context.restore();
    }

    // 飛散破片は問題板の外側にも描画する。
    const shell = isFullBoard ? host.closest('.quiz-shell') : null;
    let shardCanvas = null;
    let shardCtx = ctx;
    if (shell) {
        shardCanvas = document.createElement('canvas');
        shardCanvas.width = shell.clientWidth;
        shardCanvas.height = shell.clientHeight;
        Object.assign(shardCanvas.style, {
            position: 'absolute', left: '0', top: '0',
            width: `${shardCanvas.width}px`, height: `${shardCanvas.height}px`,
            pointerEvents: 'none', zIndex: '50'
        });
        shell.append(shardCanvas);
        shardCtx = shardCanvas.getContext('2d');
    }
    const draw = factories[selected]({ ctx, W, H, host, hint, letters, textSize, drawText, shardCtx });
    let frame = null;
    let finishIntro;
    const intro = new Promise(resolve => { finishIntro = resolve; });
    const started = performance.now();
    let releasedAt = null;
    const introDuration = draw.introDuration ?? 0;

    const render = now => {
        if (!host.isConnected) {
            shardCanvas?.remove();
            finishIntro();
            return;
        }

        const elapsed = (now - started) / 1000;
        const t = holdIntro
            ? (releasedAt === null ? Math.min(elapsed, introDuration) : introDuration + Math.max(0, (now - releasedAt) / 1000))
            : elapsed;
        ctx.clearRect(0, 0, W, H);
        if (shardCanvas) {
            const boardRect = canvas.getBoundingClientRect();
            const shellRect = shardCanvas.getBoundingClientRect();
            const scaleX = shellRect.width / shardCanvas.width || 1;
            const scaleY = shellRect.height / shardCanvas.height || 1;
            shardCtx.setTransform(1, 0, 0, 1, 0, 0);
            shardCtx.clearRect(0, 0, shardCanvas.width, shardCanvas.height);
            shardCtx.setTransform(1, 0, 0, 1,
                (boardRect.left - shellRect.left) / scaleX,
                (boardRect.top - shellRect.top) / scaleY);
        }
        draw(t, elapsed, holdIntro && releasedAt === null);
        if (t >= (draw.introDuration ?? 0)) finishIntro();
        frame = requestAnimationFrame(render);
    };

    // Render once immediately so the first frame is never blank while waiting for RAF.
    render(performance.now());

    state.visualCleanup = () => {
        shardCanvas?.remove();
        finishIntro();
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
    };
    if (holdIntro) return {
        async release() {
            await intro;
            if (host.isConnected) releasedAt = performance.now();
        }
    };
    return intro;
}

class EffectQuestion extends BaseQuestion {

    render() {
        this.selectedEffect = selectEffect();
        this.startVisual = createVisualTypingUI(
            this.question,
            this.container,
            this.selectedEffect
        );
    }

    startIntroAnimation() {
        if (this.selectedEffect === 'DYNAMIC_PRISM' && this.startVisual) {
            this.introController = this.startVisual(true);
            this.startVisual = null;
        }
    }

    startAnimation() {
        if (this.introController) {
            return this.introController.release();
        }
        if (this.startVisual) {
            const start = this.startVisual;
            this.startVisual = null;
            return start();
        }
    }
}
