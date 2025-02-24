import { symbolRenderer } from './3d-symbols.js';

class LoadingManager {
    constructor() {
        console.log('Initializing LoadingManager');
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
            console.error('Loading screen elements not found, retrying...');
            setTimeout(() => this.initializeLoading(), 100);
            return;
        }

        console.log('Loading screen initialized');
        this.loadingScreen.classList.remove('hidden');
        this.loadingScreen.style.display = 'flex';
        this.gameContent.style.display = 'none';

        this.loadedAssets = 0;
        this.lastProgress = 0;
        this.updateProgress(0);
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) {
            console.error('Loading elements not found during progress update');
            return;
        }

        progress = Math.min(100, Math.max(0, progress));

        if (Math.abs(progress - this.lastProgress) >= 1) {
            this.lastProgress = progress;
            this.loadingBar.style.width = `${progress}%`;
            this.loadingText.textContent = `${Math.round(progress)}%`;
            console.log(`Loading progress updated: ${progress}%`);
        }
    }

    hideLoadingScreen() {
        if (!this.loadingScreen || !this.gameContent) {
            console.error('Elements not found during hide loading screen');
            return;
        }

        console.log('Hiding loading screen');
        this.loadingScreen.classList.add('hidden');

        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
            console.log('Loading screen hidden, game content shown');
        }, 500);
    }

    onAssetLoaded(loaded, total) {
        console.log(`Asset loaded: ${loaded}/${total}`);
        const progress = (loaded / total) * 100;
        this.updateProgress(progress);

        if (loaded >= total) {
            console.log('All assets loaded, triggering hide loading screen');
            this.hideLoadingScreen();
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('Initializing Slot Machine');

        // Initialize basic properties
        this.lowSymbols = ['10', 'J', 'Q', 'K', 'A'];
        this.highSymbols = ['zmeja', 'gorilla', 'jaguar', 'crocodile', 'lenivec'];
        this.specialSymbols = ['scatter'];
        this.symbols = [...this.lowSymbols, ...this.highSymbols, ...this.specialSymbols];
        this.reels = Array(5).fill().map(() => Array(3).fill('A'));
        this.spinning = false;
        this.currentBet = 1.00;
        this.bonusSpinsRemaining = 0;
        this.stats = {
            totalSpins: 0,
            totalWins: 0,
            biggestWin: 0,
            totalBet: 0,
            totalWon: 0
        };

        // Initialize loading manager
        this.loadingManager = new LoadingManager();

        // Initialize after a short delay to ensure DOM is ready
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
            this.ctx = this.canvas.getContext('2d', {
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true,
                powerPreference: 'default'
            });

            this.tempCanvas = document.createElement('canvas');
            this.tempCtx = this.tempCanvas.getContext('2d', {
                alpha: true,
                antialias: true
            });

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    async init() {
        try {
            console.log('Starting slot machine initialization');

            // Initialize canvas size
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // Configure loading events
            symbolRenderer.onProgress = (loaded, total) => {
                console.log(`Model loading progress: ${loaded}/${total}`);
                this.loadingManager.onAssetLoaded(loaded, total);
            };

            // Load 3D models
            console.log('Starting to load models');
            await symbolRenderer.loadModels();

            // Initialize event listeners
            this.initializeEventListeners();

            // Initial draw
            requestAnimationFrame(() => this.draw());

            console.log('Slot machine initialization complete');
        } catch (error) {
            console.error('Error during slot machine initialization:', error);
        }
    }

    resizeCanvas() {
        if (!this.ctx || !this.canvas) {
            console.error('Canvas context not available for resize');
            return;
        }

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
            console.log(`Canvas resized to ${width}x${height} with scale ${scale}`);

            requestAnimationFrame(() => this.draw());
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    drawFallbackSymbol(symbol, x, y, size) {
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, size, size, 10);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${size * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.getSymbolDisplay(symbol), x + size/2, y + size/2);
    }

    getSymbolDisplay(symbol) {
        const symbolMap = {
            '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
            'zmeja': '🐍', 'gorilla': '🦍', 'jaguar': '🐆',
            'crocodile': '🐊', 'lenivec': '🦥',
            'scatter': '⭐'
        };
        return symbolMap[symbol] || symbol;
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        const reelWidth = this.logicalWidth / 5;
        const symbolSize = Math.min(140, Math.max(120, reelWidth * 0.6));
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const totalSymbolsHeight = symbolSize * 3;
        const verticalPadding = (this.logicalHeight - totalSymbolsHeight) / 4;

        // Update temporary canvas size
        this.tempCanvas.width = symbolSize;
        this.tempCanvas.height = symbolSize;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * reelWidth + horizontalPadding;
                const y = j * (symbolSize + verticalPadding) + verticalPadding;
                const symbol = this.reels[i][j];

                // Try to render 3D model
                const rendered = symbolRenderer.renderSymbol(symbol, this.tempCanvas, symbolSize);

                if (rendered) {
                    // If 3D render successful, copy to main canvas
                    this.ctx.drawImage(this.tempCanvas, x, y);
                } else {
                    // Fallback to 2D symbol
                    this.drawFallbackSymbol(symbol, x, y, symbolSize);
                }
            }
        }
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

            if (result.winnings > 0) {
                await this.showWinAnimation(result.winnings);
            }

            this.updateStats(result.winnings);

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

        const reelStates = Array(5).fill().map(() => ({
            symbols: Array(6).fill().map(() => this.symbols[Math.floor(Math.random() * this.symbols.length)]),
            currentStep: 0
        }));

        for (let step = 0; step < totalSteps; step++) {
            const startTime = performance.now();

            for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
                if (step < reelIndex * reelDelay) continue;

                const reel = reelStates[reelIndex];
                reel.currentStep = (reel.currentStep + 1) % reel.symbols.length;

                if (step % 2 === 0) {
                    reel.symbols.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
                    if (reel.symbols.length > 6) {
                        reel.symbols.shift();
                    }
                }

                // Update visible symbols during animation
                for (let j = 0; j < 3; j++) {
                    const symbolIndex = (reel.currentStep + j) % reel.symbols.length;
                    this.reels[reelIndex][j] = reel.symbols[symbolIndex];
                }
            }

            this.draw();

            // Оптимизированная задержка
            const elapsedTime = performance.now() - startTime;
            const remainingDelay = Math.max(0, stepDelay - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }
    }

    updateStats(winnings) {
        this.stats.totalSpins++;
        if (winnings > 0) {
            this.stats.totalWins++;
            this.stats.biggestWin = Math.max(this.stats.biggestWin, winnings);
        }
        this.stats.totalBet += this.currentBet;
        this.stats.totalWon += winnings;
    }

    async showWinAnimation(amount) {
        const winDisplay = document.createElement('div');
        winDisplay.className = 'win-animation';
        winDisplay.textContent = `WIN! ${amount.toFixed(2)}`;
        document.body.appendChild(winDisplay);

        await new Promise(resolve => setTimeout(resolve, 2000));
        winDisplay.remove();
    }

    adjustBet(amount) {
        const newBet = Math.max(0.20, Math.min(100, this.currentBet + amount));
        this.currentBet = Number(newBet.toFixed(2));
        document.getElementById('currentBet').textContent = this.currentBet.toFixed(2);
    }

    updateBonusDisplay() {
        const bonusDisplay = document.getElementById('bonusSpinsCount');
        if (this.bonusSpinsRemaining > 0) {
            bonusDisplay.textContent = `Free Spins: ${this.bonusSpinsRemaining}`;
            bonusDisplay.style.display = 'inline-block';
            bonusDisplay.classList.add('active-bonus');
        } else {
            bonusDisplay.style.display = 'none';
            bonusDisplay.classList.remove('active-bonus');
        }
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(0.10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-0.10));

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            symbolRenderer.dispose();
        });
    }
}

// Initialize slot machine when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, creating slot machine instance');
    const slot = new SlotMachine();
});