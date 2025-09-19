/*
 * FoundStrength Workout Tracker
 * ---------------------------------
 * This file contains all UI and data logic for the tracker.
 * The training plan is defined below and can be edited or expanded.
 * Future enhancements (e.g., exporting to CSV or syncing to a backend)
 * can hook into the helper functions that manage state and rendering.
 */

const trainingPlan = {
  day1: {
    label: "Day 1",
    focus: "Lower body strength emphasis",
    exercises: [
      { id: "back-squat", name: "Back Squat" },
      { id: "bench-press", name: "Bench Press" },
      { id: "lat-pulldown", name: "Lat Pulldown" },
      { id: "db-shoulder-press", name: "Dumbbell Shoulder Press" },
      { id: "plank", name: "Plank" },
    ],
  },
  day2: {
    label: "Day 2",
    focus: "Posterior chain + overhead strength",
    exercises: [
      { id: "deadlift", name: "Deadlift" },
      { id: "overhead-press", name: "Overhead Press" },
      { id: "barbell-row", name: "Barbell Row" },
      { id: "walking-lunge", name: "Walking Lunge" },
      { id: "hanging-knee-raise", name: "Hanging Knee Raise" },
    ],
  },
  day3: {
    label: "Day 3",
    focus: "Full body power + accessory work",
    exercises: [
      { id: "front-squat", name: "Front Squat" },
      { id: "incline-bench", name: "Incline Bench Press" },
      { id: "seated-cable-row", name: "Seated Cable Row" },
      { id: "romanian-deadlift", name: "Romanian Deadlift" },
      { id: "face-pull", name: "Face Pull" },
    ],
  },
};

const STORAGE_KEY = "foundStrengthWorkoutData";

// Cache DOM references once the document is ready
const daySelect = document.getElementById("day-select");
const daysContainer = document.getElementById("days-container");

// Holds all logged data. Structure: { dayX: { totalTime: string, exercises: { id: { sets: [] } } } }
let workoutData = {};

document.addEventListener("DOMContentLoaded", () => {
  initializeDataStore();
  buildDaySelector();
  renderTrainingDays();
  attachGlobalListeners();
  const initialDay = daySelect.value || Object.keys(trainingPlan)[0];
  showDay(initialDay);
});

/**
 * Initializes workoutData by merging stored localStorage data with the current training plan.
 * Ensures every exercise has a sets array even if there is no stored data yet.
 */
function initializeDataStore() {
  const stored = loadStoredData();
  const base = getEmptyDataTemplate();

  // Merge stored data with the template, preserving logged sets where possible.
  Object.keys(base).forEach((dayKey) => {
    const storedDay = stored[dayKey] || {};
    base[dayKey].totalTime = storedDay.totalTime || "";

    Object.keys(base[dayKey].exercises).forEach((exerciseId) => {
      const storedExercise = storedDay.exercises?.[exerciseId];
      base[dayKey].exercises[exerciseId].sets = Array.isArray(storedExercise?.sets)
        ? storedExercise.sets
        : [];
    });
  });

  workoutData = base;
  saveData();
}

/**
 * Generates a fresh object that matches the current training plan structure.
 */
function getEmptyDataTemplate() {
  const template = {};
  Object.entries(trainingPlan).forEach(([dayKey, dayConfig]) => {
    template[dayKey] = {
      totalTime: "",
      exercises: {},
    };

    dayConfig.exercises.forEach((exercise) => {
      template[dayKey].exercises[exercise.id] = { sets: [] };
    });
  });
  return template;
}

/**
 * Attempts to read and parse workout data from localStorage.
 */
function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Failed to parse stored workout data:", error);
    return {};
  }
}

/**
 * Writes the current workoutData to localStorage.
 */
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutData));
}

/**
 * Populates the day dropdown with options.
 */
function buildDaySelector() {
  const options = Object.entries(trainingPlan)
    .map(([dayKey, config]) => `<option value="${dayKey}">${config.label}</option>`)
    .join("");
  daySelect.innerHTML = options;
}

/**
 * Renders all day sections and inserts them into the DOM.
 */
function renderTrainingDays() {
  daysContainer.innerHTML = Object.entries(trainingPlan)
    .map(([dayKey, config]) => renderDaySection(dayKey, config))
    .join("");

  // Populate dynamic content such as saved sets and total training time.
  Object.keys(trainingPlan).forEach((dayKey) => {
    updateAllExercisesForDay(dayKey);
    updateTotalTimeField(dayKey);
  });
}

/**
 * Builds the HTML structure for a single day section.
 */
function renderDaySection(dayKey, config) {
  const exerciseCards = config.exercises
    .map((exercise) => renderExerciseCard(dayKey, exercise))
    .join("");

  return `
    <section class="day-section" data-day="${dayKey}" aria-labelledby="${dayKey}-title">
      <div class="day-header">
        <h2 id="${dayKey}-title">${config.label}</h2>
        <p>${config.focus}</p>
      </div>
      <div class="exercise-grid">
        ${exerciseCards}
      </div>
      <div class="total-time">
        <label for="${dayKey}-total-time">Total Training Time</label>
        <input
          id="${dayKey}-total-time"
          class="total-time-input"
          type="text"
          placeholder="e.g. 1h 15m"
          data-day="${dayKey}"
        />
      </div>
      <button class="clear-day-btn" data-day="${dayKey}">Clear Day</button>
    </section>
  `;
}

/**
 * Builds the HTML structure for an exercise card with collapsible details.
 */
function renderExerciseCard(dayKey, exercise) {
  const rpeOptions = Array.from({ length: 5 }, (_, index) => 6 + index)
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");

  return `
    <article class="exercise-card expanded" data-exercise="${exercise.id}" data-day="${dayKey}">
      <button type="button" class="exercise-header" aria-expanded="true">
        <span>${exercise.name}</span>
        <span class="toggle-icon">−</span>
      </button>
      <div class="exercise-details">
        <div class="exercise-inputs">
          <label>
            Weight Used
            <input type="number" min="0" step="0.5" class="weight-input" placeholder="lbs" />
          </label>
          <label>
            Reps Completed
            <input type="number" min="0" step="1" class="reps-input" placeholder="reps" />
          </label>
          <label>
            RPE
            <select class="rpe-select">
              <option value="" disabled selected>Select RPE</option>
              ${rpeOptions}
            </select>
          </label>
        </div>
        <button class="add-set-btn" data-day="${dayKey}" data-exercise="${exercise.id}">Add Set</button>
        <div class="sets-log">
          <table class="set-table" aria-label="Logged sets for ${exercise.name}">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Weight</th>
                <th scope="col">Reps</th>
                <th scope="col">RPE</th>
              </tr>
            </thead>
            <tbody class="set-rows"></tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

/**
 * Attaches listeners for day switching, adding sets, collapsing sections, etc.
 */
function attachGlobalListeners() {
  daySelect.addEventListener("change", (event) => {
    showDay(event.target.value);
  });

  daysContainer.addEventListener("click", (event) => {
    const headerButton = event.target.closest(".exercise-header");
    if (headerButton) {
      toggleExerciseCard(headerButton.closest(".exercise-card"));
      return;
    }

    const addSetButton = event.target.closest(".add-set-btn");
    if (addSetButton) {
      const { day, exercise } = addSetButton.dataset;
      handleAddSet(day, exercise, addSetButton.closest(".exercise-card"));
      return;
    }

    const clearButton = event.target.closest(".clear-day-btn");
    if (clearButton) {
      const { day } = clearButton.dataset;
      clearDay(day);
    }
  });

  // Persist total training time as the user types.
  daysContainer.addEventListener("input", (event) => {
    if (event.target.classList.contains("total-time-input")) {
      const { day } = event.target.dataset;
      workoutData[day].totalTime = event.target.value;
      saveData();
    }
  });
}

/**
 * Shows the selected day section and hides the others.
 */
function showDay(dayKey) {
  document.querySelectorAll(".day-section").forEach((section) => {
    section.classList.toggle("active", section.dataset.day === dayKey);
  });

  if (daySelect.value !== dayKey) {
    daySelect.value = dayKey;
  }
}

/**
 * Handles the Add Set button click for a specific exercise.
 */
function handleAddSet(dayKey, exerciseId, exerciseCard) {
  const weightInput = exerciseCard.querySelector(".weight-input");
  const repsInput = exerciseCard.querySelector(".reps-input");
  const rpeSelect = exerciseCard.querySelector(".rpe-select");

  const weight = weightInput.value.trim();
  const reps = repsInput.value.trim();
  const rpe = rpeSelect.value;

  if (!weight || !reps || !rpe) {
    alert("Please fill in weight, reps, and RPE before adding the set.");
    return;
  }

  const numericWeight = Number(weight);
  const numericReps = Number(reps);

  if (Number.isNaN(numericWeight) || Number.isNaN(numericReps)) {
    alert("Weight and reps must be valid numbers.");
    return;
  }

  const exerciseData = workoutData[dayKey].exercises[exerciseId];
  exerciseData.sets.push({
    weight: numericWeight,
    reps: numericReps,
    rpe: Number(rpe),
    timestamp: Date.now(),
  });

  saveData();
  updateSetsTable(dayKey, exerciseId);

  // Reset inputs for quick logging of the next set.
  weightInput.value = "";
  repsInput.value = "";
  rpeSelect.selectedIndex = 0;
  weightInput.focus();
}

/**
 * Updates every exercise table for the given day.
 */
function updateAllExercisesForDay(dayKey) {
  const daySection = document.querySelector(`.day-section[data-day="${dayKey}"]`);
  if (!daySection) return;

  Object.keys(workoutData[dayKey].exercises).forEach((exerciseId) => {
    updateSetsTable(dayKey, exerciseId);
  });
}

/**
 * Renders the stored sets into the exercise's table body.
 */
function updateSetsTable(dayKey, exerciseId) {
  const daySection = document.querySelector(`.day-section[data-day="${dayKey}"]`);
  const exerciseCard = daySection?.querySelector(`.exercise-card[data-exercise="${exerciseId}"]`);
  const tbody = exerciseCard?.querySelector(".set-rows");

  if (!tbody) return;

  const sets = workoutData[dayKey].exercises[exerciseId].sets;
  tbody.innerHTML = sets
    .map((set, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${set.weight}</td>
          <td>${set.reps}</td>
          <td>${set.rpe}</td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Updates the total training time input for a day using stored data.
 */
function updateTotalTimeField(dayKey) {
  const input = document.getElementById(`${dayKey}-total-time`);
  if (input) {
    input.value = workoutData[dayKey].totalTime;
  }
}

/**
 * Clears all data for a given day, after user confirmation.
 */
function clearDay(dayKey) {
  const confirmation = confirm(
    `Are you sure you want to clear all sets for ${trainingPlan[dayKey].label}?`
  );

  if (!confirmation) return;

  workoutData[dayKey] = getEmptyDataTemplate()[dayKey];
  saveData();
  updateAllExercisesForDay(dayKey);
  updateTotalTimeField(dayKey);
}

/**
 * Toggles an exercise card between expanded and collapsed states.
 */
function toggleExerciseCard(card) {
  if (!card) return;
  const isExpanded = card.classList.toggle("expanded");
  const header = card.querySelector(".exercise-header");
  const icon = card.querySelector(".toggle-icon");
  if (header) {
    header.setAttribute("aria-expanded", String(isExpanded));
  }
  if (icon) {
    icon.textContent = isExpanded ? "−" : "+";
  }
}
