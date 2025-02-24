class LoadingManager {
    constructor() {
        console.log('Initializing LoadingManager');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 11; // Number of symbol images
        this.loadedAssets = 0;
        this.lastProgress = 0;
        this.initializeLoading();
    }

    initializeLoading() {
        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('Loading screen elements not found, retrying...');
            setTimeout(() => this.initializeLoading(), 100);
            return;
        }

        this.loadingScreen.classList.remove('hidden');
        this.loadingScreen.style.display = 'flex';
        this.gameContent.style.display = 'none';

        this.loadedAssets = 0;
        this.lastProgress = 0;
        this.updateProgress(0);
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) return;

        progress = Math.min(100, Math.max(0, progress));
        if (Math.abs(progress - this.lastProgress) >= 1) {
            this.lastProgress = progress;
            this.loadingBar.style.width = `${progress}%`;
            this.loadingText.textContent = `${Math.round(progress)}%`;
            console.log(`Loading progress: ${progress}%`);
        }
    }

    hideLoadingScreen() {
        if (!this.loadingScreen || !this.gameContent) return;

        this.loadingScreen.classList.add('hidden');
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
        }, 500);
    }

    onAssetLoaded() {
        this.loadedAssets++;
        console.log(`Asset loaded: ${this.loadedAssets}/${this.totalAssets}`);
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);

        if (this.loadedAssets >= this.totalAssets) {
            console.log('All assets loaded');
            this.hideLoadingScreen();
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('Initializing Slot Machine');
        this.loadingManager = new LoadingManager();

        setTimeout(() => {
            this.initializeCanvas();
            this.init();
        }, 100);
    }

    initializeCanvas() {
        console.log('Initializing canvas');
        this.canvas = document.getElementById('slotCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        try {
            this.ctx = this.canvas.getContext('2d');

            // Define symbols and their properties
            this.symbolDefinitions = {
                // Low value symbols
                'wooden_a': { value: 10, path: '/static/images/symbols/wooden_a.png' },
                'wooden_k': { value: 15, path: '/static/images/symbols/wooden_k.png' },
                'wooden_arch': { value: 20, path: '/static/images/symbols/wooden_arch.png' },

                // Medium value symbols
                'snake': { value: 30, path: '/static/images/symbols/snake.png' },
                'gorilla': { value: 40, path: '/static/images/symbols/gorilla.png' },
                'jaguar': { value: 50, path: '/static/images/symbols/jaguar.png' },
                'crocodile': { value: 60, path: '/static/images/symbols/crocodile.png' },
                'gator': { value: 70, path: '/static/images/symbols/gator.png' },
                'leopard': { value: 80, path: '/static/images/symbols/leopard.png' },

                // High value symbol
                'dragon': { value: 100, path: '/static/images/symbols/dragon.png' },

                // Scatter symbol
                'sloth': { value: 0, path: '/static/images/symbols/sloth.png' }
            };

            // Initialize game state
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 1.00;
            this.bonusSpinsRemaining = 0;

            // Start loading images
            this.loadSymbolImages();

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    loadSymbolImages() {
        console.log('Starting to load symbol images');
        Object.entries(this.symbolDefinitions).forEach(([symbol, def]) => {
            console.log(`Loading image for symbol: ${symbol}, path: ${def.path}`);
            const img = new Image();
            img.onload = () => {
                console.log(`Successfully loaded image for symbol: ${symbol}`);
                this.symbolImages.set(symbol, img);
                this.loadingManager.onAssetLoaded();
            };
            img.onerror = (error) => {
                console.error(`Failed to load image for symbol: ${symbol}`, error);
                this.loadingManager.onAssetLoaded();
            };
            img.src = def.path;
        });
    }

    async init() {
        try {
            console.log('Starting slot machine initialization');

            // Initialize event listeners
            this.initializeEventListeners();

            // Set up canvas size and start rendering
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            requestAnimationFrame(() => this.draw());

            console.log('Slot machine initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    resizeCanvas() {
        if (!this.ctx || !this.canvas) return;

        try {
            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const maxWidth = Math.min(1440, window.innerWidth < 768 ? containerWidth * 0.98 : containerWidth);
            const minWidth = Math.max(800, maxWidth);
            const width = Math.min(maxWidth, Math.max(minWidth, containerWidth));
            const aspectRatio = 4 / 3;
            const height = width / aspectRatio;

            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            const scale = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = width * scale;
            this.canvas.height = height * scale;

            this.logicalWidth = width;
            this.logicalHeight = height;

            this.ctx.scale(scale, scale);
            this.draw();
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        const reelWidth = this.logicalWidth / 5;
        const symbolSize = Math.min(140, Math.max(120, reelWidth * 0.6));
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const totalSymbolsHeight = symbolSize * 3;
        const verticalPadding = (this.logicalHeight - totalSymbolsHeight) / 4;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * reelWidth + horizontalPadding;
                const y = j * (symbolSize + verticalPadding) + verticalPadding;
                const symbol = this.reels[i][j];

                try {
                    const img = this.symbolImages.get(symbol);
                    if (img) {
                        console.log(`Drawing symbol ${symbol} at position ${i},${j}`);
                        this.ctx.drawImage(img, x, y, symbolSize, symbolSize);
                    } else {
                        console.warn(`No image found for symbol ${symbol}, using fallback`);
                        this.drawFallbackSymbol(symbol, x, y, symbolSize);
                    }
                } catch (error) {
                    console.error(`Error rendering symbol ${symbol}:`, error);
                    this.drawFallbackSymbol(symbol, x, y, symbolSize);
                }
            }
        }
    }

    drawFallbackSymbol(symbol, x, y, size) {
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${size * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.getSymbolDisplay(symbol), x + size/2, y + size/2);
    }

    getSymbolDisplay(symbol) {
        const symbolMap = {
            'wooden_a': 'A', 'wooden_k': 'K', 'wooden_arch': 'Arch',
            'snake': '🐍', 'gorilla': '🦍', 'jaguar': '🐆',
            'crocodile': '🐊', 'gator': '🐊', 'leopard': '🐆',
            'dragon': '🐲', 'sloth': '🦥'
        };
        return symbolMap[symbol] || symbol;
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(0.10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-0.10));
    }

    adjustBet(amount) {
        const newBet = Math.max(0.20, Math.min(100, this.currentBet + amount));
        this.currentBet = Number(newBet.toFixed(2));
        document.getElementById('currentBet').textContent = this.currentBet.toFixed(2);
    }

    async spin() {
        if (this.spinning) return;

        const credits = parseFloat(document.getElementById('creditDisplay').textContent);
        if (!this.bonusSpinsRemaining && credits < this.currentBet) {
            alert('Insufficient credits!');
            return;
        }

        this.spinning = true;
        document.getElementById('spinButton').disabled = true;

        try {
            await this.animateSpin();

            const formData = new FormData();
            formData.append('bet', this.currentBet);

            const response = await fetch('/spin', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.error) {
                alert(result.error);
                return;
            }

            this.reels = result.result;
            document.getElementById('creditDisplay').textContent = result.credits.toFixed(2);

        } catch (error) {
            console.error('Error during spin:', error);
            alert('An error occurred during spin. Please try again.');
        } finally {
            this.spinning = false;
            document.getElementById('spinButton').disabled = false;
            this.draw();
        }
    }

    async animateSpin() {
        const totalSteps = 20;
        const stepDelay = 50;
        const reelDelay = 4;

        for (let step = 0; step < totalSteps; step++) {
            const startTime = performance.now();

            for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
                if (step < reelIndex * reelDelay) continue;

                // Generate random symbols for animation
                for (let j = 0; j < 3; j++) {
                    this.reels[reelIndex][j] = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                }
            }

            this.draw();

            const elapsedTime = performance.now() - startTime;
            const remainingDelay = Math.max(0, stepDelay - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }
    }
}

// Initialize slot machine when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, creating slot machine instance');
    const slot = new SlotMachine();
});