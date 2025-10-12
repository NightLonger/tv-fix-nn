// background.js
class PixelCityBackground {
    constructor() {
        this.canvas = document.getElementById('cityBackground');
        this.ctx = this.canvas.getContext('2d');
        this.buildings = [];
        this.animatedWindows = [];
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.generateBuildings();
        this.generateAnimatedWindows();
        this.animate();
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.generateBuildings();
            this.generateAnimatedWindows();
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateBuildings() {
        this.buildings = [];
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Цвета зданий
        const colors = ['#1A1A2E', '#16213E', '#0F3460', '#2D2D4E'];

        // Передний план (ближние здания)
        for (let i = 0; i < 4; i++) {
            const buildingWidth = width * (0.15 + Math.random() * 0.1);
            const buildingHeight = height * (0.3 + Math.random() * 0.1);
            const x = i * width * 0.25 + Math.random() * 50 - 25;
            
            this.buildings.push({
                x: x,
                y: height - buildingHeight,
                width: buildingWidth,
                height: buildingHeight,
                color: colors[Math.floor(Math.random() * colors.length)],
                windows: this.generateWindows(buildingWidth, buildingHeight, 8),
                level: 'foreground'
            });
        }

        // Средний план
        for (let i = 0; i < 6; i++) {
            const buildingWidth = width * (0.08 + Math.random() * 0.06);
            const buildingHeight = height * (0.2 + Math.random() * 0.08);
            const x = Math.random() * width * 0.8 + width * 0.1;
            
            this.buildings.push({
                x: x,
                y: height - buildingHeight,
                width: buildingWidth,
                height: buildingHeight,
                color: colors[Math.floor(Math.random() * colors.length)],
                windows: this.generateWindows(buildingWidth, buildingHeight, 6),
                level: 'midground'
            });
        }

        // Задний план
        for (let i = 0; i < 10; i++) {
            const buildingWidth = width * (0.04 + Math.random() * 0.04);
            const buildingHeight = height * (0.1 + Math.random() * 0.06);
            const x = Math.random() * width;
            
            this.buildings.push({
                x: x,
                y: height - buildingHeight,
                width: buildingWidth,
                height: buildingHeight,
                color: colors[Math.floor(Math.random() * colors.length)],
                windows: this.generateWindows(buildingWidth, buildingHeight, 3),
                level: 'background'
            });
        }
    }

    generateWindows(buildingWidth, buildingHeight, pixelSize) {
        const windows = [];
        const cols = Math.floor(buildingWidth / (pixelSize * 4));
        const rows = Math.floor(buildingHeight / (pixelSize * 4));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.3) { // 70% окон
                    windows.push({
                        x: col * pixelSize * 4 + pixelSize,
                        y: row * pixelSize * 4 + pixelSize,
                        size: pixelSize * 2,
                        color: '#2D2D4E', // темный цвет по умолчанию
                        animated: false
                    });
                }
            }
        }
        return windows;
    }

    generateAnimatedWindows() {
        this.animatedWindows = [];
        
        this.buildings.forEach((building, buildingIndex) => {
            let animationPercentage;
            
            switch(building.level) {
                case 'foreground':
                    animationPercentage = 0.07; // 7%
                    break;
                case 'midground':
                    animationPercentage = 0.04; // 4%
                    break;
                case 'background':
                    animationPercentage = 0.015; // 1.5%
                    break;
            }
            
            building.windows.forEach((window, windowIndex) => {
                if (Math.random() < animationPercentage) {
                    const colors = ['#FF00FF', '#00FFFF', '#FFFF00'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    let animationType, speed;
                    
                    switch(color) {
                        case '#FF00FF': // розовый
                            animationType = 'pulse';
                            speed = 3000 + Math.random() * 2000;
                            break;
                        case '#00FFFF': // голубой
                            animationType = 'blink';
                            speed = 1000 + Math.random() * 1000;
                            break;
                        case '#FFFF00': // желтый
                            animationType = 'flash';
                            speed = 500 + Math.random() * 500;
                            break;
                    }
                    
                    this.animatedWindows.push({
                        buildingIndex: buildingIndex,
                        windowIndex: windowIndex,
                        color: color,
                        animationType: animationType,
                        speed: speed,
                        lastUpdate: 0,
                        currentState: 0
                    });
                }
            });
        });
    }

    draw() {
        // Очищаем canvas
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем здания
        this.buildings.forEach(building => {
            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Рисуем окна
            building.windows.forEach(window => {
                this.ctx.fillStyle = window.color;
                this.ctx.fillRect(
                    building.x + window.x,
                    building.y + window.y,
                    window.size,
                    window.size
                );
            });
        });
    }

    updateAnimatedWindows(timestamp) {
        this.animatedWindows.forEach(animWindow => {
            const building = this.buildings[animWindow.buildingIndex];
            const window = building.windows[animWindow.windowIndex];
            
            if (timestamp - animWindow.lastUpdate > animWindow.speed) {
                animWindow.lastUpdate = timestamp;
                
                switch(animWindow.animationType) {
                    case 'pulse':
                        animWindow.currentState = (animWindow.currentState + 1) % 3;
                        window.color = animWindow.currentState === 0 ? '#2D2D4E' : 
                                      animWindow.currentState === 1 ? animWindow.color : 
                                      this.adjustColorBrightness(animWindow.color, 0.7);
                        break;
                        
                    case 'blink':
                        window.color = window.color === '#2D2D4E' ? animWindow.color : '#2D2D4E';
                        break;
                        
                    case 'flash':
                        window.color = animWindow.color;
                        setTimeout(() => {
                            window.color = '#2D2D4E';
                        }, 100);
                        break;
                }
            }
        });
    }

    adjustColorBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `#${Math.round(r * factor).toString(16).padStart(2, '0')}${Math.round(g * factor).toString(16).padStart(2, '0')}${Math.round(b * factor).toString(16).padStart(2, '0')}`;
    }

    animate(timestamp) {
        this.updateAnimatedWindows(timestamp);
        this.draw();
        requestAnimationFrame((ts) => this.animate(ts));
    }
}

// Инициализация когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new PixelCityBackground();
});