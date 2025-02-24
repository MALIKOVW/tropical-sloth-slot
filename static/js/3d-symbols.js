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

        // Loading state
        this.onProgress = null;
        this.onLoad = null;
        this.totalModels = Object.keys(this.symbolValues).length;
        this.loadedModels = 0;

        // Initialize THREE.js components
        this.initializeScene();
    }

    initializeScene() {
        try {
            // Create scene
            this.scene = new THREE.Scene();

            // Configure camera
            this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
            this.camera.position.z = 1.5;

            // Setup lighting
            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            this.directionalLight.position.set(1, 1, 1);

            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);

            console.log('Scene initialized successfully');
        } catch (error) {
            console.error('Error initializing scene:', error);
        }
    }

    async loadModels() {
        const loadPromises = [];

        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            const promise = new Promise((resolve) => {
                this.loader.load(
                    data.path,
                    (gltf) => {
                        try {
                            console.log(`Loading model for ${symbol}`);
                            const model = gltf.scene;

                            // Center and scale the model
                            const box = new THREE.Box3().setFromObject(model);
                            const center = box.getCenter(new THREE.Vector3());
                            const size = box.getSize(new THREE.Vector3());
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const scale = 1.2 / maxDim;

                            model.scale.setScalar(scale);
                            model.position.sub(center.multiplyScalar(scale));

                            this.models[symbol] = model;
                            this.loadedModels++;

                            if (this.onProgress) {
                                this.onProgress(this.loadedModels, this.totalModels);
                            }

                            resolve();
                        } catch (error) {
                            console.error(`Error processing model for ${symbol}:`, error);
                            resolve();
                        }
                    },
                    null,
                    (error) => {
                        console.error(`Failed to load model ${symbol}:`, error);
                        resolve();
                    }
                );
            });

            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            if (this.onLoad) {
                this.onLoad();
            }
        } catch (error) {
            console.error('Error during model loading:', error);
        }
    }

    initializeRenderer(canvas, size) {
        try {
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            });

            renderer.setSize(size, size, false);
            renderer.setClearColor(0x000000, 0);
            renderer.setPixelRatio(1);

            return renderer;
        } catch (error) {
            console.error('Failed to initialize renderer:', error);
            return null;
        }
    }

    renderSymbol(symbol, canvas, size) {
        if (!this.models[symbol]) {
            return false;
        }

        try {
            // Create or get renderer
            let renderer = this.renderers.get(canvas.id);
            if (!renderer) {
                renderer = this.initializeRenderer(canvas, size);
                if (!renderer) {
                    return false;
                }
                this.renderers.set(canvas.id, renderer);
            }

            // Clear scene
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }

            // Add lights and model
            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);

            const model = this.models[symbol].clone();
            model.rotation.y = Math.PI / 4;
            this.scene.add(model);

            // Render
            renderer.render(this.scene, this.camera);
            return true;
        } catch (error) {
            console.error(`Error rendering symbol ${symbol}:`, error);
            return false;
        }
    }

    dispose() {
        try {
            // Dispose renderers
            this.renderers.forEach((renderer, id) => {
                try {
                    if (renderer && renderer.dispose) {
                        renderer.forceContextLoss();
                        renderer.dispose();
                        console.log(`Disposed renderer ${id}`);
                    }
                } catch (error) {
                    console.error(`Error disposing renderer ${id}:`, error);
                }
            });
            this.renderers.clear();

            // Dispose models
            Object.entries(this.models).forEach(([symbol, model]) => {
                try {
                    if (model && model.traverse) {
                        model.traverse(child => {
                            if (child.geometry) {
                                child.geometry.dispose();
                            }
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(material => material.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error disposing model ${symbol}:`, error);
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