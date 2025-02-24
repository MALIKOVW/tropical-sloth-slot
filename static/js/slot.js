import { symbolRenderer } from './3d-symbols.js';

class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 11; // Total number of 3D models
        this.loadedAssets = 0;
        this.initializeLoading();
    }

    initializeLoading() {
        // Make sure loading screen is visible and game content is hidden
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
            this.loadingScreen.style.display = 'flex';
        }
        if (this.gameContent) {
            this.gameContent.style.display = 'none';
        }
    }

    updateProgress(loaded, total) {
        const progress = (loaded / total) * 100;
        if (this.loadingBar) {
            this.loadingBar.style.width = `${progress}%`;
        }
        if (this.loadingText) {
            this.loadingText.textContent = `${Math.round(progress)}%`;
        }
        console.log(`Loading progress updated: ${progress}%`);
    }

    hideLoadingScreen() {
        console.log('Hiding loading screen');
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                if (this.gameContent) {
                    this.gameContent.style.display = 'block';
                }
            }, 500);
        }
    }

    onAssetLoaded() {
        this.loadedAssets++;
        this.updateProgress(this.loadedAssets, this.totalAssets);
        console.log(`Asset loaded: ${this.loadedAssets}/${this.totalAssets}`);
        if (this.loadedAssets >= this.totalAssets) {
            console.log('All assets loaded, hiding loading screen');
            setTimeout(() => this.hideLoadingScreen(), 500);
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('Initializing Slot Machine');
        this.loadingManager = new LoadingManager();
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');

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

        // Initialize
        this.init();
    }

    async init() {
        try {
            console.log('Starting initialization');
            // Initialize responsive canvas
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // Configure loading events
            symbolRenderer.onProgress = (loaded, total) => {
                console.log(`Model loading progress: ${loaded}/${total}`);
                this.loadingManager.updateProgress(loaded, total);
            };

            symbolRenderer.onLoad = () => {
                console.log('Model loaded completely');
                this.loadingManager.onAssetLoaded();
            };

            // Load 3D models
            console.log('Starting to load models');
            await symbolRenderer.loadModels();

            // Initialize event listeners
            this.initializeEventListeners();

            // Initial draw
            this.draw();

            console.log('Initialization complete');
        } catch (error) {
            console.error('Error initializing slot machine:', error);
        }
    }

    resizeCanvas() {
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

        requestAnimationFrame(() => this.draw());
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