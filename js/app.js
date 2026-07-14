// COSMIC ODYSSEY — Main Application Controller & UI Orchestrator

import { initSpaceScene, updateScrollProgress, setOrbitScaleMode, focusCameraOnPlanet, checkPlanetIntersections, initPlanetPreview, updatePlanetPreview, setFidelity, setReducedMotion } from './space-scene.js';
import { getPlanetStats, getMissionsTimeline, getApod, getIssPosition } from './api.js';
import { agenciesData, planetsData } from './static-data.js';

let lenis;
let audioContext = null;
let osc1, osc2, filter, gainNode;
let isAudioPlaying = false;
let currentPlanetIndex = 2; // Default to Earth
const planetKeys = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Loader
    simulateLoading();

    // 2. Initialize Telemetry Header Clock
    startHeaderClock();
});

/**
 * Loader Simulation (Telescope Calibration)
 */
function simulateLoading() {
    const loaderBar = document.getElementById('loader-bar');
    const loaderPercentage = document.getElementById('loader-percentage');
    const loaderStatus = document.getElementById('loader-status');
    const loaderOverlay = document.getElementById('loader');

    const statusTexts = [
        "CALIBRATING PRIMARY MIRROR...",
        "ALIGNING ROTATIONAL ACTUATORS...",
        "SYNCHRONIZING STAR MAPS...",
        "STABILIZING SPECTRAL RECEIVER...",
        "SYSTEMS READY // CALIBRATED"
    ];

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress > 100) progress = 100;

        loaderBar.style.width = `${progress}%`;
        loaderPercentage.innerText = `${progress.toString().padStart(2, '0')}%`;

        // Update status text based on progress
        const textIdx = Math.min(Math.floor(progress / 22), statusTexts.length - 1);
        loaderStatus.innerText = statusTexts[textIdx];

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                loaderOverlay.classList.add('fade-out');
                document.body.classList.remove('loading-active');
                
                // Initialize active scroll structures
                initApp();
            }, 800);
        }
    }, 80);
}

/**
 * Initialize Web App structures after Loader fades out
 */
function initApp() {
    // A. Initialize Three.js Scene
    initSpaceScene('webgl-canvas', (percent) => {
        console.log(`WebGL Engine ready: ${percent}%`);
    });

    // B. Initialize Smooth Scroll Engine (Lenis)
    initSmoothScroll();

    // C. Bind UI controls
    bindUiControls();

    // D. Fetch dynamic details & populate grids
    populateAgencyGrid();
    setupTimeline();
    setupCockpitTelemetry();
}

/**
 * Smooth Scroll Engine binding with Lenis and GSAP
 */
function initSmoothScroll() {
    // Initialize Lenis
    lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo easing
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1.1,
        smoothTouch: false
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Setup ScrollTriggers for each section
    const sections = document.querySelectorAll('.scroll-section');
    
    sections.forEach((sec, idx) => {
        const timestamp = sec.getAttribute('data-timestamp') || '';
        const subtext = sec.getAttribute('data-sub') || '';
        
        ScrollTrigger.create({
            trigger: sec,
            start: "top center",
            end: "bottom center",
            onEnter: () => updateActiveSectionUi(sec.id, timestamp, subtext),
            onEnterBack: () => updateActiveSectionUi(sec.id, timestamp, subtext)
        });
    });

    // Main scroll progress scrubber for camera path
    ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
            // Update Three.js camera position
            updateScrollProgress(self.progress);
            
            // Update UI navigation rail fill height
            document.getElementById('nav-indicator-fill').style.height = `${self.progress * 100}%`;
            
            // Planet Selector Dock visible control
            const solarSection = document.getElementById('section-solarsystem');
            const rect = solarSection.getBoundingClientRect();
            const solarInView = rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2;
            const planetDock = document.getElementById('planet-dock');
            
            if (solarInView) {
                planetDock.classList.add('visible');
            } else {
                // If planet details panel is not visible, hide the floating dock
                if (!document.getElementById('planet-detail-panel').classList.contains('visible')) {
                    planetDock.classList.remove('visible');
                }
            }
        }
    });
}

/**
 * Update HUD labels and active buttons as user enters sections
 */
function updateActiveSectionUi(sectionId, timestamp, subtext) {
    // Update active telemetry stamp
    document.getElementById('current-timeline-val').innerText = timestamp;
    document.getElementById('current-timeline-sub').innerText = subtext;

    // Set active section class for fading in HTML cards
    document.querySelectorAll('.scroll-section').forEach(sec => {
        if (sec.id === sectionId) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });

    // Update left rail button indicator active state
    const railIdMap = {
        'section-bigbang': 'btn-nav-bigbang',
        'section-dawn': 'btn-nav-dawn',
        'section-solarsystem': 'btn-nav-solar',
        'section-missions': 'btn-nav-missions',
        'section-orgs': 'btn-nav-orgs',
        'section-crew': 'btn-nav-crew',
        'section-footer': 'btn-nav-crew' // keep cockpit active at footer
    };

    const targetBtnId = railIdMap[sectionId];
    document.querySelectorAll('.nav-chapter-btn').forEach(btn => {
        if (btn.id === targetBtnId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Dynamic telemetry clock
 */
function startHeaderClock() {
    setInterval(() => {
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        const secs = now.getSeconds().toString().padStart(2, '0');
        document.getElementById('header-time').innerText = `SYS_TIME // ${hrs}:${mins}:${secs}`;
    }, 1000);
}

/**
 * Bind UI Button clicks and events
 */
function bindUiControls() {
    // 1. Navigation Rail Button Clicks
    document.querySelectorAll('.nav-chapter-btn, .scroll-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target') || btn.getAttribute('href').replace('#', '');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                lenis.scrollTo(targetEl, { offset: 0, duration: 1.8 });
            }
        });
    });

    // 2. Audio Control Dock Toggle (Deep Space Synthesized Drone)
    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.addEventListener('click', () => {
        if (!isAudioPlaying) {
            initCosmicAudio();
            gainNode.gain.setTargetAtTime(0.2, audioContext.currentTime, 1.5);
            soundBtn.classList.add('active');
            soundBtn.querySelector('.control-label').innerText = "AUDIO ON";
            isAudioPlaying = true;
            logTerminalEvent("Cosmic synthesizer online (Low-frequency drone at 55Hz)");
        } else {
            gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.4);
            soundBtn.classList.remove('active');
            soundBtn.querySelector('.control-label').innerText = "AUDIO OFF";
            isAudioPlaying = false;
            logTerminalEvent("Cosmic synthesizer offline");
        }
    });

    // 3. Fidelity Quality Toggle
    const fidelityBtn = document.getElementById('fidelity-toggle');
    let highQuality = true;
    fidelityBtn.addEventListener('click', () => {
        highQuality = !highQuality;
        setFidelity(highQuality);
        if (highQuality) {
            fidelityBtn.classList.remove('low-fidelity');
            fidelityBtn.querySelector('.control-label').innerText = "HIGH QUALITY";
            logTerminalEvent("Optics scale: high fidelity antialiasing enabled");
        } else {
            fidelityBtn.classList.add('low-fidelity');
            fidelityBtn.querySelector('.control-label').innerText = "PERFORMANCE MODE";
            logTerminalEvent("Optics scale: reduced resolution downsampling active");
        }
    });

    // 4. Reduced Motion Toggle
    const motionBtn = document.getElementById('motion-toggle');
    let motionReduced = false;
    
    // Auto-detect browser preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        motionReduced = true;
        motionBtn.classList.add('active');
        setReducedMotion(true);
        if (lenis) lenis.destroy();
    }
    
    motionBtn.addEventListener('click', () => {
        motionReduced = !motionReduced;
        setReducedMotion(motionReduced);
        if (motionReduced) {
            motionBtn.classList.add('active');
            if (lenis) lenis.destroy();
            logTerminalEvent("Motion physics overrides: snapping active");
        } else {
            motionBtn.classList.remove('active');
            initSmoothScroll();
            logTerminalEvent("Motion physics overrides: inertia enabled");
        }
    });

    // 5. Orbits scale toggle
    const scaleBtn = document.getElementById('toggle-scale-btn');
    scaleBtn.addEventListener('click', () => {
        if (activeScaleMode === 'illustrative') {
            activeScaleMode = 'true';
            scaleBtn.innerText = "SCALE: COMPRESSED TRUE";
            setOrbitScaleMode('true');
            logTerminalEvent("Solar telemetry: switched to true distance logarithms");
        } else {
            activeScaleMode = 'illustrative';
            scaleBtn.innerText = "SCALE: ILLUSTRATIVE";
            setOrbitScaleMode('illustrative');
            logTerminalEvent("Solar telemetry: switched to visual orbit equalizing");
        }
    });

    // 6. Raycasting clicks on Main WebGL Canvas (click planet directly)
    window.addEventListener('click', (e) => {
        // Only click if we are in the Solar System section and click is on canvas
        if (e.target.id === 'webgl-canvas') {
            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            const clickedPlanet = checkPlanetIntersections(mouseX, mouseY);
            if (clickedPlanet) {
                openPlanetDetails(clickedPlanet);
            }
        }
    });

    // 7. Planet selector dock buttons
    document.querySelectorAll('.planet-dock-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-planet');
            openPlanetDetails(name);
        });
    });

    // 8. Planet details panel close and slider nav
    document.getElementById('planet-panel-close').addEventListener('click', closePlanetDetails);
    
    document.getElementById('planet-btn-prev').addEventListener('click', () => {
        currentPlanetIndex = (currentPlanetIndex - 1 + planetKeys.length) % planetKeys.length;
        openPlanetDetails(planetKeys[currentPlanetIndex]);
    });
    
    document.getElementById('planet-btn-next').addEventListener('click', () => {
        currentPlanetIndex = (currentPlanetIndex + 1) % planetKeys.length;
        openPlanetDetails(planetKeys[currentPlanetIndex]);
    });

    // 9. Mission detail modal close
    document.getElementById('mission-modal-close').addEventListener('click', () => {
        document.getElementById('mission-modal').classList.remove('visible');
    });

    // 10. NASA APOD modal close
    document.getElementById('apod-modal-close').addEventListener('click', () => {
        document.getElementById('apod-modal').classList.remove('visible');
    });
}

/**
 * Web Audio Synthesized deep low ambient drone (Zero Asset dependencies)
 */
function initCosmicAudio() {
    if (audioContext) return;
    
    // Create AudioContext
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Oscillator 1: Main hum (55Hz - A1 note)
    osc1 = audioContext.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, audioContext.currentTime);
    
    // Oscillator 2: Beating phasing oscillator (55.4Hz)
    osc2 = audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55.4, audioContext.currentTime);

    // Biquad filter: Cut off high frequencies to create a clean deep ambient hum
    filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, audioContext.currentTime);
    filter.Q.setValueAtTime(1.5, audioContext.currentTime);

    // Volume gain node
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    // Patch nodes
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start oscillators
    osc1.start();
    osc2.start();
}

/**
 * Open Planet Details sliding panel
 */
async function openPlanetDetails(planetName) {
    const panel = document.getElementById('planet-detail-panel');
    const isAlreadyVisible = panel.classList.contains('visible');
    
    currentPlanetIndex = planetKeys.indexOf(planetName.toLowerCase());
    
    // Highlight planet selector in the dock
    document.querySelectorAll('.planet-dock-item').forEach(btn => {
        if (btn.getAttribute('data-planet') === planetName.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Open detail values
    const data = await getPlanetStats(planetName);
    
    document.getElementById('planet-sys-id').innerText = data.id;
    document.getElementById('planet-name').innerText = data.name;
    document.getElementById('planet-tagline').innerText = data.tagline;
    document.getElementById('planet-description').innerText = data.description;
    
    document.getElementById('planet-val-diameter').innerText = data.diameter;
    document.getElementById('planet-val-gravity').innerText = data.gravity;
    document.getElementById('planet-val-day').innerText = data.dayLength;
    document.getElementById('planet-val-year').innerText = data.yearLength;
    document.getElementById('planet-val-temp').innerText = data.temp;
    document.getElementById('planet-val-moons').innerText = data.moons;

    // Show details panel
    panel.classList.add('visible');
    
    // Animate camera to focus planet close-up
    focusCameraOnPlanet(planetName.toLowerCase());

    // Initialize/Update the separate planet 3D Preview inside panel
    if (!isAlreadyVisible) {
        // Wait a frame for CSS panel sliding transition to capture rect sizing
        setTimeout(() => {
            initPlanetPreview('planet-preview-canvas', planetName.toLowerCase());
        }, 100);
    } else {
        updatePlanetPreview(planetName.toLowerCase());
    }

    logTerminalEvent(`Telemetry lock established: ${data.name}`);
}

function closePlanetDetails() {
    document.getElementById('planet-detail-panel').classList.remove('visible');
    document.querySelectorAll('.planet-dock-item').forEach(btn => btn.classList.remove('active'));
    logTerminalEvent("Telemetry lock terminated. Overview sweep initialized");
}

/**
 * Agencies dossiers layout populator
 */
function populateAgencyGrid() {
    const grid = document.getElementById('agencies-grid');
    grid.innerHTML = '';
    
    let totalLaunchCount = 0;

    for (const key in agenciesData) {
        const ag = agenciesData[key];
        totalLaunchCount += ag.launchesCount;

        const card = document.createElement('div');
        card.className = 'agency-card';
        card.innerHTML = `
            <div class="agency-name">${ag.name}</div>
            <div class="agency-focus">${ag.fullName}</div>
            <div class="agency-detail-grid">
                <div class="detail-item">
                    <span class="label">ESTABLISHED</span>
                    <span class="value">${ag.founded}</span>
                </div>
                <div class="detail-item">
                    <span class="label">HEADQUARTERS</span>
                    <span class="value">${ag.hq}</span>
                </div>
                <div class="detail-item">
                    <span class="label">FOCUS FOCUS</span>
                    <span class="value code" style="color: var(--color-accent);">${ag.launchesCount} LAUNCHES</span>
                </div>
                <div class="detail-item">
                    <span class="label">LAUNCH RANK</span>
                    <span class="value">ACTIVE</span>
                </div>
            </div>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); line-height: 1.5;">${ag.details}</p>
        `;
        grid.appendChild(card);
    }

    // Set combined launch matrix value in cockpit
    document.getElementById('launch-total-count').innerText = `${totalLaunchCount} FLIGHTS`;
}

/**
 * Launch Library 2 dynamic upcoming timeline populator
 */
async function setupTimeline() {
    const listContainer = document.getElementById('timeline-container');
    listContainer.innerHTML = '<div class="viewport-loader">SYNCHRONIZING TIMELINE CHANNELS...</div>';
    
    const missions = await getMissionsTimeline();
    listContainer.innerHTML = ''; // clear loader
    
    // Sort so historical missions are first, followed by upcoming
    missions.forEach((m) => {
        const card = document.createElement('div');
        card.className = 'mission-card';
        
        let statusBadgeClass = m.statusBadge || 'badge-info';
        
        card.innerHTML = `
            <div class="card-header">
                <span class="agency-badge">${m.agency}</span>
                <span class="badge ${statusBadgeClass}">${m.status.toUpperCase()}</span>
            </div>
            <h4>${m.title}</h4>
            <div class="mission-date code">${m.date}</div>
            <p class="mission-brief">${m.brief}</p>
            <button class="hud-btn card-action-btn" style="padding: 5px 10px; font-size: 0.65rem; align-self: flex-start;">TELEMETRY LINK</button>
        `;
        
        // Modal overlay trigger
        card.querySelector('.card-action-btn').addEventListener('click', () => {
            openMissionModal(m);
        });

        listContainer.appendChild(card);
    });

    // Set countdown clock for the first upcoming mission in the feed
    const firstUpcoming = missions.find(m => m.type === 'upcoming' && m.netDate);
    if (firstUpcoming) {
        startCountdown(firstUpcoming);
    } else {
        // Fallback upcoming countdown
        startCountdown({
            title: "ARTEMIS II LUNAR ORBIT",
            netDate: "2026-09-14T14:30:00Z",
            brief: "First crewed spacecraft to fly around the Moon under the Artemis program, certifying SLS and Orion spacecraft."
        });
    }
}

/**
 * Mission Modal view
 */
function openMissionModal(mission) {
    const modal = document.getElementById('mission-modal');
    
    document.getElementById('mission-modal-agency').innerText = `${mission.agency.toUpperCase()} // LOGISTICS DOSSIER`;
    document.getElementById('mission-modal-title').innerText = mission.title;
    
    const badge = document.getElementById('mission-modal-status');
    badge.innerText = mission.status.toUpperCase();
    badge.className = `badge ${mission.statusBadge || 'badge-info'}`;

    document.getElementById('mission-modal-site').innerText = mission.site;
    document.getElementById('mission-modal-rocket').innerText = mission.rocket;
    document.getElementById('mission-modal-date').innerText = mission.date;
    document.getElementById('mission-modal-desc').innerText = mission.brief;

    modal.classList.add('visible');
}

/**
 * Launch Countdown HUD clock timer
 */
let countdownTimerInterval = null;
function startCountdown(mission) {
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);

    document.getElementById('upcoming-mission-name').innerText = mission.title.toUpperCase();
    document.getElementById('upcoming-mission-desc').innerText = mission.brief;

    const targetDate = new Date(mission.netDate).getTime();

    const updateClock = () => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        const clockEl = document.getElementById('upcoming-countdown');

        if (diff <= 0) {
            clockEl.innerText = "00d 00h 00m 00s";
            clockEl.style.color = "var(--color-accent)";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        clockEl.innerText = `${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    };

    updateClock();
    countdownTimerInterval = setInterval(updateClock, 1000);
}

/**
 * Cockpit Telemetry - APOD & Live ISS
 */
async function setupCockpitTelemetry() {
    // 1. APOD Feed
    const apodViewport = document.getElementById('apod-viewport');
    const apodData = await getApod();
    
    apodViewport.innerHTML = `<img src="${apodData.url}" alt="${apodData.title}">`;
    document.getElementById('apod-title').innerText = apodData.title.toUpperCase();
    document.getElementById('apod-date').innerText = apodData.date;

    const expandBtn = document.getElementById('apod-expand-btn');
    expandBtn.addEventListener('click', () => {
        const modal = document.getElementById('apod-modal');
        document.getElementById('apod-modal-title').innerText = apodData.title;
        document.getElementById('apod-modal-date').innerText = apodData.date;
        document.getElementById('apod-modal-desc').innerText = apodData.explanation;
        modal.classList.add('visible');
    });

    // 2. ISS Position Tracker
    const updateIss = async () => {
        const issData = await getIssPosition();
        
        document.getElementById('iss-lat').innerText = `${issData.latitude}°`;
        document.getElementById('iss-lon').innerText = `${issData.longitude}°`;
        
        logTerminalEvent(`ISS Tracker check: Lat ${issData.latitude}, Lon ${issData.longitude}. Alt ${issData.altitude}. Speed ${issData.velocity}`);
    };

    updateIss();
    setInterval(updateIss, 3000); // Check ISS position every 3 seconds
}

/**
 * Telemetry log event print helper
 */
function logTerminalEvent(message) {
    const logs = document.getElementById('telemetry-logs');
    if (!logs) return;

    const time = new Date().toLocaleTimeString(undefined, {hour12: false});
    const logLine = document.createElement('div');
    logLine.className = 'log-line';
    logLine.innerText = `> [${time}] ${message}`;
    
    logs.appendChild(logLine);
    
    // Auto-scroll logs to bottom
    logs.scrollTop = logs.scrollHeight;

    // Prune logs if too long (keep last 12)
    while (logs.children.length > 12) {
        logs.removeChild(logs.firstChild);
    }
}
