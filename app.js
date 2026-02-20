/* =======================
   STORAGE
======================= */

function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

window.addEventListener("resize", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

// Particle setup
const particles = [];
const particleCount = 80;

for (let i = 0; i < particleCount; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.3
    });
}

/* =======================
   BACHGROUND ANIMATION
======================= */
// Draw loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // move particle
        p.x += p.speedX;
        p.y += p.speedY;

        // wrap around edges
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;
    });

    requestAnimationFrame(animateParticles);
}

animateParticles();

/* =======================
   SMART GREETING
======================= */

document.addEventListener("DOMContentLoaded", () => {

    const username = localStorage.getItem("username") || "User";
    const greetingEl = document.getElementById("greeting");

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }

    if (greetingEl) {
        greetingEl.textContent = `${getGreeting()}, ${username} 👋`;
    }

    loadSavedTheme();
    bindEvents();
    loadTasks();
});

/* =======================
   TOAST SYSTEM
======================= */

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}


/* =========================
   DARK MODE 
========================= */

function bindEvents() {

    const darkToggle = document.getElementById("darkToggle");
    
    const addBtn = document.getElementById("addTaskBtn");

    if (darkToggle) {
        darkToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            localStorage.setItem(
                "darkMode",
                document.body.classList.contains("dark")
            );
        });
    }
}
    
function loadSavedTheme() {
    const savedDark = localStorage.getItem("darkMode");
    const savedTheme = localStorage.getItem("theme");

    if (savedDark === "true") {
        document.body.classList.add("dark");
    }

    if (savedTheme && savedTheme !== "default") {
        document.body.classList.add(`theme-${savedTheme}`);
        const selector = document.getElementById("themeSelector");
        if (selector) selector.value = savedTheme;
    }
}

/* =======================
   STATS COUNTER
======================= */

function animateCounter(element, target) {
    let current = 0;
    const increment = Math.ceil(target / 30);

    const update = () => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
        } else {
            element.textContent = current;
            requestAnimationFrame(update);
        }
    };

    update();
}


/* =======================
   WEATHER CONFIG
======================= */

const WEATHER_API_KEY = "4082f110a3d84eca8fd3b5ee78b3e992";
const WEATHER_RATE_LIMIT_MS = 10 * 60 * 1000;


/* =======================
   WEATHER FUNCTION
======================= */

async function getWeather(city) {

    if (!WEATHER_API_KEY || WEATHER_API_KEY === "YOUR_API_KEY_HERE") {
        return null;
    }

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

        localStorage.setItem(
            key,
            JSON.stringify({ data, timestamp: Date.now() })
        );

        return data;

    } catch (error) {
        console.log("Weather error:", error);
        return null;
    }
}


/* =======================
   ADD TASK
======================= */

async function addTask() {

    const titleInput = document.getElementById("newTask");
    const descInput = document.getElementById("description");
    const cityInput = document.getElementById("city");
    const dueDateInput = document.getElementById("dueDate");

    if (!titleInput?.value || !cityInput?.value) return;

    let weather = await getWeather(cityInput.value);

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
        weatherType: weather?.weather[0]?.main || "",
        weatherIcon: weather?.weather[0]?.icon || ""
    };

    const tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);
    showToast("Task added successfully!");


    titleInput.value = "";
    descInput.value = "";
    cityInput.value = "";
    dueDateInput.value = "";

    loadTasks();
}


/* =======================
   TOGGLE / EDIT / DELETE
======================= */

function toggleComplete(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks(tasks);
    loadTasks();
    showToast("Task updated");

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
    showToast("Task deleted", "error");

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

    const icon = task.weatherIcon
        ? `<img src="https://openweathermap.org/img/wn/${task.weatherIcon}@2x.png">`
        : "";

    li.innerHTML = `
        <strong>${task.title}</strong>
        <p>${task.description}</p>
        <small>📍 ${task.city} ${icon} ${task.weatherText}</small><br>
        <small>🕒 ${new Date(task.createdAt).toLocaleString()}</small><br>
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
    if (!list) return;

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

    const totalCount = document.getElementById("taskCount");
    if (totalCount) {
        totalCount.innerText = tasks.length;
    }

    const notif = document.getElementById("notifCount");
    if (notif) {
        notif.innerText = tasks.filter(t => !t.completed).length;
    }
    // Update stats counters
    const totalCountEl = document.getElementById("totalCount");
    const activeCountEl = document.getElementById("activeCount");
    const completedCountEl = document.getElementById("completedCount");

    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;

    if (totalCountEl) animateCounter(totalCountEl, total);
    if (activeCountEl) animateCounter(activeCountEl, active);
    if (completedCountEl) animateCounter(completedCountEl, completed);
}



