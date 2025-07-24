class WeatherApp {
    constructor() {
        // Replace with your OpenWeatherMap API key
        this.apiKey = '7e33ee3e32d6f9b1698815d16f4aa2f6';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        
        this.initializeElements();
        this.bindEvents();
        this.loadDefaultCity();
    }
    
    
    initializeElements() {
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.weatherContainer = document.getElementById('weatherContainer');
        this.currentWeather = document.getElementById('currentWeather');
        this.weatherDetails = document.getElementById('weatherDetails');
        this.forecastContainer = document.getElementById('forecastContainer');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.suggestions = document.getElementById('suggestions');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        this.cityInput.addEventListener('input', (e) => {
            this.handleSuggestions(e.target.value);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) return;

        await this.getWeatherData(city);
        this.hideSuggestions();
    }

    async handleSuggestions(query) {
        if (query.length < 3) {
            this.hideSuggestions();
            return;
        }

        // Simple suggestion logic - in a real app, you'd use a geocoding API
        const commonCities = [
            'New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Los Angeles',
            'Chicago', 'Toronto', 'Berlin', 'Madrid', 'Rome', 'Amsterdam',
            'Moscow', 'Dubai', 'Singapore', 'Hong Kong', 'Mumbai', 'Delhi',
            'Bangkok', 'Seoul', 'Cairo', 'Istanbul', 'Mexico City', 'São Paulo'
        ];

        const matches = commonCities.filter(city => 
            city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        this.showSuggestions(matches);
    }

    showSuggestions(cities) {
        if (cities.length === 0) {
            this.hideSuggestions();
            return;
        }

        const suggestionsHtml = cities.map(city => 
            `<div class="suggestion-item" onclick="weatherApp.selectSuggestion('${city}')">${city}</div>`
        ).join('');

        this.suggestions.innerHTML = suggestionsHtml;
        this.suggestions.style.display = 'block';
    }

    hideSuggestions() {
        this.suggestions.style.display = 'none';
    }

    selectSuggestion(city) {
        this.cityInput.value = city;
        this.hideSuggestions();
        this.getWeatherData(city);
    }

    async getWeatherData(city) {
        try {
            this.showLoading();
            this.hideError();
            this.hideWeather();

            // Get current weather
            const currentResponse = await fetch(
                `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`
            );

            if (!currentResponse.ok) {
                throw new Error(currentResponse.status === 404 ? 'City not found' : 'Failed to fetch weather data');
            }

            const currentData = await currentResponse.json();

            // Get 5-day forecast
            const forecastResponse = await fetch(
                `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`
            );

            const forecastData = await forecastResponse.json();

            this.displayWeatherData(currentData, forecastData);
            this.hideLoading();
            this.showWeather();

        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    displayWeatherData(current, forecast) {
        this.displayCurrentWeather(current);
        this.displayWeatherDetails(current);
        this.displayForecast(forecast);
    }

    displayCurrentWeather(data) {
        const iconClass = this.getWeatherIcon(data.weather[0].main);
        const temperature = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const cityName = `${data.name}, ${data.sys.country}`;
        const dateTime = new Date().toLocaleString();

        this.currentWeather.innerHTML = `
            <div class="weather-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="temperature">${temperature}°C</div>
            <div class="city-name">${cityName}</div>
            <div class="weather-description">${description}</div>
            <div class="date-time">${dateTime}</div>
        `;
    }

    displayWeatherDetails(data) {
        const feelsLike = Math.round(data.main.feels_like);
        const humidity = data.main.humidity;
        const pressure = data.main.pressure;
        const windSpeed = data.wind.speed;
        const visibility = data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A';
        const uvIndex = 'N/A'; // UV index not available in basic API

        this.weatherDetails.innerHTML = `
            <div class="detail-card">
                <i class="fas fa-thermometer-half"></i>
                <div class="detail-value">${feelsLike}°C</div>
                <div class="detail-label">Feels Like</div>
            </div>
            <div class="detail-card">
                <i class="fas fa-tint"></i>
                <div class="detail-value">${humidity}%</div>
                <div class="detail-label">Humidity</div>
            </div>
            <div class="detail-card">
                <i class="fas fa-compress-arrows-alt"></i>
                <div class="detail-value">${pressure} hPa</div>
                <div class="detail-label">Pressure</div>
            </div>
            <div class="detail-card">
                <i class="fas fa-wind"></i>
                <div class="detail-value">${windSpeed} m/s</div>
                <div class="detail-label">Wind Speed</div>
            </div>
            <div class="detail-card">
                <i class="fas fa-eye"></i>
                <div class="detail-value">${visibility} km</div>
                <div class="detail-label">Visibility</div>
            </div>
            <div class="detail-card">
                <i class="fas fa-sun"></i>
                <div class="detail-value">${uvIndex}</div>
                <div class="detail-label">UV Index</div>
            </div>
        `;
    }

    displayForecast(data) {
        // Get one forecast per day (every 8th item, as data is every 3 hours)
        const dailyForecasts = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);

        const forecastHtml = dailyForecasts.map(item => {
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const iconClass = this.getWeatherIcon(item.weather[0].main);
            const temp = Math.round(item.main.temp);
            const description = item.weather[0].description;

            return `
                <div class="forecast-item">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="forecast-temp">${temp}°C</div>
                    <div class="forecast-desc">${description}</div>
                </div>
            `;
        }).join('');

        this.forecastContainer.innerHTML = `
            <div class="forecast-title">5-Day Forecast</div>
            <div class="forecast-grid">
                ${forecastHtml}
            </div>
        `;
    }

    getWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-drizzle',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-tornado'
        };

        return iconMap[weatherMain] || 'fas fa-question';
    }

    showLoading() {
        this.loading.style.display = 'block';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showWeather() {
        this.weatherContainer.style.display = 'block';
    }

    hideWeather() {
        this.weatherContainer.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.error.style.display = 'block';
    }

    hideError() {
        this.error.style.display = 'none';
    }

    loadDefaultCity() {
        // Load weather for a default city on page load
        this.getWeatherData('London');
    }
}

// Initialize the weather app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});

// Demo mode - use sample data if no API key is provided
if (!window.weatherApp || window.weatherApp.apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('API key not configured. Running in demo mode with sample data.');
    
    // Override the getWeatherData method for demo purposes
    setTimeout(() => {
        if (window.weatherApp) {
            const originalMethod = window.weatherApp.getWeatherData;
            window.weatherApp.getWeatherData = function(city) {
                // Sample data for demo
                const sampleCurrentData = {
                    name: city,
                    sys: { country: 'GB' },
                    weather: [{ main: 'Clear', description: 'clear sky' }],
                    main: { 
                        temp: 22, 
                        feels_like: 24, 
                        humidity: 65, 
                        pressure: 1013 
                    },
                    wind: { speed: 3.5 },
                    visibility: 10000
                };

                const sampleForecastData = {
                    list: Array.from({ length: 40 }, (_, i) => ({
                        dt: Date.now() / 1000 + (i * 3 * 3600),
                        weather: [{ main: 'Clear', description: 'clear sky' }],
                        main: { temp: 20 + Math.random() * 10 }
                    }))
                };

                this.showLoading();
                setTimeout(() => {
                    this.displayWeatherData(sampleCurrentData, sampleForecastData);
                    this.hideLoading();
                    this.showWeather();
                }, 1000);
            };
        }
    }, 100);
}