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

        this.initializeRenderer();
    }

    initializeRenderer() {
        try {
            console.log('Initializing THREE.js renderer');
            this.scene = new THREE.Scene();

            // Configure camera for better symbol viewing
            this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
            this.camera.position.z = 2;

            // Enhanced lighting setup
            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            this.directionalLight.position.set(1, 1, 2);

            // Add a second directional light for better illumination
            this.backLight = new THREE.DirectionalLight(0xffffff, 0.5);
            this.backLight.position.set(-1, -1, -2);

            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);
            this.scene.add(this.backLight);

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
                this.loader.load(
                    data.path,
                    (gltf) => {
                        try {
                            console.log(`Successfully loaded model for ${symbol}`);
                            const model = gltf.scene;

                            // Center and scale the model
                            const box = new THREE.Box3().setFromObject(model);
                            const center = box.getCenter(new THREE.Vector3());
                            const size = box.getSize(new THREE.Vector3());
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const scale = 1.5 / maxDim;

                            model.scale.setScalar(scale);
                            model.position.sub(center.multiplyScalar(scale));

                            // Add rotation animation
                            model.rotation.y = Math.PI / 6;

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
                        resolve();
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

    createRenderer(canvas, size) {
        try {
            console.log('Creating new WebGL renderer');
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            });

            renderer.setSize(size, size, false);
            renderer.setClearColor(0x000000, 0);
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;

            return renderer;
        } catch (error) {
            console.error('Error creating WebGL renderer:', error);
            return null;
        }
    }

    renderSymbol(symbol, canvas, size) {
        if (!this.models[symbol]) {
            console.warn(`No model available for symbol ${symbol}`);
            return false;
        }

        try {
            let renderer = this.renderers.get(canvas);

            if (!renderer) {
                renderer = this.createRenderer(canvas, size);
                if (!renderer) {
                    return false;
                }
                this.renderers.set(canvas, renderer);
            }

            // Clone the model for this specific render
            const model = this.models[symbol].clone();

            // Clear existing scene
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }

            // Re-add lights and model
            this.scene.add(this.ambientLight);
            this.scene.add(this.directionalLight);
            this.scene.add(this.backLight);
            this.scene.add(model);

            // Update camera aspect ratio
            this.camera.aspect = 1;
            this.camera.updateProjectionMatrix();

            // Render the scene
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

const symbolRenderer = new SymbolRenderer();
export { symbolRenderer };