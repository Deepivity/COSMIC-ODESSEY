// COSMIC ODYSSEY — Core Three.js WebGL & Scene Orchestrator

import * as THREE from 'three';
import { BigBangShader, SunShader, AtmosphereShader, ProceduralPlanetShader } from './shaders.js';
import { planetsData } from './static-data.js';

let scene, camera, renderer;
let bigBangParticles, galaxyParticles, solarSystemGroup, sunMesh, planetMeshes = [];
let starsBackground;
let activeScaleMode = 'illustrative'; // 'illustrative' or 'true'

// Animation parameters
let clock = new THREE.Clock();
let isLowFidelity = false;
let prefersReducedMotion = false;
let scrollProgressTarget = 0;
let scrollProgressCurrent = 0;

// Camera trajectory points (X, Y, Z, LookAtX, LookAtY, LookAtZ)
const pathKeyframes = [
    { p: 0.00, pos: [0, 0, 10], look: [0, 0, 0] },     // Singularity
    { p: 0.15, pos: [0, 0, 110], look: [0, 0, 0] },    // Expanded particle field
    { p: 0.30, pos: [30, 80, 160], look: [0, 0, 0] },  // Galactic Dawn overview
    { p: 0.50, pos: [0, 70, 130], look: [0, 0, 0] },   // Solar System settle
    { p: 0.70, pos: [0, 12, 25], look: [0, 0, 0] },    // Zoom to inner planets
    { p: 0.85, pos: [0, 4, 8], look: [0, 0, 0] },      // Zoom close to Earth (home)
    { p: 1.00, pos: [0, 2, 4], look: [0, 0.5, 0] }     // Outtro / Deep Space drift
];

// Earth index reference for focusing
let earthMeshRef = null;

// Secondary Canvas details for planet details panel
let previewScene, previewCamera, previewRenderer, previewPlanetMesh;

/**
 * Main Setup
 */
export function initSpaceScene(canvasId, onProgress) {
    const canvas = document.getElementById(canvasId);
    
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0035);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !isLowFidelity,
        powerPreference: "high-performance",
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Create Components
    createStarsBackground();
    createBigBangParticles(onProgress);
    createGalaxyParticles();
    createSolarSystem();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
    scene.add(ambientLight);

    // Sunlight source (Sun at center)
    const sunLight = new THREE.PointLight(0xffffff, 3.5, 300, 0.5);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Resize Handler
    window.addEventListener('resize', onWindowResize);

    // Trigger Initial Render
    animate();
}

/**
 * Stars Background
 */
function createStarsBackground() {
    const count = isLowFidelity ? 1500 : 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        // Place stars in a huge sphere shell around the solar system
        const radius = 250 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);

        // Subtle color shifts
        const r = Math.random();
        if (r < 0.2) {
            colors[i] = 0.6; colors[i + 1] = 0.8; colors[i + 2] = 1.0; // Cyan tint
        } else if (r < 0.3) {
            colors[i] = 1.0; colors[i + 1] = 0.85; colors[i + 2] = 0.7; // Warm tint
        } else {
            colors[i] = 0.9; colors[i + 1] = 0.9; colors[i + 2] = 0.95; // Cool White
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.9,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

    starsBackground = new THREE.Points(geometry, material);
    scene.add(starsBackground);
}

/**
 * Big Bang Particle Generator
 */
function createBigBangParticles(onProgress) {
    const particleCount = isLowFidelity ? 4000 : 20000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Initial tight core placement (singularity)
        positions[i * 3] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

        // Spherical shell velocities for directional expansion
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 5.0 + Math.random() * 35.0; // Expansion velocity

        velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
        velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
        velocities[i * 3 + 2] = speed * Math.cos(phi);

        // Particle size & random parameter for shaders
        sizes[i] = 2.0 + Math.random() * 12.0;
        randoms[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    const material = new THREE.ShaderMaterial({
        vertexShader: BigBangShader.vertexShader,
        fragmentShader: BigBangShader.fragmentShader,
        uniforms: {
            uProgress: { value: 0.0 },
            uTime: { value: 0.0 },
            uScale: { value: 1.0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    bigBangParticles = new THREE.Points(geometry, material);
    scene.add(bigBangParticles);
    
    if (onProgress) onProgress(100);
}

/**
 * Cosmic Dawn - Spiral Galaxy forming
 */
function createGalaxyParticles() {
    const particleCount = isLowFidelity ? 3000 : 15000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const arms = 2;
    const armAngle = (Math.PI * 2) / arms;

    for (let i = 0; i < particleCount; i++) {
        // Construct logarithmic spiral galaxy arms
        const radius = Math.pow(Math.random(), 2.0) * 80;
        const armIndex = i % arms;
        const angle = armIndex * armAngle + radius * 0.08 + (Math.random() - 0.5) * 0.25;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Flattened disk layout
        const y = (Math.random() - 0.5) * (12.0 / (1.0 + radius * 0.1));

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Core is bright/orange, arms are blue/cyan
        const ratio = radius / 80;
        const colCore = new THREE.Color(0xffaa66);
        const colArm = new THREE.Color(0x00d2ff);
        const finalCol = colCore.clone().lerp(colArm, ratio);

        colors[i * 3] = finalCol.r;
        colors[i * 3 + 1] = finalCol.g;
        colors[i * 3 + 2] = finalCol.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.65,
        vertexColors: true,
        transparent: true,
        opacity: 0, // Starts fully transparent, fades in during scroll
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    galaxyParticles = new THREE.Points(geometry, material);
    galaxyParticles.position.set(0, 0, 0);
    scene.add(galaxyParticles);
}

/**
 * Solar System Group
 */
function createSolarSystem() {
    solarSystemGroup = new THREE.Group();
    solarSystemGroup.position.set(0, 0, 0);
    scene.add(solarSystemGroup);

    // 1. The Sun
    const sunGeom = new THREE.SphereGeometry(6, 32, 32);
    const sunMat = new THREE.ShaderMaterial({
        vertexShader: SunShader.vertexShader,
        fragmentShader: SunShader.fragmentShader,
        uniforms: {
            uTime: { value: 0 }
        }
    });
    sunMesh = new THREE.Mesh(sunGeom, sunMat);
    solarSystemGroup.add(sunMesh);

    // 2. Planets
    let index = 0;
    for (const key in planetsData) {
        const pData = planetsData[key];
        
        // Planet Group (revolves around sun)
        const planetOrbitGroup = new THREE.Group();
        planetOrbitGroup.name = `orbit-group-${key}`;
        
        // Circular orbit line loop
        const orbitGeom = new THREE.BufferGeometry();
        const orbitPoints = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            orbitPoints.push(Math.cos(theta) * pData.orbitRadius, 0, Math.sin(theta) * pData.orbitRadius);
        }
        orbitGeom.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        const orbitMat = new THREE.LineBasicMaterial({
            color: 0x1d1d28,
            transparent: true,
            opacity: 0 // fades in on scroll
        });
        const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
        orbitLine.name = 'orbit-line';
        solarSystemGroup.add(orbitLine);

        // Planet Mesh
        const sphereGeom = new THREE.SphereGeometry(pData.sizeScale * 1.5, 32, 32);
        
        // Match planet type integer for shader code
        let planetTypeInt = 0.0; // 0 = rocky (Mars/Venus/Mercury/Earth)
        if (key === 'jupiter' || key === 'saturn') planetTypeInt = 1.0;
        if (key === 'uranus' || key === 'neptune') planetTypeInt = 2.0;

        const sphereMat = new THREE.ShaderMaterial({
            vertexShader: ProceduralPlanetShader.vertexShader,
            fragmentShader: ProceduralPlanetShader.fragmentShader,
            uniforms: {
                uBaseColor: { value: new THREE.Color(pData.color) },
                uAccentColor: { value: new THREE.Color(0x00f0ff) }, // Aurora Teal accent
                uPlanetType: { value: planetTypeInt },
                uTime: { value: 0 }
            }
        });

        const planetMesh = new THREE.Mesh(sphereGeom, sphereMat);
        planetMesh.position.set(pData.orbitRadius, 0, 0);
        planetMesh.name = `planet-${key}`;
        planetMesh.userData = { 
            key: key, 
            speed: pData.orbitSpeed, 
            orbitRadius: pData.orbitRadius,
            angle: Math.random() * Math.PI * 2 // Random start position
        };

        planetOrbitGroup.add(planetMesh);

        // Earth atmospheric glow
        if (key === 'earth') {
            const atmosphereGeom = new THREE.SphereGeometry(pData.sizeScale * 1.5 * 1.15, 32, 32);
            const atmosphereMat = new THREE.ShaderMaterial({
                vertexShader: AtmosphereShader.vertexShader,
                fragmentShader: AtmosphereShader.fragmentShader,
                uniforms: {
                    uColor: { value: new THREE.Color(0x00f0ff) }
                },
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true
            });
            const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
            atmosphereMesh.name = 'atmosphere';
            planetMesh.add(atmosphereMesh);
            earthMeshRef = planetMesh; // store for LEO cockpit focusing
        }

        // Saturn Rings
        if (key === 'saturn') {
            const ringGeom = new THREE.RingGeometry(pData.sizeScale * 1.5 * 1.4, pData.sizeScale * 1.5 * 2.3, 64);
            // Rotate ring to lie flat
            ringGeom.rotateX(Math.PI / 2.2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xa89370,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.65
            });
            const ringMesh = new THREE.Mesh(ringGeom, ringMat);
            planetMesh.add(ringMesh);
        }

        solarSystemGroup.add(planetOrbitGroup);
        planetMeshes.push(planetMesh);
        index++;
    }

    // Solar system starts hidden/invisible to avoid blending during Big Bang
    solarSystemGroup.visible = false;
}

/**
 * Handle Scroll Progress Updates (triggered by GSAP ScrollTrigger)
 */
export function updateScrollProgress(progress) {
    scrollProgressTarget = Math.max(0, Math.min(progress, 1));
}

/**
 * Toggle between illustrative and true scales
 */
export function setOrbitScaleMode(mode) {
    activeScaleMode = mode;
    
    // Smooth transition
    planetMeshes.forEach(mesh => {
        const key = mesh.userData.key;
        const pData = planetsData[key];
        let targetRadius = pData.orbitRadius;
        
        if (mode === 'true') {
            // Logarithmic compressed true ratios (Mercury: 0.38 AU, Jupiter: 5.2 AU, Neptune: 30 AU)
            // Map actual astronomical units to visible limits (12 to 110 radius units)
            const auMapping = {
                mercury: 0.387,
                venus: 0.723,
                earth: 1.000,
                mars: 1.524,
                jupiter: 5.203,
                saturn: 9.537,
                uranus: 19.191,
                neptune: 30.070
            };
            
            // Map AU logarithmically: radius = 20 + log(au) * scale
            const au = auMapping[key];
            targetRadius = 25 + (Math.log(au + 0.1) * 22);
        }
        
        gsap.to(mesh.position, {
            x: targetRadius,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
                mesh.userData.orbitRadius = mesh.position.x;
            }
        });
        
        // Update orbit line loop dynamically
        const orbitLine = solarSystemGroup.getObjectByName(`orbit-group-${key}`)?.parent?.children.find(c => c.name === 'orbit-line');
        if (orbitLine) {
            // Update the scale of the circular orbit mesh line
            const scaleRatio = targetRadius / pData.orbitRadius;
            gsap.to(orbitLine.scale, {
                x: scaleRatio,
                z: scaleRatio,
                duration: 1.5,
                ease: "power2.out"
            });
        }
    });
}

/**
 * Set Graphics Quality (Fidelity)
 */
export function setFidelity(highQuality) {
    isLowFidelity = !highQuality;
    if (renderer) {
        renderer.setPixelRatio(isLowFidelity ? 1 : Math.min(window.devicePixelRatio, 2));
    }
}

/**
 * Set Reduced Motion
 */
export function setReducedMotion(active) {
    prefersReducedMotion = active;
}

/**
 * Camera Flight helper for Planet clicks
 */
export function focusCameraOnPlanet(planetName, callback) {
    const mesh = planetMeshes.find(m => m.userData.key === planetName);
    if (!mesh) return;

    // Get absolute coordinates of planet
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    // Position camera slightly offset to show the planet on the left/center
    const targetCamPos = new THREE.Vector3(
        worldPos.x - mesh.userData.orbitRadius * 0.05,
        worldPos.y + mesh.scale.x * 2.0,
        worldPos.z + mesh.scale.x * 4.5
    );

    // Animate camera position and target
    gsap.killTweensOf(camera.position);
    
    gsap.to(camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: 2.0,
        ease: "power3.inOut",
        onComplete: () => {
            if (callback) callback();
        }
    });
}

/**
 * Raycasting for planet clicks
 */
export function checkPlanetIntersections(mouseX, mouseY) {
    // Standard normalized raycast check
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(planetMeshes);
    if (intersects.length > 0) {
        // Return clicked planet key
        return intersects[0].object.userData.key;
    }
    return null;
}

/**
 * Planet Detail Panel 3D Preview (Mini Canvas)
 */
export function initPlanetPreview(canvasId, planetName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Secondary scene setup
    previewScene = new THREE.Scene();
    previewCamera = new THREE.PerspectiveCamera(40, rect.width / rect.height, 0.1, 100);
    previewCamera.position.set(0, 0, 6);

    previewRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    previewRenderer.setSize(rect.width, rect.height);
    previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear any previous meshes
    if (previewPlanetMesh) previewScene.add(previewPlanetMesh);

    // Planet Physical Profile
    const pData = planetsData[planetName.toLowerCase()];
    const geom = new THREE.SphereGeometry(1.8, 64, 64);
    
    let planetTypeInt = 0.0;
    if (planetName === 'jupiter' || planetName === 'saturn') planetTypeInt = 1.0;
    if (planetName === 'uranus' || planetName === 'neptune') planetTypeInt = 2.0;

    const mat = new THREE.ShaderMaterial({
        vertexShader: ProceduralPlanetShader.vertexShader,
        fragmentShader: ProceduralPlanetShader.fragmentShader,
        uniforms: {
            uBaseColor: { value: new THREE.Color(pData.color) },
            uAccentColor: { value: new THREE.Color(0x00f0ff) },
            uPlanetType: { value: planetTypeInt },
            uTime: { value: 0 }
        }
    });

    previewPlanetMesh = new THREE.Mesh(geom, mat);
    previewScene.add(previewPlanetMesh);

    // Saturn preview ring
    if (planetName === 'saturn') {
        const ringGeom = new THREE.RingGeometry(2.3, 3.8, 64);
        ringGeom.rotateX(Math.PI / 2.3);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xa89370,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        previewPlanetMesh.add(ringMesh);
    }

    // Directional light offset for preview shading
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(5, 3, 5);
    previewScene.add(light);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    previewScene.add(ambient);
}

export function updatePlanetPreview(planetName) {
    if (previewPlanetMesh) {
        previewScene.remove(previewPlanetMesh);
    }
    
    const pData = planetsData[planetName.toLowerCase()];
    const geom = new THREE.SphereGeometry(1.8, 64, 64);
    
    let planetTypeInt = 0.0;
    if (planetName === 'jupiter' || planetName === 'saturn') planetTypeInt = 1.0;
    if (planetName === 'uranus' || planetName === 'neptune') planetTypeInt = 2.0;

    const mat = new THREE.ShaderMaterial({
        vertexShader: ProceduralPlanetShader.vertexShader,
        fragmentShader: ProceduralPlanetShader.fragmentShader,
        uniforms: {
            uBaseColor: { value: new THREE.Color(pData.color) },
            uAccentColor: { value: new THREE.Color(0x00f0ff) },
            uPlanetType: { value: planetTypeInt },
            uTime: { value: 0 }
        }
    });

    previewPlanetMesh = new THREE.Mesh(geom, mat);
    previewScene.add(previewPlanetMesh);

    if (planetName === 'saturn') {
        const ringGeom = new THREE.RingGeometry(2.3, 3.8, 64);
        ringGeom.rotateX(Math.PI / 2.3);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xa89370,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        previewPlanetMesh.add(ringMesh);
    }
}

/**
 * Window Resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Camera Path Animation Interpolation
 */
function interpolateCameraPath(progress) {
    if (pathKeyframes.length < 2) return;

    // Find the current keyframe bracket
    let startIdx = 0;
    let endIdx = 1;
    for (let i = 0; i < pathKeyframes.length - 1; i++) {
        if (progress >= pathKeyframes[i].p && progress <= pathKeyframes[i + 1].p) {
            startIdx = i;
            endIdx = i + 1;
            break;
        }
    }

    const start = pathKeyframes[startIdx];
    const end = pathKeyframes[endIdx];

    // Local normalized alpha in range [0, 1] for current bracket
    const duration = end.p - start.p;
    const alpha = duration > 0 ? (progress - start.p) / duration : 1.0;

    // Easing function for smoother transitions between camera checkpoints
    const t = gsap.parseEase("power1.inOut")(alpha);

    // Interpolate position
    const camX = start.pos[0] + (end.pos[0] - start.pos[0]) * t;
    const camY = start.pos[1] + (end.pos[1] - start.pos[1]) * t;
    const camZ = start.pos[2] + (end.pos[2] - start.pos[2]) * t;

    // Interpolate lookAt target
    const lookX = start.look[0] + (end.look[0] - start.look[0]) * t;
    const lookY = start.look[1] + (end.look[1] - start.look[1]) * t;
    const lookZ = start.look[2] + (end.look[2] - start.look[2]) * t;

    camera.position.set(camX, camY, camZ);
    camera.lookAt(lookX, lookY, lookZ);
}

/**
 * Rendering Loop
 */
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // 1. Scroll-Camera scrubbing with physics inertia
    const lerpFactor = prefersReducedMotion ? 1.0 : 0.08; // Snap in reduced motion
    scrollProgressCurrent += (scrollProgressTarget - scrollProgressCurrent) * lerpFactor;
    
    // Only drive camera path via scroll if we aren't focused on planet detail panel click
    const isOverlayVisible = document.getElementById('planet-detail-panel').classList.contains('visible');
    if (!isOverlayVisible) {
        interpolateCameraPath(scrollProgressCurrent);
    }

    // 2. Animate Shaders and Uniforms
    if (bigBangParticles && bigBangParticles.material.uniforms) {
        bigBangParticles.material.uniforms.uProgress.value = scrollProgressCurrent;
        bigBangParticles.material.uniforms.uTime.value = time;
    }

    if (sunMesh && sunMesh.material.uniforms) {
        sunMesh.material.uniforms.uTime.value = time;
    }

    // 3. Fade and rotate galactic/stellar groups depending on scroll progress
    if (galaxyParticles) {
        // Rotates spiral galaxy slowly
        galaxyParticles.rotation.y = time * 0.02;
        
        // Fades galaxy in during dawn phase, fades out for solar system
        if (scrollProgressCurrent > 0.1 && scrollProgressCurrent < 0.4) {
            galaxyParticles.material.opacity = (scrollProgressCurrent - 0.1) * 3.3; // Peaks at 1.0 around 0.4
        } else if (scrollProgressCurrent >= 0.4) {
            galaxyParticles.material.opacity = Math.max(0, 1.0 - (scrollProgressCurrent - 0.4) * 5.0); // Fades out completely by 0.6
        } else {
            galaxyParticles.material.opacity = 0;
        }
    }

    if (solarSystemGroup) {
        // Solar system resolves after cosmic dawn
        if (scrollProgressCurrent > 0.35) {
            solarSystemGroup.visible = true;
            
            // Revolve planet meshes around Sun at true orbital speeds
            planetMeshes.forEach(mesh => {
                mesh.userData.angle += mesh.userData.speed * (prefersReducedMotion ? 0.1 : 1.0);
                
                // Keep revolving planet
                const radius = mesh.userData.orbitRadius;
                mesh.position.x = Math.cos(mesh.userData.angle) * radius;
                mesh.position.z = Math.sin(mesh.userData.angle) * radius;
                
                // Axial rotation
                mesh.rotation.y += 0.005;
                
                // Feed local uniforms if procedural surface shader
                if (mesh.material.uniforms) {
                    mesh.material.uniforms.uTime.value = time;
                }
            });
            
            // Fade in orbits lines
            solarSystemGroup.children.forEach(child => {
                if (child.name === 'orbit-line') {
                    child.material.opacity = Math.min(0.25, (scrollProgressCurrent - 0.35) * 4.0);
                }
            });
            
            // Spin the Sun
            sunMesh.rotation.y = time * 0.01;
        } else {
            solarSystemGroup.visible = false;
        }
    }

    // Slowly rotate background stars shell
    if (starsBackground) {
        starsBackground.rotation.y = time * 0.003;
        starsBackground.rotation.x = time * 0.001;
    }

    // 4. Render main view
    renderer.render(scene, camera);

    // 5. Render Planet detail mini-preview canvas if visible
    if (isOverlayVisible && previewRenderer && previewScene && previewCamera) {
        if (previewPlanetMesh) {
            previewPlanetMesh.rotation.y += 0.006;
            if (previewPlanetMesh.material.uniforms) {
                previewPlanetMesh.material.uniforms.uTime.value = time;
            }
        }
        previewRenderer.render(previewScene, previewCamera);
    }
}
