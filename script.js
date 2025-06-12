document.addEventListener('DOMContentLoaded', () => {

    // --- Елементи DOM ---
    const temperatureEl = document.getElementById('temperature');
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');
    const weekdayEl = document.getElementById('weekday');
    const themeToggle = document.getElementById('theme-toggle');
    const weatherSoundToggle = document.getElementById('weather-sound-toggle');
    const alertSoundToggle = document.getElementById('alert-sound-toggle');
    const kyivStatusEl = document.getElementById('kyiv-status');
    // ОНОВЛЕНО: Тепер це контейнер для списку
    const otherAlertsContainer = document.getElementById('other-alerts-container'); 

    // --- Змінні стану ---
    let lastTemperature = null;
    let isKyivAlertActive = false;
    let weatherSoundEnabled = true;
    let alertSoundEnabled = true;

    // --- Об'єкти аудіо ---
    const sounds = {
        tempChange: new Audio('sounds/temp_change.mp3'),
        alertStart: new Audio('sounds/alert_start.mp3'),
        alertEnd: new Audio('sounds/alert_end.mp3')
    };

    // --- API Конфігурація ---
    const weatherApiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=50.462722&longitude=30.491602&current_weather=true';
    const alertsApiUrl = '/api/alerts';

    //============================================
    // БЛОК 1: ПОГОДА
    //============================================
    async function fetchWeather() {
        try {
            const response = await fetch(weatherApiUrl);
            if (!response.ok) throw new Error(`Помилка HTTP з погодою! Статус: ${response.status}`);
            const data = await response.json();
            const currentTemp = Math.round(data.current_weather.temperature);
            temperatureEl.textContent = currentTemp;
            if (lastTemperature !== null && lastTemperature !== currentTemp && weatherSoundEnabled) {
                sounds.tempChange.play();
            }
            lastTemperature = currentTemp;
        } catch (error) {
            console.error("Помилка при отриманні погоди:", error);
            temperatureEl.textContent = 'XX';
        }
    }

    //============================================
    // БЛОК 2: ЧАС, ДАТА, ДЕНЬ ТИЖНЯ
    //============================================
    function updateTime() {
        const now = new Date();
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
        const optionsWeekday = { weekday: 'long' };
        timeEl.textContent = now.toLocaleTimeString('uk-UA');
        dateEl.textContent = now.toLocaleDateString('uk-UA', optionsDate);
        let weekday = now.toLocaleDateString('uk-UA', optionsWeekday);
        weekdayEl.textContent = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    }

    //============================================
    // БЛОК 3: ПОВІТРЯНІ ТРИВОГИ (ВИПРАВЛЕНО)
    //============================================
    async function fetchAlerts() {
        try {
            const response = await fetch(alertsApiUrl);
            if (!response.ok) throw new Error('Помилка відповіді від проксі-сервера');
            
            const data = await response.json();
            const allAlerts = data.alerts;
            const kyivAlertNow = allAlerts.some(alert => alert.location_title === 'м. Київ');

            if (kyivAlertNow) {
                kyivStatusEl.textContent = 'м. Київ: ПОВІТРЯНА ТРИВОГА';
                kyivStatusEl.className = 'alert-status status-active';
            } else {
                kyivStatusEl.textContent = 'м. Київ: Немає тривоги';
                kyivStatusEl.className = 'alert-status status-inactive';
            }

            otherAlertsContainer.innerHTML = ''; // Очищуємо контейнер
            const otherRegions = allAlerts.filter(alert => alert.location_title !== 'м. Київ' && alert.alert_type === 'air_raid');
            
            if (otherRegions.length > 0) {
                const title = document.createElement('h4');
                title.textContent = 'Тривога в інших областях:';
                otherAlertsContainer.appendChild(title);
                otherRegions.forEach(alert => {
                    const regionSpan = document.createElement('span');
                    regionSpan.className = 'region';
                    regionSpan.textContent = alert.location_title.replace(" область", "").replace(" Автономна Республіка", "АР");
                    otherAlertsContainer.appendChild(regionSpan);
                });
            } else {
                const noAlertsSpan = document.createElement('span');
                noAlertsSpan.className = 'no-alerts-msg';
                noAlertsSpan.textContent = 'Наразі повітряних тривог в інших областях немає.';
                otherAlertsContainer.appendChild(noAlertsSpan);
            }

            if (kyivAlertNow && !isKyivAlertActive) {
                isKyivAlertActive = true;
                if (alertSoundEnabled) sounds.alertStart.play();
            } else if (!kyivAlertNow && isKyivAlertActive) {
                isKyivAlertActive = false;
                if (alertSoundEnabled) sounds.alertEnd.play();
            }
        } catch (error) {
            console.error("Не вдалося завантажити статус тривог:", error);
            kyivStatusEl.textContent = 'Помилка завантаження';
            kyivStatusEl.className = 'alert-status';
            // ВИПРАВЛЕНО: Прибираємо звернення до неіснуючого елемента
            if(otherAlertsContainer) {
                otherAlertsContainer.innerHTML = '<p>Помилка. Перевірте, чи запущений проксі-сервер.</p>';
            }
        }
    }
    
    //============================================
    // КЕРУВАННЯ ІНТЕРФЕЙСОМ ТА ЗАПУСК
    //============================================
    weatherSoundToggle.addEventListener('click', () => {
        weatherSoundEnabled = !weatherSoundEnabled;
        weatherSoundToggle.textContent = weatherSoundEnabled ? '🔔 Звук: Увімкнено' : '🔕 Звук: Вимкнено';
    });
    alertSoundToggle.addEventListener('click', () => {
        alertSoundEnabled = !alertSoundEnabled;
        alertSoundToggle.textContent = alertSoundEnabled ? '🔔 Тривога: Увімкнено' : '🔕 Тривога: Вимкнено';
    });
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme', themeToggle.checked);
    });

    // --- Перший запуск та інтервали ---
    fetchWeather();
    updateTime();
    fetchAlerts();
    setInterval(fetchWeather, 60 * 1000);
    setInterval(updateTime, 1000);
    setInterval(fetchAlerts, 10 * 1000);
});