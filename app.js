/* =======================
   AUTH (mock)
======================= */

function signup() {
    const username = document.getElementById("newUsername").value;
    const password = document.getElementById("newPassword").value;

    if (!username || !password) {
        document.getElementById("signupError").innerText = "All fields are required";
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some(u => u.username === username)) {
        document.getElementById("signupError").innerText = "User already exists";
        return;
    }

    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));
    window.location.href = "index.html";
}

// log in starts here 

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const validUser = users.find(u => u.username === username && u.password === password);

    if (!validUser) {
        document.getElementById("error").innerText = "Invalid credentials";
        return;
    }

    localStorage.setItem("currentUser", username);
    window.location.href = "todo.html";
}

/* =======================
   STORAGE
======================= */

function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* =======================
   TASKS
======================= */

async function addTask() {
    const titleInput = document.getElementById("newTask");
    const descInput = document.getElementById("description");
    const cityInput = document.getElementById("city");
    const dueInput = document.getElementById("dueDate");

    if (!titleInput.value || !cityInput.value) return;

    const weather = await getWeather(cityInput.value);

    const task = {
        id: Date.now(),
        title: titleInput.value,
        description: descInput.value,
        city: cityInput.value,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueInput.value || null,
        weatherText: weather
            ? `${weather.weather[0].main}, ${weather.main.temp}°C`
            : "Weather unavailable",
        weatherType: weather?.weather[0].main || "",
        weatherIcon: weather?.weather[0].icon || ""
    };

    const tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);

    renderTask(task);

    titleInput.value = "";
    descInput.value = "";
    cityInput.value = "";
    dueInput.value = "";
}

let currentFilter = "all";

/* =======================
   RENDER
======================= */

function renderTask(task) {
    if (!task || !task.id) return;

    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    const now = new Date();
    const due = task.dueDate ? new Date(task.dueDate) : null;

    if (due && due < now && !task.completed) {
    li.classList.add("overdue");
    }

    const icon = task.weatherIcon
        ? `<img src="https://openweathermap.org/img/wn/${task.weatherIcon}@2x.png">`
        : "";

    li.innerHTML = `
        <strong>${task.title}</strong>
        <p>${task.description}</p>
        <small>📍 ${task.city} ${icon} ${task.weatherText}</small><br>
        ${task.dueDate ? `<small> ⏰ Due: ${task.dueDate}</small><br>` : ""}
        <small>🕒 ${new Date(task.createdAt).toLocaleString()}</small>
        <div>
            <button onclick="toggleComplete(${task.id})">✔</button>
            <button onclick="editTask(${task.id})">✏️</button>
            <button onclick="deleteTask(${task.id})">🗑</button>
        </div>
    `;

    document.getElementById("taskList").appendChild(li);
}

/* =======================
   INIT
======================= */

document.addEventListener("DOMContentLoaded", loadTasks);
