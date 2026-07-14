// COSMIC ODYSSEY — Custom GLSL Shader Definitions for Three.js

export const BigBangShader = {
    vertexShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uScale;
        
        attribute vec3 aVelocity;
        attribute float aSize;
        attribute float aRandom;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vProgress;

        // Simple pseudo-random color mapping
        vec3 getColor(float r) {
            if (r < 0.25) return vec3(0.0, 0.94, 1.0); // Aurora Teal
            if (r < 0.50) return vec3(1.0, 0.48, 0.0); // Solar Orange
            if (r < 0.75) return vec3(1.0, 1.0, 1.0); // Cosmic White
            return vec3(0.12, 0.12, 0.16); // Dust Grey
        }

        void main() {
            vProgress = uProgress;
            
            // Initial position (center point cluster)
            vec3 pos = position;
            
            // Expand outward as progress increases (logarithmic scaling for speed deceleration)
            float expansion = log(1.0 + uProgress * 25.0) * 1.5;
            pos += aVelocity * expansion;
            
            // Add subtle drift/turbulence based on time
            pos.x += sin(uTime * 0.2 + aRandom * 100.0) * 0.2 * uProgress;
            pos.y += cos(uTime * 0.15 + aRandom * 100.0) * 0.2 * uProgress;
            pos.z += sin(uTime * 0.25 + aRandom * 100.0) * 0.2 * uProgress;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size attenuation (gets smaller as it recedes)
            gl_PointSize = aSize * uScale * (250.0 / -mvPosition.z);
            
            // Pass properties to fragment shader
            // Early phase (progress near 0) = glowing white-blue. Later = original particle color
            vec3 targetColor = getColor(aRandom);
            vColor = mix(vec3(1.0, 0.98, 0.9), targetColor, clamp(uProgress * 2.0, 0.0, 1.0));
            
            // Fade out particles that are far out or as progress approaches galaxy transition
            float fadeStart = 0.8;
            if (uProgress > fadeStart) {
                vAlpha = 1.0 - ((uProgress - fadeStart) / (1.0 - fadeStart));
            } else {
                vAlpha = clamp(uProgress * 4.0, 0.0, 1.0);
            }
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vProgress;

        void main() {
            // Draw particles as soft glowing circles
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            
            // Core heat glow
            float glow = 1.0 - (dist * 2.0);
            glow = pow(glow, 1.5);
            
            gl_FragColor = vec4(vColor, glow * vAlpha);
        }
    `
};

export const SunShader = {
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        // GLSL Noise functions for solar turbulence (Classic Perlin Noise)
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        
        float snoise(vec3 v){
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;
            
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - D.yyy;
            
            i = mod(i, 289.0 );
            vec4 p = permute( permute( permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,7*7)
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                            dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
            // Layered noise to create moving solar plumes
            vec3 noisePos = vec3(vUv * 6.0, uTime * 0.25);
            float n = snoise(noisePos);
            n += snoise(noisePos * 2.0) * 0.5;
            n = (n + 1.5) / 3.0; // Normalise
            
            // Solar color mapping: blend rich orange to yellow-white hot core
            vec3 colorCore = vec3(1.0, 0.95, 0.85); // White hot core
            vec3 colorMid = vec3(1.0, 0.48, 0.0);  // Solar Orange
            vec3 colorRim = vec3(0.65, 0.05, 0.0);  // Dark Red
            
            vec3 finalColor = mix(colorRim, colorMid, n);
            finalColor = mix(finalColor, colorCore, pow(n, 4.0));
            
            // Fresnel rim glow for hot corona bleed
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
            
            finalColor += colorMid * fresnel * 1.5;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

export const AtmosphereShader = {
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            // Fresnel coefficient mapping
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            
            // Stronger atmospheric rim effect at high viewing angle (edge of sphere)
            float intensity = pow(0.6 - dot(normal, viewDir), 4.5);
            intensity = clamp(intensity, 0.0, 1.0);
            
            gl_FragColor = vec4(uColor, intensity);
        }
    `
};

export const ProceduralPlanetShader = {
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uAccentColor;
        uniform float uPlanetType; // 0 = rocky (Mars/Venus), 1 = gas giant (Jupiter/Saturn), 2 = ice giant (Neptune)
        uniform float uTime;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        // Simple sine-based noise for planet surface details
        float waveNoise(vec2 p) {
            float v = sin(p.y * 30.0 + sin(p.x * 12.0) * 2.0);
            v += 0.5 * sin(p.y * 60.0 + p.x * 5.0 + uTime * 0.1);
            return (v + 1.5) / 3.0;
        }

        float rockyNoise(vec2 p) {
            float v = sin(p.x * 10.0) * cos(p.y * 10.0);
            v += 0.5 * sin(p.x * 25.0 + p.y * 15.0);
            v += 0.25 * cos(p.y * 50.0);
            return (v + 1.75) / 3.5;
        }

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            
            // Light source: Sun at coordinates (0, 0, 0)
            // For simplicity in planet detail viewport, assume sunlight is slightly offset
            vec3 lightDir = normalize(vec3(1.5, 0.5, 1.0));
            float diff = max(dot(normal, lightDir), 0.0);
            
            // Surface texture generation based on planet type
            vec3 surfaceColor = uBaseColor;
            if (uPlanetType == 1.0) {
                // Gas Giant: bands and turbulence
                float noise = waveNoise(vUv);
                surfaceColor = mix(uBaseColor, uAccentColor, noise);
            } else if (uPlanetType == 0.0) {
                // Rocky planet: craters and ridges
                float noise = rockyNoise(vUv);
                surfaceColor = mix(uBaseColor, uAccentColor, noise);
            } else if (uPlanetType == 2.0) {
                // Ice Giant: smooth methane banding
                float noise = sin(vUv.y * 22.0) * 0.5 + 0.5;
                surfaceColor = mix(uBaseColor, uAccentColor, noise * 0.3);
            }
            
            // Standard diffuse lighting shading
            vec3 litColor = surfaceColor * (diff * 0.85 + 0.15); // Ambient level 0.15
            
            // Add subtle atmospheric fresnel glow overlay to planets
            float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
            litColor += uAccentColor * fresnel * 0.45;
            
            gl_FragColor = vec4(litColor, 1.0);
        }
    `
};
