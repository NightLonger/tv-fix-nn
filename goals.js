// Отслеживание целей для счетчика 104657622
class MetricTracker {
    constructor() {
        this.timeStart = Date.now();
        this.init();
    }

    init() {
        this.trackClicks();
        this.trackScroll();
        this.trackTime();
    }

    track(goalName) {
        // Яндекс.Метрика
        if (typeof ym !== 'undefined') {
            ym(104657622, 'reachGoal', goalName);
            console.log('Goal tracked:', goalName);
        }
    }

    trackClicks() {
        // Телефон
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
            link.addEventListener('click', () => this.track('phone_call'));
        });

        // Мессенджеры
        document.querySelectorAll('a[href*="t.me"], a[href*="wa.me"]').forEach(link => {
            const platform = link.href.includes('t.me') ? 'telegram' : 'whatsapp';
            link.addEventListener('click', () => this.track(`${platform}_click`));
        });

        // Обратный звонок
        const callbackBtn = document.querySelector('.callback-btn');
        if (callbackBtn) {
            callbackBtn.addEventListener('click', () => this.track('callback_request'));
        }

        // Клики по услугам
        document.querySelectorAll('.service-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const serviceName = card.querySelector('.service-title').textContent;
                this.track(`service_${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
            });
        });
    }

    trackScroll() {
        const sections = ['services', 'prices', 'about', 'contacts'];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.track(`view_${entry.target.id}`);
                    // Помечаем как просмотренное
                    entry.target.setAttribute('data-viewed', 'true');
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element && !element.hasAttribute('data-viewed')) {
                observer.observe(element);
            }
        });
    }

    trackTime() {
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - this.timeStart) / 1000);
            if (typeof ym !== 'undefined') {
                ym(104657622, 'params', { 
                    time_spent_seconds: timeSpent,
                    session_end: new Date().toISOString()
                });
            }
        });
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new MetricTracker();
});
