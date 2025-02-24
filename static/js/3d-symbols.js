import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SymbolRenderer {
    constructor() {
        this.loader = new GLTFLoader();
        this.models = {};
        this.symbolValues = {
            '10': { path: '/static/models/10.glb', value: 100 },
            'J': { path: '/static/models/J.glb', value: 200 },
            'Q': { path: '/static/models/Q.glb', value: 300 },
            'K': { path: '/static/models/K.glb', value: 400 },
            'A': { path: '/static/models/A.glb', value: 500 },
            'zmeja': { path: '/static/models/zmeja.glb', value: 600 },
            'gorilla': { path: '/static/models/Gorilla.glb', value: 700 },
            'jaguar': { path: '/static/models/jaguar.glb', value: 800 },
            'crocodile': { path: '/static/models/crocodile.glb', value: 900 },
            'lenivec': { path: '/static/models/lenivec.glb', value: 1000 },
            'scatter': { path: '/static/models/scatter.glb', value: 0 }
        };

        // Pre-create shared resources
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(0, 1, 2);

        // Debug flag
        this.debug = true;
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[SymbolRenderer] ${message}`, ...args);
        }
    }

    async loadModels() {
        this.log('Starting to load models...');
        const loadPromises = [];

        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            this.log(`Loading model for symbol: ${symbol}, path: ${data.path}`);
            const promise = new Promise((resolve) => {
                this.loader.load(
                    data.path,
                    (gltf) => {
                        this.log(`Successfully loaded model for ${symbol}`);
                        this.models[symbol] = gltf.scene;

                        // Center and scale the model
                        const box = new THREE.Box3().setFromObject(gltf.scene);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 2 / maxDim;

                        gltf.scene.scale.setScalar(scale);
                        gltf.scene.position.sub(center.multiplyScalar(scale));

                        this.log(`Model ${symbol} processed: scale=${scale}, position=${gltf.scene.position.toArray()}`);
                        resolve();
                    },
                    (progress) => {
                        this.log(`Loading progress for ${symbol}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                    },
                    (error) => {
                        console.error(`Error loading model ${symbol}:`, error);
                        this.log(`Failed to load model ${symbol}, will use fallback`);
                        resolve(); // Resolve anyway to continue with other models
                    }
                );
            });
            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            this.log('All models processed');
            console.log('Successfully processed all 3D models');
        } catch (error) {
            console.error('Error during model loading:', error);
            this.log('Error during model loading process', error);
        }
    }

    createRenderer(canvas) {
        this.log('Creating renderer');
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);
        return renderer;
    }

    createScene() {
        this.log('Creating new scene');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 3;

        // Clone lights from shared resources
        scene.add(this.ambientLight.clone());
        scene.add(this.directionalLight.clone());

        return { scene, camera };
    }

    getSymbolValue(symbol) {
        return this.symbolValues[symbol]?.value || 0;
    }

    isScatter(symbol) {
        return symbol === 'scatter';
    }

    getLoadedModelKeys() {
        return Object.keys(this.models);
    }
}

// Create a single instance of SymbolRenderer
const symbolRenderer = new SymbolRenderer();

// Export the instance
export { symbolRenderer };