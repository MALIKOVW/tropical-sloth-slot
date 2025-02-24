import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SymbolRenderer {
    constructor() {
        console.log('Initializing SymbolRenderer');
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

        // Initialize loading state
        this.onProgress = null;
        this.onLoad = null;
        this.totalModels = Object.keys(this.symbolValues).length;
        this.loadedModels = 0;

        // Initialize renderer components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.z = 2;

        // Set up lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(1, 1, 1);

        this.scene.add(this.ambientLight);
        this.scene.add(this.directionalLight);
    }

    async loadModels() {
        console.log('Starting model loading process');
        const loadPromises = [];

        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            console.log(`Loading model for ${symbol}`);
            const promise = new Promise((resolve) => {
                this.loader.load(
                    data.path,
                    (gltf) => {
                        try {
                            console.log(`Successfully loaded model for ${symbol}`);
                            const model = gltf.scene;

                            // Center and scale model
                            const box = new THREE.Box3().setFromObject(model);
                            const center = box.getCenter(new THREE.Vector3());
                            const size = box.getSize(new THREE.Vector3());
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const scale = 1 / maxDim;

                            model.scale.setScalar(scale);
                            model.position.sub(center.multiplyScalar(scale));

                            this.models[symbol] = model;
                            this.loadedModels++;

                            if (this.onProgress) {
                                this.onProgress(this.loadedModels, this.totalModels);
                            }

                            if (this.loadedModels === this.totalModels && this.onLoad) {
                                this.onLoad();
                            }
                        } catch (error) {
                            console.error(`Error processing model for ${symbol}:`, error);
                        }
                        resolve();
                    },
                    (xhr) => {
                        if (xhr.lengthComputable) {
                            const progress = (xhr.loaded / xhr.total) * 100;
                            console.log(`Loading ${symbol}: ${progress.toFixed(1)}%`);
                        }
                    },
                    (error) => {
                        console.error(`Error loading model ${symbol}:`, error);
                        // Still increment counter even if model fails to load
                        this.loadedModels++;
                        if (this.onProgress) {
                            this.onProgress(this.loadedModels, this.totalModels);
                        }
                        resolve();
                    }
                );
            });

            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            console.log('Model loading process complete');
        } catch (error) {
            console.error('Error during model loading:', error);
        }
    }

    renderSymbol(symbol, canvas, size) {
        if (!this.models[symbol]) {
            return false;
        }

        try {
            let renderer = this.renderers.get(canvas);

            if (!renderer) {
                renderer = new THREE.WebGLRenderer({
                    canvas,
                    alpha: true,
                    antialias: true,
                    preserveDrawingBuffer: true
                });
                renderer.setSize(size, size);
                renderer.setClearColor(0x000000, 0);
                this.renderers.set(canvas, renderer);
            }

            // Clear existing scene
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }

            // Add lights and model
            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);

            const model = this.models[symbol].clone();
            model.rotation.y = Math.PI / 4; // Rotate for better view
            this.scene.add(model);

            // Render scene
            renderer.render(this.scene, this.camera);
            return true;
        } catch (error) {
            console.error(`Error rendering symbol ${symbol}:`, error);
            return false;
        }
    }

    dispose() {
        try {
            console.log('Disposing resources');
            this.renderers.forEach(renderer => {
                if (renderer && renderer.dispose) {
                    renderer.dispose();
                }
            });
            this.renderers.clear();

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
        } catch (error) {
            console.error('Error during resource disposal:', error);
        }
    }

    getSymbolValue(symbol) {
        return this.symbolValues[symbol]?.value || 0;
    }

    isScatter(symbol) {
        return symbol === 'scatter';
    }
}

const symbolRenderer = new SymbolRenderer();
export { symbolRenderer };