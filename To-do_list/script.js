
const form = document.getElementById("todo-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    taskList.replaceChildren();

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "active") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    if (filteredTasks.length === 0) {
        const message = document.createElement("li");
        message.className = "empty-message";
        message.textContent = tasks.length === 0
            ? "No tasks yet. Add one above!"
            : "No tasks in this category.";

        taskList.appendChild(message);
    }

    filteredTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task";

        if (task.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark task completed");

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = task.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.setAttribute("aria-label", `Delete ${task.text}`);

        deleteBtn.addEventListener("click", () => {
            tasks = tasks.filter(item => item.id !== task.id);
            saveTasks();
            renderTasks();
        });

        li.append(checkbox, span, deleteBtn);
        taskList.appendChild(li);
    });

    const remaining = tasks.filter(task => !task.completed).length;
    taskCount.textContent =
        `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;

    filterButtons.forEach(button => {
        const selected = button.dataset.filter === currentFilter;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) return;

    tasks.push({
        id: Date.now() + Math.random(),
        text: text,
        completed: false
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskInput.focus();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        renderTasks();
    });
});

clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
});

renderTasks();


const exportBtn = document.getElementById("export-json");
const importBtn = document.getElementById("import-json");
const jsonFile = document.getElementById("json-file");

// Export tasks to a JSON file
exportBtn.addEventListener("click", () => {
    const jsonData = JSON.stringify(tasks, null, 2);

    const blob = new Blob([jsonData], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-tasks.json";
    link.click();

    URL.revokeObjectURL(url);
});

// Open file picker to import JSON
importBtn.addEventListener("click", () => {
    jsonFile.click();
});

// Import tasks from a JSON file
jsonFile.addEventListener("change", async () => {
    const file = jsonFile.files[0];

    if (!file) return;

    try {
        const text = await file.text();
        const importedTasks = JSON.parse(text);

        // Validate the JSON structure
        if (
            !Array.isArray(importedTasks) ||
            !importedTasks.every(task =>
                task &&
                typeof task.text === "string" &&
                typeof task.completed === "boolean"
            )
        ) {
            throw new Error("Invalid task format");
        }

        // Normalize imported tasks
        const cleanTasks = importedTasks.map(task => ({
            id: crypto.randomUUID(),
            text: task.text.trim(),
            completed: task.completed
        })).filter(task => task.text.length > 0);

        if (!confirm(
            `Import ${cleanTasks.length} tasks? This will replace your current tasks.`
        )) {
            return;
        }

        tasks = cleanTasks;
        saveTasks();
        renderTasks();

        alert("Tasks imported successfully!");

    } catch (error) {
        alert("Could not import JSON. Please select a valid task file.");
    } finally {
        jsonFile.value = "";
    }
});
