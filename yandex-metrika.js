// yandex-metrika.js - Оптимизированная версия для NoonFix
class YandexMetrika {
    constructor(counterId = 104657622) {
        this.counterId = counterId;
        this.isLoaded = false;
        this.goals = this.initializeGoals();
        this.init();
    }

    initializeGoals() {
        return {
            // Основные конверсии
            LEAD_SUBMIT: 'lead_submit',
            CALLBACK_CLICK: 'callback_click',
            PHONE_CALL: 'phone_call',
            
            // Взаимодействия с сайтом
            NAVIGATION: 'navigation',
            SERVICE_VIEW: 'service_view',
            PRICING_VIEW: 'pricing_view',
            STAGES_VIEW: 'stages_view',
            ABOUT_VIEW: 'about_view',
            
            // Контактные действия
            CONTACT_CLICK: 'contact_click',
            FLOAT_CONTACT: 'float_contact',
            TELEGRAM_CLICK: 'telegram_click',
            WHATSAPP_CLICK: 'whatsapp_click',
            
            // Дополнительные цели
            LOGO_CLICK: 'logo_click',
            SCROLL_DEEP: 'scroll_deep',
            TIME_SPENT: 'time_spent'
        };
    }

    init() {
        if (this.isYandexBot()) return;
        
        this.injectMetrikaScript();
        this.setupErrorTracking();
    }

    isYandexBot() {
        return /bot|yandex|googlebot|bingbot|slurp/i.test(navigator.userAgent);
    }

    injectMetrikaScript() {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = `
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${this.counterId}', 'ym');

            ym(${this.counterId}, 'init', {
                ssr:true, 
                webvisor:true, 
                clickmap:true, 
                ecommerce:"dataLayer", 
                accurateTrackBounce:true, 
                trackLinks:true
            });
        `;
        document.head.appendChild(script);

        // Noscript для пользователей без JS
        const noscript = document.createElement('noscript');
        noscript.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${this.counterId}" style="position:absolute; left:-9999px;" alt="" /></div>`;
        document.head.appendChild(noscript);

        this.isLoaded = true;
        console.log('✅ Яндекс.Метрика инициализирована');
    }

    reachGoal(goalName, goalParams = {}) {
        if (this.isLoaded && typeof ym !== 'undefined') {
            try {
                ym(this.counterId, 'reachGoal', goalName, goalParams);
                console.log(`🎯 Метрика: цель "${goalName}"`, goalParams);
                
                // Дублируем в dataLayer для eCommerce
                if (goalName === this.goals.LEAD_SUBMIT) {
                    this.trackEcommerceLead(goalParams);
                }
            } catch (error) {
                console.warn('Ошибка отправки цели:', error);
            }
        } else {
            // Ставим в очередь если метрика еще не загрузилась
            this.queueGoal(goalName, goalParams);
        }
    }

    queueGoal(goalName, goalParams) {
        if (!window._ymQueue) window._ymQueue = [];
        window._ymQueue.push({ goalName, goalParams });
        
        // Пытаемся отправить позже
        setTimeout(() => {
            if (this.isLoaded && window._ymQueue.length > 0) {
                window._ymQueue.forEach(({ goalName, goalParams }) => {
                    this.reachGoal(goalName, goalParams);
                });
                window._ymQueue = [];
            }
        }, 2000);
    }

    trackEcommerceLead(leadData) {
        if (window.dataLayer) {
            window.dataLayer.push({
                'event': 'lead_success',
                'ecommerce': {
                    'purchase': {
                        'actionField': {
                            'id': 'lead_' + Date.now(),
                            'affiliation': 'NoonFix TV Repair',
                            'revenue': this.calculateLeadValue(leadData.problem),
                            'tax': 0,
                            'shipping': 0
                        },
                        'products': [{
                            'name': this.getServiceName(leadData.problem),
                            'id': 'tv_repair_service',
                            'category': 'Electronics Repair',
                            'quantity': 1
                        }]
                    }
                }
            });
        }
    }

    calculateLeadValue(problem) {
        const serviceValues = {
            'Не включается': 2500,
            'Полосы на экране': 4000,
            'Зависает': 1500,
            'Мерцает изображение': 3000,
            'Нет изображения (есть звук)': 3500,
            'Нет звука (есть изображение)': 2000,
            'Не работает Smart TV': 1000,
            'Сам выключается': 2800,
            'Перегревается': 2200
        };
        return serviceValues[problem] || 2000;
    }

    getServiceName(problem) {
        const serviceNames = {
            'Не включается': 'Ремонт блока питания',
            'Полосы на экране': 'Замена матрицы/шлейфа',
            'Зависает': 'Прошивка TV',
            'Мерцает изображение': 'Ремонт подсветки',
            'Нет изображения (есть звук)': 'Ремонт подсветки/матрицы',
            'Нет звука (есть изображение)': 'Ремонт звуковой платы',
            'Не работает Smart TV': 'Восстановление Smart функций',
            'Сам выключается': 'Ремонт системы питания',
            'Перегревается': 'Чистка и ремонт системы охлаждения'
        };
        return serviceNames[problem] || 'Ремонт телевизора';
    }

    sendParams(params) {
        if (this.isLoaded && typeof ym !== 'undefined') {
            ym(this.counterId, 'params', params);
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (e) => {
            this.sendParams({
                error_message: e.message,
                error_file: e.filename,
                error_line: e.lineno,
                error_timestamp: new Date().toISOString()
            });
        });
    }

    // Методы для конкретных целей
    trackLead(city, problem, phone, name) {
        this.reachGoal(this.goals.LEAD_SUBMIT, {
            city: city,
            problem: problem,
            phone: phone,
            name: name,
            timestamp: new Date().toISOString()
        });
    }

    trackPhoneCall(phoneNumber) {
        this.reachGoal(this.goals.PHONE_CALL, {
            phone: phoneNumber,
            timestamp: new Date().toISOString()
        });
    }

    trackServiceView(serviceName) {
        this.reachGoal(this.goals.SERVICE_VIEW, {
            service: serviceName,
            timestamp: new Date().toISOString()
        });
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.YandexMetrika = new YandexMetrika(104657622);
});