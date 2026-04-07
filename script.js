const deadlineConfig = {
  targetDate: "2026-04-07T20:00:00-04:00",
  timezone: "America/New_York",
  label: "Time remaining until the reported deadline",
  expiredMessage: "The reported deadline has now passed. Follow the latest updates below to see what happened next."
};

const updatesData = [
  {
    isoTime: "2026-04-07T19:12:00-04:00",
    title: "Final hour before the reported deadline",
    summary: "Attention remained fixed on the reported 8 p.m. Washington deadline, with observers watching for any formal statement or clear follow-through."
  },
  {
    isoTime: "2026-04-07T16:35:00-04:00",
    title: "Focus stays on the Tuesday evening deadline",
    summary: "Coverage continued to frame Tuesday evening in Washington as the key checkpoint, while markets and reporters waited for what would happen next."
  },
  {
    isoTime: "2026-04-07T11:10:00-04:00",
    title: "Reported deadline remains the central timing marker",
    summary: "The tracker launched with the reported 8 p.m. Washington deadline as the main reference point, using a simple live countdown and editable updates list."
  }
];

const timelineData = [
  {
    isoTime: "2026-04-06T12:00:00-04:00",
    title: "Reported timetable shifts",
    summary: "Recent coverage described the original window as moving, leaving Tuesday evening in Washington as the new reported deadline to watch."
  },
  {
    isoTime: "2026-04-07T08:00:00-04:00",
    title: "Final-day monitoring begins",
    summary: "Attention turned to whether the reported deadline would result in a new statement, a concrete move, or no immediate action."
  },
  {
    isoTime: "2026-04-07T20:00:00-04:00",
    title: "Reported deadline time",
    summary: "This is the reported 8 p.m. Washington deadline being tracked on the page. Edit the updates section as confirmed information arrives."
  }
];

const pollState = {
  question: "Will Trump follow through with his 8pm deadline?",
  options: [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
    { id: "unsure", label: "Unsure" }
  ],
  voteKey: "trumpsdeadline-poll-vote-v1",
  resultsKey: "trumpsdeadline-poll-results-v1"
};

const elements = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  countdownStatus: document.getElementById("countdown-status"),
  countdownPanel: document.querySelector(".countdown-panel"),
  deadlineReference: document.getElementById("deadline-reference"),
  deadlineLocal: document.getElementById("deadline-local"),
  lastUpdated: document.getElementById("last-updated"),
  updatesList: document.getElementById("updates-list"),
  timelineList: document.getElementById("timeline-list"),
  pollActions: document.getElementById("poll-actions"),
  pollResults: document.getElementById("poll-results")
};

function formatInTimeZone(dateInput, timeZone, options = {}) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
    ...options
  }).format(date);
}

function formatClockLabel(dateInput) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: deadlineConfig.timezone,
    timeZoneName: "short"
  }).format(new Date(dateInput));
}

function setDeadlineMeta() {
  elements.deadlineReference.textContent = `Deadline reference: ${formatInTimeZone(deadlineConfig.targetDate, deadlineConfig.timezone)}`;
  elements.deadlineLocal.textContent = `Your local time: ${new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(deadlineConfig.targetDate))}`;
}

function setLastUpdated() {
  const newestUpdate = updatesData
    .slice()
    .sort((a, b) => new Date(b.isoTime) - new Date(a.isoTime))[0];

  elements.lastUpdated.textContent = newestUpdate
    ? formatInTimeZone(newestUpdate.isoTime, deadlineConfig.timezone)
    : "Awaiting updates";
}

function padValue(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = Date.now();
  const target = new Date(deadlineConfig.targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    elements.days.textContent = "00";
    elements.hours.textContent = "00";
    elements.minutes.textContent = "00";
    elements.seconds.textContent = "00";
    elements.countdownStatus.textContent = deadlineConfig.expiredMessage;
    elements.countdownPanel.classList.add("is-expired");
    return;
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  elements.days.textContent = padValue(days);
  elements.hours.textContent = padValue(hours);
  elements.minutes.textContent = padValue(minutes);
  elements.seconds.textContent = padValue(seconds);
  elements.countdownStatus.textContent = `Monitoring the reported countdown toward ${formatClockLabel(deadlineConfig.targetDate)} in Washington.`;
}

function renderUpdates() {
  const sortedUpdates = updatesData
    .slice()
    .sort((a, b) => new Date(b.isoTime) - new Date(a.isoTime));

  elements.updatesList.innerHTML = sortedUpdates
    .map((item) => `
      <article class="update-card">
        <p class="update-time">${formatClockLabel(item.isoTime)}</p>
        <h3>${item.title}</h3>
        <p class="update-summary">${item.summary}</p>
      </article>
    `)
    .join("");
}

function renderTimeline() {
  const sortedTimeline = timelineData
    .slice()
    .sort((a, b) => new Date(a.isoTime) - new Date(b.isoTime));

  elements.timelineList.innerHTML = sortedTimeline
    .map((item) => `
      <article class="timeline-item">
        <p class="timeline-time">${formatInTimeZone(item.isoTime, deadlineConfig.timezone, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short"
        })}</p>
        <h3>${item.title}</h3>
        <p class="timeline-summary">${item.summary}</p>
      </article>
    `)
    .join("");
}

function getStoredResults() {
  const emptyResults = pollState.options.reduce((accumulator, option) => {
    accumulator[option.id] = 0;
    return accumulator;
  }, {});

  try {
    const saved = window.localStorage.getItem(pollState.resultsKey);
    return saved ? { ...emptyResults, ...JSON.parse(saved) } : emptyResults;
  } catch (error) {
    return emptyResults;
  }
}

function saveResults(results) {
  window.localStorage.setItem(pollState.resultsKey, JSON.stringify(results));
}

function getSavedVote() {
  return window.localStorage.getItem(pollState.voteKey);
}

function renderPoll() {
  const results = getStoredResults();
  const savedVote = getSavedVote();
  const totalVotes = Object.values(results).reduce((sum, value) => sum + value, 0);

  elements.pollResults.innerHTML = pollState.options
    .map((option) => {
      const count = results[option.id] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return `
        <div class="poll-result-row">
          <div class="poll-result-meta">
            <span>${option.label}</span>
            <span>${percentage}%</span>
          </div>
          <div class="poll-result-bar" aria-hidden="true">
            <div class="poll-result-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const buttons = elements.pollActions.querySelectorAll(".poll-option");
  buttons.forEach((button) => {
    const isSelected = button.dataset.option === savedVote;
    button.disabled = Boolean(savedVote);
    button.classList.toggle("is-selected", isSelected);
  });
}

function handlePollVote(event) {
  const selectedOption = event.target.closest(".poll-option");
  if (!selectedOption || getSavedVote()) {
    return;
  }

  const choice = selectedOption.dataset.option;
  const results = getStoredResults();
  results[choice] = (results[choice] || 0) + 1;

  saveResults(results);
  window.localStorage.setItem(pollState.voteKey, choice);
  renderPoll();
}

function init() {
  setDeadlineMeta();
  setLastUpdated();
  renderUpdates();
  renderTimeline();
  renderPoll();
  updateCountdown();

  window.setInterval(updateCountdown, 1000);
  elements.pollActions.addEventListener("click", handlePollVote);
}

init();
