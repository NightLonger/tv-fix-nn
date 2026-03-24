// yandex-analytics.js - Расширенная аналитика для NoonFix
class YandexAnalytics {
    constructor() {
        this.metrics = {};
        this.userSession = this.generateSessionId();
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.trackPerformance();
        this.trackUserBehavior();
        this.trackEngagement();
        this.setupEventListeners();
    }

    trackPerformance() {
        // Core Web Vitals
        this.trackLCP();
        this.trackFID();
        this.trackCLS();
        this.trackFCP();

        window.addEventListener('load', () => {
            setTimeout(() => {
                this.reportPerformance();
            }, 3000);
        });
    }

    trackLCP() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        });
        observer.observe({entryTypes: ['largest-contentful-paint']});
    }

    trackFID() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.metrics.FID = entry.processingStart - entry.startTime;
            });
        });
        observer.observe({entryTypes: ['first-input']});
    }

    trackCLS() {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.metrics.CLS = clsValue;
        });
        observer.observe({entryTypes: ['layout-shift']});
    }

    trackFCP() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            this.metrics.FCP = entries[0].startTime;
        });
        observer.observe({entryTypes: ['paint']});
    }

    reportPerformance() {
        if (window.YandexMetrika) {
            window.YandexMetrika.sendParams({
                performance_LCP: Math.round(this.metrics.LCP),
                performance_FID: Math.round(this.metrics.FID),
                performance_CLS: Math.round(this.metrics.CLS * 1000) / 1000,
                performance_FCP: Math.round(this.metrics.FCP),
                performance_TTFB: performance.timing.responseStart - performance.timing.requestStart,
                performance_DOMLoad: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                session_id: this.userSession
            });
        }
    }

    trackUserBehavior() {
        this.trackScrollDepth();
        this.trackTimeSpent();
        this.trackClicks();
        this.trackFormInteractions();
    }

    trackScrollDepth() {
        let maxScroll = 0;
        const reportScroll = () => {
            const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
            if (scrollDepth > maxScroll) {
                maxScroll = scrollDepth;
                
                // Отправляем важные отметки прокрутки
                if ([25, 50, 75, 90].includes(maxScroll)) {
                    window.YandexMetrika?.reachGoal('scroll_deep', { depth: maxScroll });
                }
            }
        };

        window.addEventListener('scroll', () => {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(reportScroll, 100);
        }, { passive: true });

        window.addEventListener('beforeunload', () => {
            window.YandexMetrika?.sendParams({
                scroll_depth_max: maxScroll
            });
        });
    }

    trackTimeSpent() {
        let startTime = Date.now();
        let activeTime = 0;
        let lastActive = Date.now();

        const updateActiveTime = () => {
            const now = Date.now();
            activeTime += now - lastActive;
            lastActive = now;
        };

        document.addEventListener('mousemove', updateActiveTime, { passive: true });
        document.addEventListener('keypress', updateActiveTime, { passive: true });
        document.addEventListener('click', updateActiveTime, { passive: true });

        window.addEventListener('beforeunload', () => {
            const totalTime = Date.now() - startTime;
            window.YandexMetrika?.sendParams({
                session_duration_total: Math.round(totalTime / 1000),
                session_duration_active: Math.round(activeTime / 1000),
                session_pages_visited: 1
            });
        });
    }

    trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Клики по услугам
            if (target.closest('.service-card')) {
                const serviceTitle = target.closest('.service-card').querySelector('.service-title');
                if (serviceTitle && window.YandexMetrika) {
                    window.YandexMetrika.trackServiceView(serviceTitle.textContent.trim());
                }
            }

            // Клики по телефонам
            if (target.closest('a[href^="tel:"]')) {
                const phoneLink = target.closest('a[href^="tel:"]');
                window.YandexMetrika?.trackPhoneCall(phoneLink.href.replace('tel:', ''));
            }

            // Клики по внешним ссылкам (Telegram, WhatsApp)
            if (target.closest('a[href*="t.me"]')) {
                window.YandexMetrika?.reachGoal('telegram_click');
            }
            if (target.closest('a[href*="wa.me"]')) {
                window.YandexMetrika?.reachGoal('whatsapp_click');
            }
        }, { passive: true });
    }

    trackFormInteractions() {
        const formFields = document.querySelectorAll('input, select, textarea');
        formFields.forEach(field => {
            field.addEventListener('focus', () => {
                window.YandexMetrika?.sendParams({
                    form_field_focused: field.name || field.id
                });
            });

            field.addEventListener('blur', () => {
                if (field.value.trim()) {
                    window.YandexMetrika?.sendParams({
                        form_field_filled: field.name || field.id
                    });
                }
            });
        });
    }

    trackEngagement() {
        this.trackSectionViews();
        this.trackVideoPlays();
        this.trackFileDownloads();
    }

    trackSectionViews() {
        const sections = {
            'services': 'service_view',
            'prices': 'pricing_view',
            'about': 'about_view',
            'stages': 'stages_view',
            'contacts': 'contacts_view'
        };

        Object.entries(sections).forEach(([sectionId, goalName]) => {
            const section = document.getElementById(sectionId);
            if (section) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && window.YandexMetrika) {
                            window.YandexMetrika.reachGoal(goalName, {
                                section: sectionId,
                                view_time: new Date().toISOString()
                            });
                        }
                    });
                }, { 
                    threshold: 0.5,
                    rootMargin: '0px 0px -10% 0px'
                });
                
                observer.observe(section);
            }
        });
    }

    trackVideoPlays() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.addEventListener('play', () => {
                window.YandexMetrika?.sendParams({
                    video_played: video.src || 'mask_gif'
                });
            });
        });
    }

    trackFileDownloads() {
        // Можно добавить для будущих файлов (прайсы, инструкции)
    }

    setupEventListeners() {
        // Глобальные события для отслеживания
        window.addEventListener('beforeunload', () => {
            this.reportFinalMetrics();
        });

        // Отслеживание видимости вкладки
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                window.YandexMetrika?.sendParams({
                    tab_hidden_at: new Date().toISOString()
                });
            }
        });
    }

    reportFinalMetrics() {
        const finalMetrics = {
            session_end: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookies_enabled: navigator.cookieEnabled,
            java_enabled: navigator.javaEnabled ? navigator.javaEnabled() : false
        };

        window.YandexMetrika?.sendParams(finalMetrics);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.YandexAnalytics = new YandexAnalytics();
});