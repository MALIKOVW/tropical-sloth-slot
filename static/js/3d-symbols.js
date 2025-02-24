import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SymbolRenderer {
    constructor() {
        console.log('Initializing SymbolRenderer');
        // Initialize loader
        this.loader = new GLTFLoader();
        this.models = {};
        this.renderers = new Map();

        // Model paths configuration
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

        this.initializeRenderer();
    }

    initializeRenderer() {
        try {
            console.log('Initializing THREE.js renderer');
            // Create scene once
            this.scene = new THREE.Scene();

            // Create camera with proper frustum
            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            this.camera.position.z = 5;

            // Set up lighting
            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            this.directionalLight.position.set(0, 1, 2);

            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);

            // Loading state
            this.onProgress = null;
            this.onLoad = null;
            this.totalModels = Object.keys(this.symbolValues).length;
            this.loadedModels = 0;

            console.log('THREE.js renderer initialized successfully');
        } catch (error) {
            console.error('Error initializing THREE.js renderer:', error);
        }
    }

    async loadModels() {
        console.log('Starting to load models...');
        const loadPromises = [];

        for (const [symbol, data] of Object.entries(this.symbolValues)) {
            const promise = new Promise((resolve) => {
                // Check if model exists first
                fetch(data.path, { method: 'HEAD' })
                    .then(response => {
                        if (!response.ok) {
                            console.warn(`Model for ${symbol} not found, using fallback`);
                            this.loadedModels++;
                            if (this.onProgress) {
                                this.onProgress(this.loadedModels, this.totalModels);
                            }
                            resolve();
                            return;
                        }

                        this.loader.load(
                            data.path,
                            (gltf) => {
                                try {
                                    console.log(`Loaded model for ${symbol}`);
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

                                    if (this.loadedModels === this.totalModels && this.onLoad) {
                                        console.log('All models loaded successfully');
                                        this.onLoad();
                                    }
                                } catch (error) {
                                    console.error(`Error processing model for ${symbol}:`, error);
                                }
                                resolve();
                            },
                            (xhr) => {
                                if (xhr.lengthComputable) {
                                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                                    console.log(`${symbol} ${percentComplete.toFixed(2)}% downloaded`);
                                }
                            },
                            (error) => {
                                console.warn(`Error loading model for ${symbol}:`, error);
                                this.loadedModels++;
                                if (this.onProgress) {
                                    this.onProgress(this.loadedModels, this.totalModels);
                                }
                                resolve();
                            }
                        );
                    })
                    .catch(error => {
                        console.error(`Failed to check model for ${symbol}:`, error);
                        this.loadedModels++;
                        if (this.onProgress) {
                            this.onProgress(this.loadedModels, this.totalModels);
                        }
                        resolve();
                    });
            });

            loadPromises.push(promise);
        }

        try {
            await Promise.all(loadPromises);
            console.log('All models processed');

            // Ensure onLoad is called even if some models failed to load
            if (this.loadedModels === this.totalModels && this.onLoad) {
                this.onLoad();
            }
        } catch (error) {
            console.error('Error during model loading:', error);
            if (this.onLoad) {
                this.onLoad();
            }
        }
    }

    renderSymbol(symbol, canvas, size) {
        if (!this.models[symbol]) {
            return false; // Use fallback rendering
        }

        try {
            let renderer = this.renderers.get(canvas);

            if (!renderer) {
                console.log(`Creating new WebGL renderer for canvas ${canvas.id}`);
                renderer = new THREE.WebGLRenderer({
                    canvas,
                    alpha: true,
                    antialias: true,
                    preserveDrawingBuffer: true
                });
                renderer.setSize(size, size, false);
                renderer.setClearColor(0x000000, 0);
                this.renderers.set(canvas, renderer);
            }

            const model = this.models[symbol].clone();

            // Reset scene
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);
            this.scene.add(model);

            // Center model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            renderer.render(this.scene, this.camera);
            return true;
        } catch (error) {
            console.error(`Error rendering symbol ${symbol}:`, error);
            return false;
        }
    }

    dispose() {
        try {
            console.log('Disposing SymbolRenderer resources');
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
            console.log('SymbolRenderer resources disposed');
        } catch (error) {
            console.error('Error disposing SymbolRenderer:', error);
        }
    }

    getSymbolValue(symbol) {
        return this.symbolValues[symbol]?.value || 0;
    }

    isScatter(symbol) {
        return symbol === 'scatter';
    }
}

// Create and export a single instance
const symbolRenderer = new SymbolRenderer();
export { symbolRenderer };