// matrix-rain.js
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixRain');
        this.ctx = this.canvas.getContext('2d');
        this.symbols = 'TVFIX8BIT80SGLITCHPIXEL01';
        this.columns = [];
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createColumns();
        this.animate();
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createColumns();
        });

        // Добавляем интерактивность
        this.addInteractivity();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight * 0.3; // Только верхние 30% экрана
    }

    createColumns() {
        this.columns = [];
        const columnWidth = 20;
        const columnsCount = Math.floor(this.canvas.width / columnWidth);
        
        for (let i = 0; i < columnsCount; i++) {
            this.columns.push({
                x: i * columnWidth,
                y: Math.random() * -100, // Начинаем выше экрана
                speed: 1 + Math.random() * 2,
                symbols: this.generateSymbols(8 + Math.floor(Math.random() * 6)),
                currentSymbol: 0,
                isGlitching: false,
                glitchTimer: 0
            });
        }
    }

    generateSymbols(length) {
        const symbols = [];
        for (let i = 0; i < length; i++) {
            symbols.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
        }
        return symbols;
    }

    draw() {
        // Полупрозрачный фон для плавного исчезновения
        this.ctx.fillStyle = 'rgba(17, 17, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.columns.forEach(column => {
            this.drawColumn(column);
        });
    }

    drawColumn(column) {
        const symbolHeight = 12;
        const x = column.x;
        
        // Рисуем символы колонки
        for (let i = 0; i < column.symbols.length; i++) {
            const y = column.y + i * symbolHeight;
            
            // Пропускаем символы за пределами экрана
            if (y < -symbolHeight || y > this.canvas.height) continue;
            
            const symbol = column.symbols[i];
            const opacity = this.calculateOpacity(i, column.symbols.length);
            const color = this.getSymbolColor(i, column);
            
            this.drawSymbol(symbol, x, y, color, opacity);
        }
    }

    drawSymbol(symbol, x, y, color, opacity) {
        this.ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.fillText(symbol, x, y);
    }

    calculateOpacity(symbolIndex, totalSymbols) {
        // Первые символы ярче, последние тусклее
        if (symbolIndex === 0) return 1; // Лидирующий символ
        return Math.max(0.2, 1 - (symbolIndex / totalSymbols) * 0.8);
    }

    getSymbolColor(symbolIndex, column) {
        if (column.isGlitching) {
            const colors = ['#FF00FF', '#00FFFF', '#FFFF00'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        return symbolIndex === 0 ? '#00FFFF' : '#FF00FF'; // Лидирующий символ голубой
    }

    update() {
        this.columns.forEach(column => {
            // Обновляем позицию
            column.y += column.speed;
            
            // Обновляем текущий символ для мерцания
            column.currentSymbol = (column.currentSymbol + 1) % 4;
            
            // Случайный глитч
            if (!column.isGlitching && Math.random() < 0.002) {
                column.isGlitching = true;
                column.glitchTimer = 10; // 10 кадров глитча
            }
            
            // Обработка глитча
            if (column.isGlitching) {
                column.glitchTimer--;
                if (column.glitchTimer <= 0) {
                    column.isGlitching = false;
                    // Меняем символы после глитча
                    column.symbols = this.generateSymbols(column.symbols.length);
                }
            }
            
            // Если колонка ушла за экран - перезапускаем
            if (column.y > this.canvas.height + column.symbols.length * 12) {
                this.resetColumn(column);
            }
        });
    }

    resetColumn(column) {
        column.y = -Math.random() * 100;
        column.speed = 1 + Math.random() * 2;
        column.symbols = this.generateSymbols(8 + Math.floor(Math.random() * 6));
        column.isGlitching = false;
    }

    addInteractivity() {
        const logo = document.getElementById('mainLogo');
        const nav = document.querySelector('.nav');
        
        // Ускорение при наведении на логотип
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                this.columns.forEach(column => {
                    column.speed *= 2;
                });
            });
            
            logo.addEventListener('mouseleave', () => {
                this.columns.forEach(column => {
                    column.speed /= 2;
                });
            });
        }
        
        // Эффект обтекания для навигации
        if (nav) {
            nav.addEventListener('mouseenter', () => {
                this.columns.forEach(column => {
                    if (Math.random() < 0.3) { // 30% колонок реагируют
                        column.isGlitching = true;
                        column.glitchTimer = 20;
                    }
                });
            });
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new MatrixRain();
});    