// ============================================================
// ARCHIVO: galaxy_comentado.js
// DESCRIPCIÓN: Escena 3D interactiva de galaxia con Three.js
// Incluye: galaxia de partículas, hành tinh central, anillos
// de texto, estrellas fugaces, grupos de puntos con imágenes/videos
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// ============================================================
// SECCIÓN 1: INICIALIZACIÓN DE ESCENA, CÁMARA Y RENDERER
// ============================================================

// ESCENA: El contenedor principal de todos los objetos 3D
const scene = new THREE.Scene();

// NIEBLA EXPONENCIAL: Hace que los objetos lejanos se desvanezcan en negro
// Parámetro 1 (0x000000): Color de la niebla → cambia para niebla de otro color (ej: 0x0a0020 para azul oscuro)
// Parámetro 2 (0.0015): Densidad → AUMENTAR (ej: 0.005) para niebla más densa/corta distancia
//                                  REDUCIR (ej: 0.0005) para ver más lejos antes de que la niebla aparezca
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

// CÁMARA PERSPECTIVA: Simula ojo humano con perspectiva
// Parámetro 1 (75): Campo de visión en grados → AUMENTAR para ver más área (efecto gran angular)
//                                                REDUCIR para efecto teleobjetivo (objetos parecen más cercanos)
// Parámetro 2: Relación de aspecto (ancho/alto) → no cambiar, se calcula automáticamente
// Parámetro 3 (0.1): Plano cercano de recorte → objetos más cerca de 0.1 unidades no se renderizan
// Parámetro 4 (100000): Plano lejano de recorte → objetos más lejos de 100000 no se renderizan
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

// POSICIÓN INICIAL DE LA CÁMARA (antes de la animación de intro)
// x=0: centrada horizontalmente
// y=20: 20 unidades arriba del origen → AUMENTAR para vista más aérea
// z=30: 30 unidades al frente del origen → AUMENTAR para cámara más alejada al inicio
camera.position.set(0, 20, 30);

// RENDERER WebGL: Motor de renderizado de gráficos 3D
// antialias: true → Suaviza bordes dentados (más calidad, más lento en hardware débil)
//            false → Más rendimiento, bordes más ásperos
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Límite de píxeles de pantalla (para pantallas Retina/4K)
// Math.min(window.devicePixelRatio, 2) → Máximo 2x para no sobrecargar GPU
// Cambiar "2" a "1" para forzar resolución estándar (más rendimiento en móviles)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Espacio de color SRGB: Estándar para pantallas modernas
// Cambiar a THREE.LinearSRGBColorSpace si los colores se ven lavados
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);


// ============================================================
// SECCIÓN 2: CONTROLES DE ÓRBITA (OrbitControls)
// ============================================================

// Permite rotar, hacer zoom y pan con mouse/touch
const controls = new OrbitControls(camera, renderer.domElement);

// Amortiguación de movimiento: hace que la cámara se detenga suavemente
// true = movimiento fluido (recomendado), false = parada brusca
controls.enableDamping = true;

// Rotación automática de la cámara alrededor del objetivo
// true = la cámara gira sola, false = estática hasta que el usuario la mueva
controls.autoRotate = true;

// Velocidad de rotación automática
// 0.5 = lento y suave → AUMENTAR (ej: 2.0) para rotación más rápida
//                       REDUCIR (ej: 0.1) para casi estática
controls.autoRotateSpeed = 0.5;

// Deshabilitado al inicio (se habilita después de la animación de intro)
// false = usuario NO puede mover la cámara aún
controls.enabled = false;

// Punto al que apunta la cámara (centro de órbita)
// Set(0,0,0) = apunta al origen (al planeta central)
controls.target.set(0, 0, 0);

// Deshabilita el paneo lateral (arrastrar con botón central)
// false = usuario no puede "deslizar" la vista → cambiar a true para permitirlo
controls.enablePan = false;

// Distancia mínima de zoom (cuánto puede acercarse el usuario)
// 15 = no puede acercarse más de 15 unidades al planeta
// REDUCIR (ej: 5) para poder acercarse más, AUMENTAR para mantener más distancia
controls.minDistance = 15;

// Distancia máxima de zoom (cuánto puede alejarse el usuario)
// 300 = máximo alejamiento permitido
// REDUCIR para que el usuario no pueda alejarse demasiado
controls.maxDistance = 300;

// Velocidad de zoom con rueda del mouse
// 0.3 = zoom lento y preciso → AUMENTAR (ej: 1.0) para zoom más rápido
controls.zoomSpeed = 0.3;

// Velocidad de rotación manual con mouse
// 0.3 = rotación lenta → AUMENTAR para rotación más sensible al mouse
controls.rotateSpeed = 0.3;
controls.update();


// ============================================================
// SECCIÓN 3: FUNCIÓN UTILITARIA - EFECTO GLOW (RESPLANDOR)
// ============================================================

// Crea un sprite con resplandor usando un canvas con gradiente radial
// Uso: Se usa para el brillo central y las nebulosas
//
// @param color (string): Color CSS del resplandor (ej: 'rgba(255,255,255,0.8)')
//   → Cambiar para distintos colores de brillo
// @param size (number): Resolución del canvas en píxeles (default: 128)
//   → AUMENTAR para resplandor más detallado (más calidad, más memoria)
//   → REDUCIR para mejor rendimiento
// @param opacity (number): Opacidad del sprite (default: 0.55)
//   → 0.0 = invisible, 1.0 = completamente opaco
function createGlowMaterial(color, size = 128, opacity = 0.55) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');

    // Gradiente radial: del centro (color) hacia los bordes (transparente)
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);          // Centro: color sólido
    gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Borde: completamente transparente
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: opacity,
        depthWrite: false,           // No escribe en el buffer de profundidad (evita artefactos)
        blending: THREE.AdditiveBlending // Se SUMA al color de fondo (efecto luminoso/neón)
                                         // Cambiar a THREE.NormalBlending para mezcla normal (oculta lo de atrás)
    });
    return new THREE.Sprite(material);
}


// ============================================================
// SECCIÓN 4: CREACIÓN DE ELEMENTOS VISUALES DE FONDO
// ============================================================

// --- BRILLO CENTRAL ---
// El resplandor blanco en el centro de la escena (encima del planeta)
// createGlowMaterial('rgba(255,255,255,0.8)', 156, 0.25):
//   → Color: blanco casi opaco
//   → Tamaño canvas: 156px
//   → Opacidad: 0.25 (sutil) → AUMENTAR para brillo más intenso
const centralGlow = createGlowMaterial('rgba(255,255,255,0.8)', 156, 0.25);

// scale.set(8, 8, 1): Tamaño visual del sprite en unidades 3D
// → AUMENTAR para un halo más grande alrededor del planeta
centralGlow.scale.set(8, 8, 1);
scene.add(centralGlow);

// --- NUBES DE NEBULOSA ---
// Crea 15 manchas de colores aleatorios en el fondo del espacio
// Cambiar "15" para más o menos nebulosas
for (let i = 0; i < 15; i++) {
    // Color aleatorio con tono (hue) variable, saturación fija al 80%, brillo 50%
    const hue = Math.random() * 360; // 0-360: todo el espectro de colores
    const color = `hsla(${hue}, 80%, 50%, 0.6)`; // Cambiar 80% y 50% para colores distintos
    const nebula = createGlowMaterial(color, 256); // 256px de resolución

    // Tamaño de la nebulosa: 100x100 unidades (muy grandes, como fondo)
    // → AUMENTAR para nebulosas más grandes y difusas
    nebula.scale.set(100, 100, 1);

    // Posición aleatoria dentro de un cubo de 175x175x175 unidades
    // → AUMENTAR 175 para esparcir nebulosas más lejos del centro
    nebula.position.set(
        (Math.random() - 0.5) * 175,
        (Math.random() - 0.5) * 175,
        (Math.random() - 0.5) * 175
    );
    scene.add(nebula);
}


// ============================================================
// SECCIÓN 5: PARÁMETROS DE LA GALAXIA
// ============================================================

const galaxyParameters = {
    // Número total de partículas de fondo de la galaxia
    // → AUMENTAR (ej: 200000) para galaxia más densa (más lento)
    // → REDUCIR (ej: 50000) para mejor rendimiento
    count: 100000,

    // Número de brazos espirales de la galaxia
    // → AUMENTAR (ej: 8) para más brazos, REDUCIR (ej: 3) para menos
    arms: 6,

    // Radio máximo de la galaxia en unidades 3D
    // → AUMENTAR para galaxia más extensa, REDUCIR para más compacta
    radius: 100,

    // Cuánto se "tuercen" los brazos espirales
    // → AUMENTAR (ej: 1.5) para espirales más cerradas
    // → REDUCIR (ej: 0.1) para brazos casi rectos
    spin: 0.5,

    // Qué tan dispersas están las partículas respecto al brazo ideal
    // → AUMENTAR (ej: 0.5) para galaxia más "caótica" y difusa
    // → REDUCIR (ej: 0.05) para brazos bien definidos y ordenados
    randomness: 0.2,

    // Controla cómo se distribuyen las partículas en el radio
    // → AUMENTAR (ej: 30) para más concentración en el centro
    // → REDUCIR (ej: 5) para distribución más uniforme
    randomnessPower: 20,

    // Color de las partículas cercanas al centro
    // → Cambiar el hex para otro color interior (ej: 0xff0000 para rojo)
    insideColor: new THREE.Color(0xd63ed6), // Magenta/morado

    // Color de las partículas en los bordes exteriores
    // → Cambiar para otro color exterior (ej: 0x0000ff para azul)
    outsideColor: new THREE.Color(0x48b8b8), // Cian/turquesa
};


// ============================================================
// SECCIÓN 6: LISTA DE IMÁGENES/VIDEOS PARA LOS GRUPOS DE PUNTOS
// ============================================================

// heartImages: Array con rutas de archivos para los "grupos de puntos" con foto
// Se mezclan los datos externos (window.dataLove2Loveloom) con los defaults
// → Agregar más rutas al array para más grupos
// → Soporta: .jpg, .png, .gif (imágenes) y .mp4, .webm, .ogg (videos)
const heartImages = [
    // Datos dinámicos desde el servidor (si existen)
    ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.heartImages
        ? window.dataLove2Loveloom.data.heartImages
        : []),
    // Imágenes por defecto (9 repeticiones de 'primero.jpg')
    // → Cambiar 'primero.jpg' por la ruta de tu imagen
    'primero.jpg', 'primero.jpg', 'primero.jpg',
    'primero.jpg', 'primero.jpg', 'primero.jpg',
    'primero.jpg', 'primero.jpg', 'primero.jpg'
];

const textureLoader = new THREE.TextureLoader();
const numGroups = heartImages.length; // Total de grupos = total de imágenes


// ============================================================
// SECCIÓN 7: CÁLCULO DE DENSIDAD POR GRUPO (INTERPOLACIÓN)
// ============================================================
// Cuántos puntos tiene cada grupo de imagen
// Se interpola: a más imágenes → menos puntos por grupo (para no saturar GPU)

// Puntos cuando solo hay 1 imagen (máxima densidad visual)
// → AUMENTAR para grupos más densos con pocas imágenes
const maxDensity = 15000;

// Puntos cuando hay 9+ imágenes (mínima densidad para no colapsar)
// → REDUCIR si 9 imágenes se ve muy escaso
const minDensity = 4000;

// A partir de cuántas imágenes se usa la densidad mínima
// → AUMENTAR si quieres que la reducción sea más gradual
const maxGroupsForScale = 9;

let pointsPerGroup;

if (numGroups <= 1) {
    pointsPerGroup = maxDensity; // Solo 1 imagen: máxima densidad
} else if (numGroups >= maxGroupsForScale) {
    pointsPerGroup = minDensity; // Muchas imágenes: densidad mínima
} else {
    // Interpolación lineal entre maxDensity y minDensity
    const t = (numGroups - 1) / (maxGroupsForScale - 1);
    pointsPerGroup = Math.floor(maxDensity * (1 - t) + minDensity * t);
}

// Seguridad: que el total no supere galaxyParameters.count
if (pointsPerGroup * numGroups > galaxyParameters.count) {
    pointsPerGroup = Math.floor(galaxyParameters.count / numGroups);
}

console.log(`Số lượng ảnh: ${numGroups}, Điểm mỗi ảnh: ${pointsPerGroup}`);


// ============================================================
// SECCIÓN 8: GENERACIÓN DE LA GALAXIA (NUBE DE PUNTOS BASE)
// ============================================================

// Arrays de posiciones y colores para todos los puntos de la galaxia
const positions = new Float32Array(galaxyParameters.count * 3); // x,y,z por punto
const colors = new Float32Array(galaxyParameters.count * 3);    // r,g,b por punto
let pointIdx = 0;

for (let i = 0; i < galaxyParameters.count; i++) {
    // Distancia del punto al centro (con sesgo hacia el centro usando potencia)
    const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;

    // Ángulo base del brazo espiral al que pertenece este punto
    const branchAngle = (i % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;

    // Ángulo de torsión adicional según la distancia al centro
    const spinAngle = radius * galaxyParameters.spin;

    // Desplazamiento aleatorio en X, Y, Z para dar volumen a la galaxia
    const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    // El Y se multiplica por 0.5 para que la galaxia sea más plana (disco)
    // → Cambiar 0.5 a 1.0 para galaxia esférica, 0.1 para disco muy fino
    const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
    const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;

    const totalAngle = branchAngle + spinAngle;

    // Filtra puntos demasiado cercanos al centro (para dejar espacio al planeta)
    // radius < 30: no genera puntos en las primeras 30 unidades
    // Math.random() < 0.7: el 70% de esos puntos también se omite
    // → Reducir "30" para que la galaxia llegue más cerca del planeta
    // → Cambiar "0.7" a "1.0" para filtrar TODOS los puntos cercanos
    if (radius < 30 && Math.random() < 0.7) continue;

    const i3 = pointIdx * 3;
    positions[i3]     = Math.cos(totalAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(totalAngle) * radius + randomZ;

    // Color interpolado entre el interior y el exterior de la galaxia
    // Empieza en 0xff66ff (rosa/magenta) → mezcla hacia 0x66ffff (cian)
    // → Cambiar estos colores para paleta distinta
    const mixedColor = new THREE.Color(0xff66ff);
    mixedColor.lerp(new THREE.Color(0x66ffff), radius / galaxyParameters.radius);

    // Variación aleatoria de brillo: entre 0.7 y 1.0 de intensidad
    // → 0.7 = el 30% más oscuro que el color puro
    // → Cambiar "0.7 + 0.3" para más/menos variación de brillo
    mixedColor.multiplyScalar(0.7 + 0.3 * Math.random());
    colors[i3]     = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    pointIdx++;
}

// Geometría con los atributos calculados
const galaxyGeometry = new THREE.BufferGeometry();
galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, pointIdx * 3), 3));
galaxyGeometry.setAttribute('color',    new THREE.BufferAttribute(colors.slice(0, pointIdx * 3), 3));


// ============================================================
// SECCIÓN 9: SHADER MATERIAL DE LA GALAXIA
// ============================================================
// Usa GLSL (shader personalizado) para efectos avanzados de partículas

const galaxyMaterial = new THREE.ShaderMaterial({
    uniforms: {
        // Tiempo actual de animación (se actualiza cada frame en animate())
        uTime: { value: 0.0 },

        // Tamaño base de cada partícula en píxeles
        // → AUMENTAR (ej: 80) para partículas más grandes
        // → REDUCIR (ej: 20) para partículas más pequeñas/sutiles
        uSize: { value: 50.0 * renderer.getPixelRatio() },

        // Tiempo en que ocurrió el último "ripple" (efecto de onda expansiva)
        // -1.0 = sin ripple activo
        uRippleTime: { value: -1.0 },

        // Velocidad a la que se expande la onda del ripple
        // → AUMENTAR (ej: 80) para onda más rápida
        // → REDUCIR (ej: 20) para onda más lenta
        uRippleSpeed: { value: 40.0 },

        // Ancho/grosor del frente de onda del ripple
        // → AUMENTAR para una onda más ancha/difusa
        // → REDUCIR para un frente de onda más nítido
        uRippleWidth: { value: 20.0 }
    },

    // --- VERTEX SHADER: Se ejecuta una vez por partícula ---
    // Calcula posición en pantalla y aplica efecto de onda
    vertexShader: `
        uniform float uSize;
        uniform float uTime;
        uniform float uRippleTime;
        uniform float uRippleSpeed;
        uniform float uRippleWidth;

        varying vec3 vColor; // Pasa el color al fragment shader

        void main() {
            vColor = color; // Toma el color del atributo de geometría

            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            // Efecto de onda (ripple) que viaja desde el centro
            if (uRippleTime > 0.0) {
                float rippleRadius = (uTime - uRippleTime) * uRippleSpeed; // Radio actual de la onda
                float particleDist = length(modelPosition.xyz); // Distancia de esta partícula al origen

                // smoothstep crea una transición suave entre 0 y 1
                float strength = 1.0 - smoothstep(rippleRadius - uRippleWidth, rippleRadius + uRippleWidth, particleDist);
                strength *= smoothstep(rippleRadius + uRippleWidth, rippleRadius - uRippleWidth, particleDist);

                if (strength > 0.0) {
                    // Aumenta el brillo de la partícula cuando la onda la toca
                    // → "2.0" controla cuánto más brillante se vuelve (AUMENTAR para efecto más dramático)
                    vColor += vec3(strength * 2.0);
                }
            }

            vec4 viewPosition = viewMatrix * modelPosition;
            gl_Position = projectionMatrix * viewPosition;

            // Las partículas se hacen más pequeñas con la distancia (perspectiva)
            gl_PointSize = uSize / -viewPosition.z;
        }
    `,

    // --- FRAGMENT SHADER: Se ejecuta por cada píxel de cada partícula ---
    // Hace que las partículas sean círculos en lugar de cuadrados
    fragmentShader: `
        varying vec3 vColor;
        void main() {
            // gl_PointCoord va de (0,0) a (1,1) en el cuadrado de la partícula
            // Calculamos distancia al centro (0.5, 0.5) del cuadrado
            float dist = length(gl_PointCoord - vec2(0.5));

            // Si el píxel está fuera del radio de 0.5 = fuera del círculo → descartamos
            if (dist > 0.5) discard;

            gl_FragColor = vec4(vColor, 1.0); // Color opaco del punto
        }
    `,

    blending: THREE.AdditiveBlending, // Los colores se SUMAN (efecto brillante/neón)
    depthWrite: false,     // No escribe en buffer de profundidad (evita artefactos de orden)
    transparent: true,
    vertexColors: true     // Usa colores individuales de cada vértice
});

const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);


// ============================================================
// SECCIÓN 10: FUNCIÓN createNeonTexture
// ============================================================
// Toma una imagen y la dibuja en un canvas cuadrado con esquinas redondeadas
// Se usa para que las imágenes de las fotos tengan bordes redondeados como cards

// @param image: Objeto Image ya cargado
// @param size: Resolución del canvas cuadrado de salida (ej: 256 = 256x256 px)
//   → AUMENTAR (ej: 512) para texturas más nítidas (más memoria GPU)
//   → REDUCIR (ej: 128) para texturas más pixeladas pero más eficientes
function createNeonTexture(image, size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Calcula cómo escalar la imagen para que quepa manteniendo proporciones (letterbox)
    const aspectRatio = image.width / image.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (aspectRatio > 1) { // Imagen horizontal → ajusta ancho al máximo
        drawWidth  = size;
        drawHeight = size / aspectRatio;
        offsetX = 0;
        offsetY = (size - drawHeight) / 2; // Centra verticalmente
    } else { // Imagen vertical o cuadrada → ajusta altura al máximo
        drawHeight = size;
        drawWidth  = size * aspectRatio;
        offsetX = (size - drawWidth) / 2; // Centra horizontalmente
        offsetY = 0;
    }

    ctx.clearRect(0, 0, size, size);

    // Radio de las esquinas redondeadas: 10% del tamaño total
    // → AUMENTAR (ej: size * 0.3) para esquinas más redondeadas
    // → Cambiar a 0 para esquinas perfectamente rectas
    const cornerRadius = size * 0.1;

    // Crea un path de rectángulo con esquinas redondeadas y lo usa como máscara (clip)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(offsetX + cornerRadius, offsetY);
    ctx.lineTo(offsetX + drawWidth - cornerRadius, offsetY);
    ctx.arcTo(offsetX + drawWidth, offsetY, offsetX + drawWidth, offsetY + cornerRadius, cornerRadius);
    ctx.lineTo(offsetX + drawWidth, offsetY + drawHeight - cornerRadius);
    ctx.arcTo(offsetX + drawWidth, offsetY + drawHeight, offsetX + drawWidth - cornerRadius, offsetY + drawHeight, cornerRadius);
    ctx.lineTo(offsetX + cornerRadius, offsetY + drawHeight);
    ctx.arcTo(offsetX, offsetY + drawHeight, offsetX, offsetY + drawHeight - cornerRadius, cornerRadius);
    ctx.lineTo(offsetX, offsetY + cornerRadius);
    ctx.arcTo(offsetX, offsetY, offsetX + cornerRadius, offsetY, cornerRadius);
    ctx.closePath();
    ctx.clip(); // Todo lo dibujado fuera de este path será invisible
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
}


// ============================================================
// SECCIÓN 11: CREACIÓN DE GRUPOS DE PUNTOS CON IMÁGENES/VIDEOS
// ============================================================
// Para cada imagen/video en heartImages, se crean nubes de partículas
// distribuidas en los brazos de la galaxia, con la textura de esa imagen

for (let group = 0; group < numGroups; group++) {
    const groupPositions  = new Float32Array(pointsPerGroup * 3);
    const groupColorsNear = new Float32Array(pointsPerGroup * 3); // Blanco (de cerca)
    const groupColorsFar  = new Float32Array(pointsPerGroup * 3); // Colores de galaxia (de lejos)
    let validPointCount = 0;

    for (let i = 0; i < pointsPerGroup; i++) {
        const idx       = validPointCount * 3;
        const globalIdx = group * pointsPerGroup + i;
        const radius    = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;

        // Filtra puntos demasiado cerca del centro (para no tapar el planeta)
        if (radius < 30) continue;

        const branchAngle = (globalIdx % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;
        const spinAngle   = radius * galaxyParameters.spin;
        const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
        const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
        const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
        const totalAngle = branchAngle + spinAngle;

        groupPositions[idx]     = Math.cos(totalAngle) * radius + randomX;
        groupPositions[idx + 1] = randomY;
        groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;

        // Color de cerca: blanco puro (para que la imagen de la textura se vea real)
        // → Cambiar 0xffffff a otro color para teñir las imágenes de cerca
        const colorNear = new THREE.Color(0xffffff);
        groupColorsNear[idx]     = colorNear.r;
        groupColorsNear[idx + 1] = colorNear.g;
        groupColorsNear[idx + 2] = colorNear.b;

        // Color de lejos: igual que la galaxia (se mezcla visualmente)
        const colorFar = galaxyParameters.insideColor.clone();
        colorFar.lerp(galaxyParameters.outsideColor, radius / galaxyParameters.radius);
        colorFar.multiplyScalar(0.7 + 0.3 * Math.random());
        groupColorsFar[idx]     = colorFar.r;
        groupColorsFar[idx + 1] = colorFar.g;
        groupColorsFar[idx + 2] = colorFar.b;

        validPointCount++;
    }

    if (validPointCount === 0) continue;

    // Geometría para estado CERCA (con colores blancos para mostrar imagen real)
    const groupGeometryNear = new THREE.BufferGeometry();
    groupGeometryNear.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
    groupGeometryNear.setAttribute('color',    new THREE.BufferAttribute(groupColorsNear.slice(0, validPointCount * 3), 3));

    // Geometría para estado LEJOS (con colores de galaxia, se mezcla con el entorno)
    const groupGeometryFar = new THREE.BufferGeometry();
    groupGeometryFar.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
    groupGeometryFar.setAttribute('color',    new THREE.BufferAttribute(groupColorsFar.slice(0, validPointCount * 3), 3));

    // Calcula el centro del grupo y mueve la geometría para que el pivote sea ese centro
    // (Necesario para poder posicionar el objeto 3D en la escena correctamente)
    const posAttr = groupGeometryFar.getAttribute('position');
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < posAttr.count; i++) {
        cx += posAttr.getX(i);
        cy += posAttr.getY(i);
        cz += posAttr.getZ(i);
    }
    cx /= posAttr.count; cy /= posAttr.count; cz /= posAttr.count;
    groupGeometryNear.translate(-cx, -cy, -cz);
    groupGeometryFar.translate(-cx, -cy, -cz);

    // --- Determina si es video o imagen según la extensión del archivo ---
    const url     = heartImages[group];
    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');

    if (isVideo) {
        // --- LÓGICA PARA VIDEOS ---
        // Crea un elemento <video> oculto en memoria para decodificar el video
        const video = document.createElement('video');
        video.src          = url;
        video.crossOrigin  = 'anonymous';
        video.loop         = true;   // → false para reproducción una sola vez
        video.muted        = true;   // Debe estar en mute para autoplay en navegadores
        video.playsInline  = true;   // Necesario en iOS para no ir a pantalla completa
        video.autoplay     = true;
        video.play().catch(e => console.warn("Autoplay bloqueado:", e));

        // En lugar de pasar el video directamente a Three.js,
        // lo dibujamos en un canvas cada frame (igual que las fotos)
        // para poder aplicar el recorte con esquinas redondeadas
        const size   = 512; // → AUMENTAR para videos más nítidos (más CPU)
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        const videoCanvasTexture = new THREE.CanvasTexture(canvas);
        videoCanvasTexture.colorSpace = THREE.SRGBColorSpace;

        // Registra este video en la lista global para actualizarlo cada frame en animate()
        if (!window.videoTexturesToUpdate) window.videoTexturesToUpdate = [];
        window.videoTexturesToUpdate.push({
            video: video, canvas: canvas, ctx: ctx,
            texture: videoCanvasTexture, size: size
        });

        // Material de CERCA: sin transparencia, blending normal (imagen real)
        const materialNear = new THREE.PointsMaterial({
            size: 1.8,             // Tamaño de cada punto en unidades 3D
                                   // → AUMENTAR para puntos más grandes/visibles de cerca
            map: videoCanvasTexture,
            transparent: false,
            alphaTest: 0.2,        // Descarta píxeles con alpha < 0.2 (evita bordes sucios)
                                   // → REDUCIR para ver bordes más transparentes
            depthWrite: true,
            depthTest: true,
            blending: THREE.NormalBlending, // Mezcla normal (la imagen tapa lo que está detrás)
            vertexColors: true
        });

        // Material de LEJOS: con transparencia y blending aditivo (se mezcla con galaxia)
        const materialFar = new THREE.PointsMaterial({
            size: 1.8,
            map: videoCanvasTexture,
            transparent: true,
            alphaTest: 0.2,
            depthWrite: false,
            blending: THREE.AdditiveBlending, // Los colores se suman (efecto luminoso)
            vertexColors: true
        });

        const pointsObject = new THREE.Points(groupGeometryFar, materialFar);
        pointsObject.position.set(cx, cy, cz);
        pointsObject.userData.materialNear = materialNear;
        pointsObject.userData.geometryNear = groupGeometryNear;
        pointsObject.userData.materialFar  = materialFar;
        pointsObject.userData.geometryFar  = groupGeometryFar;
        scene.add(pointsObject);

    } else {
        // --- LÓGICA PARA IMÁGENES (.jpg, .png, etc.) ---
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = url;

        img.onload = () => {
            // Convierte la imagen a textura con esquinas redondeadas
            const neonTexture = createNeonTexture(img, 256); // 256 = resolución de la textura

            // Material de CERCA: sin transparencia para imágenes nítidas
            const materialNear = new THREE.PointsMaterial({
                size: 1.8, map: neonTexture,
                transparent: false, alphaTest: 0.2,
                depthWrite: true, depthTest: true,
                blending: THREE.NormalBlending, vertexColors: true
            });

            // Material de LEJOS: aditivo para mezclar con la galaxia
            const materialFar = new THREE.PointsMaterial({
                size: 1.8, map: neonTexture,
                transparent: true, alphaTest: 0.2,
                depthWrite: false,
                blending: THREE.AdditiveBlending, vertexColors: true
            });

            const pointsObject = new THREE.Points(groupGeometryFar, materialFar);
            pointsObject.position.set(cx, cy, cz);
            pointsObject.userData.materialNear = materialNear;
            pointsObject.userData.geometryNear = groupGeometryNear;
            pointsObject.userData.materialFar  = materialFar;
            pointsObject.userData.geometryFar  = groupGeometryFar;
            scene.add(pointsObject);
        };
    }
}


// ============================================================
// SECCIÓN 12: LUZ AMBIENTAL
// ============================================================

// Ilumina todos los objetos por igual desde todas las direcciones (sin sombras)
// Parámetro 1 (0xffffff): Color de la luz → cambiar para luz cálida (0xffddcc) o fría (0xccddff)
// Parámetro 2 (0.2): Intensidad → AUMENTAR para escena más iluminada, REDUCIR para más oscura
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);


// ============================================================
// SECCIÓN 13: CAMPO DE ESTRELLAS DE FONDO (STARFIELD)
// ============================================================

// Número de estrellas de fondo
// → AUMENTAR (ej: 50000) para cielo más estrellado (algo más lento)
// → REDUCIR (ej: 5000) para más rendimiento
const starCount = 20000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    // Distribuye estrellas en un cubo de 900x900x900 unidades
    // → AUMENTAR 900 para estrellas más esparcidas
    starPositions[i * 3]     = (Math.random() - 0.5) * 900;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,    // Color de las estrellas → cambiar para estrellas de color
    size: 0.7,          // Tamaño de cada estrella → AUMENTAR para estrellas más grandes
    transparent: true,
    opacity: 0.7,       // Transparencia → 1.0 para estrellas más brillantes
    depthWrite: false   // No escribir en profundidad (evita artefactos)
});
const starField = new THREE.Points(starGeometry, starMaterial);
starField.name = 'starfield'; // Nombre usado para identificarla en traverse()
starField.renderOrder = 999;  // Se renderiza al final (siempre visible)
scene.add(starField);


// ============================================================
// SECCIÓN 14: ESTRELLAS FUGACES (SHOOTING STARS)
// ============================================================

let shootingStars = []; // Array que guarda todas las estrellas fugaces activas

function createShootingStar() {
    // Número de puntos que forman la estela de la estrella fugaz
    // → AUMENTAR para estela más larga, REDUCIR para estela corta
    const trailLength = 100;

    // Cabeza de la estrella: esfera pequeña
    const headGeometry = new THREE.SphereGeometry(
        2,  // Radio: → AUMENTAR para cabeza más grande
        32, 32 // Segmentos: más = esfera más suave (más costo GPU)
    );
    const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,                         // Comienza invisible, se anima en el loop
        blending: THREE.AdditiveBlending   // Se suma al fondo (brilla)
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);

    // Halo/resplandor alrededor de la cabeza (shader personalizado)
    const glowGeometry = new THREE.SphereGeometry(3, 32, 32); // Radio 3 = más grande que la cabeza
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform float time;
            void main() {
                // Intensidad mayor en los bordes que en el centro (efecto fresnel)
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                // Parpadeo usando sin(time): varía entre 0.6 y 1.0 de opacidad
                // → Cambiar "5.0" para frecuencia de parpadeo (mayor = más rápido)
                // → Cambiar "0.2" para amplitud del parpadeo
                gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * (0.8 + sin(time * 5.0) * 0.2));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide // Visible desde afuera hacia adentro
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    head.add(glow);

    // Nota: El código de atmosphereGeometry/atmosphereMaterial está aquí pero
    // hace referencia a "planet" y "planetRadius" que se definen más abajo.
    // En producción esto causa un error. Debe moverse después de crear el planeta.
    const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.05, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0xe0b3ff) } // Color del halo atmosférico
            // → Cambiar 0xe0b3ff para otro color de atmósfera (ej: 0x00aaff para azul)
        },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform vec3 glowColor;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(glowColor, 1.0) * intensity;
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planet.add(atmosphere); // Se adjunta al planeta (hereda su posición y rotación)

    // Estela de la estrella fugaz (línea 3D)
    const curve = createRandomCurve(); // Genera una curva bezier aleatoria
    const trailPoints = [];
    for (let i = 0; i < trailLength; i++) {
        const progress = i / (trailLength - 1);
        trailPoints.push(curve.getPoint(progress));
    }
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    const trailMaterial = new THREE.LineBasicMaterial({
        color: 0x99eaff,      // Color de la estela: azul cielo
                               // → Cambiar para estelas de otro color
        transparent: true,
        opacity: 0.7,          // Opacidad de la estela → 1.0 para estela más visible
        linewidth: 2           // En WebGL, linewidth > 1 no funciona en la mayoría de GPUs
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);

    const shootingStarGroup = new THREE.Group();
    shootingStarGroup.add(head);
    shootingStarGroup.add(trail);
    shootingStarGroup.userData = {
        curve: curve,
        progress: 0,             // 0.0 = inicio del camino, 1.0 = fin
        // Velocidad de avance sobre la curva bezier por frame
        // → AUMENTAR (ej: 0.005) para estrellas más rápidas
        // → REDUCIR (ej: 0.0005) para estrellas más lentas
        speed: 0.001 + Math.random() * 0.001,
        life: 0,                 // Frames de vida actuales
        maxLife: 300,            // Frames totales de vida
                                 // → AUMENTAR para estrellas que duran más en pantalla
        head: head,
        trail: trail,
        trailLength: trailLength,
        trailPoints: trailPoints,
    };
    scene.add(shootingStarGroup);
    shootingStars.push(shootingStarGroup);
}

// Genera una curva Bezier cúbica aleatoria para la trayectoria de la estrella fugaz
function createRandomCurve() {
    // Punto de inicio: área izquierda/atrás de la escena
    const startPoint = new THREE.Vector3(
        -200 + Math.random() * 100, // X: entre -200 y -100
        -100 + Math.random() * 200, // Y: entre -100 y 100
        -100 + Math.random() * 200  // Z: entre -100 y 100
    );
    // Punto final: muy a la derecha/adelante
    // → Cambiar estos rangos para controlar dirección general de las estrellas
    const endPoint = new THREE.Vector3(
        600 + Math.random() * 200,
        startPoint.y + (-100 + Math.random() * 200),
        startPoint.z + (-100 + Math.random() * 200)
    );
    // Puntos de control para la curva (determinan la curvatura)
    const controlPoint1 = new THREE.Vector3(
        startPoint.x + 200 + Math.random() * 100,
        startPoint.y + (-50 + Math.random() * 100),
        startPoint.z + (-50 + Math.random() * 100)
    );
    const controlPoint2 = new THREE.Vector3(
        endPoint.x - 200 + Math.random() * 100,
        endPoint.y + (-50 + Math.random() * 100),
        endPoint.z + (-50 + Math.random() * 100)
    );
    return new THREE.CubicBezierCurve3(startPoint, controlPoint1, controlPoint2, endPoint);
}


// ============================================================
// SECCIÓN 15: TEXTURA PROCEDURAL DEL PLANETA
// ============================================================

// Genera una textura colorida tipo "gas giant" (planeta gaseoso)
// usando gradientes y manchas aleatorias en canvas 2D

// @param size: Resolución de la textura (512 = 512x512)
//   → AUMENTAR (ej: 1024) para textura más detallada
//   → REDUCIR (ej: 256) para mejor rendimiento
function createPlanetTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Gradiente radial: define los colores de capas del planeta
    const gradient = ctx.createRadialGradient(size/2, size/2, size/8, size/2, size/2, size/2);
    // Cada addColorStop: (posición 0.0-1.0, color_hex)
    // → Cambiar los colores para distintas paletas de planeta
    gradient.addColorStop(0.00, '#f8bbd0'); // Centro: rosa pálido
    gradient.addColorStop(0.12, '#f48fb1'); // Rosa medio
    gradient.addColorStop(0.22, '#f06292'); // Rosa fuerte
    gradient.addColorStop(0.35, '#ffffff'); // Blanco
    gradient.addColorStop(0.50, '#e1aaff'); // Lavanda
    gradient.addColorStop(0.62, '#a259f7'); // Morado
    gradient.addColorStop(0.75, '#b2ff59'); // Verde lima
    gradient.addColorStop(1.00, '#3fd8c7'); // Cian/turquesa
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Manchas de color aleatorias (simulan nubes/tormentas)
    const spotColors = ['#f8bbd0','#f8bbd0','#f48fb1','#f48fb1','#f06292','#f06292','#ffffff','#e1aaff','#a259f7','#b2ff59'];
    // → Cambiar "40" por más/menos manchas
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        // Radio de la mancha: entre 30 y 150 px
        // → AUMENTAR "120" para manchas más grandes
        const radius = 30 + Math.random() * 120;
        const color  = spotColors[Math.floor(Math.random() * spotColors.length)];
        const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        spotGradient.addColorStop(0, color + 'cc'); // 'cc' = alpha ~80%
        spotGradient.addColorStop(1, color + '00'); // '00' = completamente transparente
        ctx.fillStyle = spotGradient;
        ctx.fillRect(0, 0, size, size);
    }

    // Curvas (líneas de tormenta tipo Júpiter)
    // → Cambiar "8" para más/menos líneas de tormenta
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * size, Math.random() * size);
        ctx.bezierCurveTo(
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size
        );
        // Opacidad de las líneas: entre 0.12 y 0.30
        // → Cambiar "0.12" y "0.18" para líneas más/menos visibles
        ctx.strokeStyle = 'rgba(180, 120, 200, ' + (0.12 + Math.random() * 0.18) + ')';
        ctx.lineWidth = 8 + Math.random() * 18; // Grosor variable de las líneas
        ctx.stroke();
    }

    // Blur suave para suavizar la textura
    if (ctx.filter !== undefined) {
        ctx.filter = 'blur(2px)'; // → AUMENTAR "2px" para textura más borrosa/suave
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
    }

    return new THREE.CanvasTexture(canvas);
}


// ============================================================
// SECCIÓN 16: SHADER DEL PLANETA (EFECTO TORMENTA/ANIMACIÓN)
// ============================================================
// Anima la textura del planeta para simular remolinos y tormentas

const stormShader = {
    uniforms: {
        time: { value: 0.0 },         // Tiempo de animación (actualizado cada frame)
        baseTexture: { value: null }  // La textura del planeta (se asigna abajo)
    },
    vertexShader: `
        varying vec2 vUv; // Pasa las coordenadas UV al fragment shader
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform sampler2D baseTexture;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;

            // Efecto de torsión radial: más intenso en los bordes
            float angle = length(uv - vec2(0.5)) * 3.0;
            // → Cambiar "3.0" para más/menos torsión total
            // → Cambiar "0.1" para más/menos distorsión máxima
            float twist = sin(angle * 3.0 + time) * 0.1;

            // Desplaza las UV con el tiempo para animar la torsión
            uv.x += twist * sin(time * 0.5); // → "0.5" controla velocidad de rotación en X
            uv.y += twist * cos(time * 0.5); // → "0.5" controla velocidad de rotación en Y

            vec4 texColor = texture2D(baseTexture, uv);

            // Añade "ruido" visual (efecto de tormenta)
            float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.1;
            // → "10.0" controla la frecuencia del ruido (mayor = más detallado)
            // → "0.1" controla la intensidad del ruido
            // Los valores RGB (0.8, 0.4, 0.2) tiñen el ruido de naranja/cálido
            // → Cambiar para ruido de otro color
            texColor.rgb += noise * vec3(0.8, 0.4, 0.2);

            gl_FragColor = texColor;
        }
    `
};


// ============================================================
// SECCIÓN 17: CREACIÓN DEL PLANETA CENTRAL
// ============================================================

// Radio del planeta (unidades 3D)
// → AUMENTAR para planeta más grande (también afecta los anillos de texto)
const planetRadius = 10;

const planetGeometry = new THREE.SphereGeometry(
    planetRadius,  // Radio
    48, 48         // Segmentos (mayor = esfera más suave, más GPU)
                   // → Reducir a 32,32 para mejor rendimiento
);

const planetTexture  = createPlanetTexture(); // Genera la textura procedural
const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        baseTexture: { value: planetTexture } // Asigna la textura al shader
    },
    vertexShader:   stormShader.vertexShader,
    fragmentShader: stormShader.fragmentShader
});

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0); // En el origen de la escena
scene.add(planet);


// ============================================================
// SECCIÓN 18: ANILLOS DE TEXTO ALREDEDOR DEL PLANETA
// ============================================================

// Array de textos que aparecerán como anillos orbitales alrededor del planeta
// → Agregar más strings para más anillos
// → El primer elemento usa font más pequeño (ver scaleParams abajo)
const ringTexts = [
    ' 🤍 Christian y Rocio  🤍 ',       // Anillo 0: texto principal (font más pequeño)
    ' Eres mi sol en cualquier galaxia', // Anillo 1: segundo texto
    // Datos dinámicos del servidor (si existen)
    ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.ringTexts
        ? window.dataLove2Loveloom.data.ringTexts
        : [])
];

function createTextRings() {
    const numRings    = ringTexts.length;
    // Radio del primer anillo: planeta + 10% extra (para no overlapping)
    // → AUMENTAR (ej: planetRadius * 1.5) para anillos más separados del planeta
    const baseRingRadius = planetRadius * 1.1;

    // Espaciado entre anillos consecutivos (unidades 3D)
    // → AUMENTAR para anillos más separados entre sí
    const ringSpacing = 5;

    window.textRings = []; // Almacena referencias para animarlos luego

    for (let i = 0; i < numRings; i++) {
        const text       = ringTexts[i % ringTexts.length] + '   '; // Añade separación al final
        const ringRadius = baseRingRadius + i * ringSpacing; // Radio crece con cada anillo

        // --- Detección de tipo de caracteres para ajustar font ---
        function getCharType(char) {
            const charCode = char.charCodeAt(0);
            if ((charCode >= 0x4E00 && charCode <= 0x9FFF) || // CJK (Chino/Japonés)
                (charCode >= 0x3040 && charCode <= 0x309F) || // Hiragana
                (charCode >= 0x30A0 && charCode <= 0x30FF) || // Katakana
                (charCode >= 0xAC00 && charCode <= 0xD7AF)) { // Coreano
                return 'cjk';
            } else if (charCode >= 0 && charCode <= 0x7F) { // ASCII/Latino
                return 'latin';
            }
            return 'other';
        }

        let charCounts = { cjk: 0, latin: 0, other: 0 };
        for (let char of text) charCounts[getCharType(char)]++;
        const totalChars = text.length;
        const cjkRatio   = charCounts.cjk / totalChars; // Proporción de caracteres CJK

        // Parámetros de escala por posición del anillo
        // fontScale: escala del tamaño del texto → AUMENTAR para texto más grande
        // spacingScale: espaciado entre caracteres → AUMENTAR para texto más espaciado
        let scaleParams = { fontScale: 0.75, spacingScale: 1.1 }; // Default para anillos 2+

        if (i === 0) {
            // Anillo 0 (más interno): texto más pequeño para no cubrir el planeta
            scaleParams.fontScale    = 0.55; // → AUMENTAR para texto más grande en anillo 0
            scaleParams.spacingScale = 0.9;
        } else if (i === 1) {
            scaleParams.fontScale    = 0.65;
            scaleParams.spacingScale = 1.0;
        }

        if (cjkRatio > 0) {
            // Los caracteres CJK son más anchos: reducir font y aumentar espaciado
            scaleParams.fontScale    *= 0.9;
            scaleParams.spacingScale *= 1.1;
        }

        // --- Creación de la textura de texto en canvas ---
        const textureHeight = 750; // Alto de la textura en px → AUMENTAR para texto más alto
        const fontSize = Math.max(500, .9 * textureHeight); // Tamaño de fuente enorme para nitidez

        // Mide el texto para saber cuántas repeticiones caben en el anillo
        const tempCanvas = document.createElement('canvas');
        const tempCtx    = tempCanvas.getContext('2d');
        tempCtx.font = `bold ${fontSize}px Arial, sans-serif`;
        let singleText          = ringTexts[i % ringTexts.length];
        const separator         = '   '; // 3 espacios como separador entre repeticiones
        let repeatedTextSegment = singleText + separator;
        let segmentWidth        = tempCtx.measureText(repeatedTextSegment).width;

        // Circunferencia "visual" del anillo: se usa para calcular repeticiones necesarias
        // "180" es un valor heurístico ajustado manualmente
        // → AUMENTAR si el texto no cubre el anillo completo, REDUCIR si se superpone
        let textureWidthCircumference = 2 * Math.PI * ringRadius * 180;
        let repeatCount = Math.ceil(textureWidthCircumference / segmentWidth);

        let fullText = '';
        for (let j = 0; j < repeatCount; j++) fullText += repeatedTextSegment;

        let finalTextureWidth = segmentWidth * repeatCount;
        if (finalTextureWidth < 1 || !fullText) {
            fullText = repeatedTextSegment;
            finalTextureWidth = segmentWidth;
        }

        // Canvas final donde se dibuja el texto
        const textCanvas    = document.createElement('canvas');
        textCanvas.width    = Math.ceil(Math.max(1, finalTextureWidth));
        textCanvas.height   = textureHeight;
        const ctx           = textCanvas.getContext('2d');

        ctx.clearRect(0, 0, textCanvas.width, textureHeight);
        ctx.font        = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle   = '#800040'; // Color de relleno del texto: rojo/burdeos
                                     // → Cambiar para texto de otro color
        ctx.textAlign   = 'left';
        ctx.textBaseline = 'alphabetic';

        // Capa 1: Borde exterior del texto (glow)
        ctx.shadowColor  = '#404040'; // Color de la sombra exterior
        ctx.shadowBlur   = 24;        // Difuminado de la sombra → AUMENTAR para más halo
        ctx.lineWidth    = 6;         // Grosor del borde
        ctx.strokeStyle  = '#fff';    // Color del borde: blanco
        ctx.strokeText(fullText, 0, textureHeight * 0.8); // 0.8 = 80% desde arriba

        // Capa 2: Relleno con efecto glow rosado
        ctx.shadowColor  = '#ffb3de'; // Color del halo rosado
        ctx.shadowBlur   = 16;        // → AUMENTAR para halo más extendido
        ctx.fillText(fullText, 0, textureHeight * 0.8);

        // Configura la textura para repetir horizontalmente y envolver el cilindro
        const ringTexture     = new THREE.CanvasTexture(textCanvas);
        ringTexture.wrapS     = THREE.RepeatWrapping; // Se repite en S (horizontal)
        ringTexture.repeat.x  = finalTextureWidth / textureWidthCircumference;
        ringTexture.needsUpdate = true;

        // Geometría del anillo: cilindro abierto (sin tapas)
        // Parámetros: radio top, radio bottom, altura, segmentos, anillos verticales, openEnded
        const ringGeometry  = new THREE.CylinderGeometry(ringRadius, ringRadius, 1, 128, 1, true);
        const ringMaterial  = new THREE.MeshBasicMaterial({
            map: ringTexture,
            transparent: true,
            side: THREE.DoubleSide, // Visible desde dentro y fuera del cilindro
            alphaTest: 0.01         // Descarta píxeles casi transparentes
        });

        const textRingMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        textRingMesh.position.set(0, 0, 0);
        textRingMesh.rotation.y = Math.PI / 2; // Rota 90° para orientar correctamente

        const ringGroup = new THREE.Group();
        ringGroup.add(textRingMesh);
        ringGroup.userData = {
            ringRadius:      ringRadius,
            angleOffset:     0.15 * Math.PI * 0.5, // Ángulo inicial del anillo
            speed:           0.008, // Velocidad de rotación del anillo
                                    // → AUMENTAR para anillos más rápidos
                                    // → REDUCIR (ej: 0.001) para anillos casi estáticos
            tiltSpeed:       0, rollSpeed: 0, pitchSpeed: 0,       // Velocidades de balanceo (0 = sin balanceo)
            tiltAmplitude:   Math.PI / 3,  // Amplitud de inclinación → REDUCIR para menos movimiento
            rollAmplitude:   Math.PI / 6,  // Amplitud de giro lateral
            pitchAmplitude:  Math.PI / 8,  // Amplitud de cabeceo
            tiltPhase:       Math.PI * 2,  // Fase inicial del balanceo
            rollPhase:       Math.PI * 2,
            pitchPhase:      Math.PI * 2,
            isTextRing:      true          // Flag para identificar en traverse()
        };

        // Inclinación inicial diferente por anillo (para que no estén todos en el mismo plano)
        // → Cambiar Math.PI / 1 para diferente rango de inclinaciones
        const initialRotationX = i / numRings * (Math.PI / 1);
        ringGroup.rotation.x   = initialRotationX;

        scene.add(ringGroup);
        window.textRings.push(ringGroup);
    }
}

createTextRings();

// Actualiza la orientación de los textos en los anillos para mirar a la cámara
function updateTextRingsRotation() {
    if (!window.textRings || !camera) return;
    window.textRings.forEach((ringGroup, index) => {
        ringGroup.children.forEach(child => {
            if (child.userData.initialAngle !== undefined) {
                const angle = child.userData.initialAngle + ringGroup.userData.angleOffset;
                const x = Math.cos(angle) * child.userData.ringRadius;
                const z = Math.sin(angle) * child.userData.ringRadius;
                child.position.set(x, 0, z);
                const worldPos = new THREE.Vector3();
                child.getWorldPosition(worldPos);
                const lookAtVector = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
                const rotationY = Math.atan2(lookAtVector.x, lookAtVector.z);
                child.rotation.y = rotationY;
            }
        });
    });
}

// Anima los anillos: rotación, balanceo, pulsación de opacidad
function animatePlanetSystem() {
    if (!window.textRings) return;
    const time = Date.now() * 0.001; // Tiempo en segundos

    window.textRings.forEach((ringGroup, index) => {
        const userData = ringGroup.userData;

        // Avanza el ángulo de órbita cada frame
        userData.angleOffset += userData.speed;

        // Movimiento de balanceo usando funciones seno/coseno
        const tilt  = Math.sin(time * userData.tiltSpeed  + userData.tiltPhase)  * userData.tiltAmplitude;
        const roll  = Math.cos(time * userData.rollSpeed  + userData.rollPhase)  * userData.rollAmplitude;
        const pitch = Math.sin(time * userData.pitchSpeed + userData.pitchPhase) * userData.pitchAmplitude;

        ringGroup.rotation.x = (index / window.textRings.length) * (Math.PI / 1) + tilt;
        ringGroup.rotation.z = roll;
        ringGroup.rotation.y = userData.angleOffset + pitch;

        // Movimiento vertical suave (bobbing)
        const verticalBob = Math.sin(time * (userData.tiltSpeed * 0.7) + userData.tiltPhase) * 0.3;
        // → "0.3" es la amplitud del bobbing → AUMENTAR para más movimiento vertical
        ringGroup.position.y = verticalBob;

        // Pulsación de opacidad del texto (entre 0.7 y 1.0)
        const pulse    = (Math.sin(time * 1.5 + index) + 1) / 2; // Valor 0-1
        // → "1.5" controla velocidad de pulsación → AUMENTAR para parpadeo más rápido
        const textMesh = ringGroup.children[0];
        if (textMesh && textMesh.material) {
            textMesh.material.opacity = 0.7 + pulse * 0.3; // Rango: 0.7-1.0
        }
    });
    updateTextRingsRotation();
}


// ============================================================
// SECCIÓN 19: BUCLE PRINCIPAL DE ANIMACIÓN (animate)
// ============================================================

let fadeOpacity    = 0.1;    // Opacidad inicial de la escena (antes de la intro)
let fadeInProgress = false;  // Flag que activa el fade-in tras el click

// --- ICONO DE AYUDA (HINT ICON) ---
let hintIcon;  // Grupo 3D del icono cursor
let hintText;  // Mesh 3D del texto de ayuda

/**
 * Crea un cursor 3D animado sobre el planeta para indicar que se puede clickear.
 */
function createHintIcon() {
    hintIcon = new THREE.Group();
    hintIcon.name = 'hint-icon-group';
    scene.add(hintIcon);

    const cursorVisuals = new THREE.Group();

    // Forma del cursor (triángulo con extensión, como cursor de Windows)
    const cursorShape = new THREE.Shape();
    const h = 1.5; // Altura del cursor → AUMENTAR para cursor más grande
    const w = h * 0.5; // Ancho proporcional

    cursorShape.moveTo(0, 0);
    cursorShape.lineTo(-w * 0.4, -h * 0.7);
    cursorShape.lineTo(-w * 0.25, -h * 0.7);
    cursorShape.lineTo(-w * 0.5, -h);
    cursorShape.lineTo(w * 0.5, -h);
    cursorShape.lineTo(w * 0.25, -h * 0.7);
    cursorShape.lineTo(w * 0.4, -h * 0.7);
    cursorShape.closePath();

    // Capa de fondo del cursor (blanco)
    const backgroundGeometry = new THREE.ShapeGeometry(cursorShape);
    const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const backgroundMesh     = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

    // Capa de frente (ligeramente más pequeña para dar sensación de borde)
    const foregroundGeometry = new THREE.ShapeGeometry(cursorShape);
    const foregroundMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const foregroundMesh     = new THREE.Mesh(foregroundGeometry, foregroundMaterial);
    foregroundMesh.scale.set(0.8, 0.8, 1); // Escala 80% del fondo
    foregroundMesh.position.z = 0.01;       // Ligeramente al frente para evitar z-fighting

    cursorVisuals.add(backgroundMesh, foregroundMesh);
    cursorVisuals.position.y = h / 2;
    cursorVisuals.rotation.x = Math.PI / 2; // Rota para orientar verticalmente

    // Anillo circular alrededor del cursor
    const ringGeometry = new THREE.RingGeometry(1.8, 2.0, 32); // Radio interno 1.8, externo 2.0
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    hintIcon.userData.ringMesh = ringMesh; // Referencia para animarlo

    hintIcon.add(cursorVisuals);
    hintIcon.add(ringMesh);

    // Posición del icono respecto al planeta
    // x=1.5, y=1.5 → ligeramente arriba y a la derecha del planeta
    // z=15 → 15 unidades al frente del planeta (hacia la cámara)
    // → Cambiar estos valores para reposicionar el cursor
    hintIcon.position.set(1.5, 1.5, 15);
    hintIcon.scale.set(0.8, 0.8, 0.8); // → AUMENTAR para cursor más grande
    hintIcon.lookAt(planet.position);   // Apunta hacia el planeta
    hintIcon.userData.initialPosition = hintIcon.position.clone(); // Guarda posición para animación
    
}

/**
 * Anima el icono de ayuda (movimiento de "tapping" y pulsación del anillo).
 * Solo visible ANTES de que el usuario haga click para iniciar la intro.
 * @param {number} time - Tiempo en segundos
 */
function animateHintIcon(time) {
    if (!hintIcon) return;

    if (!introStarted) {
        hintIcon.visible = true;

        // Animación de "tap": el cursor se mueve hacia adelante y atrás
        const tapFrequency = 2.5; // Frecuencia de ciclos por segundo → AUMENTAR para tap más rápido
        const tapAmplitude = 1.5; // Distancia del movimiento → AUMENTAR para movimiento más amplio
        const tapOffset    = Math.sin(time * tapFrequency) * tapAmplitude;

        const direction = new THREE.Vector3();
        hintIcon.getWorldDirection(direction);
        hintIcon.position.copy(hintIcon.userData.initialPosition).addScaledVector(direction, -tapOffset);

        // Pulsación del anillo (escala y opacidad)
        const ring      = hintIcon.userData.ringMesh;
        const ringScale = 1 + Math.sin(time * tapFrequency) * 0.1; // Variación ±10%
        ring.scale.set(ringScale, ringScale, 1);
        ring.material.opacity = 0.5 + Math.sin(time * tapFrequency) * 0.2; // Entre 0.3 y 0.7

        // Animación del texto de ayuda
        if (hintText) {
            hintText.visible = true;
            hintText.material.opacity = 0.7 + Math.sin(time * 3) * 0.3; // Parpadeo entre 0.4 y 1.0
            hintText.position.y       = 15 + Math.sin(time * 2) * 0.5;  // Flotación vertical ±0.5
            hintText.lookAt(camera.position); // Siempre mira a la cámara (billboard)
        }
    } else {
        // Oculta el icono después de que comienza la intro
        if (hintIcon)  hintIcon.visible  = false;
        if (hintText)  hintText.visible  = false;
    }
}

// ============================================================
// SECCIÓN 20: FUNCIÓN PRINCIPAL animate()
// ============================================================
function animate() {
    requestAnimationFrame(animate); // Encola el próximo frame
    const time = performance.now() * 0.001; // Tiempo en segundos con alta precisión

    // --- Actualización de texturas de video (frame por frame) ---
    // Dibuja el frame actual de cada video en su canvas con bordes redondeados
    if (window.videoTexturesToUpdate) {
        window.videoTexturesToUpdate.forEach(item => {
            // Solo actualiza si el video tiene datos de imagen listos
            if (item.video.readyState >= item.video.HAVE_CURRENT_DATA) {
                const size        = item.size;
                const aspectRatio = item.video.videoWidth / item.video.videoHeight;
                let drawWidth, drawHeight, offsetX, offsetY;

                // Cálculo igual al de createNeonTexture (mantiene proporciones)
                if (aspectRatio > 1) {
                    drawWidth = size; drawHeight = size / aspectRatio;
                    offsetX = 0; offsetY = (size - drawHeight) / 2;
                } else {
                    drawHeight = size; drawWidth = size * aspectRatio;
                    offsetX = (size - drawWidth) / 2; offsetY = 0;
                }

                item.ctx.clearRect(0, 0, size, size);
                const cornerRadius = size * 0.1; // Mismo radio que las fotos

                // Clip con esquinas redondeadas (idéntico a createNeonTexture)
                item.ctx.save();
                item.ctx.beginPath();
                item.ctx.moveTo(offsetX + cornerRadius, offsetY);
                item.ctx.lineTo(offsetX + drawWidth - cornerRadius, offsetY);
                item.ctx.arcTo(offsetX + drawWidth, offsetY, offsetX + drawWidth, offsetY + cornerRadius, cornerRadius);
                item.ctx.lineTo(offsetX + drawWidth, offsetY + drawHeight - cornerRadius);
                item.ctx.arcTo(offsetX + drawWidth, offsetY + drawHeight, offsetX + drawWidth - cornerRadius, offsetY + drawHeight, cornerRadius);
                item.ctx.lineTo(offsetX + cornerRadius, offsetY + drawHeight);
                item.ctx.arcTo(offsetX, offsetY + drawHeight, offsetX, offsetY + drawHeight - cornerRadius, cornerRadius);
                item.ctx.lineTo(offsetX, offsetY + cornerRadius);
                item.ctx.arcTo(offsetX, offsetY, offsetX + cornerRadius, offsetY, cornerRadius);
                item.ctx.closePath();
                item.ctx.clip();
                item.ctx.drawImage(item.video, offsetX, offsetY, drawWidth, drawHeight); // Dibuja el frame del video
                item.ctx.restore();

                item.texture.needsUpdate = true; // Avisa a Three.js que actualice la GPU
            }
        });
    }

    animateHintIcon(time); // Anima el cursor de ayuda
    controls.update();     // Necesario para el amortiguado del OrbitControls

    // Avanza la animación del shader del planeta
    planet.material.uniforms.time.value = time * 0.5;
    // → "0.5" es la velocidad de animación de la tormenta del planeta
    // → AUMENTAR para tormentas más rápidas, REDUCIR para más lentas

    // --- Fade-in gradual después de iniciar la intro ---
    if (fadeInProgress && fadeOpacity < 1) {
        fadeOpacity += 0.025; // Incremento por frame (~40 frames para fade completo a 60fps)
        // → AUMENTAR (ej: 0.05) para fade más rápido
        // → REDUCIR (ej: 0.01) para fade más lento (más suave)
        if (fadeOpacity > 1) fadeOpacity = 1;
    }

    // --- Control de visibilidad: antes vs. después de la intro ---
    if (!introStarted) {
        // ANTES DEL CLICK: Casi todo invisible excepto planeta, glow e icono de ayuda
        fadeOpacity = 0.1; // Opacidad baja pero no cero (la galaxia se intuye de fondo)
        scene.traverse(obj => {
            if (obj.name === 'starfield') return; // Las estrellas siempre visibles
            if (obj.userData.isTextRing || (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing)) {
                // Los anillos de texto siempre visibles antes de la intro
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = false;
                    obj.material.opacity = 1;
                }
                if (obj.material && obj.material.color) obj.material.color.set(0xffffff);
            } else if (obj !== planet && obj !== centralGlow && obj !== hintIcon && obj.name !== 'hint-text' && obj.type !== 'Scene' && !obj.parent.isGroup) {
                // El resto: casi transparente
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = true;
                    obj.material.opacity = 0.1; // → AUMENTAR para que la galaxia se vea más de fondo
                }
            }
        });
        planet.visible      = true;
        centralGlow.visible = true;
    } else {
        // DESPUÉS DEL CLICK: Todo va apareciendo gradualmente con fadeOpacity
        scene.traverse(obj => {
            if (!(obj.userData.isTextRing || (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing) || obj === planet || obj === centralGlow || obj.type === 'Scene')) {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = true;
                    obj.material.opacity     = fadeOpacity; // Se anima de 0.1 → 1.0
                }
            } else {
                // Anillos y planeta siempre completamente visibles después del click
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.opacity     = 1;
                    obj.material.transparent = false;
                }
            }
            if (obj.material && obj.material.color) obj.material.color.set(0xffffff);
        });
    }

    // --- Animación de estrellas fugaces ---
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.userData.life++;

        // Fade-in al inicio y fade-out al final de la vida
        let opacity = 1.0;
        if (star.userData.life < 30) {
            opacity = star.userData.life / 30; // Los primeros 30 frames: fade-in
        } else if (star.userData.life > star.userData.maxLife - 30) {
            opacity = (star.userData.maxLife - star.userData.life) / 30; // Últimos 30 frames: fade-out
        }

        star.userData.progress += star.userData.speed;
        if (star.userData.progress > 1) {
            // La estrella llegó al final: eliminar de escena y array
            scene.remove(star);
            shootingStars.splice(i, 1);
            continue;
        }

        // Mueve la estrella a lo largo de su curva bezier
        const currentPos = star.userData.curve.getPoint(star.userData.progress);
        star.position.copy(currentPos);
        star.userData.head.material.opacity = opacity;
        star.userData.head.children[0].material.uniforms.time.value = time;

        // Actualiza los puntos de la estela (recalcula desde la posición actual hacia atrás)
        const trail       = star.userData.trail;
        const trailPoints = star.userData.trailPoints;
        trailPoints[0].copy(currentPos);
        for (let j = 1; j < star.userData.trailLength; j++) {
            const trailProgress = Math.max(0, star.userData.progress - j * 0.01);
            // → "0.01" controla cuán larga es la estela visible
            // → AUMENTAR para estela más larga, REDUCIR para estela más corta
            trailPoints[j].copy(star.userData.curve.getPoint(trailProgress));
        }
        trail.geometry.setFromPoints(trailPoints);
        trail.material.opacity = opacity * 0.7; // La estela es 30% más transparente que la cabeza
    }

    // Probabilidad de crear una nueva estrella fugaz si hay menos de 3 activas
    // Math.random() < 0.02 = 2% de probabilidad por frame (~1 estrella nueva cada 50 frames a 60fps)
    // → AUMENTAR "3" para más estrellas simultáneas
    // → AUMENTAR "0.02" para que aparezcan más frecuentemente
    if (shootingStars.length < 3 && Math.random() < 0.02) {
        createShootingStar();
    }

    // --- Cambio de material según distancia (cerca = imagen real, lejos = galaxia) ---
    scene.traverse(obj => {
        if (obj.isPoints && obj.userData.materialNear && obj.userData.materialFar) {
            const positionAttr = obj.geometry.getAttribute('position');
            let isClose = false;

            for (let i = 0; i < positionAttr.count; i++) {
                const worldX = positionAttr.getX(i) + obj.position.x;
                const worldY = positionAttr.getY(i) + obj.position.y;
                const worldZ = positionAttr.getZ(i) + obj.position.z;
                const distance = camera.position.distanceTo(new THREE.Vector3(worldX, worldY, worldZ));

                if (distance < 10) { // Si algún punto está a menos de 10 unidades de la cámara
                    // → AUMENTAR "10" para que el cambio ocurra más lejos
                    isClose = true;
                    break;
                }
            }

            if (isClose) {
                if (obj.material !== obj.userData.materialNear) {
                    obj.material  = obj.userData.materialNear;  // Cambia a material "real"
                    obj.geometry  = obj.userData.geometryNear;  // Usa colores blancos
                }
            } else {
                if (obj.material !== obj.userData.materialFar) {
                    obj.material  = obj.userData.materialFar;  // Vuelve al material de galaxia
                    obj.geometry  = obj.userData.geometryFar;
                }
            }
        }
    });

    planet.lookAt(camera.position); // El planeta siempre "mira" a la cámara (billboard)
    animatePlanetSystem();           // Anima los anillos de texto

    // Asegura que las estrellas de fondo siempre sean completamente visibles
    if (starField && starField.material && starField.material.opacity !== undefined) {
        starField.material.opacity     = 1.0;
        starField.material.transparent = false;
    }

    renderer.render(scene, camera); // ← RENDER FINAL del frame
}


// ============================================================
// SECCIÓN 21: TEXTO DE AYUDA (HINT TEXT)
// ============================================================
// Crea un panel 2D con texto flotante sobre el planeta

function createHintText() {
    const canvasSize = 300; // Resolución del canvas del texto → AUMENTAR para texto más nítido
    const canvas     = document.createElement('canvas');
    canvas.width = canvas.height = canvasSize;
    const context = canvas.getContext('2d');

    const fontSize = 30; // Tamaño del texto en px → AUMENTAR para texto más grande
    const text     = 'Triunfo el Amor 💕'; // → Cambiar por el texto que desees mostrar
    context.font        = `bold ${fontSize}px Arial, sans-serif`;
    context.textAlign   = 'center';
    context.textBaseline = 'middle';

    // Capa 1: Sombra difuminada blanca
    context.shadowColor  = '#f7f7f7ff';
    context.shadowBlur   = 25;     // → AUMENTAR para halo más difuso
    context.lineWidth    = 5;
    context.strokeStyle  = 'rgba(189, 19, 132, 0.8)'; // Borde rosa oscuro
    context.strokeText(text, canvasSize / 2, canvasSize / 2);

    // Capa 2: Segundo borde morado (profundidad)
    context.shadowColor  = '#e0b3ff';
    context.shadowBlur   = 3;
    context.lineWidth    = 2;
    context.strokeStyle  = 'rgba(220, 180, 255, 0.5)'; // Borde morado suave
    context.strokeText(text, canvasSize / 2, canvasSize / 2);

    // Capa 3: Relleno sólido blanco
    context.shadowColor  = 'transparent';
    context.shadowBlur   = 0;
    context.fillStyle    = 'white'; // → Cambiar para texto de otro color
    context.fillText(text, canvasSize / 2, canvasSize / 2);

    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.needsUpdate = true;

    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    // Plano 3D que muestra el texto
    // Parámetros: ancho=35, alto=15 (unidades 3D) → CAMBIAR para diferente tamaño del panel
    const planeGeometry = new THREE.PlaneGeometry(35, 15);
    hintText = new THREE.Mesh(planeGeometry, textMaterial);
    hintText.renderOrder     = 999; // Se renderiza encima de todo
    hintText.material.depthTest = false; // No ocultado por otros objetos
    hintText.name = 'hint-text';
    hintText.position.set(0, 18, 0); // Posición: centrado en X, 18 unidades arriba
                                     // → Cambiar Y para subir/bajar el texto
    scene.add(hintText);
}


// ============================================================
// SECCIÓN 22: INICIALIZACIÓN, EVENTOS Y ANIMACIÓN DE INTRO
// ============================================================

createShootingStar();  // Crea la primera estrella fugaz
createHintIcon();      // Crea el icono de ayuda
createHintText();      // Crea el texto de ayuda

// Actualiza cámara y renderer si cambia el tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.target.set(0, 0, 0);
    controls.update();
});

/**
 * Animación de la cámara cuando el usuario hace click en el planeta.
 * La cámara viaja desde su posición inicial hasta la posición final de exploración.
 */
function startCameraAnimation() {
    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const midPos1  = { x: startPos.x, y: 0, z: startPos.z };          // Intermedio 1: baja al nivel Y=0
    const midPos2  = { x: startPos.x, y: 0, z: 160 };                  // Intermedio 2: se aleja en Z
    const endPos   = { x: -40, y: 100, z: 100 };                        // Posición final: vista panorámica
    // → Cambiar endPos para diferente ángulo/posición final de la cámara

    // Duración de cada segmento como proporción del total (suman ~1.15)
    const duration1 = 0.2;  // 20% del viaje: bajada vertical
    const duration2 = 0.55; // 55% del viaje: alejamiento en Z
    const duration3 = 0.4;  // 40% del viaje: vuelo a posición final con ease-in-out

    let progress = 0;

    function animatePath() {
        progress += 0.001010; // Incremento por frame → AUMENTAR para animación más rápida
                               // A 60fps: 0.001010 → ~16 segundos para completar
        let newPos;

        if (progress < duration1) {
            // Segmento 1: interpolación lineal hacia midPos1
            let t = progress / duration1;
            newPos = {
                x: startPos.x + (midPos1.x - startPos.x) * t,
                y: startPos.y + (midPos1.y - startPos.y) * t,
                z: startPos.z + (midPos1.z - startPos.z) * t,
            };
        } else if (progress < duration1 + duration2) {
            // Segmento 2: interpolación lineal hacia midPos2
            let t = (progress - duration1) / duration2;
            newPos = {
                x: midPos1.x + (midPos2.x - midPos1.x) * t,
                y: midPos1.y + (midPos2.y - midPos1.y) * t,
                z: midPos1.z + (midPos2.z - midPos1.z) * t,
            };
        } else if (progress < duration1 + duration2 + duration3) {
            // Segmento 3: ease-in-out (coseno) hacia posición final
            let t       = (progress - duration1 - duration2) / duration3;
            let easedT  = 0.5 - 0.5 * Math.cos(Math.PI * t); // Curva suave
            newPos = {
                x: midPos2.x + (endPos.x - midPos2.x) * easedT,
                y: midPos2.y + (endPos.y - midPos2.y) * easedT,
                z: midPos2.z + (endPos.z - midPos2.z) * easedT,
            };
        } else {
            // Animación terminada: coloca cámara exactamente en endPos y activa controles
            camera.position.set(endPos.x, endPos.y, endPos.z);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            controls.enabled = true; // Ahora el usuario puede mover la cámara
            return;
        }

        camera.position.set(newPos.x, newPos.y, newPos.z);
        camera.lookAt(0, 0, 0);
        requestAnimationFrame(animatePath); // Continúa la animación en el próximo frame
    }

    controls.enabled = false; // Deshabilita controles durante la animación
    animatePath();
}


// ============================================================
// SECCIÓN 23: RAYCASTER Y DETECCIÓN DE CLICK EN EL PLANETA
// ============================================================

const raycaster = new THREE.Raycaster(); // Lanza rayos desde la cámara para detectar clicks
const mouse     = new THREE.Vector2();  // Coordenadas normalizadas del mouse (-1 a 1)
let introStarted = false;               // Flag: si ya se inició la intro

// Al inicio muestra solo el 10% de las estrellas de fondo (antes del click)
// Aumenta a 100% tras el click (en onCanvasClick)
const originalStarCount = starGeometry.getAttribute('position').count;
if (starField && starField.geometry) {
    starField.geometry.setDrawRange(0, Math.floor(originalStarCount * 0.1));
    // → Cambiar "0.1" a "0.5" para mostrar 50% de estrellas desde el inicio
}

// Solicita modo pantalla completa al navegador
function requestFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// Maneja el click en el canvas
function onCanvasClick(event) {
    if (introStarted) return; // Ignora clicks después de que la intro ya empezó

    // Convierte coordenadas de pixel a coordenadas normalizadas (-1 a 1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) *  2 + 1;

    raycaster.setFromCamera(mouse, camera); // Configura el rayo desde la cámara

    const intersects = raycaster.intersectObject(planet); // ¿El rayo toca el planeta?

    if (intersects.length > 0) {
        // El usuario hizo click en el planeta
        requestFullScreen();
        introStarted   = true;
        fadeInProgress = true;
        document.body.classList.add('intro-started'); // Para CSS (ej: ocultar overlays)
        startCameraAnimation(); // Inicia vuelo de cámara

        // Intenta reproducir música
        if (window.musicManager) {
            window.musicManager.play().catch(error => {
                console.warn("Autoplay bloqueado, usuario debe interactuar con botón de audio.", error);
                if (window.musicManager.audio) {
                    window.musicManager.audio.muted = true; // Silencia temporalmente
                    window.musicManager.updateUI();          // Actualiza ícono del botón
                }
            });
        } else {
            console.error("musicManager no está inicializado.");
        }

        // Muestra todas las estrellas de fondo
        if (starField && starField.geometry) {
            starField.geometry.setDrawRange(0, originalStarCount);
        }

    } else if (introStarted) {
        // Si la intro ya empezó y se hace click en un grupo de puntos: centrar cámara en él
        const heartIntersects = raycaster.intersectObjects(heartPointClouds);
        if (heartIntersects.length > 0) {
            const targetObject = heartIntersects[0].object;
            controls.target.copy(targetObject.position);
        }
    }
}

renderer.domElement.addEventListener('click', onCanvasClick);

animate(); // ← INICIA EL BUCLE DE ANIMACIÓN

// Nombres útiles para debug o referencia externa
planet.name      = 'main-planet';
centralGlow.name = 'main-glow';


// ============================================================
// SECCIÓN 24: UTILIDADES RESPONSIVE Y MOBILE
// ============================================================

// Ajusta la altura del viewport para móviles (soluciona el bug del 100vh en iOS/Android)
function setFullScreen() {
    const vh        = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    const container = document.getElementById('container');
    if (container) {
        container.style.height = `${window.innerHeight}px`;
    }
}

window.addEventListener('resize',            setFullScreen);
window.addEventListener('orientationchange', () => {
    setTimeout(setFullScreen, 300); // Espera 300ms para que el navegador actualice dimensiones
});
setFullScreen();

// Previene comportamientos táctiles no deseados (scroll/pinch en el canvas)
const preventDefault = event => event.preventDefault();
document.addEventListener('touchmove',    preventDefault, { passive: false });
document.addEventListener('gesturestart', preventDefault, { passive: false });

const container = document.getElementById('container');
if (container) {
    container.addEventListener('touchmove', preventDefault, { passive: false });
}


// ============================================================
// SECCIÓN 25: DETECCIÓN DE ORIENTACIÓN PARA ADVERTENCIA MOBILE
// ============================================================
// Si el usuario usa el móvil en vertical (portrait), añade una clase CSS
// para mostrar una advertencia pidiéndole girar el dispositivo

function checkOrientation() {
    // Detecta si es portrait Y es un dispositivo táctil (excluye ventanas de escritorio estrechas)
    const isMobilePortrait = window.innerHeight > window.innerWidth && 'ontouchstart' in window;

    if (isMobilePortrait) {
        document.body.classList.add('portrait-mode');
        // → El CSS debe tener .portrait-mode { ... } para mostrar el aviso de girar pantalla
    } else {
        document.body.classList.remove('portrait-mode');
    }
}

window.addEventListener('DOMContentLoaded',  checkOrientation);
window.addEventListener('resize',            checkOrientation);
window.addEventListener('orientationchange', () => {
    setTimeout(checkOrientation, 200); // 200ms de espera para dimensiones correctas
});




// ============================================================
// CONTADOR DE DÍAS JUNTOS (FLOTANDO EN 3D)
// ============================================================
function createDayCounter() {
    const startDate = new Date('2024-08-01'); // ← cambia tu fecha aquí
    const today     = new Date();
    /*const diffDays  = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    /*const line1 = '💖 Juntos hace';
    const line2 = `${diffDays} días`;
    const line3 = 'Christian & Rocio'; // ← cambia los nombres aquí*/

    const diffTime   = today - startDate;
    let diffDays   = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.44);
    const years      = Math.floor(diffMonths / 12);
    const months     = diffMonths % 12;

    // Arma el texto según cuánto tiempo llevan
    let tiempoTexto = '';
    if (years > 0 && months > 0) {
        tiempoTexto = `${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''}`;
    } else if (years > 0) {
        tiempoTexto = `${years} año${years > 1 ? 's' : ''}`;
    } else {
        tiempoTexto = `${months} mes${months > 1 ? 'es' : ''}`;
    }

    const line1 = '💖 Juntos hace';
    const line2 = tiempoTexto;   // ← ahora muestra "1 año y 7 meses"
    const line3 = 'Christian & Rocio 🌟';





    const W = 800, H = 256;
    const canvas  = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx     = canvas.getContext('2d');

    // Fondo redondeado
    /*const cornerR = 40;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cornerR, 0);
    ctx.lineTo(W - cornerR, 0);
    ctx.arcTo(W, 0, W, cornerR, cornerR);
    ctx.lineTo(W, H - cornerR);
    ctx.arcTo(W, H, W - cornerR, H, cornerR);
    ctx.lineTo(cornerR, H);
    ctx.arcTo(0, H, 0, H - cornerR, cornerR);
    ctx.lineTo(0, cornerR);
    ctx.arcTo(0, 0, cornerR, 0, cornerR);
    ctx.closePath();

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   'rgba(162, 89, 247, 0.75)'); // ← color morado
    bg.addColorStop(0.5, 'rgba(240, 98, 146, 0.75)'); // ← color rosa
    bg.addColorStop(1,   'rgba(162, 89, 247, 0.75)'); // ← color morado
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();*/

    ctx.clearRect(0, 0, W, H); // fondo transparente




    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = 'rgba(255,100,200,0.9)';
    ctx.fillStyle    = 'white';

    ctx.font = 'italic 36px "Cormorant Garamond", serif';  // line1
    ctx.shadowBlur = 15;
    ctx.fillText(line1, W / 2, 60);

    ctx.font      = 'italic 80px "Cormorant Garamond", serif'; // ← tamaño del número de días
    ctx.shadowBlur = 25;
    ctx.fillText(line2, W / 2, 148);

    ctx.font = 'italic 32px "Cormorant Garamond", serif';  // line3
    ctx.shadowBlur = 12;
    ctx.fillText(line3, W / 2, 220);

    const texture  = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture, transparent: true,
        depthWrite: false, blending: THREE.NormalBlending
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(55, 27, 1);           // ← tamaño del cartel
    sprite.position.set(-50, 35, -10);    // ← posición X, Y, Z en la escena
    sprite.renderOrder = 99;
    scene.add(sprite);
    window.dayCounterSprite = sprite;
    window._dayCounterBaseY = sprite.position.y;
}

function updateDayCounter(time) {
    if (!window.dayCounterSprite) return;
    const floatY = Math.sin(time * 0.8) * 2; // ← velocidad * altura
    window.dayCounterSprite.position.y = window._dayCounterBaseY + floatY;
    window.dayCounterSprite.visible = introStarted;
}

createDayCounter();

// ============================================================
// HOOK DE ANIMACIÓN
// ============================================================
const _originalRender = renderer.render.bind(renderer);
renderer.render = function(scene, camera) {
    const time = performance.now() / 1000;
    updateDayCounter(time);
    updatePoemGalaxy(time); 
    updateFallingHearts();
    _originalRender(scene, camera);
};


// ============================================================
// GALAXIA DE POEMA DE AMOR (CORAZÓN DE PARTÍCULAS)
// ============================================================

// ← Edita aquí las líneas del poema
const lovePoem1 = [
    '      No me iré, nunca.      ',
    ' ¿Sabes por qué? Porque estamos ',
    '  para sanar y aprender juntos.  ',
    'En ti encontré un corazón precioso',
    ' en una generación muy difícil. ',
    '  Así que no pienso dejarte ir  ',
    '   tan fácil. No es necesario   ',
    '    esperar a otra vida para    ',
    '      que todo funcione.        ',
    '        Yo me haré cargo        ',
    '          de que seamos         ',
    '            felices             ',
    '             juntos.            ',
    '              ❤️               '
];

const lovePoem2 = [
    ' Yo al darme cuenta de que ',
    '  me aceptó tal como soy   ',
    ' con mis celos, mis       ',
    ' inseguridades, mis días  ',
    ' malos y todo. Por eso la    ',
    ' amo tanto es el amor de mi  ',
    ' vida. Porque me  ',
    ' quiere completo, con     ',
    ' defectos incluidos. No me ',
    ' arrepiento ni un segundo ',
    ' de haberme enamorado de  ',
    '         ti.         ',
    '            ❤️            '
];

const lovePoem3 = [
    ' Desde que estás en mi vida ',
    '  aprendí que el amor no es  ',
    ' solo felicidad constante,  ',
    ' es crecimiento, paciencia y ',
    '  luz incluso en los días   ',
    ' grises, la vida me mostró  ',
    ' a través de ti que amar es ',
    '  elegir todos los días,    ',
    '  aun cuando no es fácil,   ',
    '  aun cuando el mundo pesa. ',
    '             ❤️              '
];

const lovePoem4 = [
    '      Gracias por       ',
    '        ser ese         ',
    '     espacio seguro     ',
    '      donde sé que      ',
    '     puedo bajar la     ',
    '      guardia sin       ',
    '        miedo a         ',
    '      ser juzgadx       ',
    '           ❤️           '
];

const lovePoem5 = [
    '      Gracias por       ',
    '      quedarte cuando   ',
    '     la mayoría se      ',
    '      hubiera ido.      ',
    '       Tu lealtad       ',
    '      es un tesoro      ',
    '       que valoro       ',
    '      inmensamente      ',
    '           ❤️           '
];

const lovePoem6 = [
    '  Ti amo mucho mi noviesita  ',
    '   linda eres la niña con    ',
    '   la que siempre soñé       ',
    '   quédate conmigo para      ',
    '       siempre Tii           ',
    '             🌸              '
];

const lovePoem7 = [
    '       Mi enamorada      ',
    '      Mi mejor amiga     ',
    '       Mi compañera      ',
    '         Mi hogar        ',
    '     Mi lugar seguro     ',
    '     Mi gatitobonito     ',
    '       Mi princesa       ',
    '    Mi futura esposa     ',
    '    El amor de mi vida   ',
    '        Mi todo.         ',
    '           ✨            '
];

const lovePoem8 = [
    ' “¿Cómo negarte que me muero de ',
    '  ganas de vivir contigo?      ',
    ' Despertar junto a ti cada     ',
    ' mañana y abrazarte fuerte.    ',
    ' Que las citas de películas y  ',
    ' series no culminen con una    ',
    ' despedida,                   ',
    ' sino con tu piel entre mis   ',
    ' dedos.                       ',
    ' Que al volver de una fiesta, ',
    ' seamos el after,             ',
    ' y a la mañana siguiente,     ',
    ' levantarte con desayuno en    ',
    ' la cama.                     '
];

const lovePoem9 = [
    ' Despertar para ver tu cepillo ',
    ' junto al mío,                ',
    ' y tener toda una rutina para ',
    ' dormir contigo.              ',
    ' Poder llevarte flores al     ',
    ' salir del hospital,          ',
    ' y contarnos mutuamente las   ',
    ' aventuras que el día trajo   ',
    ' consigo.                     '
];

const lovePoem10 = [
    ' Pero resulta que quiero vivirlo ',
    ' todo, lo bueno y lo malo.       ',
    ' Así que no me molestaría si     ',
    ' discutimos de vez en cuando,    ',
    ' o si te enojas porque tus       ',
    ' costumbres sean diferentes a    ',
    ' las mías,                       ',
    ' porque, al final,               ',
    ' haremos las nuestras.           '
];

const lovePoem11 = [
    ' Me encantaría poder cuidarte    ',
    ' cuando enfermes,                ',
    ' y llenarte de todo eso que te   ',
    ' gusta cuando lleguen esos días  ',
    ' del mes.                        ',

    ' No te prometo que siempre sea   ',
    ' perfecto,                       ',
    ' pero te prometo que siempre     ',
    ' será... real.”                  '
];

const lovePoem12 = [
    ' de misionero para verla a ',
    ' los ojos y preguntarle si ',
    ' realmente me ama o que    ',
    ' brujeria me hizo para     ',
    ' estar tan enamorado de    ',
    '           ella.           '
];

const lovePoem13 = [
    ' Amorshito nunca dudes que si ',
    '  te amo porque cada noche    ',
    '     que duermo sueño con     ',
    '       casarme contigo        ',
    '       mi vida hermosa        ',
    '             ❤️                '
];

const lovePoem14 = [
    ' Lo primero que haré cuando ',
    '      vea a mi amorcito     ',
    ' (Darle un muy fuerte abrazo) ',
    '             🐱              '
];

const lovePoem15 = [
    ' Eres tú con quien quiero   ',
    ' estar, no me importa       ',
    ' conocer a alguien más yo   ',
    ' quiero seguir              ',
    ' conociéndote a ti, cada    ',
    ' detalle tuyo, por más      ',
    ' pequeño que sea, los       ',
    ' defectos que dices tener,  ',
    ' tus metas, tus miedos,     ',
    ' tu anhelos en esta vida, lo ',
    ' que te hace feliz y lo que ',
    ' no, cada cosa tuya me      ',
    ' parece interesante Eres tú ',
    ' y solo tú:                 '
];

const lovePoem16 = [
    ' Tatuarme tu nombre no ',
    ' sería suficiente. Yo quiero ',
    ' que tu ser viva en mí, que ',
    ' cada aliento y cada latido ',
    ' sean una ofrenda hacia ti: '
];

const lovePoem17 = [
    ' te haré tan mía, que vas a ',
    ' estar sin cólicos por      ',
    ' nueve meses                '
];

const lovePoem18 = [
    ' Por un momento Creí que estaría ',
    ' solo toda mi vida               ',
    ' Creí que iba a hundirme en el   ',
    ' caos de mis problemas           ',
    ' Pero te encontré                ',
    ' No quiero que te vayas          ',
    ' Perdon por no ser la persona    ',
    ' perfecta para tí                ',
    ' Perdón por todo                 ',
    ' Te voy a esperar, aunque nunca  ',
    ' vuelvas.                        '
];

const lovePoem19 = [
    ' Quédate durmiendo en mi   ',
    ' pecho toda la vida, aunque ',
    ' afuera puedas con todo,    ',
    ' aquí conmigo podrás volver ',
    ' a sentirte como niña segura,',
    ' amada y cuidada            ',
    '             🤍              '
];

const lovePoem20 = [
    ' Amor te ecstraño           ',
    ' Amor nezesito velte        ',
    ' Amor teletransportate      ',
    ' Amor kero abrasalte        ',
    ' Amor te ano                ',
    ' Amor amor                  ',
    ' Amor                       '
];

const lovePoem21 = [
    ' No tiene sentido fingir enojo ',
    ' contigo, sabiendo que sería capaz ',
    '   de dar mi vida por la tuya.   '
];

const lovePoem22 = [
    ' Soy feliz con lo más        ',
    ' mínimo, de verdad. No       ',
    ' necesito gestos enormes     ',
    ' ni promesas grandísimas.    ',
    ' Me alcanza con sentir que   ',
    ' me escuchas cuando          ',
    ' hablo, que lo que digo no   ',
    ' pasa desapercibido. Que     ',
    ' te intereses en mis         ',
    ' palabras, en mis ideas, en  ',
    ' lo que hago cada día,       ',
    ' aunque sea algo simple.     ',
    ' Me hace feliz saber que     ',
    ' te importa quién soy, que   ',
    ' preguntes, que prestes      ',
    ' atención, que quieras       ',
    ' entenderme. Porque en       ',
    ' esos detalles es donde yo   ',
    ' encuentro todo. Sentirme    ',
    ' escuchado/a. Ahí está mi    ',
    ' felicidad, en lo simple     '
];

const lovePoem23 = [
    ' Acurrucarnos no es          ',
    ' suficiente...               ',
    ' quiero juntar               ',
    ' nuestros                    ',
    ' cuerpos                     ',
    ' hasta ser                   ',
    ' uno solo                    '
];

const lovePoem24 = [
    ' Solía pensar               ',
    ' que el amor era            ',
    ' devoción y                 ',
    ' matrimonio, sin            ',
    ' embargo, ahora             ',
    ' pienso que                 ',
    ' el amor                    ',
    ' es la risita que           ',
    ' dejas salir cuando         ',
    ' te digo                    ',
    ' lo mucho que te            ',
    ' amo. Pienso                ',
    ' que el                     ',
    ' amor es el brillo          ',
    ' de tus ojos                ',
    ' cuando                     ',
    ' me ves. Pienso             ',
    ' que el amor es el          ',
    ' suave golpeteo             ',
    ' en mi corazón              ',
    ' que siento                 ',
    ' cada vez                   ',
    ' que sonríes.               '
];

const lovePoem25 = [
    ' Me da igual cuantos ojos me ',
    ' miren, yo ya me perdí en los ',
    '            tuyos            '
];

const lovePoem26 = [
    ' Amor, por favor, te lo ruego, ',
    ' pídeme más, mis desvelos, mis ',
    ' sueños, mis botas, mis        ',
    ' prendas, lo que sea, solo     ',
    ' pídeme más, que todo es tuyo, ',
    ' devórame física y             ',
    ' espiritualmente               '
];

const lovePoem27 = [
    '✨ Mi lugar favorito ✨',
    'No es un lugar, eres tú.',
    'Donde estés, ahí está mi hogar.',
    'Te amo hoy y siempre.',
    ' Christian 💖'
];

// agrupa todos en orden
const allPoems = [
    lovePoem1,  lovePoem2,  lovePoem3,  lovePoem4,  lovePoem5,
    lovePoem6,  lovePoem7,  lovePoem8,  lovePoem9,  lovePoem10,
    lovePoem11, lovePoem12, lovePoem13, lovePoem14, lovePoem15,
    lovePoem16, lovePoem17, lovePoem18, lovePoem19, lovePoem20,
    lovePoem21, lovePoem22, lovePoem23, lovePoem24, lovePoem25,
    lovePoem26, lovePoem27
];

let currentPoemIndex = 0;
let poemOpacity      = 1.0;
let poemFading       = false;
let poemFadeDir      = -1;

function createPoemGalaxy() {
    const numPoints  = 8000; // ← más número = más denso el corazón
    const heartScale = 3.5;  // ← más número = corazón más grande

    const positions = new Float32Array(numPoints * 3);
    const colors    = new Float32Array(numPoints * 3);

    for (let i = 0; i < numPoints; i++) {
        const t  = (i / numPoints) * Math.PI * 2;
        const x  = 16 * Math.pow(Math.sin(t), 3);
        const y  = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        positions[i*3]     = x * heartScale + (Math.random()-0.5) * 3;
        positions[i*3 + 1] = y * heartScale + (Math.random()-0.5) * 3;
        positions[i*3 + 2] = (Math.random()-0.5) * 6;

        const col = new THREE.Color();
        col.setHSL(0.85 - (i/numPoints) * 0.15, 1.0, 0.65);
        colors[i*3]     = col.r;
        colors[i*3 + 1] = col.g;
        colors[i*3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const material = new THREE.PointsMaterial({
        size: 0.7,           // ← tamaño de cada partícula
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const heartCloud = new THREE.Points(geometry, material);
    heartCloud.position.set(120, 40, -80); // ← posición X, Y, Z en la escena
    scene.add(heartCloud);
    window.poemGalaxyCloud = heartCloud;

    // ── Texto del poema ──
    const lineSpacing = 4; // ← separación entre líneas
    const totalHeight  = allPoems[0].length * lineSpacing;
    window.poemSprites = [];

    allPoems[0].forEach((line, idx) => {
        const cW = 700, cH = 80;
        const c  = document.createElement('canvas');
        c.width = cW; c.height = cH;
        const cx = c.getContext('2d');

        cx.clearRect(0, 0, cW, cH);
        cx.font         = `italic ${idx === 0 ? 42 : 30}px "Cormorant Garamond", serif`; // ← tamaño fuente
        cx.textAlign    = 'center';
        cx.textBaseline = 'middle';
        cx.shadowColor  = idx === 0 ? 'rgba(255,100,200,1.0)' : 'rgba(200,150,255,0.9)';
        cx.shadowBlur   = 20;
        cx.fillStyle    = idx === 0 ? '#ffccff' : 'white'; // ← color del texto
        cx.fillText(line, cW/2, cH/2);

        const mat = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(c),
            transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(60, 7, 1); // ← tamaño del panel de texto
        sprite.position.set(
            120,                                       // ← mismo X que el corazón
            25 + totalHeight/2 - idx * lineSpacing,   // Y se calcula automático
            -80                                        // ← mismo Z que el corazón
        );
        sprite.renderOrder = 100;
        scene.add(sprite);
        window.poemSprites.push(sprite);
    });
       const poemDurations = [
        8000,  // lovePoem1 (14 líneas - necesita tiempo para la reflexión)
        8000,  // lovePoem2 (13 líneas - denso)
        7000,  // lovePoem3 (11 líneas)
        5000,  // lovePoem4 (9 líneas - frases cortas)
        5000,  // lovePoem5 (9 líneas)
        4000,  // lovePoem6 (6 líneas)
        6500,  // lovePoem7 (11 líneas - estilo lista, se lee rápido)
        10000, // lovePoem8 (14 líneas - texto muy denso y largo)
        7000,  // lovePoem9 (9 líneas)
        7500,  // lovePoem10 (9 líneas - ideas complejas)
        7500,  // lovePoem11 (10 líneas)
        5000,  // lovePoem12 (6 líneas)
        4500,  // lovePoem13 (6 líneas)
        3500,  // lovePoem14 (4 líneas - muy corto)
        10000, // lovePoem15 (14 líneas - muy denso)
        5000,  // lovePoem16 (5 líneas)
        4000,  // lovePoem17 (3 líneas - corto pero impactante)
        9000,  // lovePoem18 (10 líneas - requiere pausa emocional)
        6000,  // lovePoem19 (7 líneas)
        4500,  // lovePoem20 (7 líneas - repetitivo, lectura rápida)
        4000,  // lovePoem21 (3 líneas)
        15000, // lovePoem22 (21 líneas - ¡Es el más largo! Necesita mucho tiempo)
        5000,  // lovePoem23 (7 líneas - palabras cortas)
        16000, // lovePoem24 (23 líneas - El más extenso de todos)
        4000,  // lovePoem25 (3 líneas)
        7000,  // lovePoem26 (7 líneas - profundo)
        5500   // lovePoem27 (5 líneas - El cierre de Christian)
    ];

function scheduleNextPoem() {
    const delay = poemDurations[currentPoemIndex] || 8000;
    setTimeout(() => {
        poemFading  = true;
        poemFadeDir = -1;
    }, delay);
}
scheduleNextPoem();
window._scheduleNextPoem = scheduleNextPoem;
}

function updatePoemGalaxy(time) {
    if (!window.poemGalaxyCloud) return;
    window.poemGalaxyCloud.visible = introStarted;
    window.poemGalaxyCloud.rotation.y = time * 0.2; // ← velocidad de rotación
    window.poemGalaxyCloud.rotation.x = Math.sin(time * 0.15) * 0.15;
    if (window.poemSprites) {
        window.poemSprites.forEach(s => s.visible = introStarted);
    }

    if (poemFading) {
    poemOpacity += poemFadeDir * 0.02;

    if (poemOpacity <= 0) {
        poemOpacity      = 0;
        currentPoemIndex = (currentPoemIndex + 1) % allPoems.length;
        // borra sprites actuales
        window.poemSprites.forEach(s => scene.remove(s));
        window.poemSprites = [];
        // crea sprites del nuevo poema
        const poem       = allPoems[currentPoemIndex];
        const lineSpacing = 4;
        const totalHeight = poem.length * lineSpacing;
        poem.forEach((line, idx) => {
            const cW = 700, cH = 80;
            const c  = document.createElement('canvas');
            c.width = cW; c.height = cH;
            const cx = c.getContext('2d');
            cx.clearRect(0, 0, cW, cH);
            cx.font         = `italic ${idx === 0 ? 42 : 30}px "Cormorant Garamond", serif`;
            cx.textAlign    = 'center';
            cx.textBaseline = 'middle';
            cx.shadowColor  = idx === 0 ? 'rgba(255,100,200,1.0)' : 'rgba(200,150,255,0.9)';
            cx.shadowBlur   = 20;
            cx.fillStyle    = idx === 0 ? '#ffccff' : 'white';
            cx.fillText(line, cW/2, cH/2);
            const mat = new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(c),
                transparent: true, depthWrite: false,
                blending: THREE.AdditiveBlending, opacity: 0
            });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(60, 7, 1);
            sprite.position.set(120, 20 + totalHeight/2 - idx * lineSpacing, -80);
            sprite.renderOrder = 100;
            scene.add(sprite);
            window.poemSprites.push(sprite);
        });
        poemFadeDir = 1;
    }

    if (poemOpacity >= 1) {
        poemOpacity = 1.0;
        poemFading  = false;
        window._scheduleNextPoem();
    }

    window.poemSprites.forEach(s => s.material.opacity = poemOpacity);
}


}

createPoemGalaxy();

// ============================================================
// LLUVIA DE CORAZONES SOBRE EL CORAZÓN DE PARTÍCULAS
// ============================================================
function createFallingHearts() {
    window.fallingHearts = [];

    function spawnHeart() {
        const canvas  = document.createElement('canvas');
        canvas.width  = 64;
        canvas.height = 64;
        const ctx     = canvas.getContext('2d');

        // Dibuja el emoji corazón
        ctx.font      = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', 32, 32);

        const mat = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const sprite = new THREE.Sprite(mat);

       // Posición sobre el BORDE del corazón
        const t  = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        sprite.position.set(
            120 + hx * 2.5,  // ← el 2.5 debe ser igual a tu heartScale
            40  + hy * 2.5,  // ← igual aquí
            -80 + (Math.random() - 0.5) * 4
        );  

        sprite.scale.set(4, 4, 1); // ← tamaño de cada corazón

        sprite.userData.speedY    = -(0.02 + Math.random() * 0.05); // ← velocidad de caída
        sprite.userData.speedX    = (Math.random() - 0.5) * 0.01;   // ← deriva lateral
        sprite.userData.opacity   = 1.0;
        sprite.userData.baseY     = sprite.position.y;
        sprite.userData.life      = 0;
        sprite.userData.maxLife   = 120 + Math.floor(Math.random() * 80); // frames de vida

        scene.add(sprite);
        window.fallingHearts.push(sprite);
    }

    // Genera corazones continuamente
    setInterval(() => {
        if (!introStarted) return;
        if (window.fallingHearts.length < 40) { // ← máximo de corazones simultáneos
            spawnHeart();
        }
    }, 200); // ← cada cuántos ms aparece uno nuevo
}

function updateFallingHearts() {
    if (!window.fallingHearts) return;
    for (let i = window.fallingHearts.length - 1; i >= 0; i--) {
        const h = window.fallingHearts[i];
        h.userData.life++;
        h.position.y += h.userData.speedY; // cae hacia abajo
        h.position.x += h.userData.speedX; // deriva lateral

        // Fade out al final de su vida
        const lifeRatio = h.userData.life / h.userData.maxLife;
        h.material.opacity = 1.0 - lifeRatio;

        // Cuando muere, eliminar
        if (h.userData.life >= h.userData.maxLife) {
            scene.remove(h);
            window.fallingHearts.splice(i, 1);
        }
    }
}

createFallingHearts();

