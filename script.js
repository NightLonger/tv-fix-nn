// Конфигурация и константы
const CONFIG = {
    glitch: {
        interval: 3000,
        probability: 0.7,
        duration: 100
    },
    stages: {
        autoSwitchInterval: 3000,
        animationDuration: 500
    },
    mobileBreakpoint: 768,
    modal: {
        closeDelay: 2000,
        animationDuration: 1000
    }
};

// Конфигурация Telegram
const TELEGRAM_CONFIG = {
    botToken: '8410028742:AAGjEgJSRDyJxYUbOhbtCyOmqY0xP3D8VzM',
    adminChatId: '546467695',
    
    // Мастера - получают ТОЛЬКО свои заявки
    masters: {
        'nnov': '546467695',      // Нижний Новгород
        'perm': '490135281',      // Пермь
        'syktyvkar': '6744326620' // Сыктывкар
    }
};

// Конфигурация города
const cityConfig = {
    name: 'Нижний Новгород',
    code: 'nnov'
};

// Кэш DOM элементов
const domCache = {
    elements: {},
    get(selector) {
        if (!this.elements[selector]) {
            this.elements[selector] = document.querySelector(selector);
        }
        return this.elements[selector];
    },
    getAll(selector) {
        if (!this.elements[selector]) {
            this.elements[selector] = document.querySelectorAll(selector);
        }
        return this.elements[selector];
    },
    // Очистка кэша при необходимости
    clear() {
        this.elements = {};
    }
};

// Утилиты
const utils = {
    // Дебаунс для оптимизации событий
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Плавный скролл к элементу
    smoothScrollTo(element, block = 'start') {
        if (element && element.scrollIntoView) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: block
            });
        }
    },

    // Анимация элемента
    animateElement(element, animationClass, duration = 300) {
        if (!element) return;
        
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    },

    // Управление скроллом body
    toggleBodyScroll(enable) {
        document.body.style.overflow = enable ? '' : 'hidden';
    },

    // Маска для телефона
    formatPhoneInput(value) {
        let numbers = value.replace(/\D/g, '');
        
        if (numbers.startsWith('7') || numbers.startsWith('8')) {
            numbers = numbers.substring(1);
        }
        
        if (numbers.length === 0) return '';
        
        let formatted = '+7 (';
        
        if (numbers.length > 0) {
            formatted += numbers.substring(0, 3);
        }
        if (numbers.length > 3) {
            formatted += ') ' + numbers.substring(3, 6);
        }
        if (numbers.length > 6) {
            formatted += '-' + numbers.substring(6, 8);
        }
        if (numbers.length > 8) {
            formatted += '-' + numbers.substring(8, 10);
        }
        
        return formatted;
    },

    // Проверка поддержки touch событий
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
};

// Функция отправки в Telegram
async function sendToTelegram(cityCode, formData) {
    const message = `
🚗 НОВАЯ ЗАЯВКА
──────────────
🏙️ Город: ${formData.city.name}
👤 Имя: ${formData.name}
📞 Телефон: ${formData.phone}
🔧 Проблема: ${formData.problem}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
🌐 Сайт: ${window.location.hostname}
    `;

    try {
        // 1. Отправляем ВАМ (все заявки)
        await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.adminChatId,
                text: `👑 ${message}`
            })
        });

        // 2. Отправляем МАСТЕРУ (только его город)
        if (TELEGRAM_CONFIG.masters[cityCode]) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.masters[cityCode],
                    text: message
                })
            });
        }

        // 3. Отправляем событие в Яндекс.Метрику
        if (window.YandexMetrika) {
            window.YandexMetrika.trackLead(
                formData.city.name,
                formData.problem,
                formData.phone,
                formData.name
            );
        }

        console.log('✅ Заявки отправлены!');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        
        // Отслеживаем ошибки
        if (window.YandexMetrika) {
            window.YandexMetrika.reachGoal('lead_error');
        }
        
        return false;
    }
}

// Функция валидации номера телефона
function validatePhoneNumber(phone) {
    const phoneInput = document.getElementById('userPhone');
    
    if (!phoneInput) return false;
    
    // Убираем все нецифровые символы кроме +
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Проверяем что номер российский и имеет 11 цифр (включая +7)
    const isValid = cleanPhone.length === 11 && cleanPhone.startsWith('7');
    
    if (phone && !isValid) {
        phoneInput.style.borderColor = '#ff4444';
        phoneInput.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
        
        // Показываем подсказку
        showPhoneHint('Введите полный номер телефона (11 цифр)');
        return false;
    } else if (isValid) {
        phoneInput.style.borderColor = 'var(--neon-green)';
        phoneInput.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
        hidePhoneHint();
        return true;
    } else {
        phoneInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        phoneInput.style.boxShadow = 'none';
        hidePhoneHint();
        return false;
    }
}

// Функция показа подсказки
function showPhoneHint(message) {
    let hintElement = document.getElementById('phoneHint');
    
    if (!hintElement) {
        hintElement = document.createElement('div');
        hintElement.id = 'phoneHint';
        hintElement.className = 'phone-hint';
        
        const phoneGroup = document.querySelector('.form-group:has(#userPhone)');
        if (phoneGroup) {
            phoneGroup.appendChild(hintElement);
        }
    }
    
    hintElement.textContent = message;
    hintElement.style.display = 'block';
}

// Функция скрытия подсказки
function hidePhoneHint() {
    const hintElement = document.getElementById('phoneHint');
    if (hintElement) {
        hintElement.style.display = 'none';
    }
}

// Функция проверки всей формы
function isFormValid() {
    const form = document.getElementById('masterForm');
    const agreementCheckbox = document.getElementById('userAgreement');
    const phoneInput = document.getElementById('userPhone');
    const nameInput = document.getElementById('userName');
    const problemSelect = document.getElementById('userProblem');
    
    if (!form || !agreementCheckbox || !phoneInput || !nameInput || !problemSelect) {
        return false;
    }
    
    // Проверяем согласие
    if (!agreementCheckbox.checked) {
        return false;
    }
    
    // Проверяем имя
    if (!nameInput.value.trim()) {
        return false;
    }
    
    // Проверяем проблему
    if (!problemSelect.value) {
        return false;
    }
    
    // Проверяем номер телефона
    const cleanPhone = phoneInput.value.replace(/\D/g, '');
    const isPhoneValid = cleanPhone.length === 11 && cleanPhone.startsWith('7');
    
    return isPhoneValid;
}

// Функция обновления состояния кнопки отправки
function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        const isValid = isFormValid();
        submitBtn.disabled = !isValid;
        
        // Добавляем подсказку на кнопку
        if (!isValid) {
            submitBtn.title = 'Заполните все поля правильно';
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            submitBtn.title = 'Отправить заявку';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
}

// Глобальная функция открытия модального окна
function openMasterModal() {
    const modal = document.getElementById('masterModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    const form = document.getElementById('masterForm');

    // Показываем модалку
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Сброс формы
    if (form) form.reset();
    
    // Сбрасываем стили полей
    const phoneInput = document.getElementById('userPhone');
    if (phoneInput) {
        phoneInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        phoneInput.style.boxShadow = 'none';
    }
    
    hidePhoneHint();
    
    // Обновляем состояние кнопки
    updateSubmitButton();
    
    // Фокус на первое поле
    setTimeout(() => {
        const userNameInput = document.getElementById('userName');
        if (userNameInput) userNameInput.focus();
    }, 100);
    
    // Отслеживание в Яндекс.Метрике
    if (window.YandexMetrika) {
        window.YandexMetrika.reachGoal('callback_click', {
            source: 'master_call_button',
            location: 'contacts_section'
        });
    }

    console.log('✅ Модальное окно открыто');
}

// Функция закрытия модального окна
function closeMasterModal() {
    const modal = document.getElementById('masterModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Отслеживание взаимодействий для аналитики
function trackUserInteraction(action, data = {}) {
    console.log('📊 User action:', action, data);
    
    // Яндекс.Метрика через модуль
    if (window.YandexMetrika) {
        const goalsMap = {
            'callback_button_clicked': 'callback_click',
            'navigation_click': 'navigation',
            'stage_changed': 'stage_progress',
            'advantage_clicked': 'advantage_view',
            'contact_menu_item_clicked': 'contact_click',
            'floating_contact_toggled': 'float_contact',
            'logo_clicked': 'logo_click',
            'video_play_started': 'video_play',
            'master_call_button_clicked': 'callback_click'
        };
        
        if (goalsMap[action]) {
            window.YandexMetrika.reachGoal(goalsMap[action], data);
        }
    }
}

// Обработка загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeLogo();
    initializeNavigation();
    initializeCallbacks();
    initializeMobileMenu();
    initializePricing();
    initializeWhyMe();
    initializeMaskVideo();
    initializeFloatingContact();
    initializeWorkStages();
    initializeMasterModal();
    
    optimizeForMobile();
    window.addEventListener('resize', utils.debounce(optimizeForMobile, 250));
    
    console.log('🚀 Все модули инициализированы');

    // ── Отслеживание скролла до ключевых секций ──
    const sectionGoals = {
        'services': 'section_services',
        'prices':   'section_prices',
        'about':    'section_about',
        'stages':   'section_stages',
    };
    const seenSections = new Set();

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            if (seenSections.has(id)) return;
            seenSections.add(id);
            if (window.YandexMetrika && sectionGoals[id]) {
                window.YandexMetrika.reachGoal(sectionGoals[id], { section: id });
            }
        });
    }, { threshold: 0.3 });

    Object.keys(sectionGoals).forEach(id => {
        const el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
    });

    // ── Глубокий скролл 75% страницы ──
    let deepScrollFired = false;
    window.addEventListener('scroll', () => {
        if (deepScrollFired) return;
        const pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        if (pct >= 0.75) {
            deepScrollFired = true;
            if (window.YandexMetrika) {
                window.YandexMetrika.reachGoal('scroll_deep', { depth: '75%' });
            }
        }
    }, { passive: true });

    // ── FAQ аккордеон ──
    initializeFAQ();
});

function initializeFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Закрываем все остальные
            items.forEach(other => {
                other.classList.remove('open');
                const otherBtn = other.querySelector('.faq-question');
                if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            });

            // Переключаем текущий
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');

                // Цель метрики — какой вопрос открыли
                if (window.YandexMetrika) {
                    const question = btn.querySelector('[itemprop="name"]');
                    window.YandexMetrika.reachGoal('faq_open', {
                        question: question ? question.textContent.trim() : ''
                    });
                }
            }
        });
    });

    console.log('✅ FAQ initialized');
}

// Инициализация логотипа
function initializeLogo() {
    const logo = domCache.get('#mainLogo');
    if (!logo) return;

    const randomDelay = Math.random() * 1000;
    
    setTimeout(() => {
        logo.classList.replace('logo-loading', 'logo-loaded');
        startAdvancedGlitchEffects();
        addLogoInteractions();
    }, randomDelay);
}

function startAdvancedGlitchEffects() {
    const glitchTexts = domCache.getAll('.logo-text-glitch');
    const logo = domCache.get('#mainLogo');
    if (!logo) return;

    const glitchInterval = setInterval(() => {
        if (Math.random() > CONFIG.glitch.probability) {
            // Применяем глитч
            logo.style.transform = `translate(${Math.random() * 6 - 3}px, ${Math.random() * 4 - 2}px)`;
            
            glitchTexts.forEach(text => {
                text.style.color = Math.random() > 0.5 ? 'var(--neon-pink)' : 'var(--neon-cyan)';
            });
            
            // Возвращаем нормальное состояние
            setTimeout(() => {
                logo.style.transform = '';
                glitchTexts.forEach(text => {
                    text.style.color = '';
                });
            }, CONFIG.glitch.duration);
        }
    }, CONFIG.glitch.interval);

    // Очистка интервала при выгрузке страницы
    window.addEventListener('beforeunload', () => {
        clearInterval(glitchInterval);
    });
}

function addLogoInteractions() {
    const logo = domCache.get('#mainLogo');
    if (!logo) return;

    const interactions = {
        mouseenter: () => {
            logo.style.boxShadow = '0 0 30px var(--neon-pink), 0 0 60px var(--neon-cyan)';
            logo.style.transform = 'scale(1.05)';
        },
        mouseleave: () => {
            logo.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.1)';
            logo.style.transform = '';
        },
        click: () => {
            utils.animateElement(logo, 'glitch-overlay', 300);
            trackUserInteraction('logo_clicked');
        }
    };

    Object.entries(interactions).forEach(([event, handler]) => {
        logo.addEventListener(event, handler);
    });
}

// Инициализация навигации
function initializeNavigation() {
    const navLinks = domCache.getAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = domCache.get(targetId);
            
            if (targetSection) {
                utils.smoothScrollTo(targetSection);
                trackUserInteraction('navigation_click', { target: targetId });
            }
        });
    });
}

// Инициализация обратных вызовов
function initializeCallbacks() {
    // Клик по номеру телефона — главная цель
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.YandexMetrika) {
                window.YandexMetrika.reachGoal('phone_call', {
                    phone: link.href.replace('tel:', ''),
                    location: link.closest('header') ? 'header'
                            : link.closest('.contacts-section') ? 'contacts'
                            : link.closest('.contact-menu') ? 'floating'
                            : 'other'
                });
            }
        });
    });

    // Кнопка в шапке
    const callbackBtn = domCache.get('.callback-btn');
    if (callbackBtn) {
        callbackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMasterModal();
            trackUserInteraction('callback_button_clicked', { location: 'header' });
        });
    }
    
    // Новая кнопка в секции контактов
    const masterCallBtn = document.querySelector('.master-call-button');
    if (masterCallBtn) {
        masterCallBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMasterModal();
            trackUserInteraction('master_call_button_clicked', { location: 'contacts_section' });
        });
    }

    console.log('✅ Callbacks initialized');
}

// Оптимизация для мобильных устройств
function optimizeForMobile() {
    const isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    document.body.classList.toggle('mobile-view', isMobile);
    
    // Дополнительные мобильные оптимизации
    if (isMobile) {
        document.body.classList.add('touch-device');
    } else {
        document.body.classList.remove('touch-device');
    }
}

// Инициализация мобильного меню
function initializeMobileMenu() {
    const mobileMenuBtn = domCache.get('.mobile-menu-btn');
    const mobileMenu = domCache.get('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isActive = mobileMenu.classList.toggle('active');
            utils.toggleBodyScroll(!isActive);
            mobileMenuBtn.setAttribute('aria-expanded', isActive);
            
            trackUserInteraction('mobile_menu_toggled', { state: isActive ? 'opened' : 'closed' });
        });

        // Закрытие меню при клике на ссылку
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                utils.toggleBodyScroll(true);
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

// Инициализация цен
function initializePricing() {
    const tableRows = domCache.getAll('.table-row[data-service]');
    
    tableRows.forEach(row => {
        row.addEventListener('click', () => {
            const service = row.getAttribute('data-service');
            const targetSection = domCache.get('#services');
            
            utils.smoothScrollTo(targetSection);
            
            setTimeout(() => {
                highlightServiceCard(service);
            }, 500);
            
            trackUserInteraction('pricing_row_clicked', { service: service });
        });
        
        // Добавляем интерактивность
        row.style.cursor = 'pointer';
        row.classList.add('interactive-row');
    });
}

function highlightServiceCard(service) {
    const allCards = domCache.getAll('.service-card');
    const targetCard = domCache.get(`.service-card:nth-child(${getCardIndex(service)})`);
    
    // Снимаем подсветку
    allCards.forEach(card => {
        card.style.boxShadow = '';
    });
    
    // Подсвечиваем целевую карточку
    if (targetCard) {
        targetCard.style.boxShadow = '0 0 30px var(--neon-pink)';
        setTimeout(() => {
            targetCard.style.boxShadow = '';
        }, 2000);
    }
}

function getCardIndex(service) {
    const serviceMap = {
        'matrix': 1,
        'backlight': 2,
        'power': 3,
        'firmware': 4,
        'motherboard': 5,
        'buyout': 6
    };
    return serviceMap[service] || 1;
}

// Инициализация секции "Почему я"
function initializeWhyMe() {
    const advantageItems = domCache.getAll('.advantage-item');
    const menuOption = domCache.get('.menu-option');
    
    advantageItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            item.style.animation = 'item-pulse 0.5s ease-in-out';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.animation = '';
        });
        
        item.addEventListener('click', () => {
            trackUserInteraction('advantage_clicked', { index: index + 1 });
        });
    });
    
    if (menuOption) {
        menuOption.addEventListener('click', () => {
            const nextSection = domCache.get('#contacts');
            utils.smoothScrollTo(nextSection);
            trackUserInteraction('continue_menu_clicked');
        });
        
        menuOption.style.cursor = 'pointer';
        menuOption.classList.add('interactive-element');
    }
}

// Инициализация видео
function initializeMaskVideo() {
    const video = domCache.get('#masksVideo');
    const container = domCache.get('.mask-video-container');
    
    if (!video || !container) return;
    
    // Настройка видео
    Object.assign(video, {
        loop: true,
        muted: true,
        playsInline: true,
        preload: 'auto'
    });
    
    // Обработчики событий
    container.addEventListener('click', () => {
        video.currentTime = 0;
        video.play().catch(console.error);
        trackUserInteraction('video_restarted');
    });
    
    video.addEventListener('loadeddata', () => {
        video.play().catch(e => {
            console.log('Автовоспроизведение заблокировано, ждем взаимодействия пользователя');
        });
    });
    
    video.addEventListener('error', () => {
        console.error('Ошибка загрузки видео');
        video.style.display = 'none';
        trackUserInteraction('video_load_error');
    });
    
    // Отслеживание начала воспроизведения
    video.addEventListener('play', () => {
        trackUserInteraction('video_play_started');
    });
}

// Функция для плавающей кнопки связи
function initializeFloatingContact() {
    const floatingContact = domCache.get('#floatingContact');
    if (!floatingContact) return;

    const contactButton = floatingContact.querySelector('.contact-button-main');
    if (!contactButton) return;

    const toggleMenu = (e) => {
        e?.stopPropagation();
        const isActive = floatingContact.classList.toggle('active');
        trackUserInteraction('floating_contact_toggled', { state: isActive ? 'opened' : 'closed' });
    };

    const closeMenu = () => {
        floatingContact.classList.remove('active');
    };

    contactButton.addEventListener('click', toggleMenu);
    document.addEventListener('click', closeMenu);
    
    // Закрытие при клике на пункты меню
    const menuItems = floatingContact.querySelectorAll('.contact-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            closeMenu();
            trackUserInteraction('contact_menu_item_clicked', { 
                type: item.textContent.trim() 
            });
        });
    });
    
    // Закрытие при скролле с дебаунсом
    window.addEventListener('scroll', utils.debounce(closeMenu, 100));
}

// Инициализация этапов работ
function initializeWorkStages() {
    const stages       = domCache.getAll('.stage');
    const stagesTrack  = document.querySelector('.stages-track');
    const stageDesc    = document.getElementById('stageDescription');
    const noiseCanvas  = document.getElementById('stageNoise');
    const descIcon     = document.getElementById('descIcon');
    const descNum      = document.getElementById('descNum');
    const descTitle    = document.getElementById('descTitle');
    const descText     = document.getElementById('descText');

    if (!stages.length) return;

    const STAGE_DATA = {
        1: { icon:'📞', num:'01', title:'Оформление заявки',  text:'Удобным для Вас способом — звонок, мессенджер или заявка на сайте. Ежедневно с 10:00 до 21:00.' },
        2: { icon:'🚗', num:'02', title:'Выезд специалиста',  text:'Мастер приезжает в день обращения, обычно в течение 1–3 часов по всей Перми.' },
        3: { icon:'🔍', num:'03', title:'Диагностика',         text:'Выявляем неисправность и согласовываем стоимость. Диагностика бесплатна при ремонте.' },
        4: { icon:'🔧', num:'04', title:'Ремонт',              text:'Ремонт и проверка качества прямо у вас дома. Большинство неисправностей — 1–4 часа.' },
        5: { icon:'✅', num:'05', title:'Гарантия и сдача',    text:'Проверяем работу вместе с вами. Гарантия на все виды работ и замену деталей.' },
    };

    const GCHARS = 'TVFIX01NOONGLITCH#@!%&*><';
    let currentStage = 1, autoSwitchInterval, isAnimating = false;
    let noiseCtx = noiseCanvas ? noiseCanvas.getContext('2d') : null;

    // Горизонтальный сдвиг узлов
    function applyShifts(activeIdx) {
        stages.forEach((s, i) => {
            const d = i - activeIdx;
            const shift = d === 0 ? 0 : (d > 0 ? 1 : -1) * Math.min(Math.abs(d), 2) * 7;
            s.style.setProperty('--stage-shift', shift + 'px');
        });
    }



    // Статические помехи
    function playNoise(duration) {
        if (!noiseCtx || !stageDesc) return;
        noiseCanvas.width  = stageDesc.offsetWidth;
        noiseCanvas.height = stageDesc.offsetHeight;
        noiseCanvas.style.opacity = '1';
        let start = null;
        function frame(ts) {
            if (!start) start = ts;
            const p = (ts - start) / duration;
            const intensity = p < 0.3 ? (p/0.3)*0.15 : (1-p)*0.15;
            const id = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
            const d  = id.data;
            for (let i = 0; i < d.length; i += 4) {
                if (Math.random() < intensity) {
                    const cyan = Math.random() < 0.35, pink = Math.random() < 0.25;
                    d[i]   = pink ? 220 : cyan ? 0 : Math.random()*255;
                    d[i+1] = 0;
                    d[i+2] = (cyan||pink) ? 220 : Math.random()*255;
                    d[i+3] = Math.random() * 180;
                }
            }
            noiseCtx.putImageData(id, 0, 0);
            if (p < 1) requestAnimationFrame(frame);
            else { noiseCtx.clearRect(0,0,noiseCanvas.width,noiseCanvas.height); noiseCanvas.style.opacity='0'; }
        }
        requestAnimationFrame(frame);
    }

    // Глитч символов
    function glitchText(el, finalText, duration) {
        const steps = 7, iv = duration / steps;
        let step = 0;
        const t = setInterval(() => {
            if (step >= steps) {
                el.textContent = finalText;
                el.setAttribute('data-text', finalText);
                clearInterval(t);
                return;
            }
            const p = step / steps;
            el.textContent = [...finalText].map(ch =>
                ch === ' ' ? ' ' : Math.random() < p ? ch : GCHARS[Math.floor(Math.random()*GCHARS.length)]
            ).join('');
            step++;
        }, iv);
    }

    function switchStage(stageNumber, manual = false) {
        if (isAnimating) return;
        if (stageNumber < 1) stageNumber = 5;
        if (stageNumber > 5) stageNumber = 1;

        const prevN   = currentStage;
        const prevIdx = prevN - 1;
        const nextIdx = stageNumber - 1;
        currentStage  = stageNumber;
        isAnimating   = true;

        // Прогресс через CSS-переменную на .stages-track
        if (stagesTrack) {
            const pct = ((stageNumber-1)/4*100);
            // Ширина заполненной части = от левого края до центра активного узла
            // Вычисляем как процент от общей ширины дорожки
            const trackW = stagesTrack.offsetWidth;
            const leftOffset = parseFloat(getComputedStyle(stagesTrack, '::before').left) || (trackW * 0.1 + 6);
            const rightOffset = trackW * 0.1 + 6;
            const lineW = trackW - leftOffset - rightOffset;
            const fillPct = pct === 0 ? '0%' : (pct / 100 * lineW) + 'px';
            stagesTrack.style.setProperty('--progress-width', pct === 0 ? '0%' : pct + '%');
        }

        // Активный класс
        stages.forEach(s => s.classList.remove('active'));
        stages[nextIdx].classList.add('active');

        // Сдвиг узлов
        applyShifts(nextIdx);

        // Помехи + глитч
        const data = STAGE_DATA[stageNumber];
        playNoise(380);
        if (stageDesc) stageDesc.classList.add('glitching');
        if (descIcon) descIcon.textContent = data.icon;
        if (descNum)  descNum.textContent  = `Этап ${data.num} / 05`;
        if (descTitle) glitchText(descTitle, data.title, 320);
        if (descText) {
            setTimeout(() => {
                descText.style.opacity = '0';
                descText.textContent   = data.text;
                requestAnimationFrame(() => { descText.style.opacity = '1'; });
            }, 180);
        }

        setTimeout(() => {
            if (stageDesc) stageDesc.classList.remove('glitching');
            isAnimating = false;
        }, 400);

        trackUserInteraction('stage_changed', { stage: stageNumber });
        if (manual) { stopAutoSwitch(); startAutoSwitch(); }
    }

    function startAutoSwitch() {
        autoSwitchInterval = setInterval(() => {
            switchStage(currentStage === 5 ? 1 : currentStage + 1);
        }, CONFIG.stages.autoSwitchInterval);
    }

    function stopAutoSwitch() {
        if (autoSwitchInterval) clearInterval(autoSwitchInterval);
    }

    stages.forEach(stage => {
        stage.addEventListener('click', () => {
            const n = parseInt(stage.getAttribute('data-stage'));
            switchStage(n, true);
            trackUserInteraction('stage_manual_click', { stage: n });
        });
        stage.setAttribute('role', 'button');
        stage.setAttribute('tabindex', '0');
        stage.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stage.click(); }
        });
    });



    // Инициализация
    applyShifts(0);
    startAutoSwitch();
    window.addEventListener('beforeunload', stopAutoSwitch);
}

// Инициализация модального окна вызова мастера
function initializeMasterModal() {
    const modal = document.getElementById('masterModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    const form = document.getElementById('masterForm');
    const closeButton = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const agreementCheckbox = document.getElementById('userAgreement');
    const submitBtn = document.getElementById('submitBtn');

    if (!closeButton || !form || !overlay || !agreementCheckbox || !submitBtn) {
        console.error('Some modal elements not found');
        return;
    }

    // Устанавливаем город в форме
    const cityDisplay = document.getElementById('cityDisplay');
    if (cityDisplay) {
        cityDisplay.textContent = cityConfig.name;
    }

    // Обработчики закрытия
    closeButton.addEventListener('click', closeMasterModal);
    overlay.addEventListener('click', closeMasterModal);

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeMasterModal();
        }
    });

    // Валидация формы в реальном времени
    form.addEventListener('input', updateSubmitButton);
    agreementCheckbox.addEventListener('change', updateSubmitButton);

    // Маска и валидация для телефона
    const phoneInput = document.getElementById('userPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.startsWith('7') || value.startsWith('8')) {
                value = value.substring(1);
            }
            
            if (value.length > 0) {
                value = '+7 (' + value;
                
                if (value.length > 7) {
                    value = value.substring(0, 7) + ') ' + value.substring(7);
                }
                if (value.length > 12) {
                    value = value.substring(0, 12) + '-' + value.substring(12);
                }
                if (value.length > 15) {
                    value = value.substring(0, 15) + '-' + value.substring(15, 17);
                }
            }
            
            e.target.value = value;
            
            // Валидация номера в реальном времени
            validatePhoneNumber(value);
            updateSubmitButton();
        });
        
        // Добавляем проверку при потере фокуса
        phoneInput.addEventListener('blur', function() {
            validatePhoneNumber(this.value);
            updateSubmitButton();
        });
    }

    // Обработка отправки формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Проверяем валидность формы
        if (!isFormValid()) {
            // Анимация ошибки
            form.classList.add('form-error');
            setTimeout(() => form.classList.remove('form-error'), 1000);
            
            // Подсвечиваем проблемные поля
            const nameInput = document.getElementById('userName');
            const problemSelect = document.getElementById('userProblem');
            
            if (!nameInput.value.trim()) {
                nameInput.style.borderColor = '#ff4444';
                nameInput.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
            }
            
            if (!problemSelect.value) {
                problemSelect.style.borderColor = '#ff4444';
                problemSelect.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
            }
            
            return;
        }

        // Собираем данные формы
        const formData = {
            city: cityConfig,
            name: document.getElementById('userName').value,
            phone: document.getElementById('userPhone').value,
            problem: document.getElementById('userProblem').value,
            timestamp: new Date().toLocaleString('ru-RU')
        };

        console.log('📦 Данные заявки:', formData);
        
        // Отправляем в Telegram
        const success = await sendToTelegram(cityConfig.code, formData);
        
        if (success) {
            // Показываем успешную отправку
            showSuccessMessage();
            
            // Закрываем модалку через 2 секунды
            setTimeout(() => {
                closeMasterModal();
            }, 2000);
        } else {
            // Показываем ошибку
            alert('Ошибка отправки заявки. Пожалуйста, попробуйте позже.');
        }
    });

    // Функция успешной отправки
    function showSuccessMessage() {
        closeMasterModal();
        
        // Показываем окно благодарности через небольшую задержку
        setTimeout(() => {
            openSuccessModal();
        }, 500);
    }

    // Инициализация кнопки при загрузке
    updateSubmitButton();
    console.log('✅ Master modal initialized');
}

// Функция открытия окна благодарности
function openSuccessModal(estimate) {
    const successModal = document.getElementById('successModal');
    if (!successModal) return;

    const closeBtn = successModal.querySelector('.success-close-btn');
    const overlay  = successModal.querySelector('.modal-overlay');

    if (!closeBtn || !overlay) return;

    // Блок оценки — показываем только если передан estimate из сканера
    const estimateBlock   = document.getElementById('successEstimate');
    const estimateProblem = document.getElementById('successEstimateProblem');
    const estimatePrice   = document.getElementById('successEstimatePrice');

    if (estimateBlock) {
        if (estimate && estimate.label) {
            estimateProblem.textContent = estimate.label;
            estimatePrice.textContent   = estimate.price
                ? 'от ' + estimate.price.toLocaleString('ru-RU') + ' ₽'
                : 'уточняется после диагностики';
            estimateBlock.style.display = 'block';
        } else {
            // Вызов через кнопку мастера — оценку не показываем
            estimateBlock.style.display = 'none';
        }
    }

    // Сбрасываем и запускаем таймер
    startCountdown(15 * 60);

    // Показываем окно
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Обработчики закрытия
    closeBtn.addEventListener('click', closeSuccessModal);
    overlay.addEventListener('click', closeSuccessModal);

    // Закрытие по ESC
    document.addEventListener('keydown', handleSuccessEscape);
}

// Функция закрытия окна благодарности
function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (!successModal) return;
    
    successModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Останавливаем таймер
    stopCountdown();
    
    // Убираем обработчики
    document.removeEventListener('keydown', handleSuccessEscape);
}

// Обработчик ESC для окна благодарности
function handleSuccessEscape(e) {
    if (e.key === 'Escape') {
        closeSuccessModal();
    }
}

// Таймер обратного отсчета
let countdownInterval;

function startCountdown(totalSeconds) {
    const timerElement = document.getElementById('countdownTimer');
    if (!timerElement) return;
    
    let remainingSeconds = totalSeconds;
    
    // Обновляем таймер сразу
    updateTimerDisplay(timerElement, remainingSeconds);
    
    // Запускаем интервал
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            stopCountdown();
            timerElement.textContent = '00:00';
            timerElement.style.color = '#ff4444';
            return;
        }
        
        updateTimerDisplay(timerElement, remainingSeconds);
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function updateTimerDisplay(element, seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    element.textContent = 
        `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Очистка ресурсов при выгрузке страницы
window.addEventListener('beforeunload', () => {
    // Очищаем кэш
    domCache.clear();
    console.log('🧹 Ресурсы очищены');
});

// Делаем функции глобальными для прямого вызова из HTML
window.openMasterModal = openMasterModal;
window.closeMasterModal = closeMasterModal;
