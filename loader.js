// loader.js
class TVDiagnosticLoader {
    constructor() {
        this.loader = document.getElementById('tvLoader');
        this.content = document.getElementById('loaderContent');
        this.testScreen = document.getElementById('testScreen');
        this.beepSound = null;
        this.stages = [
            this.stage1.bind(this),
            this.stage2.bind(this)
        ];
        this.currentStage = 0;
        this.isSkipped = false;
        
        this.init();
    }

    init() {
        this.createBeepSound();
        this.showLoader();
        this.startSequence();
        this.addSkipListener();
    }

    createBeepSound() {
        // Создаем высокочастотный писк (15 kHz)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 15000; // 15 kHz
        gainNode.gain.value = 0.1; // Тихий звук
        
        this.beepSound = { oscillator, gainNode, audioContext };
    }

    playBeep(duration = 100) {
        if (!this.beepSound) return;
        
        try {
            this.beepSound.oscillator.start();
            setTimeout(() => {
                this.beepSound.oscillator.stop();
            }, duration);
        } catch (e) {
            console.log('Sound not supported');
        }
    }

    stopBeep() {
        if (this.beepSound) {
            this.beepSound.oscillator.stop();
        }
    }

    showLoader() {
        this.loader.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.showTestPattern();
    }

    hideLoader() {
        this.stopBeep();
        this.loader.style.display = 'none';
        document.body.style.overflow = '';
    }

    showTestPattern() {
        // Показываем экран диагностики с цветными полосами
        this.testScreen.style.display = 'block';
        this.playBeep(1500); // Укороченный писк при появлении
    }

    startSequence() {
        setTimeout(() => {
            this.stages[0]();
        }, 800); // Уменьшена задержка старта
    }

    stage1() {
        this.playBeep(80);
        const text = `
СКАНИРОВАНИЕ...
ОБНАРУЖЕН ТЕЛЕВИЗОР
СОСТОЯНИЕ: ТРЕБУЕТ РЕМОНТА
АВТОМАТИЧЕСКОЕ ПЕРЕНАПРАВЛЕНИЕ...
        `;
        this.typeText(text, () => {
            setTimeout(() => this.nextStage(), 600); // Уменьшена задержка
        });
    }

    stage2() {
        this.playBeep(120);
        const text = `
ПОДКЛЮЧЕНИЕ К СЕРВИСУ...
NOONFIX
ГОТОВ К ПРИЕМУ ЗАЯВОК

>>> НАЖМИТЕ ЛЮБУЮ КЛАВИШУ <<<
        `;
        this.typeText(text, () => {
            this.addBlinkingCursor();
            // Короткие повторяющиеся писки в фоне
            this.backgroundBeep = setInterval(() => {
                this.playBeep(20);
            }, 2000);
        });
    }
    
    typeText(text, callback) {
        this.content.innerHTML = '';
        const lines = text.trim().split('\n');
        let currentLine = 0;
        let currentChar = 0;

        const typeLine = () => {
            if (currentLine >= lines.length) {
                callback();
                return;
            }

            if (currentChar === 0) {
                this.content.innerHTML += '<div class="terminal-line"></div>';
            }

            const lineElement = this.content.lastElementChild;
            
            if (currentChar < lines[currentLine].length) {
                lineElement.textContent += lines[currentLine][currentChar];
                currentChar++;
                setTimeout(typeLine, 25); // Увеличена скорость печати
            } else {
                currentLine++;
                currentChar = 0;
                setTimeout(typeLine, 80); // Уменьшена задержка между строками
            }
        };

        typeLine();
    }

    addBlinkingCursor() {
        const cursor = document.createElement('span');
        cursor.className = 'blinking-cursor';
        cursor.textContent = '█';
        this.content.appendChild(cursor);
    }

    nextStage() {
        if (this.isSkipped) return;
        
        this.currentStage++;
        if (this.currentStage < this.stages.length) {
            this.stages[this.currentStage]();
        }
    }

    addSkipListener() {
        const skipLoader = () => {
            if (this.isSkipped) return;
            this.isSkipped = true;
            if (this.backgroundBeep) {
                clearInterval(this.backgroundBeep);
            }
            this.stopBeep();
            this.hideLoader();
        };

        this.loader.addEventListener('click', skipLoader);
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'F5' && e.key !== 'F12') {
                skipLoader();
            }
        });
        document.addEventListener('touchstart', skipLoader, { once: true });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TVDiagnosticLoader();
});