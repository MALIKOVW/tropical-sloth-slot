class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');

        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('LoadingManager: Required elements not found');
            return;
        }

        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.imageCache = new Map();

        this.gameContent.style.display = 'none';
        this.loadingScreen.style.display = 'flex';
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) return;
        progress = Math.min(100, Math.max(0, progress));
        console.log(`Loading progress: ${progress}%`);
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.textContent = `${Math.round(progress)}%`;
    }

    onAssetLoaded() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);

        if (this.loadedAssets >= this.totalAssets) {
            console.log('All assets loaded');
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
        }
    }

    async loadImage(path) {
        try {
            console.log(`Loading image: ${path}`);
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
                img.src = path;
            });
            console.log(`Successfully loaded: ${path}`);
            this.imageCache.set(path, img);
            this.onAssetLoaded();
            return img;
        } catch (error) {
            console.error(`Error loading image: ${path}`, error);
            throw error;
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('Initializing slot machine');
        this.init();
    }

    async init() {
        try {
            // Basic initialization
            this.SYMBOL_SIZE = 60;
            this.SYMBOL_PADDING = 3;
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 10;

            // Initialize canvas
            this.canvas = document.getElementById('slotCanvas');
            if (!this.canvas) {
                throw new Error('Canvas not found');
            }

            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            // Initialize loading manager
            this.loadingManager = new LoadingManager();

            // Initialize reels with default symbol
            this.reels = Array(5).fill().map(() => Array(3).fill('10'));

            // Define symbols with paths
            const symbols = [
                { name: '10', path: '/static/images/symbols/pic1.png' },
                { name: 'J', path: '/static/images/symbols/pic2.png' },
                { name: 'Q', path: '/static/images/symbols/pic3.png' },
                { name: 'K', path: '/static/images/symbols/pic4.png' },
                { name: 'A', path: '/static/images/symbols/pic5.png' }
            ];

            // Set total assets to load
            this.loadingManager.totalAssets = symbols.length;

            // Load all symbols
            for (const symbol of symbols) {
                try {
                    const img = await this.loadingManager.loadImage(symbol.path);
                    this.symbolImages.set(symbol.name, img);
                } catch (error) {
                    console.error(`Failed to load symbol ${symbol.name}:`, error);
                    this.createFallbackSymbol(symbol.name);
                }
            }

            // Initialize game components
            this.initPaylines();
            this.initializeEventListeners();
            this.resizeCanvas();
            this.draw();

            console.log('Slot machine initialized');
        } catch (error) {
            console.error('Failed to initialize slot:', error);
        }
    }

    createFallbackSymbol(symbol) {
        console.log(`Creating fallback for ${symbol}`);
        const canvas = document.createElement('canvas');
        canvas.width = this.SYMBOL_SIZE;
        canvas.height = this.SYMBOL_SIZE;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, this.SYMBOL_SIZE, this.SYMBOL_SIZE);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, this.SYMBOL_SIZE / 2, this.SYMBOL_SIZE / 2);

        const img = new Image();
        img.src = canvas.toDataURL();
        this.symbolImages.set(symbol, img);
        this.loadingManager.onAssetLoaded();
    }

    initPaylines() {
        this.paylines = [
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}],
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}],
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}],
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}],
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}]
        ];
    }

    resizeCanvas() {
        const numReels = 5;
        const numRows = 3;
        const horizontalPadding = this.SYMBOL_PADDING * 6;
        const verticalPadding = this.SYMBOL_PADDING * 4;

        this.canvas.width = (this.SYMBOL_SIZE * numReels) + horizontalPadding;
        this.canvas.height = (this.SYMBOL_SIZE * numRows) + verticalPadding;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const totalWidth = this.canvas.width;
        const totalHeight = this.canvas.height;
        const symbolWidth = this.SYMBOL_SIZE;
        const symbolHeight = this.SYMBOL_SIZE;

        const horizontalGap = (totalWidth - (5 * symbolWidth)) / 6;
        const verticalGap = (totalHeight - (3 * symbolHeight)) / 4;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const symbol = this.reels[i][j];
                const x = horizontalGap + i * (symbolWidth + horizontalGap);
                const y = verticalGap + j * (symbolHeight + verticalGap);

                const img = this.symbolImages.get(symbol);
                if (img) {
                    this.ctx.drawImage(img, x, y, symbolWidth, symbolHeight);
                }
            }
        }
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        const increaseBet = document.getElementById('increaseBet');
        const decreaseBet = document.getElementById('decreaseBet');

        if (increaseBet) {
            increaseBet.addEventListener('click', () => this.adjustBet(1));
        }
        if (decreaseBet) {
            decreaseBet.addEventListener('click', () => this.adjustBet(-1));
        }
    }

    adjustBet(amount) {
        const betValues = [10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000];
        const currentIndex = betValues.indexOf(this.currentBet);
        const newIndex = amount > 0 
            ? Math.min(currentIndex + 1, betValues.length - 1)
            : Math.max(currentIndex - 1, 0);

        this.currentBet = betValues[newIndex];
        const currentBetElement = document.getElementById('currentBet');
        if (currentBetElement) {
            currentBetElement.textContent = this.currentBet.toFixed(2);
        }
    }

    async spin() {
        if (this.spinning) return;

        const credits = parseFloat(document.getElementById('creditDisplay').textContent);
        if (credits < this.currentBet) {
            alert('Недостаточно кредитов!');
            return;
        }

        this.spinning = true;
        const spinButton = document.getElementById('spinButton');
        if (spinButton) spinButton.disabled = true;

        // Update credits
        const newCredits = credits - this.currentBet;
        const creditDisplay = document.getElementById('creditDisplay');
        if (creditDisplay) creditDisplay.textContent = newCredits.toFixed(2);

        // Generate random result
        const result = Array(5).fill().map(() =>
            Array(3).fill().map(() => {
                const symbols = ['10', 'J', 'Q', 'K', 'A'];
                return symbols[Math.floor(Math.random() * symbols.length)];
            })
        );

        // Animate spin
        await this.animateSpin(result);

        // Update reels and redraw
        this.reels = result;
        this.draw();

        // Re-enable spin button
        if (spinButton) spinButton.disabled = false;
        this.spinning = false;
    }

    async animateSpin(finalResult) {
        const steps = 30;
        const stepDelay = 50;

        for (let step = 0; step < steps; step++) {
            for (let i = 0; i < 5; i++) {
                if (step < i * 2) continue;

                if (step < steps - 1) {
                    for (let j = 0; j < 3; j++) {
                        const symbols = ['10', 'J', 'Q', 'K', 'A'];
                        this.reels[i][j] = symbols[Math.floor(Math.random() * symbols.length)];
                    }
                } else {
                    this.reels[i] = finalResult[i];
                }
            }

            this.draw();
            await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
    }
    showWinningLine(positions) {
        const container = document.getElementById('paylineContainer');
        if (!container) return;

        container.innerHTML = '';

        const cellSize = this.SYMBOL_SIZE + (this.SYMBOL_PADDING * 2);
        const startPos = positions[0];
        const endPos = positions[positions.length - 1];

        const startX = startPos.x * cellSize + cellSize / 2;
        const startY = startPos.y * cellSize + cellSize / 2;
        const endX = endPos.x * cellSize + cellSize / 2;
        const endY = endPos.y * cellSize + cellSize / 2;

        const line = document.createElement('div');
        line.className = 'payline active';

        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

        line.style.width = `${length}px`;
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.transform = `rotate(${angle}deg)`;

        container.appendChild(line);

        positions.forEach(pos => {
            const x = pos.x * cellSize;
            const y = pos.y * cellSize;

            const symbolKey = this.reels[pos.x][pos.y];
            const img = this.symbolImages.get(symbolKey);

            if (img) {
                const symbol = document.createElement('div');
                symbol.className = 'winning-symbol active';
                symbol.style.left = `${x}px`;
                symbol.style.top = `${y}px`;

                const symbolImg = document.createElement('img');
                symbolImg.src = img.src;
                symbol.appendChild(symbolImg);

                container.appendChild(symbol);
            }
        });

        setTimeout(() => {
            container.innerHTML = '';
        }, 2000);
    }

    checkWinningLines() {
        const winningLines = [];

        this.paylines.forEach((line, index) => {
            const symbols = line.map(pos => this.reels[pos.x][pos.y]);
            const firstSymbol = symbols[0];

            if (firstSymbol === 'scatter') return;

            let consecutiveCount = 1;
            for (let i = 1; i < symbols.length; i++) {
                if (symbols[i] === firstSymbol || this.isWildSymbol(symbols[i])) {
                    consecutiveCount++;
                } else {
                    break;
                }
            }

            if (consecutiveCount >= 3) {
                winningLines.push({
                    lineIndex: index,
                    positions: line.slice(0, consecutiveCount),
                    symbol: firstSymbol,
                    count: consecutiveCount
                });
            }
        });

        return winningLines;
    }

    calculateWinAmount(line) {
        const symbol = line.symbol;
        const count = line.count;
        const symbolDef = this.symbolDefinitions[symbol];
        return symbolDef && symbolDef.multipliers && symbolDef.multipliers[count] ? symbolDef.multipliers[count] * this.currentBet : 0;

    }
    showWinPopup(winAmount) {
        const popup = document.getElementById('winPopup');
        const multiplierElement = popup.querySelector('.win-multiplier');
        const amountElement = popup.querySelector('.win-amount');

        popup.style.display = 'block';
        multiplierElement.textContent = `${(winAmount / this.currentBet).toFixed(2)}x`;
        amountElement.textContent = winAmount.toFixed(2);

        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }

    isWildSymbol(symbol) {
        return this.symbolDefinitions[symbol]?.isWild || false;
    }
}

// Initialize slot machine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Creating slot machine');
    window.slotMachine = new SlotMachine();
});