import { symbolRenderer } from './3d-symbols.js';

class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.lowSymbols = ['10', 'J', 'Q', 'K', 'A'];
        this.highSymbols = ['zmeja', 'gorilla', 'jaguar', 'crocodile', 'lenivec'];
        this.specialSymbols = ['scatter'];

        this.symbols = [...this.lowSymbols, ...this.highSymbols, ...this.specialSymbols];
        this.reels = Array(5).fill().map(() => Array(3).fill('A'));
        this.spinning = false;
        this.currentBet = 1.00;
        this.bonusSpinsRemaining = 0;
        this.wildPositions = [];
        this.stats = {
            totalSpins: 0,
            totalWins: 0,
            biggestWin: 0,
            totalBet: 0,
            totalWon: 0
        };

        // Initialize responsive canvas
        this.resizeCanvas();
        this.draw();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });

        // Load 3D models
        this.loadModels();

        this.initializeEventListeners();
        this.updateBonusDisplay();
    }

    async loadModels() {
        try {
            await symbolRenderer.loadModels();
            console.log('3D models loaded successfully');
            this.draw(); // Redraw after models are loaded
        } catch (error) {
            console.error('Error loading 3D models:', error);
            // Continue with fallback display
            this.draw();
        }
    }

    drawFallbackSymbol(symbol, x, y, size) {
        // Draw background
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, size, size, 10);
        this.ctx.fill();

        // Draw symbol text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${size * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.getSymbolDisplay(symbol), x + size/2, y + size/2);
    }

    async draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        const reelWidth = this.logicalWidth / 5;
        const maxSymbolSize = 140;
        const minSymbolSize = 120;
        const symbolSize = Math.min(maxSymbolSize, Math.max(minSymbolSize, reelWidth * 0.6));
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const totalSymbolsHeight = symbolSize * 3;
        const verticalPadding = (this.logicalHeight - totalSymbolsHeight) / 4;

        // Create temporary canvas for each symbol
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = symbolSize;
        tempCanvas.height = symbolSize;

        // Draw symbols
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * reelWidth + horizontalPadding;
                const y = j * (symbolSize + verticalPadding) + verticalPadding;
                const symbol = this.reels[i][j];

                try {
                    // Create a renderer for this symbol
                    const renderer = symbolRenderer.createRenderer(tempCanvas);
                    const { scene, camera } = symbolRenderer.createScene();

                    // Add the model to the scene if it exists
                    if (symbolRenderer.models[symbol]) {
                        const model = symbolRenderer.models[symbol].clone();
                        scene.add(model);

                        // Render the symbol
                        renderer.setSize(symbolSize, symbolSize);
                        renderer.render(scene, camera);

                        // Draw the rendered symbol onto the main canvas
                        this.ctx.drawImage(tempCanvas, x, y);

                        // Clean up
                        renderer.dispose();
                    } else {
                        // Fallback to 2D rendering if model not available
                        this.drawFallbackSymbol(symbol, x, y, symbolSize);
                    }
                } catch (error) {
                    console.error('Error rendering symbol:', error);
                    // Fallback to 2D rendering on error
                    this.drawFallbackSymbol(symbol, x, y, symbolSize);
                }
            }
        }
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

        const scale = window.devicePixelRatio || 1;
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;

        this.logicalWidth = width;
        this.logicalHeight = height;

        this.ctx.scale(scale, scale);
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
            }

            await new Promise(resolve => setTimeout(resolve, stepDelay));
            this.draw();
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

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(0.10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-0.10));
    }
}

window.addEventListener('load', () => {
    const slot = new SlotMachine();

    // Prevent double-tap zoom on mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});