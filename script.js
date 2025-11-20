let scene, camera, renderer, particles;
const count = 12000;
let currentState = 'sphere';

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);

    camera.position.z = 25;

    createParticles();
    setupEventListeners();
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const p = sphericalDistribution(i);

        positions[i * 3] = p.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2) / 8;
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function setupEventListeners() {
    const btn = document.getElementById("typeBtn");
    const input = document.getElementById("morphText");

    btn.addEventListener("click", () => {
        const t = input.value.trim();
        if (t) morphToText(t);
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const t = input.value.trim();
            if (t) morphToText(t);
        }
    });
}

function createTextPoints(text) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSize = 100;

    ctx.font = `bold ${fontSize}px Arial`;
    const width = ctx.measureText(text).width;

    canvas.width = width + 40;
    canvas.height = fontSize + 40;

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const points = [];

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 128 && Math.random() < 0.3) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor(i / 4 / canvas.width);
            points.push({
                x: (x - canvas.width / 2) / 10,
                y: -(y - canvas.height / 2) / 10
            });
        }
    }

    return points;
}

function morphToText(text) {
    currentState = "text";
    const points = createTextPoints(text);
    const positions = particles.geometry.attributes.position.array;

    const targets = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        if (i < points.length) {
            targets[i * 3] = points[i].x;
            targets[i * 3 + 1] = points[i].y;
            targets[i * 3 + 2] = 0;
        } else {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 20 + 10;
            targets[i * 3] = Math.cos(a) * r;
            targets[i * 3 + 1] = Math.sin(a) * r;
            targets[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: targets[i],
            [i + 1]: targets[i + 1],
            [i + 2]: targets[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    setTimeout(() => morphToSphere(), 4000);
}

function morphToSphere() {
    currentState = "sphere";
    const positions = particles.geometry.attributes.position.array;
    const targets = new Float32Array(count * 3);

    function distribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const p = distribution(i);
        targets[i * 3] = p.x;
        targets[i * 3 + 1] = p.y;
        targets[i * 3 + 2] = p.z;
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: targets[i],
            [i + 1]: targets[i + 1],
            [i + 2]: targets[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (currentState === "sphere") {
        particles.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();