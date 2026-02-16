/* =======================
   STORAGE
======================= */

function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* =========================
   DARK MODE TOGGLE
========================= */

const darkToggle = document.getElementById("darkToggle");
const themeSelector = document.getElementById("themeSelector");

darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
    );
});

/* =========================
   THEME SWITCHER
========================= */

themeSelector.addEventListener("change", (e) => {
    document.body.classList.remove(
        "theme-blue",
        "theme-green",
        "theme-orange"
    );

    if (e.target.value !== "default") {
        document.body.classList.add(`theme-${e.target.value}`);
    }

    localStorage.setItem("theme", e.target.value);
});

/* =========================
   LOAD SAVED THEME
========================= */

document.addEventListener("DOMContentLoaded", () => {
    const savedDark = localStorage.getItem("darkMode");
    const savedTheme = localStorage.getItem("theme");

    if (savedDark === "true") {
        document.body.classList.add("dark");
    }

    if (savedTheme && savedTheme !== "default") {
        document.body.classList.add(`theme-${savedTheme}`);
        themeSelector.value = savedTheme;
    }
});


/* =======================
   WEATHER
======================= */

const WEATHER_API_KEY = "YOUR_API_KEY_HERE";
const WEATHER_RATE_LIMIT_MS = 10 * 60 * 1000;

async function getWeather(city) {
    const key = `weather_${city.toLowerCase()}`;
    const cached = JSON.parse(localStorage.getItem(key));

    if (cached && Date.now() - cached.timestamp < WEATHER_RATE_LIMIT_MS) {
        return cached.data;
    }

    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
        );

        if (!res.ok) return null;

        const data = await res.json();
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    } catch {
        return null;
    }
}

function getWeatherClass(type) {
    if (!type) return "";
    return `weather-${type.toLowerCase()}`;
}

/* =======================
   TASKS
======================= */

async function addTask() {
    const titleInput = document.getElementById("newTask");
    const descInput = document.getElementById("description");
    const cityInput = document.getElementById("city");
    const dueDateInput = document.getElementById("dueDate");

    if (!titleInput.value || !cityInput.value) return;

    const weather = await getWeather(cityInput.value);

    const task = {
        id: Date.now(),
        title: titleInput.value,
        description: descInput.value,
        city: cityInput.value,
        dueDate: dueDateInput.value,
        completed: false,
        createdAt: new Date().toISOString(),
        weatherText: weather
            ? `${weather.weather[0].main}, ${weather.main.temp}°C`
            : "Weather unavailable",
        weatherType: weather?.weather[0].main || "",
        weatherIcon: weather?.weather[0].icon || ""
    };

    const tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);

    loadTasks();

    titleInput.value = "";
    descInput.value = "";
    cityInput.value = "";
    dueDateInput.value = "";
}

function toggleComplete(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks(tasks);
    loadTasks();
}

function editTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const title = prompt("Edit title", task.title);
    if (title !== null) task.title = title;

    const desc = prompt("Edit description", task.description);
    if (desc !== null) task.description = desc;

    saveTasks(tasks);
    loadTasks();
}

function deleteTask(id) {
    const tasks = getTasks().filter(t => t.id !== id);
    saveTasks(tasks);
    loadTasks();
}

/* =======================
   FILTER
======================= */

let currentFilter = "all";

function setFilter(filter) {
    currentFilter = filter;
    loadTasks();
}

/* =======================
   RENDER
======================= */

function renderTask(task) {
    const li = document.createElement("li");

    if (task.completed) li.classList.add("completed");

    if (task.dueDate && !task.completed) {
        const today = new Date().toISOString().split("T")[0];
        if (task.dueDate < today) {
            li.classList.add("overdue");
        }
    }

    li.classList.add(getWeatherClass(task.weatherType));

    const icon = task.weatherIcon
        ? `<img src="https://openweathermap.org/img/wn/${task.weatherIcon}@2x.png">`
        : "";

    li.innerHTML = `
        <strong>${task.title}</strong>
        <p>${task.description}</p>
        <small>📍 ${task.city} ${icon} ${task.weatherText}</small><br>
        <small>🕒 ${new Date(task.createdAt).toLocaleString()}</small>
        <small>📅 Due: ${task.dueDate || "Not set"}</small>

        <div class="task-actions">
            <button onclick="toggleComplete(${task.id})">✔</button>
            <button onclick="editTask(${task.id})">✏️</button>
            <button onclick="deleteTask(${task.id})">🗑</button>
        </div>
    `;

    return li;
}

function loadTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    const tasks = getTasks();

    const filtered = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        if (currentFilter === "overdue") {
            const today = new Date().toISOString().split("T")[0];
            return task.dueDate && task.dueDate < today && !task.completed;
        }
        return true;
    });

    filtered.forEach(task => list.appendChild(renderTask(task)));

    document.getElementById("notifCount").innerText =
        tasks.filter(t => !t.completed).length;
}

/* =======================
   INIT
======================= */

document.addEventListener("DOMContentLoaded", loadTasks);
