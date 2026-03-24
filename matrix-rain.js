class MatrixLoader {
    constructor() {
        this.overlay  = document.getElementById('matrixLoader');
        this.canvas   = document.getElementById('matrixLoaderCanvas');
        this.skipBtn  = document.getElementById('matrixSkipBtn');
        this.ctx      = this.canvas.getContext('2d');

        this.symbols  = 'TVFIX8BIT80SGLITCHPIXEL01NOONFIX';
        this.columns  = [];
        this.animationId = null;
        this.isFinishing = false;

        // Через сколько мс начинается fade out
        this.DURATION      = 5000;
        this.FADE_DURATION = 1000;

        this.isMobile    = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.fpsInterval = 1000 / (this.isMobile ? 30 : 60);
        this.lastFrameTime = 0;
        this.isPaused = false;

        // Карта секций для reveal: { el, revealed, xStart, xEnd }
        this.revealSections = [];
        // Процент колонок каждой секции которые должны пройти до reveal
        this.REVEAL_THRESHOLD = 0.4;

        document.addEventListener('visibilitychange', () => {
            this.isPaused = document.hidden;
        });

        // Оверлей прозрачный — сайт виден под дождём
        this.overlay.style.background = 'transparent';
        // Блокируем прокрутку
        document.body.style.overflow = 'hidden';

        this.init();
    }

    // ─── ИНИЦИАЛИЗАЦИЯ ────────────────────────────────────────────────────────

    init() {
        this.resizeCanvas();
        this.createColumns();
        this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
        this.buildRevealMap();
        this.animate();

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createColumns();
            this.buildRevealMap();
        });

        this.startTimer = setTimeout(() => this.startFadeOut(), this.DURATION);

        const skip = () => this.finish();
        this.skipBtn.addEventListener('click', skip);
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'F5' && e.key !== 'F12') skip();
        });
        document.addEventListener('touchstart', skip, { once: true });
    }

    // Строим карту: секция → диапазон X на экране
    buildRevealMap() {
        const selectors = [
            'header.header',
            'section.work-stages',
            'section.services',
            'section.why-me',
            'section.contacts-section',
            'section.scanner-section',
        ];

        this.revealSections = selectors.map(sel => {
            const el = document.querySelector(sel);
            if (!el) return null;
            return {
                el,
                revealed:        false,
                columnsInZone:   0,   // сколько колонок в зоне секции завершили проход
                columnsTotal:    0,   // сколько всего колонок попадает на зону
                xStart:          0,
                xEnd:            0,
            };
        }).filter(Boolean);

        this.updateRevealMap();
    }

    // Пересчитываем X-диапазоны по текущей ширине экрана
    // Все секции full-width → xStart=0, xEnd=cssWidth,
    // но триггером служат колонки достигшие НИЖНЕЙ точки секции
    updateRevealMap() {
        const w = this.cssWidth || window.innerWidth;
        this.revealSections.forEach(s => {
            s.xStart       = 0;
            s.xEnd         = w;
            s.columnsTotal = this.columns.length;
            if (!s.revealed) s.columnsInZone = 0;
        });
    }

    // ─── CANVAS ───────────────────────────────────────────────────────────────

    resizeCanvas() {
        const dpr  = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        this.canvas.width  = cssW * dpr;
        this.canvas.height = cssH * dpr;
        this.canvas.style.width  = cssW + 'px';
        this.canvas.style.height = cssH + 'px';

        this.ctx.scale(dpr, dpr);
        this.cssWidth  = cssW;
        this.cssHeight = cssH;
    }

    createColumns() {
        this.columns = [];
        const colW  = 20;
        const count = Math.floor((this.cssWidth || window.innerWidth) / colW);

        for (let i = 0; i < count; i++) {
            this.columns.push({
                x:     i * colW,
                y:     Math.random() * -(this.cssHeight || window.innerHeight),
                speed: 1.5 + Math.random() * 2.5,
                syms:  this.generateSymbols(8 + Math.floor(Math.random() * 7)),
                isGlitching: false,
                glitchTimer: 0,
                passedBottom: false,  // прошла ли колонка нижний край
            });
        }
        if (this.revealSections) this.updateRevealMap();
    }

    generateSymbols(len) {
        return Array.from({ length: len }, () =>
            this.symbols[Math.floor(Math.random() * this.symbols.length)]
        );
    }

    // ─── REVEAL ЛОГИКА ────────────────────────────────────────────────────────

    // Вызывается когда колонка достигла нижнего края экрана
    onColumnReachedBottom(column) {
        if (column.passedBottom) return;
        column.passedBottom = true;

        // Для каждой ещё не открытой секции увеличиваем счётчик колонок
        this.revealSections.forEach(section => {
            if (section.revealed) return;
            section.columnsInZone++;

            // Когда REVEAL_THRESHOLD колонок прошли — открываем секцию
            const ratio = section.columnsInZone / (section.columnsTotal || 1);
            if (ratio >= this.REVEAL_THRESHOLD) {
                this.revealSection(section);
            }
        });
    }

    revealSection(section) {
        if (section.revealed) return;
        section.revealed = true;

        // Небольшой stagger — каждая следующая секция чуть позже
        const idx   = this.revealSections.indexOf(section);
        const delay = idx * 120;

        setTimeout(() => {
            // CSS .revealed включает transition + opacity:1 + transform:none
            section.el.classList.add('revealed');
        }, delay);
    }

    // Немедленно открыть всё (при пропуске или истечении таймера)
    revealAll() {
        this.revealSections.forEach((section, idx) => {
            if (section.revealed) return;
            section.revealed = true;
            const delay = idx * 80;
            setTimeout(() => section.el.classList.add('revealed'), delay);
        });
    }

    // ─── РИСОВАНИЕ ────────────────────────────────────────────────────────────

    draw() {
        const w = this.cssWidth  || window.innerWidth;
        const h = this.cssHeight || window.innerHeight;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // меньше непрозрачность — сайт виден под дождём
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.font = 'bold 14px "JetBrains Mono", "Courier New", monospace';

        this.columns.forEach(col => this.drawColumn(col));
    }

    drawColumn(col) {
        const symH = 14;
        const h    = this.cssHeight || window.innerHeight;

        col.syms.forEach((sym, i) => {
            const y = col.y + i * symH;
            if (y < -symH || y > h) return;

            const opacity = i === 0 ? 1 : Math.max(0.15, 1 - (i / col.syms.length) * 0.85);
            let color;
            if (col.isGlitching) {
                const gc = ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'];
                color = gc[Math.floor(Math.random() * gc.length)];
            } else {
                color = i === 0 ? '#00FFFF' : '#FF00FF';
            }

            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle   = color;
            this.ctx.fillText(sym, col.x, y);
        });
        this.ctx.globalAlpha = 1;
    }

    update() {
        const h = this.cssHeight || window.innerHeight;

        this.columns.forEach(col => {
            col.y += col.speed;

            // Глитч
            if (!col.isGlitching && Math.random() < 0.002) {
                col.isGlitching = true;
                col.glitchTimer = 10;
            }
            if (col.isGlitching && --col.glitchTimer <= 0) {
                col.isGlitching = false;
                col.syms = this.generateSymbols(col.syms.length);
            }

            // Проверяем достижение нижнего края — триггер reveal
            const colBottom = col.y + col.syms.length * 14;
            if (!col.passedBottom && colBottom > h) {
                this.onColumnReachedBottom(col);
            }

            // Перезапуск колонки
            if (col.y > h + col.syms.length * 14) {
                col.y     = -Math.random() * 100;
                col.speed = 1.5 + Math.random() * 2.5;
                col.syms  = this.generateSymbols(8 + Math.floor(Math.random() * 7));
                // passedBottom НЕ сбрасываем — повторный проход не триггерит reveal
            }
        });
    }

    // ─── ЗАВЕРШЕНИЕ ───────────────────────────────────────────────────────────

    startFadeOut() {
        if (this.isFinishing) return;
        this.isFinishing  = true;
        this.fadeStartTime = performance.now();
        // Открываем всё что ещё не открылось
        this.revealAll();
    }

    finish() {
        clearTimeout(this.startTimer);
        this.revealAll();
        if (this.isFinishing) return;
        this.startFadeOut();
    }

    hide() {
        cancelAnimationFrame(this.animationId);
        this.overlay.style.display   = 'none';
        document.body.style.overflow = '';
        // Страховка: если что-то осталось скрытым — открываем всё
        document.body.classList.add('loader-done');
    }

    // ─── ГЛАВНЫЙ ЦИКЛ ─────────────────────────────────────────────────────────

    animate(timestamp = 0) {
        this.animationId = requestAnimationFrame((ts) => this.animate(ts));

        if (this.isPaused) return;

        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed < this.fpsInterval) return;
        this.lastFrameTime = timestamp - (elapsed % this.fpsInterval);

        this.update();
        this.draw();

        // Fade out оверлея
        if (this.isFinishing) {
            const progress = Math.min((timestamp - this.fadeStartTime) / this.FADE_DURATION, 1);
            this.overlay.style.opacity = 1 - progress;
            if (progress >= 1) this.hide();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MatrixLoader();
});
