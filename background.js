class PixelCityBackground {
    constructor() {
        this.canvas = document.getElementById('cityBackground');
        this.ctx    = this.canvas.getContext('2d');

        this.buildings       = [];
        this.animatedWindows = [];
        this.stars           = [];

        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Мобильные: 30fps, меньше зданий и деталей
        this.fpsInterval   = 1000 / (this.isMobile ? 30 : 60);
        this.lastFrameTime = 0;
        this.isPaused      = false;

        // Счётчик для мигания звёзд
        this.starTick = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.generateStars();
        this.generateBuildings();
        this.generateAnimatedWindows();
        this.animate();

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.generateStars();
            this.generateBuildings();
            this.generateAnimatedWindows();
        });

        document.addEventListener('visibilitychange', () => {
            this.isPaused = document.hidden;
        });
    }

    resizeCanvas() {
        const dpr  = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        this.canvas.width  = cssW * dpr;
        this.canvas.height = cssH * dpr;
        this.canvas.style.width  = cssW + 'px';
        this.canvas.style.height = cssH + 'px';

        // canvas.width= сбрасывает трансформации — scale только один раз
        this.ctx.scale(dpr, dpr);

        this.cssWidth  = cssW;
        this.cssHeight = cssH;
    }

    // ─── ЗВЁЗДЫ ────────────────────────────────────────────────────────────────

    generateStars() {
        this.stars = [];
        const w = this.cssWidth  || window.innerWidth;
        const h = this.cssHeight || window.innerHeight;

        // На мобильных меньше звёзд
        const count = this.isMobile ? 40 : 80;

        // Звёзды в верхних 45% экрана — зона неба за шапкой сайта
        const skyZone = this.isMobile ? 0.35 : 0.45;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x:         Math.random() * w,
                y:         Math.random() * h * skyZone,
                size:      Math.random() < 0.15 ? 2 : 1,   // 15% — крупные
                opacity:   0.4 + Math.random() * 0.6,
                blinkRate: Math.random() < 0.3              // 30% звёзд мигают
                    ? 2000 + Math.random() * 3000
                    : 0,
                blinkOffset: Math.random() * 5000
            });
        }
    }

    drawStars(timestamp) {
        this.stars.forEach(star => {
            let opacity = star.opacity;

            // Плавное мигание через sin
            if (star.blinkRate > 0) {
                const phase = ((timestamp + star.blinkOffset) % star.blinkRate) / star.blinkRate;
                opacity = star.opacity * (0.4 + 0.6 * Math.abs(Math.sin(phase * Math.PI)));
            }

            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle   = '#FFFFFF';
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1;
    }

    // ─── НЕБО ──────────────────────────────────────────────────────────────────

    drawSky() {
        const w = this.cssWidth  || window.innerWidth;
        const h = this.cssHeight || window.innerHeight;

        // Градиент на весь экран: фиолетовый вверху (шапка сайта) → тёмный внизу
        // Верх совпадает с background-color body — нет скачка при загрузке
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0,    '#0A0015');   // глубокий фиолетовый — за шапкой
        skyGrad.addColorStop(0.25, '#0D0A2E');   // тёмно-синий
        skyGrad.addColorStop(0.5,  '#0F1520');   // синевато-чёрный — линия горизонта
        skyGrad.addColorStop(0.75, '#111118');   // почти чёрный под городом
        skyGrad.addColorStop(1,    '#111111');   // у самого низа

        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, w, h);
    }

    // ─── ТУМАН МЕЖДУ СЛОЯМИ ────────────────────────────────────────────────────

    drawFog() {
        const w = this.cssWidth  || window.innerWidth;
        const h = this.cssHeight || window.innerHeight;

        // Туман на границе неба и крыш зданий (~25-45% высоты экрана)
        const fogTop = this.isMobile ? h * 0.2 : h * 0.25;
        const fogH   = h * 0.2;
        const fogGrad = this.ctx.createLinearGradient(0, fogTop, 0, fogTop + fogH);
        fogGrad.addColorStop(0,   'rgba(13, 10, 46, 0)');
        fogGrad.addColorStop(0.5, 'rgba(10, 15, 30, 0.2)');
        fogGrad.addColorStop(1,   'rgba(13, 10, 46, 0)');

        this.ctx.fillStyle = fogGrad;
        this.ctx.fillRect(0, fogTop, w, fogH);
    }

    // ─── ЗДАНИЯ ────────────────────────────────────────────────────────────────

    generateBuildings() {
        this.buildings = [];
        const w = this.cssWidth  || window.innerWidth;
        const h = this.cssHeight || window.innerHeight;

        // Цвета: задний план холоднее/темнее, передний теплее
        const bgColors   = ['#0A0E1A', '#0D1225', '#0B1030'];   // холодный синий
        const midColors  = ['#141830', '#162040', '#1A1A3A'];   // средний
        const fgColors   = ['#1A1A2E', '#16213E', '#0F3460', '#2D2D4E'];  // тёплый

        // Мобильные: меньше зданий для экономии GPU
        const bgCount  = this.isMobile ? 8  : 14;
        const midCount = this.isMobile ? 5  : 8;
        const fgCount  = this.isMobile ? 4  : 5;

        // ── Задний план — тонкие, уходят высоко вверх ──
        for (let i = 0; i < bgCount; i++) {
            const bw = w * (0.04 + Math.random() * 0.05);
            const bh = h * (0.3  + Math.random() * 0.25);
            const x  = Math.random() * w;

            this.buildings.push({
                x, y: h - bh,
                width: bw, height: bh,
                color: bgColors[Math.floor(Math.random() * bgColors.length)],
                windows: this.generateWindows(bw, bh, 3),
                level: 'background',
                roofDetails: this.isMobile ? [] : this.generateRoofDetails(bw, 3)
            });
        }

        // ── Средний план ──
        for (let i = 0; i < midCount; i++) {
            const bw = w * (0.07 + Math.random() * 0.07);
            const bh = h * (0.42 + Math.random() * 0.15);
            const x  = Math.random() * w * 0.85 + w * 0.05;

            this.buildings.push({
                x, y: h - bh,
                width: bw, height: bh,
                color: midColors[Math.floor(Math.random() * midColors.length)],
                windows: this.generateWindows(bw, bh, 5),
                level: 'midground',
                roofDetails: this.isMobile ? [] : this.generateRoofDetails(bw, 5)
            });
        }

        // ── Передний план — крупные, нижние 55-75% ──
        for (let i = 0; i < fgCount; i++) {
            const bw = w * (0.14 + Math.random() * 0.1);
            const bh = h * (0.55 + Math.random() * 0.2);
            const x  = i * (w / fgCount) + Math.random() * 30 - 15;

            this.buildings.push({
                x, y: h - bh,
                width: bw, height: bh,
                color: fgColors[Math.floor(Math.random() * fgColors.length)],
                windows: this.generateWindows(bw, bh, 7),
                level: 'foreground',
                roofDetails: this.generateRoofDetails(bw, 7)
            });
        }
    }

    generateWindows(bw, bh, pixelSize) {
        const windows = [];
        const cols = Math.floor(bw / (pixelSize * 4));
        const rows = Math.floor(bh / (pixelSize * 4));

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.3) {
                    windows.push({
                        x:    col * pixelSize * 4 + pixelSize,
                        y:    row * pixelSize * 4 + pixelSize,
                        size: pixelSize * 2,
                        color: '#2D2D4E'
                    });
                }
            }
        }
        return windows;
    }

    // Детали крыши: антенны, уступы, башенки — всё из прямоугольников
    generateRoofDetails(buildingWidth, pixelSize) {
        const details = [];
        if (buildingWidth < pixelSize * 4) return details;

        // Антенна / шпиль (50% шанс)
        if (Math.random() > 0.5) {
            const antennaX = buildingWidth * (0.3 + Math.random() * 0.4);
            const antennaH = pixelSize * (2 + Math.random() * 3);
            const antennaW = Math.max(1, pixelSize * 0.5);
            details.push({ type: 'antenna', x: antennaX, w: antennaW, h: antennaH });
        }

        // Надстройка / технический этаж (40% шанс)
        if (Math.random() > 0.6) {
            const strutW = buildingWidth * (0.2 + Math.random() * 0.25);
            const strutH = pixelSize * (1 + Math.random() * 1.5);
            const strutX = (buildingWidth - strutW) * Math.random();
            details.push({ type: 'strut', x: strutX, w: strutW, h: strutH });
        }

        return details;
    }

    drawBuildings() {
        const h = this.cssHeight || window.innerHeight;

        this.buildings.forEach(building => {
            // Тело здания
            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(building.x, building.y, building.width, building.height);

            // Окна
            building.windows.forEach(win => {
                this.ctx.fillStyle = win.color;
                this.ctx.fillRect(
                    building.x + win.x,
                    building.y + win.y,
                    win.size, win.size
                );
            });

            // Детали крыши
            if (building.roofDetails && building.roofDetails.length > 0) {
                this.ctx.fillStyle = building.color;
                building.roofDetails.forEach(d => {
                    this.ctx.fillRect(
                        building.x + d.x,
                        building.y - d.h,
                        d.w, d.h
                    );
                });
            }
        });
    }

    // ─── АНИМАЦИЯ ОКОН ─────────────────────────────────────────────────────────

    generateAnimatedWindows() {
        this.animatedWindows = [];

        this.buildings.forEach((building, buildingIndex) => {
            const pct = building.level === 'foreground' ? 0.07
                      : building.level === 'midground'  ? 0.04
                      : 0.015;

            building.windows.forEach((win, windowIndex) => {
                if (Math.random() >= pct) return;

                const colors = ['#FF00FF', '#00FFFF', '#FFFF00'];
                const color  = colors[Math.floor(Math.random() * colors.length)];

                let animationType, speed;
                if      (color === '#FF00FF') { animationType = 'pulse'; speed = 3000 + Math.random() * 2000; }
                else if (color === '#00FFFF') { animationType = 'blink'; speed = 1000 + Math.random() * 1000; }
                else                          { animationType = 'flash'; speed =  500 + Math.random() *  500; }

                this.animatedWindows.push({
                    buildingIndex, windowIndex,
                    color, animationType, speed,
                    lastUpdate: 0, currentState: 0, flashResetAt: null
                });
            });
        });
    }

    updateAnimatedWindows(timestamp) {
        this.animatedWindows.forEach(animWindow => {
            const building = this.buildings[animWindow.buildingIndex];
            if (!building) return;
            const win = building.windows[animWindow.windowIndex];
            if (!win) return;

            if (animWindow.flashResetAt !== null && timestamp >= animWindow.flashResetAt) {
                win.color = '#2D2D4E';
                animWindow.flashResetAt = null;
            }

            if (timestamp - animWindow.lastUpdate <= animWindow.speed) return;
            animWindow.lastUpdate = timestamp;

            switch (animWindow.animationType) {
                case 'pulse':
                    animWindow.currentState = (animWindow.currentState + 1) % 3;
                    win.color = animWindow.currentState === 0 ? '#2D2D4E'
                              : animWindow.currentState === 1 ? animWindow.color
                              : this.adjustColorBrightness(animWindow.color, 0.7);
                    break;
                case 'blink':
                    win.color = (win.color === '#2D2D4E') ? animWindow.color : '#2D2D4E';
                    break;
                case 'flash':
                    win.color = animWindow.color;
                    animWindow.flashResetAt = timestamp + 100;
                    break;
            }
        });
    }

    adjustColorBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `#${Math.round(r * factor).toString(16).padStart(2, '0')}` +
               `${Math.round(g * factor).toString(16).padStart(2, '0')}` +
               `${Math.round(b * factor).toString(16).padStart(2, '0')}`;
    }

    // ─── ГЛАВНЫЙ ЦИКЛ ──────────────────────────────────────────────────────────

    draw(timestamp) {
        const w = this.cssWidth  || window.innerWidth;
        const h = this.cssHeight || window.innerHeight;

        this.ctx.clearRect(0, 0, w, h);

        // Порядок рисования: небо → звёзды → туман → здания → отражения
        this.drawSky();
        this.drawStars(timestamp);
        this.drawFog();
        this.drawBuildings();
    }

    animate(timestamp = 0) {
        requestAnimationFrame((ts) => this.animate(ts));

        if (this.isPaused) return;

        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed < this.fpsInterval) return;
        this.lastFrameTime = timestamp - (elapsed % this.fpsInterval);

        this.updateAnimatedWindows(timestamp);
        this.draw(timestamp);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelCityBackground();
});
