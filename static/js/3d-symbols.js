import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SymbolRenderer {
    constructor() {
        this.loader = new GLTFLoader();
        this.models = {};
        this.symbolValues = {
            '10': { path: '/attached_assets/10.glb', value: 100 },
            'J': { path: '/attached_assets/J.glb', value: 200 },
            'Q': { path: '/attached_assets/Q.glb', value: 300 },
            'K': { path: '/attached_assets/K.glb', value: 400 },
            'A': { path: '/attached_assets/A.glb', value: 500 },
            'zmeja': { path: '/attached_assets/zmeja.glb', value: 600 },
            'gorilla': { path: '/attached_assets/Gorilla.glb', value: 700 },
            'jaguar': { path: '/attached_assets/jaguar.glb', value: 800 },
            'crocodile': { path: '/attached_assets/crocodile.glb', value: 900 },
            'lenivec': { path: '/attached_assets/lenivec.glb', value: 1000 },
            'scatter': { path: '/attached_assets/scatter.glb', value: 0 }
        };
    }

    async loadModels() {
        const loadPromises = [];
        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            const promise = new Promise((resolve, reject) => {
                this.loader.load(
                    data.path,
                    (gltf) => {
                        this.models[symbol] = gltf.scene;
                        resolve();
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading model ${symbol}:`, error);
                        reject(error);
                    }
                );
            });
            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            console.log('All models loaded successfully');
        } catch (error) {
            console.error('Error loading models:', error);
        }
    }

    createRenderer(canvas) {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        return renderer;
    }

    createScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 5;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 2);

        scene.add(ambientLight);
        scene.add(directionalLight);

        return { scene, camera };
    }

    getSymbolValue(symbol) {
        return this.symbolValues[symbol]?.value || 0;
    }

    isScatter(symbol) {
        return symbol === 'scatter';
    }
}

// Create a single instance of SymbolRenderer
const symbolRenderer = new SymbolRenderer();

// Export the instance
export { symbolRenderer };