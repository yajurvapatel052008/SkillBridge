# Volunteer Skill-Matching Prototype

This is a lightweight front-end prototype for the hackathon problem statement:

- Volunteers sign up and create their own profile with address and city
- Organisers sign up separately and log in to request help
- A weighted matching engine ranks only registered volunteers
- The UI explains why a volunteer is recommended
- A basic schedule overlap suggestion is shown

## Files

- `index.html`: landing page and role selection
- `volunteer.html`: volunteer signup, login, and profile preview
- `organiser.html`: organiser signup, login, and matching dashboard
- `styles.css`: visual design and responsive layout
- `app.js`: Supabase-first data layer with local fallback
- `script.js`: older local prototype logic kept as reference
- `supabase-config.js`: local config file for your Supabase URL and anon key
- `supabase-config.example.js`: sample config template
- `schema.sql`: starter PostgreSQL schema for moving to a real database
- `seed_demo.sql`: demo volunteer data for Supabase

## Demo flow

1. Start the local Node server with `npm start`.
2. Open `http://127.0.0.1:3000/index.html` in a browser.
3. Go to `volunteer.html` and register 2-3 volunteers with different skills and cities.
4. Go to `organiser.html`, create or log into an organiser account.
5. Submit a request with organisation address and city, then show that only volunteer-entered data is used for matching.

## Supabase setup

1. Create a new project in Supabase.
2. Open the SQL editor and run `schema.sql`.
3. Open `supabase-config.example.js`, copy the values into `supabase-config.js`.
4. Put your Supabase project URL in `url`.
5. Put your Supabase anon key in `anonKey`.
6. Open the pages in a browser with internet access.

## Demo seed data

1. Open Supabase `SQL Editor`.
2. Open `seed_demo.sql`.
3. Run it after `schema.sql`.
4. Use any demo volunteer email from the file with password `demo123`.

This script uses `on conflict do nothing`, so running it again will not duplicate demo volunteers.

## Current behavior

- If `supabase-config.js` has valid credentials, the app reads and writes data from Supabase.
- If credentials are blank, the app falls back to browser local storage so the prototype still works.
- Passwords are stored as plain text in this prototype flow, which is okay for hackathon demo use but not for production.

## Suggested next step

Convert this prototype into a full stack app with:

- `Next.js` for UI and API routes
- `Supabase` for volunteer and NGO request storage
- PostgreSQL for structured matching data
