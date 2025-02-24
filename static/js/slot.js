import { symbolRenderer } from './3d-symbols.js';

class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 11;
        this.loadedAssets = 0;
        this.lastProgress = 0;
        this.initializeLoading();
    }

    initializeLoading() {
        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
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

    onAssetLoaded(loaded, total) {
        const progress = (loaded / total) * 100;
        this.updateProgress(progress);

        if (loaded >= total) {
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
        this.canvas = document.getElementById('slotCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        try {
            this.ctx = this.canvas.getContext('2d');

            // Create separate canvas for each symbol
            this.symbolCanvas = document.createElement('canvas');
            this.symbolCanvas.width = 150;
            this.symbolCanvas.height = 150;

            // Initialize game properties
            this.lowSymbols = ['10', 'J', 'Q', 'K', 'A'];
            this.highSymbols = ['zmeja', 'gorilla', 'jaguar', 'crocodile', 'lenivec'];
            this.specialSymbols = ['scatter'];
            this.symbols = [...this.lowSymbols, ...this.highSymbols, ...this.specialSymbols];
            this.reels = Array(5).fill().map(() => Array(3).fill('A'));
            this.spinning = false;
            this.currentBet = 1.00;
            this.bonusSpinsRemaining = 0;

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    async init() {
        try {
            console.log('Starting slot machine initialization');

            // Configure loading events
            symbolRenderer.onProgress = (loaded, total) => {
                this.loadingManager.onAssetLoaded(loaded, total);
            };

            // Load models
            await symbolRenderer.loadModels();

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
                    const rendered = symbolRenderer.renderSymbol(symbol, this.symbolCanvas, this.symbolCanvas.width);

                    if (rendered) {
                        // Draw rendered 3D symbol
                        this.ctx.drawImage(this.symbolCanvas, x, y, symbolSize, symbolSize);
                    } else {
                        // Fallback to 2D symbol
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
            '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
            'zmeja': '🐍', 'gorilla': '🦍', 'jaguar': '🐆',
            'crocodile': '🐊', 'lenivec': '🦥', 'scatter': '⭐'
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

        window.addEventListener('beforeunload', () => {
            symbolRenderer.dispose();
        });
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