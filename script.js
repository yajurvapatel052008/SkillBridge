const STORAGE_KEYS = {
  volunteers: "skillbridge_volunteers",
  organisers: "skillbridge_organisers",
  activeVolunteer: "skillbridge_active_volunteer",
  activeOrganiser: "skillbridge_active_organiser"
};

function getCollection(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function setCollection(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setMessage(elementId, message, isError = false) {
  const node = document.getElementById(elementId);
  if (!node) return;
  node.textContent = message;
  node.className = isError ? "feedback error" : "feedback success";
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function labelSkill(skill) {
  return skill
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function labelUrgency(urgency) {
  const labels = { today: "Today", tomorrow: "Tomorrow", this_week: "This Week" };
  return labels[urgency] || urgency;
}

function createVolunteerCard(volunteer) {
  return `
    <div class="profile-preview">
      <strong>${volunteer.name}</strong>
      <span>${volunteer.title}</span>
      <span>Skill: ${labelSkill(volunteer.skill)}</span>
      <span>Proficiency: ${volunteer.proficiency}/100</span>
      <span>Address: ${volunteer.address}</span>
      <span>City: ${volunteer.city}</span>
      <span>Trust: ${volunteer.trustScore}/100</span>
      <span>Availability: ${labelUrgency(volunteer.availability.urgency)}, ${volunteer.availability.start}-${volunteer.availability.end}</span>
    </div>
  `;
}

function initVolunteerPage() {
  const signupForm = document.getElementById("volunteer-signup-form");
  const loginForm = document.getElementById("volunteer-login-form");
  const previewNode = document.getElementById("volunteer-profile-preview");

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const volunteers = getCollection(STORAGE_KEYS.volunteers);
    const email = document.getElementById("volunteer-email").value.trim().toLowerCase();
    if (volunteers.some((volunteer) => volunteer.email === email)) {
      setMessage("volunteer-signup-message", "This email is already registered.", true);
      return;
    }

    const volunteer = {
      id: Date.now(),
      name: document.getElementById("volunteer-name").value.trim(),
      email,
      password: document.getElementById("volunteer-password").value,
      title: document.getElementById("volunteer-title").value.trim(),
      skill: document.getElementById("volunteer-skill").value,
      proficiency: Number(document.getElementById("volunteer-proficiency").value),
      address: document.getElementById("volunteer-address").value.trim(),
      city: document.getElementById("volunteer-city").value.trim(),
      trustScore: Number(document.getElementById("volunteer-trust").value),
      availability: {
        urgency: document.getElementById("volunteer-urgency").value,
        start: document.getElementById("volunteer-start").value,
        end: document.getElementById("volunteer-end").value
      }
    };

    volunteers.push(volunteer);
    setCollection(STORAGE_KEYS.volunteers, volunteers);
    localStorage.setItem(STORAGE_KEYS.activeVolunteer, JSON.stringify(volunteer));
    signupForm.reset();
    setMessage("volunteer-signup-message", "Volunteer account created and profile saved.");
    previewNode.innerHTML = createVolunteerCard(volunteer);
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const volunteers = getCollection(STORAGE_KEYS.volunteers);
    const email = document.getElementById("volunteer-login-email").value.trim().toLowerCase();
    const password = document.getElementById("volunteer-login-password").value;
    const volunteer = volunteers.find((entry) => entry.email === email && entry.password === password);

    if (!volunteer) {
      setMessage("volunteer-login-message", "Invalid volunteer email or password.", true);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.activeVolunteer, JSON.stringify(volunteer));
    setMessage("volunteer-login-message", "Volunteer login successful.");
    previewNode.innerHTML = createVolunteerCard(volunteer);
  });

  const activeVolunteer = JSON.parse(localStorage.getItem(STORAGE_KEYS.activeVolunteer) || "null");
  if (activeVolunteer) {
    previewNode.innerHTML = createVolunteerCard(activeVolunteer);
  }
}

function getAvailabilityScore(slot, urgency) {
  if (!slot || slot.urgency !== urgency) return 0;
  const map = { today: 100, tomorrow: 78, this_week: 58 };
  return map[urgency] ?? 40;
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function tokenizeAddress(value) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function getLocationScore(volunteer, request) {
  const volunteerCity = normalizeText(volunteer.city);
  const requestCity = normalizeText(request.city);
  const volunteerTokens = tokenizeAddress(volunteer.address);
  const requestTokens = tokenizeAddress(request.address);
  const sharedTokens = volunteerTokens.filter((token) => requestTokens.includes(token)).length;

  if (volunteerCity && requestCity && volunteerCity === requestCity && sharedTokens >= 2) return 100;
  if (volunteerCity && requestCity && volunteerCity === requestCity) return 82;
  if (sharedTokens >= 2) return 65;
  if (sharedTokens === 1) return 45;
  return 20;
}

function findSuggestedSlot(volunteer, urgency, requestedStart, durationHours) {
  const slot = volunteer.availability.urgency === urgency ? volunteer.availability : null;
  if (!slot) return null;

  const requestedStartMinutes = timeToMinutes(requestedStart);
  const requestedEndMinutes = requestedStartMinutes + durationHours * 60;
  const slotStart = timeToMinutes(slot.start);
  const slotEnd = timeToMinutes(slot.end);

  if (requestedStartMinutes >= slotStart && requestedEndMinutes <= slotEnd) {
    return `${requestedStart} - ${minutesToTime(requestedEndMinutes)}`;
  }

  if (slotStart + durationHours * 60 <= slotEnd) {
    return `${slot.start} - ${minutesToTime(slotStart + durationHours * 60)}`;
  }

  return null;
}

function calculateMatches(request, volunteers) {
  return volunteers
    .map((volunteer) => {
      const skillScore = volunteer.skill === request.skill ? volunteer.proficiency : 0;
      const availabilityScore = getAvailabilityScore(volunteer.availability, request.urgency);
      const locationScore = getLocationScore(volunteer, request);
      const suggestedSlot = findSuggestedSlot(volunteer, request.urgency, request.startTime, request.duration);
      const totalScore = Math.round(
        skillScore * 0.4 +
        availabilityScore * 0.25 +
        locationScore * 0.2 +
        volunteer.trustScore * 0.15
      );

      return {
        ...volunteer,
        skillScore,
        availabilityScore,
        locationScore,
        suggestedSlot,
        totalScore
      };
    })
    .filter((volunteer) => volunteer.skillScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore);
}

function renderMatches(matches, request, resultsNode) {
  if (!matches.length) {
    resultsNode.innerHTML = `
      <article class="result-item">
        <h4 class="result-name">No volunteers found</h4>
        <p class="result-reason">No registered volunteer currently matches this skill. Add more volunteer profiles and try again.</p>
      </article>
    `;
    return;
  }

  resultsNode.innerHTML = matches
    .map((volunteer, index) => {
      const slotText = volunteer.suggestedSlot || "No exact overlap found";
      return `
        <article class="result-item">
          <div class="result-top">
            <div>
              <p class="eyebrow">Rank #${index + 1}</p>
              <h4 class="result-name">${volunteer.name}</h4>
              <div class="result-role">${volunteer.title}</div>
            </div>
            <div class="result-score">
              <strong>${volunteer.totalScore}</strong>
              <span>match</span>
            </div>
          </div>
          <div class="chip-row">
            <span class="chip">Skill ${volunteer.skillScore}</span>
            <span class="chip">Availability ${volunteer.availabilityScore}</span>
            <span class="chip">Location ${volunteer.locationScore}</span>
            <span class="chip">Trust ${volunteer.trustScore}</span>
          </div>
          <div class="chip-row">
            <span class="chip">Skill: ${labelSkill(volunteer.skill)}</span>
            <span class="chip">City: ${volunteer.city}</span>
            <span class="chip">Address: ${volunteer.address}</span>
            <span class="chip">Slot: ${slotText}</span>
          </div>
          <p class="result-reason">
            ${volunteer.name} is ranked for "${labelSkill(request.skill)}" because this volunteer actually registered in the system,
            has strong location fit with ${request.city}, and has matching availability and trust score.
          </p>
        </article>
      `;
    })
    .join("");
}

function initOrganiserPage() {
  const signupForm = document.getElementById("organiser-signup-form");
  const loginForm = document.getElementById("organiser-login-form");
  const requestForm = document.getElementById("request-form");
  const resultsNode = document.getElementById("results");
  const statusNode = document.getElementById("organiser-status");
  const countNode = document.getElementById("volunteer-count");

  const updateVolunteerCount = () => {
    const volunteers = getCollection(STORAGE_KEYS.volunteers);
    countNode.textContent = volunteers.length
      ? `${volunteers.length} volunteer profile(s) available for matching.`
      : "No volunteers registered yet.";
  };

  const updateOrganiserStatus = () => {
    const organiser = JSON.parse(localStorage.getItem(STORAGE_KEYS.activeOrganiser) || "null");
    statusNode.textContent = organiser
      ? `Logged in as ${organiser.organisation}. Matching will use registered volunteer data only.`
      : "Please log in as an organiser to run matching.";
  };

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const organisers = getCollection(STORAGE_KEYS.organisers);
    const email = document.getElementById("organiser-email").value.trim().toLowerCase();
    if (organisers.some((organiser) => organiser.email === email)) {
      setMessage("organiser-signup-message", "This organiser email is already registered.", true);
      return;
    }

    const organiser = {
      id: Date.now(),
      organisation: document.getElementById("organiser-name").value.trim(),
      email,
      password: document.getElementById("organiser-password").value
    };

    organisers.push(organiser);
    setCollection(STORAGE_KEYS.organisers, organisers);
    localStorage.setItem(STORAGE_KEYS.activeOrganiser, JSON.stringify(organiser));
    signupForm.reset();
    setMessage("organiser-signup-message", "Organiser account created.");
    updateOrganiserStatus();
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const organisers = getCollection(STORAGE_KEYS.organisers);
    const email = document.getElementById("organiser-login-email").value.trim().toLowerCase();
    const password = document.getElementById("organiser-login-password").value;
    const organiser = organisers.find((entry) => entry.email === email && entry.password === password);

    if (!organiser) {
      setMessage("organiser-login-message", "Invalid organiser email or password.", true);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.activeOrganiser, JSON.stringify(organiser));
    setMessage("organiser-login-message", "Organiser login successful.");
    updateOrganiserStatus();
  });

  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const organiser = JSON.parse(localStorage.getItem(STORAGE_KEYS.activeOrganiser) || "null");
    if (!organiser) {
      setMessage("organiser-login-message", "Please log in first to run volunteer matching.", true);
      return;
    }

    const request = {
      skill: document.getElementById("skill").value,
      urgency: document.getElementById("urgency").value,
      date: document.getElementById("date-needed").value,
      address: document.getElementById("request-address").value.trim(),
      city: document.getElementById("request-city").value.trim(),
      startTime: document.getElementById("start-time").value,
      duration: Number(document.getElementById("duration").value)
    };

    const volunteers = getCollection(STORAGE_KEYS.volunteers);
    const matches = calculateMatches(request, volunteers);
    renderMatches(matches, request, resultsNode);
  });

  updateVolunteerCount();
  updateOrganiserStatus();
}

function initPage() {
  const page = document.body.dataset.page;
  if (page === "volunteer") initVolunteerPage();
  if (page === "organiser") initOrganiserPage();
}

initPage();
