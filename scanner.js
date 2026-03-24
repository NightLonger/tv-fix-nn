(function () {
    'use strict';

    /* ═══════════════════════════════════════════════
       БАЗА БРЕНДОВ (автодополнение)
    ═══════════════════════════════════════════════ */
    var BRANDS = [
        'BBK', 'BQ', 'Beko', 'Daewoo', 'DNS', 'Doffler',
        'Erisson', 'Fusion', 'Grundig', 'Haier', 'Hisense',
        'Horizont', 'Hyundai', 'Irbis', 'JVC', 'Kraft',
        'LG', 'Leff', 'Leran', 'Loewe', 'Loona',
        'Manya', 'Marantz', 'Mitsubishi', 'Mystery',
        'NEC', 'Onkyo', 'Orion', 'Panasonic', 'Philips',
        'Pioneer', 'Polarline', 'Prestigio', 'Rolsen',
        'Samsung', 'Sharp', 'Skyworth', 'Sony', 'Starwind',
        'TCL', 'Thomson', 'Toshiba', 'Telefunken',
        'Topdevice', 'Vekta', 'Vestel', 'Xiaomi', 'Yuno'
    ];

    /* ═══════════════════════════════════════════════
       ТАБЛИЦА ЦЕН: symptomKey → { sizeKey → price }

       sizeKey:  's' = до 32"
                 'm' = 32–43"
                 'l' = 43–55"
                 'xl'= 55–65"
                 'xxl'= 65"+
    ═══════════════════════════════════════════════ */
    var PRICE_TABLE = {
        backlight: {            // подсветка
            label: 'Ремонт подсветки',
            prices: { s: 1500, m: 2000, l: 3500, xl: 5000, xxl: 7000 }
        },
        power: {                // блок питания
            label: 'Ремонт блока питания',
            prices: { s: 1500, m: 2000, l: 2500, xl: 3000, xxl: 3500 }
        },
        firmware: {             // прошивка / зависание
            label: 'Прошивка / восстановление ПО',
            prices: { s: 1000, m: 1000, l: 1000, xl: 1000, xxl: 1500 }
        },
        sound: {                // звук
            label: 'Ремонт усилителя звука',
            prices: { s: 1500, m: 1800, l: 2000, xl: 2500, xxl: 3000 }
        },
        tcon: {                 // полосы / матрица
            label: 'Ремонт T-CON / шлейфа матрицы',
            prices: { s: 2000, m: 2500, l: 3000, xl: 4000, xxl: 5000 }
        },
        tuner: {                // нет сигнала
            label: 'Ремонт тюнера / антенного входа',
            prices: { s: 1500, m: 2000, l: 2500, xl: 3000, xxl: 3500 }
        },
        diagnostic: {           // неизвестно
            label: 'Требуется диагностика',
            prices: null
        }
    };

    /* Симптом → ключ ремонта */
    var SYMPTOM_MAP = [
        { symptoms: ['Нет изображения, звук есть', 'Тёмный экран при запуске', 'Мерцание экрана'], key: 'backlight' },
        { symptoms: ['Не включается', 'Мигает индикатор', 'Сам выключается'],                      key: 'power' },
        { symptoms: ['Зависает / тормозит'],                                                         key: 'firmware' },
        { symptoms: ['Нет звука'],                                                                   key: 'sound' },
        { symptoms: ['Полосы на экране'],                                                            key: 'tcon' },
        { symptoms: ['Нет сигнала / каналов'],                                                      key: 'tuner' }
    ];

    /* Диагональ → ключ размера */
    var SIZE_MAP = {
        'до 32"':    's',
        '32–43"':    'm',
        '43–55"':    'l',
        '55–65"':    'xl',
        '65"+':      'xxl'
    };

    /* ═══════════════════════════════════════════════
       СОСТОЯНИЕ
    ═══════════════════════════════════════════════ */
    var state = {
        brand:    '',
        size:     null,
        age:      null,
        symptoms: [],
        name:     '',
        phone:    ''
    };

    /* ═══════════════════════════════════════════════
       ВЫЧИСЛЕНИЕ ЦЕНЫ
    ═══════════════════════════════════════════════ */
    function getRepairKey(symptoms) {
        for (var i = 0; i < SYMPTOM_MAP.length; i++) {
            var entry = SYMPTOM_MAP[i];
            for (var j = 0; j < entry.symptoms.length; j++) {
                if (symptoms.indexOf(entry.symptoms[j]) !== -1) {
                    return entry.key;
                }
            }
        }
        return 'diagnostic';
    }

    function getEstimate(symptoms, sizeValue) {
        var key     = getRepairKey(symptoms);
        var repair  = PRICE_TABLE[key];
        var sizeKey = SIZE_MAP[sizeValue] || null;

        if (repair.prices === null || !sizeKey) {
            return { label: repair.label, price: null };
        }

        var price = repair.prices[sizeKey];
        return { label: repair.label, price: price };
    }

    /* ═══════════════════════════════════════════════
       БЛОК ОЦЕНКИ
    ═══════════════════════════════════════════════ */
    function updateEstimate() {
        // Оценка не показывается на странице до отправки —
        // она появится в successModal после нажатия кнопки.
        // Функция оставлена для совместимости (вызывается при выборе симптомов).
    }

    /* ═══════════════════════════════════════════════
       АВТОДОПОЛНЕНИЕ
    ═══════════════════════════════════════════════ */
    function highlight(text, query) {
        if (!query) return text;
        var re  = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return text.replace(re, '<mark>$1</mark>');
    }

    function initAutocomplete() {
        var input    = document.getElementById('brandInput');
        var dropdown = document.getElementById('brandDropdown');
        if (!input || !dropdown) return;

        var highlightedIndex = -1;
        var filtered = [];

        function showDropdown(query) {
            query    = query.trim();
            filtered = query.length
                ? BRANDS.filter(function (b) {
                    return b.toLowerCase().indexOf(query.toLowerCase()) !== -1;
                  })
                : [];

            if (!filtered.length) {
                dropdown.classList.remove('open');
                return;
            }

            dropdown.innerHTML = filtered.map(function (b, i) {
                return '<div class="sc-dropdown-item" data-index="' + i + '">'
                    + highlight(b, query)
                    + '</div>';
            }).join('');

            highlightedIndex = -1;
            dropdown.classList.add('open');
        }

        function selectBrand(brand) {
            input.value = brand;
            input.classList.add('has-value');
            state.brand = brand;
            dropdown.classList.remove('open');
            // Снимаем активность с быстрых кнопок и ставим нужную
            document.querySelectorAll('.sc-quick-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.brand === brand);
            });
        }

        input.addEventListener('input', function () {
            state.brand = this.value;
            this.classList.toggle('has-value', this.value.length > 0);
            showDropdown(this.value);
            // Снять активность с быстрых кнопок при ручном вводе
            document.querySelectorAll('.sc-quick-btn').forEach(function (b) {
                b.classList.remove('active');
            });
        });

        input.addEventListener('keydown', function (e) {
            var items = dropdown.querySelectorAll('.sc-dropdown-item');
            if (!dropdown.classList.contains('open') || !items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
                    selectBrand(filtered[highlightedIndex]);
                }
                return;
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('open');
                return;
            }

            items.forEach(function (item, i) {
                item.classList.toggle('highlighted', i === highlightedIndex);
            });
        });

        dropdown.addEventListener('mousedown', function (e) {
            var item = e.target.closest('.sc-dropdown-item');
            if (!item) return;
            var idx = parseInt(item.dataset.index, 10);
            if (filtered[idx]) selectBrand(filtered[idx]);
        });

        // Закрыть при клике вне
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    /* ═══════════════════════════════════════════════
       БЫСТРЫЕ БРЕНДЫ
    ═══════════════════════════════════════════════ */
    function initQuickBrands() {
        document.querySelectorAll('.sc-quick-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var brand = this.dataset.brand;
                state.brand = brand;

                var input = document.getElementById('brandInput');
                if (input) {
                    input.value = brand;
                    input.classList.add('has-value');
                }

                document.querySelectorAll('.sc-quick-btn').forEach(function (b) {
                    b.classList.remove('active');
                });
                this.classList.add('active');

                var dropdown = document.getElementById('brandDropdown');
                if (dropdown) dropdown.classList.remove('open');
            });
        });
    }

    /* ═══════════════════════════════════════════════
       КНОПКИ ВЫБОРА (диагональ / возраст)
    ═══════════════════════════════════════════════ */
    function initOptButtons() {
        document.querySelectorAll('.sc-opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var group = this.dataset.group;
                document.querySelectorAll('.sc-opt[data-group="' + group + '"]')
                    .forEach(function (b) { b.classList.remove('selected'); });
                this.classList.add('selected');
                state[group] = this.dataset.value;
                updateEstimate(); // цена меняется при смене диагонали
            });
        });
    }

    /* ═══════════════════════════════════════════════
       СИМПТОМЫ
    ═══════════════════════════════════════════════ */
    function initSymptoms() {
        document.querySelectorAll('.sc-chip input[type="checkbox"]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                if (this.checked) {
                    if (state.symptoms.indexOf(this.value) === -1) {
                        state.symptoms.push(this.value);
                    }
                } else {
                    state.symptoms = state.symptoms.filter(function (s) {
                        return s !== cb.value;
                    });
                }
                updateEstimate();
            });
        });
    }

    /* ═══════════════════════════════════════════════
       ПОЛЯ КОНТАКТА
    ═══════════════════════════════════════════════ */
    function isPhoneValid(phone) {
        return phone.replace(/\D/g, '').length === 11
            && phone.replace(/\D/g, '').charAt(0) === '7';
    }

    function formatPhone(raw) {
        var d = raw.replace(/\D/g, '');
        if (d.charAt(0) === '7' || d.charAt(0) === '8') d = d.substring(1);
        if (!d.length) return '';
        var out = '+7 (';
        out += d.substring(0, 3);
        if (d.length > 3) out += ') ' + d.substring(3, 6);
        if (d.length > 6) out += '-' + d.substring(6, 8);
        if (d.length > 8) out += '-' + d.substring(8, 10);
        return out;
    }

    function isReady() {
        var agree = document.getElementById('scannerAgreement');
        return state.name.trim().length > 0
            && isPhoneValid(state.phone)
            && agree && agree.checked;
    }

    function updateSubmit() {
        var btn = document.getElementById('scannerSubmitBtn');
        if (btn) btn.disabled = !isReady();
    }

    function initContactFields() {
        var nameEl  = document.getElementById('scannerName');
        var phoneEl = document.getElementById('scannerPhone');
        var agreeEl = document.getElementById('scannerAgreement');

        if (nameEl) {
            nameEl.addEventListener('input', function () {
                state.name = this.value;
                updateSubmit();
            });
        }

        if (phoneEl) {
            phoneEl.addEventListener('input', function () {
                var fmt = formatPhone(this.value);
                this.value = fmt;
                state.phone = fmt;
                if (fmt.length > 4) {
                    this.classList.toggle('valid',   isPhoneValid(fmt));
                    this.classList.toggle('invalid', !isPhoneValid(fmt));
                } else {
                    this.classList.remove('valid', 'invalid');
                }
                updateSubmit();
            });
            phoneEl.addEventListener('blur', function () {
                if (this.value && !isPhoneValid(this.value)) {
                    this.classList.add('invalid');
                    this.classList.remove('valid');
                }
            });
        }

        if (agreeEl) {
            agreeEl.addEventListener('change', updateSubmit);
        }
    }

    /* ═══════════════════════════════════════════════
       TELEGRAM
    ═══════════════════════════════════════════════ */
    function buildMessage() {
        var symptoms = state.symptoms.length ? state.symptoms.join(', ') : 'не указаны';
        var estimate = getEstimate(state.symptoms, state.size);
        var priceStr = estimate.price
            ? 'от ' + estimate.price.toLocaleString('ru-RU') + ' ₽'
            : 'уточняется после диагностики';
        var ts = new Date().toLocaleString('ru-RU');

        return '📋 ЗАЯВКА НА ОЦЕНКУ СТОИМОСТИ\n'
            + '──────────────────────────\n'
            + '📺 Марка: '     + (state.brand || '—')   + '\n'
            + '📐 Диагональ: ' + (state.size  || '—')   + '\n'
            + '📅 Возраст: '   + (state.age   || '—')   + '\n'
            + '⚠️ Симптомы: '  + symptoms               + '\n'
            + '🔍 Причина: '   + estimate.label          + '\n'
            + '💰 Оценка: '    + priceStr                + '\n'
            + '──────────────────────────\n'
            + '👤 Имя: '       + state.name              + '\n'
            + '📞 Телефон: '   + state.phone             + '\n'
            + '🕐 Время: '     + ts                      + '\n'
            + '🌐 Сайт: '      + window.location.hostname;
    }

    async function sendToBot() {
        if (typeof TELEGRAM_CONFIG === 'undefined') {
            console.error('TELEGRAM_CONFIG не найден — убедитесь что script.js подключён раньше scanner.js');
            return false;
        }

        var text    = buildMessage();
        var baseUrl = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.botToken + '/sendMessage';
        var city    = (typeof cityConfig !== 'undefined') ? cityConfig.code : 'perm';

        try {
            // Администратору
            await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CONFIG.adminChatId, text: '📊 ' + text })
            });

            // Мастеру города
            if (TELEGRAM_CONFIG.masters[city]) {
                await fetch(baseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: TELEGRAM_CONFIG.masters[city], text: text })
                });
            }

            // Яндекс.Метрика
            if (window.YandexMetrika) {
                window.YandexMetrika.reachGoal('scanner_lead', {
                    brand:    state.brand,
                    size:     state.size,
                    symptoms: state.symptoms.join(', ')
                });
            }

            return true;
        } catch (err) {
            console.error('Ошибка отправки сканера:', err);
            return false;
        }
    }

    /* ═══════════════════════════════════════════════
       КНОПКА ОТПРАВКИ
    ═══════════════════════════════════════════════ */
    function resetForm() {
        state.brand = ''; state.size = null; state.age = null;
        state.symptoms = []; state.name = ''; state.phone = '';

        document.querySelectorAll('.sc-opt').forEach(function (b) { b.classList.remove('selected'); });
        document.querySelectorAll('.sc-chip input').forEach(function (c) { c.checked = false; });
        document.querySelectorAll('.sc-quick-btn').forEach(function (b) { b.classList.remove('active'); });

        var brandInput = document.getElementById('brandInput');
        if (brandInput) { brandInput.value = ''; brandInput.classList.remove('has-value'); }

        var nameEl = document.getElementById('scannerName');
        var phoneEl = document.getElementById('scannerPhone');
        var agreeEl = document.getElementById('scannerAgreement');
        if (nameEl)  { nameEl.value  = ''; nameEl.classList.remove('valid','invalid'); }
        if (phoneEl) { phoneEl.value = ''; phoneEl.classList.remove('valid','invalid'); }
        if (agreeEl) agreeEl.checked = false;

        // scEstimate скрыт постоянно — оценка показывается в successModal

        updateSubmit();
    }

    function initSubmit() {
        var btn = document.getElementById('scannerSubmitBtn');
        if (!btn) return;

        btn.addEventListener('click', async function () {
            if (!isReady()) return;

            var textEl = btn.querySelector('.sc-submit-text');
            var orig   = textEl ? textEl.textContent : '';

            btn.classList.add('loading');
            btn.disabled = true;
            if (textEl) textEl.textContent = 'ОТПРАВЛЯЕМ';

            // Сохраняем оценку ДО resetForm (он сбросит state)
            var currentEstimate = getEstimate(state.symptoms, state.size);

            var ok = await sendToBot();

            btn.classList.remove('loading');

            if (ok) {
                resetForm();
                // Передаём оценку в модалку — она покажет её внутри
                if (typeof openSuccessModal === 'function') {
                    openSuccessModal(currentEstimate);
                } else {
                    alert('✅ Заявка отправлена! Мастер перезвонит в течение 15 минут.');
                }
            } else {
                btn.disabled = false;
                if (textEl) textEl.textContent = orig;
                alert('Ошибка отправки. Пожалуйста, позвоните нам напрямую: +7 (919) 473-20-90');
            }
        });
    }

    /* ═══════════════════════════════════════════════
       ЗАПУСК
    ═══════════════════════════════════════════════ */
    function init() {
        if (!document.getElementById('scannerCard')) return;

        initAutocomplete();
        initQuickBrands();
        initOptButtons();
        initSymptoms();
        initContactFields();
        initSubmit();
        updateSubmit();

        console.log('✅ Scanner v2 ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
