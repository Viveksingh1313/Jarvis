// Arc Reactor - Three.js Holographic Animation
import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';

let scene, camera, renderer;
let reactor, outerRing, innerRing, triangles = [];
let audioLevel = 0;
let targetAudioLevel = 0;
let mouseX = 0, mouseY = 0;

export function initReactor(canvas) {
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x060B14, 5, 15);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x060B14, 1);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1A56DB, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x38BDF8, 2, 10);
    pointLight1.position.set(0, 0, 3);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x1A56DB, 1, 8);
    pointLight2.position.set(2, 2, 2);
    scene.add(pointLight2);
    
    // Create Arc Reactor
    createReactor();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    
    // Start animation loop
    animate();
}

function createReactor() {
    reactor = new THREE.Group();
    
    // Central glow sphere
    const coreGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x38BDF8,
        transparent: true,
        opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    reactor.add(core);
    
    // Central torus (main ring)
    const torusGeometry = new THREE.TorusGeometry(0.5, 0.08, 16, 64);
    const torusMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A56DB,
        emissive: 0x1A56DB,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    reactor.add(torus);
    
    // Inner ring
    const innerRingGeometry = new THREE.TorusGeometry(0.3, 0.03, 8, 32);
    const innerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0x38BDF8,
        emissive: 0x38BDF8,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
    });
    innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    reactor.add(innerRing);
    
    // Outer ring with segments
    const outerRingGeometry = new THREE.TorusGeometry(0.9, 0.04, 8, 48);
    const outerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A56DB,
        emissive: 0x1A56DB,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.3
    });
    outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    reactor.add(outerRing);
    
    // Create 8 triangular segments arranged in a ring
    const triangleCount = 8;
    for (let i = 0; i < triangleCount; i++) {
        const angle = (i / triangleCount) * Math.PI * 2;
        
        // Create triangle shape
        const shape = new THREE.Shape();
        shape.moveTo(0, 0.15);
        shape.lineTo(-0.08, 0);
        shape.lineTo(0.08, 0);
        shape.closePath();
        
        const extrudeSettings = {
            depth: 0.02,
            bevelEnabled: false
        };
        
        const triangleGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const triangleMaterial = new THREE.MeshStandardMaterial({
            color: 0x38BDF8,
            emissive: 0x38BDF8,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        
        const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
        triangle.position.x = Math.cos(angle) * 0.65;
        triangle.position.y = Math.sin(angle) * 0.65;
        triangle.rotation.z = angle - Math.PI / 2;
        
        reactor.add(triangle);
        triangles.push(triangle);
    }
    
    // Add glow rings (particle effect)
    createGlowRings();
    
    scene.add(reactor);
}

function createGlowRings() {
    // Create circular particle ring
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.7 + Math.random() * 0.1;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x38BDF8,
        size: 0.02,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    reactor.add(particles);
}

export function setAudioLevel(level) {
    targetAudioLevel = Math.min(Math.max(level, 0), 1);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Smooth audio level transition
    audioLevel += (targetAudioLevel - audioLevel) * 0.1;
    
    if (reactor) {
        // Rotate outer ring
        outerRing.rotation.z += 0.005 + audioLevel * 0.02;
        
        // Rotate inner ring opposite direction
        innerRing.rotation.z -= 0.003 + audioLevel * 0.01;
        
        // Pulse reactor based on audio level
        const pulseScale = 1 + audioLevel * 0.15;
        reactor.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Update emissive intensity based on audio
        reactor.children.forEach(child => {
            if (child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = 0.3 + audioLevel * 0.7;
            }
        });
        
        // Animate triangles
        triangles.forEach((triangle, i) => {
            const offset = (i / triangles.length) * Math.PI * 2;
            triangle.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.003 + offset) * 0.3 + audioLevel * 0.5;
        });
        
        // Subtle rotation based on mouse
        reactor.rotation.x = mouseY * 0.1;
        reactor.rotation.y = mouseX * 0.1;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
}
