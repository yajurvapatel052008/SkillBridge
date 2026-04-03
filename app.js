const STORAGE_KEYS = {
  volunteers: "skillbridge_volunteers",
  organisers: "skillbridge_organisers",
  activeVolunteer: "skillbridge_active_volunteer",
  activeOrganiser: "skillbridge_active_organiser",
  theme: "skillbridge_theme"
};

const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseClient =
  window.supabase && supabaseConfig.url && supabaseConfig.anonKey
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

function getCollection(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function setCollection(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setSession(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(key) {
  return JSON.parse(localStorage.getItem(key) || "null");
}

function setMessage(elementId, message, isError = false) {
  const node = document.getElementById(elementId);
  if (!node) return;
  node.textContent = message;
  node.className = isError ? "feedback error" : "feedback success";
}

function getStorageMode() {
  return supabaseClient ? "Supabase" : "local storage";
}

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function initThemeToggle() {
  applyTheme(getPreferredTheme());
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

function mapVolunteerFromDb(row) {
  const availability = Array.isArray(row.volunteer_availability)
    ? row.volunteer_availability[0]
    : row.volunteer_availability;

  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    password: row.password_hash,
    title: row.title,
    skill: row.skill,
    proficiency: row.proficiency,
    address: row.address,
    city: row.city,
    trustScore: row.trust_score,
    availability: availability
      ? {
          urgency: availability.urgency_bucket,
          start: String(availability.start_time).slice(0, 5),
          end: String(availability.end_time).slice(0, 5)
        }
      : { urgency: "today", start: "09:00", end: "11:00" }
  };
}

async function insertVolunteer(volunteer) {
  if (!supabaseClient) {
    const volunteers = getCollection(STORAGE_KEYS.volunteers);
    volunteers.push(volunteer);
    setCollection(STORAGE_KEYS.volunteers, volunteers);
    return volunteer;
  }

  const { data: createdVolunteer, error: volunteerError } = await supabaseClient
    .from("volunteers")
    .insert({
      full_name: volunteer.name,
      email: volunteer.email,
      password_hash: volunteer.password,
      title: volunteer.title,
      skill: volunteer.skill,
      proficiency: volunteer.proficiency,
      address: volunteer.address,
      city: volunteer.city,
      trust_score: volunteer.trustScore
    })
    .select()
    .single();

  if (volunteerError) throw volunteerError;

  const { error: availabilityError } = await supabaseClient
    .from("volunteer_availability")
    .insert({
      volunteer_id: createdVolunteer.id,
      urgency_bucket: volunteer.availability.urgency,
      start_time: volunteer.availability.start,
      end_time: volunteer.availability.end
    });

  if (availabilityError) throw availabilityError;

  return { ...volunteer, id: createdVolunteer.id };
}

async function fetchVolunteers() {
  if (!supabaseClient) {
    return getCollection(STORAGE_KEYS.volunteers);
  }

  const { data, error } = await supabaseClient
    .from("volunteers")
    .select("id, full_name, email, password_hash, title, skill, proficiency, address, city, trust_score, volunteer_availability(urgency_bucket, start_time, end_time)");

  if (error) throw error;
  return (data || []).map(mapVolunteerFromDb);
}

async function findVolunteerByEmail(email) {
  if (!supabaseClient) {
    return getCollection(STORAGE_KEYS.volunteers).find((entry) => entry.email === email) || null;
  }

  const { data, error } = await supabaseClient
    .from("volunteers")
    .select("id, full_name, email, password_hash, title, skill, proficiency, address, city, trust_score, volunteer_availability(urgency_bucket, start_time, end_time)")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data ? mapVolunteerFromDb(data) : null;
}

async function findVolunteerByCredentials(email, password) {
  if (!supabaseClient) {
    return getCollection(STORAGE_KEYS.volunteers).find(
      (entry) => entry.email === email && entry.password === password
    ) || null;
  }

  const { data, error } = await supabaseClient
    .from("volunteers")
    .select("id, full_name, email, password_hash, title, skill, proficiency, address, city, trust_score, volunteer_availability(urgency_bucket, start_time, end_time)")
    .eq("email", email)
    .eq("password_hash", password)
    .maybeSingle();

  if (error) throw error;
  return data ? mapVolunteerFromDb(data) : null;
}

async function insertOrganiser(organiser) {
  if (!supabaseClient) {
    const organisers = getCollection(STORAGE_KEYS.organisers);
    organisers.push(organiser);
    setCollection(STORAGE_KEYS.organisers, organisers);
    return organiser;
  }

  const { data, error } = await supabaseClient
    .from("organisers")
    .insert({
      organisation_name: organiser.organisation,
      email: organiser.email,
      password_hash: organiser.password
    })
    .select()
    .single();

  if (error) throw error;
  return { ...organiser, id: data.id };
}

async function findOrganiserByEmail(email) {
  if (!supabaseClient) {
    return getCollection(STORAGE_KEYS.organisers).find((entry) => entry.email === email) || null;
  }

  const { data, error } = await supabaseClient
    .from("organisers")
    .select("id, organisation_name, email, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    organisation: data.organisation_name,
    email: data.email,
    password: data.password_hash
  };
}

async function findOrganiserByCredentials(email, password) {
  if (!supabaseClient) {
    return getCollection(STORAGE_KEYS.organisers).find(
      (entry) => entry.email === email && entry.password === password
    ) || null;
  }

  const { data, error } = await supabaseClient
    .from("organisers")
    .select("id, organisation_name, email, password_hash")
    .eq("email", email)
    .eq("password_hash", password)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    organisation: data.organisation_name,
    email: data.email,
    password: data.password_hash
  };
}

async function insertNgoRequestAndMatches(request, organiser, matches) {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("ngo_requests")
    .insert({
      organiser_id: organiser.id,
      required_skill: request.skill,
      urgency_bucket: request.urgency,
      request_date: request.date,
      address: request.address,
      city: request.city,
      start_time: request.startTime,
      duration_hours: request.duration
    })
    .select()
    .single();

  if (error) throw error;
  if (!matches.length) return;

  const payload = matches.map((match) => ({
    request_id: data.id,
    volunteer_id: match.id,
    total_score: match.totalScore,
    skill_score: match.skillScore,
    availability_score: match.availabilityScore,
    location_score: match.locationScore,
    trust_score: match.trustScore,
    suggested_slot: match.suggestedSlot
  }));

  const { error: matchError } = await supabaseClient.from("matches").insert(payload);
  if (matchError) throw matchError;
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

async function initVolunteerPage() {
  const signupForm = document.getElementById("volunteer-signup-form");
  const loginForm = document.getElementById("volunteer-login-form");
  const previewNode = document.getElementById("volunteer-profile-preview");

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const email = document.getElementById("volunteer-email").value.trim().toLowerCase();
      const existing = await findVolunteerByEmail(email);
      if (existing) {
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

      const savedVolunteer = await insertVolunteer(volunteer);
      setSession(STORAGE_KEYS.activeVolunteer, savedVolunteer);
      signupForm.reset();
      setMessage("volunteer-signup-message", "Volunteer account created successfully.");
      previewNode.innerHTML = createVolunteerCard(savedVolunteer);
    } catch (error) {
      setMessage("volunteer-signup-message", `Signup failed: ${error.message}`, true);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const email = document.getElementById("volunteer-login-email").value.trim().toLowerCase();
      const password = document.getElementById("volunteer-login-password").value;
      const volunteer = await findVolunteerByCredentials(email, password);

      if (!volunteer) {
        setMessage("volunteer-login-message", "Invalid volunteer email or password.", true);
        return;
      }

      setSession(STORAGE_KEYS.activeVolunteer, volunteer);
      setMessage("volunteer-login-message", "Volunteer login successful.");
      previewNode.innerHTML = createVolunteerCard(volunteer);
    } catch (error) {
      setMessage("volunteer-login-message", `Login failed: ${error.message}`, true);
    }
  });

  const activeVolunteer = getSession(STORAGE_KEYS.activeVolunteer);
  if (activeVolunteer) {
    previewNode.innerHTML = createVolunteerCard(activeVolunteer);
  }
}

async function initOrganiserPage() {
  const signupForm = document.getElementById("organiser-signup-form");
  const loginForm = document.getElementById("organiser-login-form");
  const requestForm = document.getElementById("request-form");
  const resultsNode = document.getElementById("results");
  const statusNode = document.getElementById("organiser-status");
  const countNode = document.getElementById("volunteer-count");

  const updateVolunteerCount = async () => {
    try {
      const volunteers = await fetchVolunteers();
      countNode.textContent = volunteers.length
        ? `${volunteers.length} volunteer profile(s) available for matching.`
        : "No volunteers registered yet.";
    } catch (error) {
      countNode.textContent = `Unable to load volunteers: ${error.message}`;
    }
  };

  const updateOrganiserStatus = () => {
    const organiser = getSession(STORAGE_KEYS.activeOrganiser);
    statusNode.textContent = organiser
      ? `Logged in as ${organiser.organisation}. You can now post a requirement and match volunteers.`
      : "Please log in as an organiser to run matching.";
  };

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const email = document.getElementById("organiser-email").value.trim().toLowerCase();
      const existing = await findOrganiserByEmail(email);
      if (existing) {
        setMessage("organiser-signup-message", "This organiser email is already registered.", true);
        return;
      }

      const organiser = {
        id: Date.now(),
        organisation: document.getElementById("organiser-name").value.trim(),
        email,
        password: document.getElementById("organiser-password").value
      };

      const savedOrganiser = await insertOrganiser(organiser);
      setSession(STORAGE_KEYS.activeOrganiser, savedOrganiser);
      signupForm.reset();
      setMessage("organiser-signup-message", "Organiser account created successfully.");
      updateOrganiserStatus();
    } catch (error) {
      setMessage("organiser-signup-message", `Signup failed: ${error.message}`, true);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const email = document.getElementById("organiser-login-email").value.trim().toLowerCase();
      const password = document.getElementById("organiser-login-password").value;
      const organiser = await findOrganiserByCredentials(email, password);

      if (!organiser) {
        setMessage("organiser-login-message", "Invalid organiser email or password.", true);
        return;
      }

      setSession(STORAGE_KEYS.activeOrganiser, organiser);
      setMessage("organiser-login-message", "Organiser login successful.");
      updateOrganiserStatus();
    } catch (error) {
      setMessage("organiser-login-message", `Login failed: ${error.message}`, true);
    }
  });

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const organiser = getSession(STORAGE_KEYS.activeOrganiser);
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

      const volunteers = await fetchVolunteers();
      const matches = calculateMatches(request, volunteers);
      renderMatches(matches, request, resultsNode);
      await insertNgoRequestAndMatches(request, organiser, matches);
    } catch (error) {
      resultsNode.innerHTML = `
        <article class="result-item">
          <h4 class="result-name">Matching failed</h4>
          <p class="result-reason">${error.message}</p>
        </article>
      `;
    }
  });

  await updateVolunteerCount();
  updateOrganiserStatus();
}

async function initPage() {
  initThemeToggle();
  const page = document.body.dataset.page;
  if (page === "volunteer") await initVolunteerPage();
  if (page === "organiser") await initOrganiserPage();
}

initPage();
