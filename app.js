// ===== STATE =====
const state = {
  xp: 0,
  level: 1,
  streak: 0,
  badges: [],
  currentTask: null,
  lastTaskDate: null,
  lastTaskId: null
};

function saveState() {
  localStorage.setItem("focusQuestState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("focusQuestState");
  if (saved) Object.assign(state, JSON.parse(saved));
}

// ===== DOM =====
const dom = {
  xpValue: document.getElementById("xpValue"),
  xpNeeded: document.getElementById("xpNeeded"),
  levelTitle: document.getElementById("levelTitle"),
  levelDesc: document.getElementById("levelDesc"),
  levelBadge: document.getElementById("levelBadge"),
  avatar: document.getElementById("avatar"),
  progressCircle: document.getElementById("progressCircle"),
  streakValue: document.getElementById("streakValue"),
  taskCard: document.getElementById("taskCard"),
  getTaskBtn: document.getElementById("getTaskBtn"),
  completeBtn: document.getElementById("completeBtn"),
  skipBtn: document.getElementById("skipBtn"),
  badgesGrid: document.getElementById("badgesGrid"),
  badgeCount: document.getElementById("badgeCount"),
  message: document.getElementById("message")
};

// ===== LEVELS & BADGES =====
const levels = [
  { title: "Beginner", desc: "Stay focused and level up!", avatar: "🌱", color: "#6a5acd" },
  { title: "Apprentice", desc: "You're getting better!", avatar: "🔥", color: "#ff8c00" },
  { title: "Expert", desc: "Your focus is unmatched!", avatar: "💎", color: "#28c76f" },
  { title: "Master", desc: "You've reached mastery!", avatar: "🏆", color: "#ffd700" },
  { title: "Legend", desc: "Your focus inspires others!", avatar: "🦁", color: "#ff4500" }
];

const badges = [
  { id: "streak3", name: "3-Day Streak", icon: "🔥", req: "streak", value: 3 },
  { id: "level2", name: "Level 2 Achieved", icon: "⭐", req: "level", value: 2 },
  { id: "level4", name: "Level 4 Achieved", icon: "🏆", req: "level", value: 4 }
];

// ===== XP LOGIC =====
function getXpNeeded(level) {
  return 50 + Math.round(level * level * 30);
}

function animateValue(el, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();
  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    el.textContent = Math.floor(start + range * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function showMessage(text, duration = 3000) {
  dom.message.textContent = text;
  dom.message.classList.add("show");
  setTimeout(() => dom.message.classList.remove("show"), duration);
}

function showConfetti() {
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}

// ===== UI UPDATE =====
function updateUI() {
  const lvl = levels[state.level - 1] || levels[levels.length - 1];
  document.documentElement.style.setProperty("--level-color", lvl.color);
  dom.avatar.textContent = lvl.avatar;
  dom.levelBadge.textContent = state.level;
  dom.levelTitle.textContent = lvl.title;
  dom.levelDesc.textContent = lvl.desc;
  dom.xpNeeded.textContent = getXpNeeded(state.level);
  dom.badgeCount.textContent = state.badges.length;

  animateValue(dom.xpValue, parseInt(dom.xpValue.textContent), state.xp, 500);
  animateValue(dom.streakValue, parseInt(dom.streakValue.textContent), state.streak, 500);

  const percent = Math.min(state.xp / getXpNeeded(state.level), 1);
  const offset = 565.48 * (1 - percent);
  dom.progressCircle.style.strokeDashoffset = offset;
}

// ===== TASK LOGIC =====
function getDifficultyStars(d) {
  return "★".repeat(d) + "☆".repeat(5 - d);
}

async function loadTasks() {
  try {
    const res = await fetch("tasks.json");
    if (!res.ok) throw new Error("Tasks couldn't be loaded");
    return await res.json();
  } catch {
    showMessage("⚠️ Error loading tasks");
    return [];
  }
}

function renderTask(task) {
  dom.taskCard.innerHTML = `
    <div class="task-header">
      <div><strong>${task.category}</strong> • ${task.time}</div>
      <div class="task-difficulty">${getDifficultyStars(task.difficulty)}</div>
    </div>
    <div>${task.task}</div>
    <div style="color:var(--accent);">+${task.xp} XP</div>
  `;
}

function getRandomTask(tasks) {
  const available = tasks.filter(t => t.level === state.level && t.id !== state.lastTaskId);
  if (available.length === 0) return { task: "No tasks available for this level", category: "", difficulty: 1, time: "", xp: 0, id: null };
  const task = available[Math.floor(Math.random() * available.length)];
  state.lastTaskId = task.id;
  return task;
}

function levelUpCongrats() {
  const lvl = levels[state.level - 1];
  showMessage(`🎉 Congratulations! You've reached ${lvl.title}!`, 5000);
  showConfetti();
}

function checkLevelUp() {
  let needed = getXpNeeded(state.level);
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level++;
    levelUpCongrats();
    needed = getXpNeeded(state.level);
  }
}

function checkBadges() {
  badges.forEach(b => {
    if (state.badges.includes(b.id)) return;
    if ((b.req === "streak" && state.streak >= b.value) || (b.req === "level" && state.level >= b.value)) {
      state.badges.push(b.id);
      showMessage(`🏅 New badge unlocked: ${b.name}`, 4000);
      showConfetti();
    }
  });
  renderBadges();
}

function renderBadges() {
  dom.badgesGrid.innerHTML = "";
  badges.forEach(b => {
    const unlocked = state.badges.includes(b.id);
    const div = document.createElement("div");
    div.className = `badge-item ${unlocked ? "" : "locked"}`;
    div.innerHTML = `<div>${b.icon}</div><div>${b.name}</div>`;
    if (!unlocked) div.title = `Reach ${b.req} ${b.value} to unlock`;
    dom.badgesGrid.appendChild(div);
  });
}

// ===== DAILY LIMIT LOGIC =====
function getMidnightCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24,0,0,0);
  return midnight - now;
}

function startCountdown() {
  const msLeft = getMidnightCountdown();
  if (state.lastTaskDate === new Date().toDateString()) {
    dom.getTaskBtn.disabled = true;
    updateCountdownText(msLeft);
    const countdown = setInterval(() => {
      const left = getMidnightCountdown();
      if (left <= 0) {
        clearInterval(countdown);
        dom.getTaskBtn.disabled = false;
        dom.getTaskBtn.textContent = "🎯 Get Task";
        state.lastTaskDate = null;
        saveState();
      } else updateCountdownText(left);
    }, 60000);
  }
}

function updateCountdownText(msLeft) {
  const hrs = Math.floor(msLeft / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  dom.getTaskBtn.textContent = `⏳ ${hrs}h ${mins}m until next task`;
}

// ===== MAIN LOGIC =====
loadState();
loadTasks().then(tasks => {

  startCountdown();
  updateUI();
  renderBadges();

  dom.getTaskBtn.addEventListener("click", () => {
    const task = getRandomTask(tasks);
    state.currentTask = task;
    state.lastTaskDate = new Date().toDateString();
    renderTask(task);
    dom.getTaskBtn.classList.add("hidden");
    dom.completeBtn.classList.remove("hidden");
    dom.skipBtn.classList.remove("hidden");
    saveState();
  });

  dom.completeBtn.addEventListener("click", () => {
    if (!state.currentTask) return;
    state.xp += state.currentTask.xp;
    state.streak++;
    showMessage("✅ Task Completed! Keep it up!", 2500);
    checkLevelUp();
    checkBadges();
    updateUI();
    renderTask({ task: "🎯 Well done! Ready for next task?", category: "", difficulty: 1, time: "", xp: 0 });
    dom.completeBtn.classList.add("hidden");
    dom.skipBtn.classList.add("hidden");
    dom.getTaskBtn.classList.remove("hidden");
    saveState();
  });

  dom.skipBtn.addEventListener("click", () => {
    showMessage("⏭ Task skipped. Try the next one!", 2500);
    renderTask({ task: "⏭ Skipped! Ready for a new one?", category: "", difficulty: 1, time: "", xp: 0 });
    dom.completeBtn.classList.add("hidden");
    dom.skipBtn.classList.add("hidden");
    dom.getTaskBtn.classList.remove("hidden");
    saveState();
  });
});

// ===== PARTICLE BACKGROUND =====
function createParticles() {
  const bg = document.querySelector(".animated-bg");
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.top = `${Math.random() * 100}%`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${10 + Math.random() * 20}s`;
    bg.appendChild(p);
  }
}
createParticles();
