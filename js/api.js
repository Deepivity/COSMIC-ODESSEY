// COSMIC ODYSSEY — API Data Fetching Layer with Cache and Fallbacks

import { fallbackMissions, planetsData, agenciesData } from './static-data.js';

// Caching helper
function getCache(key) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        const now = new Date().getTime();
        // Check if cache has expired (default: 1 hour)
        if (now > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch (e) {
        console.warn("Storage read failure:", e);
        return null;
    }
}

function setCache(key, data, ttlMs = 3600000) { // 1 hour default TTL
    try {
        const expiry = new Date().getTime() + ttlMs;
        localStorage.setItem(key, JSON.stringify({ data, expiry }));
    } catch (e) {
        console.warn("Storage write failure:", e);
    }
}

// Timeout fetch helper
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/**
 * 1. Fetch NASA Astronomy Picture of the Day (APOD)
 */
export async function getApod() {
    const cached = getCache('nasa_apod');
    if (cached) return cached;

    try {
        // Using the official DEMO_KEY which has rate limits, but is public
        const res = await fetchWithTimeout('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        
        const result = {
            title: data.title || "Cosmic Silhouette",
            date: data.date || new Date().toISOString().split('T')[0],
            url: data.url || "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1200",
            hdurl: data.hdurl || data.url,
            explanation: data.explanation || "A beautiful view of deep space, showcasing interstellar gases and distant star clusters."
        };
        
        setCache('nasa_apod', result, 4 * 3600000); // Cache APOD for 4 hours since it changes daily
        return result;
    } catch (error) {
        console.warn("NASA APOD API unavailable, falling back to static photo:", error);
        return {
            title: "Carina Nebula Pillars",
            date: "2026-07-12",
            url: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200",
            hdurl: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200",
            explanation: "Dynamic pillars of cold gas and dark dust wind through the glowing heart of the Carina Nebula, sculpted by energetic stellar winds from nearby supermassive stars."
        };
    }
}

/**
 * 2. Fetch Solar System OpenData API for planets
 */
export async function getPlanetStats(planetName) {
    const cached = getCache(`planet_data_${planetName}`);
    if (cached) return cached;

    const staticBackup = planetsData[planetName.toLowerCase()];

    try {
        // Request the specific planet details from api.le-systeme-solaire.net
        const res = await fetchWithTimeout(`https://api.le-systeme-solaire.net/rest/bodies/${planetName.toLowerCase()}`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const raw = await res.json();

        // Convert the raw values to user-friendly formatting
        const moonsCount = raw.moons ? raw.moons.length : 0;
        const meanTempK = raw.meanTemp || 0;
        const tempC = meanTempK ? Math.round(meanTempK - 273.15) : parseInt(staticBackup.temp);
        
        const result = {
            id: staticBackup.id,
            name: raw.englishName.toUpperCase(),
            tagline: staticBackup.tagline,
            diameter: raw.equaRadius ? `${Math.round(raw.equaRadius * 2).toLocaleString()} km` : staticBackup.diameter,
            gravity: raw.gravity ? `${raw.gravity.toFixed(2)} m/s²` : staticBackup.gravity,
            dayLength: raw.sideralRotation ? `${Math.abs(Math.round(raw.sideralRotation)).toLocaleString()} hours` : staticBackup.dayLength,
            yearLength: raw.sideralOrbit ? `${Math.round(raw.sideralOrbit).toLocaleString()} Earth Days` : staticBackup.yearLength,
            temp: `${tempC} °C`,
            moons: moonsCount === 1 ? "1 Moon" : `${moonsCount} Moons`,
            description: staticBackup.description,
            color: staticBackup.color,
            sizeScale: staticBackup.sizeScale,
            orbitRadius: staticBackup.orbitRadius,
            orbitSpeed: staticBackup.orbitSpeed
        };

        setCache(`planet_data_${planetName}`, result, 24 * 3600000); // Planets don't change, cache for 24h
        return result;
    } catch (error) {
        console.warn(`Solar System API unavailable for ${planetName}. Using static backup:`, error);
        return staticBackup;
    }
}

/**
 * 3. Fetch Space Missions Timeline (Launch Library 2 API)
 */
export async function getMissionsTimeline() {
    const cached = getCache('missions_timeline');
    if (cached) return cached;

    try {
        // LLDev is the development server of Launch Library 2 - it does not require authentication and has no hard CORS restrictions.
        // It's the perfect match for frontend-only web tools.
        const res = await fetchWithTimeout('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=8');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        
        const mapped = data.results.map((launch, idx) => {
            // Find status code mapping
            let statusName = "TBD";
            let statusBadge = "badge-info";
            const code = launch.status?.id;
            
            if (code === 1) { // Go for launch
                statusName = "Go";
                statusBadge = "badge-success";
            } else if (code === 3) { // Launch Success
                statusName = "Success";
                statusBadge = "badge-success";
            } else if (code === 4) { // Failure
                statusName = "Failure";
                statusBadge = "badge-danger";
            } else if (code === 2) { // TBD
                statusName = "TBD";
                statusBadge = "badge-warning";
            } else if (code === 6) { // In flight
                statusName = "Active";
                statusBadge = "badge-success";
            }

            return {
                id: launch.id || `live-launch-${idx}`,
                title: launch.name ? launch.name.split('|')[1]?.trim() || launch.name : "Space Mission",
                agency: launch.launch_service_provider?.name || "Global Agency",
                date: launch.net ? new Date(launch.net).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}) : "TBD",
                netDate: launch.net, // Iso string for countdown calculations
                status: statusName,
                statusBadge: statusBadge,
                rocket: launch.rocket?.configuration?.name || "Carrier Rocket",
                site: launch.pad?.location?.name || "Global Spaceport",
                brief: launch.mission?.description || "Spacecraft deployment operations in low Earth orbit.",
                type: "upcoming"
            };
        });

        // Merge with historic items to present a complete timeline (Past & Upcoming)
        const historic = fallbackMissions.filter(m => m.type === "historical");
        const merged = [...historic, ...mapped];
        
        setCache('missions_timeline', merged, 1800000); // Cache timeline for 30 minutes
        return merged;
    } catch (error) {
        console.warn("Launch Library 2 API failed, using static fallbacks:", error);
        return fallbackMissions;
    }
}

/**
 * 4. Fetch Live ISS Tracker Position (No Auth Required)
 */
export async function getIssPosition() {
    try {
        const res = await fetchWithTimeout('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 3000 });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        
        return {
            latitude: data.latitude.toFixed(4),
            longitude: data.longitude.toFixed(4),
            velocity: `${Math.round(data.velocity).toLocaleString()} km/h`,
            altitude: `${Math.round(data.altitude).toLocaleString()} km`
        };
    } catch (e) {
        // Return a floating default
        const now = new Date().getTime() / 100000;
        return {
            latitude: (Math.sin(now) * 51.6).toFixed(4),
            longitude: ((now * 10) % 360 - 180).toFixed(4),
            velocity: "27,560 km/h",
            altitude: "421 km"
        };
    }
}
