
// Phase 12: Canvas effects adjusted against the JavaFX EffectView implementation.

function validEffect(q) {
    return q.type === 'EFFECT' &&
        typeof q.hint === 'string' &&
        q.hint.length > 0 &&
        acceptedAnswers(q).some(a => a.length > 0 && [...a].length <= 8);
}

function setupEffect(hint, host) {
    const effects = ['ROTATING', 'MOSAIC', 'ZOOM_OUT', 'SLIDING_PUZZLE'];
    const forced = gameExtension.effectChoice?.() ?? 'RANDOM';
    const selected = effects.includes(forced)
        ? forced
        : effects[Math.floor(Math.random() * effects.length)];

    const W = 760, H = 180;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.className = 'effect-canvas';
    host.append(canvas);

    const ctx = canvas.getContext('2d');

    const source = document.createElement('canvas');
    source.width = W;
    source.height = H;
    const sx = source.getContext('2d');

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

    drawText(
        sx,
        textSize,
        ['MOSAIC', 'ZOOM_OUT'].includes(selected) ? '#d36aff' : '#fff',
        !['MOSAIC', 'ZOOM_OUT'].includes(selected)
    );

    const angles = letters.map(() => Math.random() * Math.PI * 2);
    const directions = letters.map(() => Math.random() < .5 ? -1 : 1);
    const rotationPeriods = letters.map(() => 6 + Math.random() * 3);
    const scalePeriods = letters.map(() => 3 + Math.random() * 6);
    const rotationOffsets = rotationPeriods.map(p => Math.random() * p);
    const scaleOffsets = scalePeriods.map(p => Math.random() * p * 2);

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

    const durationFor = i => i < 151 ? .03 : i < 276 ? .055 : i < 286 ? .11 : i < 297 ? 0.22 : 0.5

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

    // Reuse the downsample buffer; allocating a canvas each frame causes avoidable GC stutter.
    const low = document.createElement('canvas');
    const lowCtx = low.getContext('2d');

    // A fresh, per-question source is essential: never reuse a previous question's
    // mosaic bitmap. Render the current hint again when its font becomes available.
    let mosaicSourceReady = false;

    function prepareMosaicSource() {
        sx.clearRect(0, 0, W, H);
        drawText(sx, textSize, '#d36aff', false);
        mosaicSourceReady = true;
    }

    if (selected === 'MOSAIC') {
        prepareMosaicSource();

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                if (host.isConnected) {
                    prepareMosaicSource();
                }
            });
        }
    }

    let frame = null;
    const started = performance.now();

    const render = now => {
        if (!host.isConnected) {
            return;
        }

        const t = (now - started) / 1000;
        ctx.clearRect(0, 0, W, H);

        if (selected === 'ROTATING') {
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

        } else if (selected === 'MOSAIC') {
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

        } else if (selected === 'ZOOM_OUT') {
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

        } else {
            drawSliding(t);
        }

        frame = requestAnimationFrame(render);
    };

    // Render once immediately so the first frame is never blank while waiting for RAF.
    render(performance.now());

    state.visualCleanup = () => {
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
    };
}

class EffectQuestion extends BaseQuestion {

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
