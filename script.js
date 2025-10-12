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
    optimizeForMobile();
});

// Инициализация логотипа
function initializeLogo() {
    const logo = document.getElementById('mainLogo');
    
    // Случайная задержка для более естественного эффекта
    const randomDelay = Math.random() * 1000;
    
    setTimeout(() => {
        logo.classList.remove('logo-loading');
        logo.classList.add('logo-loaded');
        startAdvancedGlitchEffects();
        addLogoInteractions();
    }, randomDelay);
}

function startAdvancedGlitchEffects() {
    const glitchTexts = document.querySelectorAll('.logo-text-glitch');
    const logo = document.getElementById('mainLogo');
    
    // Случайные интенсивные глитчи
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance for major glitch
            logo.style.transform = `translate(${Math.random() * 6 - 3}px, ${Math.random() * 4 - 2}px)`;
            
            glitchTexts.forEach(text => {
                text.style.color = Math.random() > 0.5 ? 'var(--neon-pink)' : 'var(--neon-cyan)';
            });
            
            // Быстрое возвращение к нормальному состоянию
            setTimeout(() => {
                logo.style.transform = 'translate(0, 0)';
                glitchTexts.forEach(text => {
                    text.style.color = 'var(--text-white)';
                });
            }, 100);
        }
    }, 3000);
}

function addLogoInteractions() {
    const logo = document.getElementById('mainLogo');
    
    // Эффект при наведении
    logo.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 0 30px var(--neon-pink), 0 0 60px var(--neon-cyan)';
        this.style.transform = 'scale(1.05)';
    });
    
    logo.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.1)';
        this.style.transform = 'scale(1)';
    });
    
    // Эффект при клике
    logo.addEventListener('click', function() {
        // Интенсивный глитч при клике
        this.style.animation = 'none';
        void this.offsetWidth; // Trigger reflow
        this.style.animation = 'glitch-overlay 0.3s linear';
        
        // Сброс анимации
        setTimeout(() => {
            this.style.animation = '';
        }, 300);
    });
}

// Инициализация навигации
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Инициализация обратных вызовов
function initializeCallbacks() {
    const callbackBtn = document.querySelector('.callback-btn');
    
    if (callbackBtn) {
        callbackBtn.addEventListener('click', function() {
            showCallbackModal();
        });
    }
}

// Показать модальное окно обратного звонка
function showCallbackModal() {
    // Заглушка для модального окна
    alert('Форма обратного звонка будет здесь!\nМы перезвоним вам в течение 5 минут.');
}

// Отслеживание взаимодействий для аналитики
function trackUserInteraction(action) {
    console.log('User action:', action);
    // Здесь можно добавить Google Analytics или другую аналитику
}

// Оптимизация для мобильных устройств
function optimizeForMobile() {
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// Обработчик изменения размера окна
window.addEventListener('resize', optimizeForMobile);

// Инициализация мобильного меню
function initializeMobileMenu() {
    // Заглушка для мобильного меню - можно добавить функционал позже
    console.log('Mobile menu initialized');
}

function initializePricing() {
    const tableRows = document.querySelectorAll('.table-row[data-service]');
    
    tableRows.forEach(row => {
        row.addEventListener('click', function() {
            const service = this.getAttribute('data-service');
            
            // Плавный скролл к соответствующей услуге
            const targetSection = document.getElementById('services');
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Можно добавить подсветку соответствующей карточки
                setTimeout(() => {
                    highlightServiceCard(service);
                }, 500);
            }
        });
    });
}

function highlightServiceCard(service) {
    // Снимаем подсветку со всех карточек
    const allCards = document.querySelectorAll('.service-card');
    allCards.forEach(card => {
        card.style.boxShadow = 'none';
    });
    
    // Подсвечиваем нужную карточку
    const targetCard = document.querySelector(`.service-card:nth-child(${getCardIndex(service)})`);
    if (targetCard) {
        targetCard.style.boxShadow = '0 0 30px var(--neon-pink)';
        setTimeout(() => {
            targetCard.style.boxShadow = 'none';
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

function initializeWhyMe() {
    const advantageItems = document.querySelectorAll('.advantage-item');
    const menuOption = document.querySelector('.menu-option');
    
    // Анимация при наведении на пункты
    advantageItems.forEach((item, index) => {
        item.addEventListener('mouseenter', function() {
            this.style.animation = 'item-pulse 0.5s ease-in-out';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.animation = 'none';
        });
        
        // Клик по пункту - можно добавить функционал
        item.addEventListener('click', function() {
            console.log('Clicked advantage:', index + 1);
        });
    });
    
    // Интерактивность для меню "ПРОДОЛЖИТЬ"
    if (menuOption) {
        menuOption.addEventListener('click', function() {
            const nextSection = document.getElementById('contacts');
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        menuOption.style.cursor = 'pointer';
    }
}

function initializeMaskVideo() {
    const video = document.getElementById('masksVideo');
    const container = document.querySelector('.mask-video-container');
    
    if (!video || !container) return;
    
    // Настройка видео
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    // Обработчик клика - перезапуск
    container.addEventListener('click', function() {
        video.currentTime = 0;
        video.play();
    });
    
    // Автозапуск при загрузке
    video.addEventListener('loadeddata', function() {
        this.play().catch(e => {
            console.log('Autoplay blocked:', e);
        });
    });
    
    // Обработка ошибок
    video.addEventListener('error', function() {
        console.log('Video loading error');
        this.style.display = 'none';
    });
}

// Функция для плавающей кнопки связи
function initializeFloatingContact() {
    const floatingContact = document.getElementById('floatingContact');
    
    if (!floatingContact) {
        console.log('Floating contact element not found');
        return;
    }
    
    const contactButton = floatingContact.querySelector('.contact-button-main');
    
    if (!contactButton) {
        console.log('Contact button not found');
        return;
    }
    
    console.log('Floating contact initialized'); // Для отладки
    
    // Переключение меню
    contactButton.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Contact button clicked'); // Для отладки
        floatingContact.classList.toggle('active');
    });
    
    // Закрытие меню при клике вне
    document.addEventListener('click', function(e) {
        if (!floatingContact.contains(e.target)) {
            floatingContact.classList.remove('active');
        }
    });
    
    // Закрытие меню при клике на пункт меню
    const menuItems = floatingContact.querySelectorAll('.contact-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            floatingContact.classList.remove('active');
        });
    });
    
    // Закрытие меню при скролле
    window.addEventListener('scroll', function() {
        floatingContact.classList.remove('active');
    });
}

