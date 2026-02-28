function showHeatmap(events) {
    if (events.length < 3) {
        alert('Log at least 3 events to generate a heatmap.');
        return;
    }

    const modal = document.getElementById('heatmapModal');
    const canvas = document.getElementById('heatmapCanvas');

    // Canvas dimensions maintaining 68:105 pitch ratio
    const canvasW = 300;
    const canvasH = Math.round(canvasW * 105 / 68);
    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');

    // Extract coordinates with jitter (±2m, matching Python script)
    const points = events.map(e => ({
        x: e.x + (Math.random() * 4 - 2),
        y: e.y + (Math.random() * 4 - 2)  // y_flipped: 0=bottom, 105=top
    }));

    // KDE on a 68x105 grid (1 cell per meter)
    const gridW = 68;
    const gridH = 105;
    const bandwidth = 10;
    const bw2 = bandwidth * bandwidth;
    const cutoff = bandwidth * 3;
    const cutoff2 = cutoff * cutoff;
    const grid = new Float32Array(gridW * gridH);

    for (const pt of points) {
        const gxMin = Math.max(0, Math.floor(pt.x - cutoff));
        const gxMax = Math.min(gridW - 1, Math.ceil(pt.x + cutoff));
        const gyMin = Math.max(0, Math.floor(pt.y - cutoff));
        const gyMax = Math.min(gridH - 1, Math.ceil(pt.y + cutoff));

        for (let gy = gyMin; gy <= gyMax; gy++) {
            for (let gx = gxMin; gx <= gxMax; gx++) {
                const dx = (gx + 0.5) - pt.x;
                const dy = (gy + 0.5) - pt.y;
                const dist2 = dx * dx + dy * dy;
                if (dist2 < cutoff2) {
                    grid[gy * gridW + gx] += Math.exp(-dist2 / (2 * bw2));
                }
            }
        }
    }

    // Normalize to 0-1
    let maxVal = 0;
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] > maxVal) maxVal = grid[i];
    }
    if (maxVal === 0) return;

    // Render heatmap pixel by pixel using ImageData
    const imageData = ctx.createImageData(canvasW, canvasH);
    const data = imageData.data;

    const scaleX = gridW / canvasW;
    const scaleY = gridH / canvasH;

    for (let py = 0; py < canvasH; py++) {
        for (let px = 0; px < canvasW; px++) {
            const gx = Math.min(gridW - 1, Math.floor(px * scaleX));
            // Flip y: py=0 is top of canvas = top of pitch (y=105)
            const gy = Math.min(gridH - 1, Math.floor((canvasH - 1 - py) * scaleY));
            const val = grid[gy * gridW + gx] / maxVal;
            const [r, g, b] = emeraldColor(val);
            const idx = (py * canvasW + px) * 4;
            data[idx]     = Math.round(r * 0.98);
            data[idx + 1] = Math.round(g * 0.98);
            data[idx + 2] = Math.round(b * 0.98);
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw pitch lines on top of heatmap
    drawPitchLines(ctx, canvasW, canvasH);

    modal.style.display = 'flex';
}


function emeraldColor(t) {
    // Approximation of cmasher's emerald colormap: near-black → bright emerald
    const stops = [
        [0.0,  [0,   10,  8]],
        [0.25, [0,   60,  45]],
        [0.5,  [0,   130, 90]],
        [0.75, [0,   200, 130]],
        [1.0,  [120, 255, 180]]
    ];

    for (let i = 0; i < stops.length - 1; i++) {
        const [t0, c0] = stops[i];
        const [t1, c1] = stops[i + 1];
        if (t >= t0 && t <= t1) {
            const f = (t - t0) / (t1 - t0);
            return [
                Math.round(c0[0] + f * (c1[0] - c0[0])),
                Math.round(c0[1] + f * (c1[1] - c0[1])),
                Math.round(c0[2] + f * (c1[2] - c0[2]))
            ];
        }
    }
    return [120, 255, 180];
}


function drawPitchLines(ctx, w, h) {
    const sx = w / 68;
    const sy = h / 105;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;

    function line(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1 * sx, h - y1 * sy);
        ctx.lineTo(x2 * sx, h - y2 * sy);
        ctx.stroke();
    }

    // Pitch outline
    line(0, 0, 68, 0);
    line(0, 105, 68, 105);
    line(0, 0, 0, 105);
    line(68, 0, 68, 105);

    // Centre line
    line(0, 52.5, 68, 52.5);

    // Top penalty area
    line(13.85, 105, 13.85, 88.5);
    line(54.15, 105, 54.15, 88.5);
    line(13.85, 88.5, 54.15, 88.5);

    // Bottom penalty area
    line(13.85, 0, 13.85, 16.5);
    line(54.15, 0, 54.15, 16.5);
    line(13.85, 16.5, 54.15, 16.5);

    // Top 6-yard box
    line(24.74, 105, 24.74, 99.5);
    line(43.26, 105, 43.26, 99.5);
    line(24.74, 99.5, 43.26, 99.5);

    // Bottom 6-yard box
    line(24.74, 0, 24.74, 5.5);
    line(43.26, 0, 43.26, 5.5);
    line(24.74, 5.5, 43.26, 5.5);

    // Centre circle
    ctx.beginPath();
    ctx.arc(34 * sx, h - 52.5 * sy, 9.15 * sx, 0, Math.PI * 2);
    ctx.stroke();

    // Centre spot and penalty spots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    [[34, 52.5], [34, 11], [34, 94]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx * sx, h - cy * sy, 0.8, 0, Math.PI * 2);
        ctx.fill();
    });

    // Bottom arc (bulges toward centre from bottom penalty area)
    ctx.beginPath();
    ctx.arc(34 * sx, h - 11 * sy, 9.15 * sx,
        -38 * Math.PI / 180, -142 * Math.PI / 180, true);
    ctx.stroke();

    // Top arc (bulges toward centre from top penalty area)
    ctx.beginPath();
    ctx.arc(34 * sx, h - 94 * sy, 9.15 * sx,
        142 * Math.PI / 180, 38 * Math.PI / 180, true);
    ctx.stroke();

    // Goals
    line(30.34, 0.2, 37.66, 0.2);
    line(30.34, 104.8, 37.66, 104.8);
}


function closeHeatmap() {
    document.getElementById('heatmapModal').style.display = 'none';
}
