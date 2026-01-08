document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_KEY = '1a58080466731ce96ec4b4e65f76433d'; // Replace with your OpenWeatherMap API key
    const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
    
    // DOM Elements
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const weatherDisplay = document.getElementById('weatherDisplay');
    const loading = document.getElementById('loading');
    const errorDisplay = document.getElementById('errorDisplay');
    const unitButtons = document.querySelectorAll('.unit-btn');
    
    // State
    let currentUnit = 'metric';
    let lastSearchedCity = '';
    
    // Event Listeners
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    unitButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentUnit = this.dataset.unit;
            unitButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // If we have a previous search, update with new units
            if (lastSearchedCity) {
                fetchWeather(lastSearchedCity, currentUnit);
            }
        });
    });
    
    // Default city on load
    fetchWeather('London', currentUnit);
    
    // Functions
    function searchWeather() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city, currentUnit);
        } else {
            showError('Please enter a city name');
        }
    }
    
    async function fetchWeather(city, unit) {
        try {
            showLoading(true);
            hideError();
            
            const response = await fetch(
                `${BASE_URL}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}`
            );
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found. Please check the spelling.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            lastSearchedCity = city;
            displayWeather(data, unit);
            
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }
    
    function displayWeather(data, unit) {
        const tempUnit = unit === 'metric' ? '°C' : '°F';
        const speedUnit = unit === 'metric' ? 'm/s' : 'mph';
        
        // Get weather icon
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        
        // Format date
        const date = new Date(data.dt * 1000);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const formattedDate = date.toLocaleDateString('en-US', options);
        
        // Create HTML
        const weatherHTML = `
            <h2>${data.name}, ${data.sys.country}</h2>
            <p>${formattedDate}</p>
            
            <div class="weather-main">
                <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
                <div class="temperature">${Math.round(data.main.temp)}${tempUnit}</div>
                <div class="description">${data.weather[0].description}</div>
                <p>Feels like: ${Math.round(data.main.feels_like)}${tempUnit}</p>
            </div>
            
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${data.main.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${data.wind.speed} ${speedUnit}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pressure</div>
                    <div class="detail-value">${data.main.pressure} hPa</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Visibility</div>
                    <div class="detail-value">${(data.visibility / 1000).toFixed(1)} km</div>
                </div>
            </div>
        `;
        
        weatherDisplay.innerHTML = weatherHTML;
    }
    
    function showLoading(show) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    function showError(message) {
        errorDisplay.textContent = `Error: ${message}`;
        errorDisplay.style.display = 'block';
    }
    
    function hideError() {
        errorDisplay.style.display = 'none';
    }
});




// Add this function after fetchWeather function
async function fetchForecast(city, unit) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`
        );
        const data = await response.json();
        displayForecast(data, unit);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

function displayForecast(data, unit) {
    const tempUnit = unit === 'metric' ? '°C' : '°F';
    const forecastContainer = document.createElement('div');
    forecastContainer.className = 'forecast-container';
    
    // Group forecasts by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = {
                temps: [],
                icons: [],
                date: date
            };
        }
        
        dailyForecasts[day].temps.push(item.main.temp);
        dailyForecasts[day].icons.push(item.weather[0].icon);
    });
    
    // Create forecast HTML
    let forecastHTML = '<h3>5-Day Forecast</h3><div class="forecast-days">';
    
    Object.keys(dailyForecasts).slice(0, 5).forEach(day => {
        const dayData = dailyForecasts[day];
        const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b) / dayData.temps.length);
        const icon = dayData.icons[Math.floor(dayData.icons.length / 2)];
        
        forecastHTML += `
            <div class="forecast-day">
                <div class="forecast-date">${day}</div>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather">
                <div class="forecast-temp">${avgTemp}${tempUnit}</div>
            </div>
        `;
    });
    
    forecastHTML += '</div>';
    forecastContainer.innerHTML = forecastHTML;
    
    // Add to display
    const existingForecast = document.querySelector('.forecast-container');
    if (existingForecast) {
        existingForecast.remove();
    }
    document.querySelector('.container').appendChild(forecastContainer);
}

// Add to your fetchWeather function:
async function fetchWeather(city, unit) {
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        lastSearchedCity = city;
        displayWeather(data, unit);
        
        // Fetch forecast after current weather
        fetchForecast(city, unit);
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Add this function to get user's location
function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, currentUnit);
            },
            error => {
                showLoading(false);
                showError('Location access denied. Please search manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

async function fetchWeatherByCoords(lat, lon, unit) {
    try {
        const response = await fetch(
            `${BASE_URL}?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`
        );
        const data = await response.json();
        displayWeather(data, unit);
        fetchForecast(data.name, unit);
    } catch (error) {
        showError('Failed to fetch weather for your location.');
    }
}

// Add a location button to your HTML:
<div class="search-box">
    <input 
        type="text" 
        id="cityInput" 
        placeholder="Enter city name (e.g., London, Tokyo, New York)"
        autocomplete="off"
    >
    <button id="searchBtn">Search</button>
    <button id="locationBtn" title="Use my location">📍</button>
</div>

// Add to your JavaScript:
const locationBtn = document.getElementById('locationBtn');
locationBtn.addEventListener('click', getCurrentLocationWeather);


// Add these functions for search history
function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
    
    // Remove if already exists
    history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning
    history.unshift(city);
    
    // Keep only last 5 searches
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    localStorage.setItem('weatherSearchHistory', JSON.stringify(history));
    displaySearchHistory();
}

function displaySearchHistory() {
    const history = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
    
    const historyContainer = document.createElement('div');
    historyContainer.className = 'search-history';
    
    if (history.length > 0) {
        let historyHTML = '<h4>Recent Searches:</h4><div class="history-items">';
        
        history.forEach(city => {
            historyHTML += `
                <button class="history-item" onclick="fetchWeather('${city}', currentUnit)">
                    ${city}
                </button>
            `;
        });
        
        historyHTML += '</div>';
        historyContainer.innerHTML = historyHTML;
    }
    
    // Add/update in DOM
    const existingHistory = document.querySelector('.search-history');
    if (existingHistory) {
        existingHistory.remove();
    }
    
    const container = document.querySelector('.container');
    const footer = document.querySelector('footer');
    container.insertBefore(historyContainer, footer);
}

// Update fetchWeather function to save history:
async function fetchWeather(city, unit) {
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        lastSearchedCity = city;
        displayWeather(data, unit);
        
        // Save to history
        saveToHistory(city);
        
        // Fetch forecast
        fetchForecast(city, unit);
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Initialize history display on load
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    displaySearchHistory();
});



function showWeatherMap(city) {
    // OpenWeatherMap map layer
    const mapUrl = `https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=${API_KEY}`;
    
    // Create modal with map
    const modal = document.createElement('div');
    modal.className = 'weather-map-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Weather Map: ${city}</h3>
            <div class="map-container">
                <img src="https://maps.googleapis.com/maps/api/staticmap?center=${city}&zoom=10&size=600x400&markers=color:red%7C${city}" alt="Map">
            </div>
            <button class="close-modal">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
}

async function fetchAlerts(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`
        );
        const data = await response.json();
        
        // Check for severe weather conditions
        if (data.weather[0].main === 'Thunderstorm') {
            showAlert('⚡ Thunderstorm Alert', 'Stay indoors and avoid open areas.');
        } else if (data.wind.speed > 10) { // m/s
            showAlert('💨 High Wind Alert', 'Secure outdoor objects.');
        } else if (data.main.temp < 0) {
            showAlert('❄️ Freezing Temperature', 'Watch for icy conditions.');
        }
    } catch (error) {
        console.error('Alert error:', error);
    }
}

function showAlert(title, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'weather-alert';
    alertDiv.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
    `;
    
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.weather-info'));
}



async function fetchAirQuality(lat, lon) {
    try {
        const response = await fetch(
            `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const data = await response.json();
        displayAirQuality(data.list[0].main.aqi);
    } catch (error) {
        console.error('Air quality error:', error);
    }
}

function displayAirQuality(aqi) {
    const aqiLevels = [
        'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'
    ];
    const colors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#99004c'];
    
    const aqiDiv = document.createElement('div');
    aqiDiv.className = 'air-quality';
    aqiDiv.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Air Quality</div>
            <div class="detail-value" style="color: ${colors[aqi-1]}">
                ${aqiLevels[aqi-1]} (${aqi}/5)
            </div>
        </div>
    `;
    
    // Add to details section
    document.querySelector('.details').appendChild(aqiDiv);
}