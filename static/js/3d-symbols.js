import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SymbolRenderer {
    constructor() {
        this.loader = new GLTFLoader();
        this.models = {};
        this.renderers = new Map();
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
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.z = 3;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(0, 1, 2);

        this.scene.add(this.ambientLight);
        this.scene.add(this.directionalLight);

        // Loading events
        this.onProgress = null;
        this.onLoad = null;
        this.totalModels = Object.keys(this.symbolValues).length;
        this.loadedModels = 0;

        // Enable error logging
        THREE.onError = (error) => {
            console.error('THREE.js error:', error);
        };
    }

    async loadModels() {
        console.log('Starting to load models...');
        const loadPromises = [];

        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            console.log(`Loading model for symbol: ${symbol}`);
            const promise = new Promise((resolve) => {
                this.loader.load(
                    data.path,
                    (gltf) => {
                        console.log(`Successfully loaded model for ${symbol}`);
                        const model = gltf.scene.clone();

                        // Center and scale the model
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 1.5 / maxDim;

                        model.scale.setScalar(scale);
                        model.position.sub(center.multiplyScalar(scale));

                        this.models[symbol] = model;
                        this.loadedModels++;

                        if (this.onProgress) {
                            this.onProgress(this.loadedModels, this.totalModels);
                        }
                        if (this.onLoad) {
                            this.onLoad();
                        }

                        resolve();
                    },
                    (progress) => {
                        const percent = (progress.loaded / progress.total * 100).toFixed(2);
                        console.log(`Loading progress for ${symbol}: ${percent}%`);
                    },
                    (error) => {
                        console.warn(`Failed to load model ${symbol}:`, error);
                        this.loadedModels++;
                        if (this.onProgress) {
                            this.onProgress(this.loadedModels, this.totalModels);
                        }
                        resolve(); // Continue loading other models
                    }
                );
            });
            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            console.log('All models processed');
        } catch (error) {
            console.error('Error during model loading:', error);
        }
    }

    getRenderer(canvas, size) {
        const key = `${canvas.id}_${size}`;
        if (!this.renderers.has(key)) {
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance',
                precision: 'mediump' // Use medium precision for better performance
            });
            renderer.setSize(size, size);
            renderer.setClearColor(0x000000, 0);
            renderer.setPixelRatio(1); // Use 1 for better performance
            this.renderers.set(key, renderer);
        }
        return this.renderers.get(key);
    }

    renderSymbol(symbol, canvas, size) {
        if (!this.models[symbol]) {
            return false;
        }

        try {
            const renderer = this.getRenderer(canvas, size);
            const model = this.models[symbol].clone();

            this.scene.clear();
            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);
            this.scene.add(model);

            renderer.render(this.scene, this.camera);
            return true;
        } catch (error) {
            console.error(`Error rendering symbol ${symbol}:`, error);
            return false;
        }
    }

    dispose() {
        // Очистка ресурсов
        this.renderers.forEach(renderer => {
            if (renderer && renderer.dispose) {
                renderer.dispose();
            }
        });
        this.renderers.clear();

        // Очистка моделей
        Object.values(this.models).forEach(model => {
            if (model && model.traverse) {
                model.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        });
        this.models = {};
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