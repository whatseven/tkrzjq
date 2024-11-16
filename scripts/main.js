const GLOBE_CONFIG = {
    width: 800,
    height: 800,
    devicePixelRatio: 2,
    phi: 0,
    theta: 0.3,
    dark: 0,
    diffuse: 0.4,
    mapSamples: 16000,
    mapBrightness: 1.2,
    baseColor: [1, 1, 1],
    markerColor: [251 / 255, 100 / 255, 21 / 255],
    glowColor: [1, 1, 1],
    markers: [
        { location: [14.5995, 120.9842], size: 0.03 },
        { location: [19.076, 72.8777], size: 0.1 },
        { location: [23.8103, 90.4125], size: 0.05 },
        { location: [30.0444, 31.2357], size: 0.07 },
        { location: [39.9042, 116.4074], size: 0.08 },
        { location: [-23.5505, -46.6333], size: 0.1 },
        { location: [19.4326, -99.1332], size: 0.1 },
        { location: [40.7128, -74.006], size: 0.1 },
        { location: [34.6937, 135.5022], size: 0.05 },
        { location: [41.0082, 28.9784], size: 0.06 },
    ],
};

let phi = 0;
let width = 0;
let canvas;
let pointerInteracting = null;
let pointerInteractionMovement = 0;
let r = 0;

function createGlobeVisualization() {
    canvas = document.createElement('canvas');
    canvas.className = 'globe-canvas';
    document.getElementById('globe').appendChild(canvas);

    const onResize = () => {
        width = canvas.offsetWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvas, {
        ...GLOBE_CONFIG,
        width: width * 2,
        height: width * 2,
        onRender: (state) => {
            if (!pointerInteracting) {
                phi += 0.005;
            }
            state.phi = phi + r;
            state.width = width * 2;
            state.height = width * 2;
        },
    });

    canvas.style.cursor = 'grab';
    
    canvas.onpointerdown = (e) => {
        pointerInteracting = e.clientX - pointerInteractionMovement;
        canvas.style.cursor = 'grabbing';
    };
    
    canvas.onpointerup = () => {
        pointerInteracting = null;
        canvas.style.cursor = 'grab';
    };
    
    canvas.onpointerout = () => {
        pointerInteracting = null;
        canvas.style.cursor = 'grab';
    };
    
    canvas.onmousemove = (e) => {
        if (pointerInteracting !== null) {
            const delta = e.clientX - pointerInteracting;
            pointerInteractionMovement = delta;
            r = delta / 200;
        }
    };

    setTimeout(() => {
        canvas.style.opacity = '1';
    });
}

// 初始化地球可视化
window.addEventListener('load', createGlobeVisualization); 