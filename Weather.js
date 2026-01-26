document.addEventListener("DOMContentLoaded", function () {
  // API Configuration
  const API_KEY = import.meta.env.VITE_WEB_API_KEY;
  const BASE_URL = import.meta.env.VITE_WEB_BASE_URL;

  // DOM Elements
  const cityInput = document.getElementById("cityInput");
  const searchBtn = document.getElementById("searchBtn");
  const weatherDisplay = document.getElementById("weatherDisplay");
  const loading = document.getElementById("loading");
  const errorDisplay = document.getElementById("errorDisplay");
  const unitButtons = document.querySelectorAll(".unit-btn");

  // State
  let currentUnit = "metric";
  let lastSearchedCity = "";

  // Event Listeners
  searchBtn.addEventListener("click", searchWeather);
  cityInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchWeather();
    }
  });

  unitButtons.forEach((button) => {
    button.addEventListener("click", function () {
      currentUnit = this.dataset.unit;
      unitButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // If we have a previous search, update with new units
      if (lastSearchedCity) {
        fetchWeather(lastSearchedCity, currentUnit);
      }
    });
  });

  // Default city on load
  fetchWeather("London", currentUnit);

  // Functions
  function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
      fetchWeather(city, currentUnit);
    } else {
      showError("Please enter a city name");
    }
  }

  async function fetchWeather(city, unit) {
    try {
      showLoading(true);
      hideError();

      const response = await fetch(
        `${BASE_URL}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("City not found. Please check the spelling.");
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
    const tempUnit = unit === "metric" ? "°C" : "°F";
    const speedUnit = unit === "metric" ? "m/s" : "mph";

    // Get weather icon
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    // Format date
    const date = new Date(data.dt * 1000);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = date.toLocaleDateString("en-US", options);

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
    loading.style.display = show ? "block" : "none";
  }

  function showError(message) {
    errorDisplay.textContent = `Error: ${message}`;
    errorDisplay.style.display = "block";
  }

  function hideError() {
    errorDisplay.style.display = "none";
  }
});
