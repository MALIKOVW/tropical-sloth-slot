class LoadingManager {
    constructor() {
        console.log('LoadingManager: Starting initialization');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');

        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('LoadingManager: Required elements not found');
            return;
        }

        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.imageCache = new Map();

        // Initial state
        this.gameContent.style.opacity = '0';
        this.gameContent.style.display = 'none';
        this.loadingScreen.style.display = 'flex';

        // Add transitions
        this.loadingScreen.style.transition = 'opacity 0.5s ease-out';
        this.gameContent.style.transition = 'opacity 0.5s ease-in';

        console.log('LoadingManager: Initialized successfully');
    }

    updateProgress(progress) {
        progress = Math.min(100, Math.max(0, progress));
        console.log(`LoadingManager: Progress ${progress}%`);
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.textContent = `${Math.round(progress)}%`;
    }

    onAssetLoaded() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        console.log(`LoadingManager: Asset loaded ${this.loadedAssets}/${this.totalAssets}`);
        this.updateProgress(progress);

        if (this.loadedAssets >= this.totalAssets) {
            console.log('LoadingManager: All assets loaded, showing game content');
            this.showGame();
        }
    }

    showGame() {
        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
            requestAnimationFrame(() => {
                this.gameContent.style.opacity = '1';
            });
        }, 500);
    }

    loadImage(path) {
        return new Promise((resolve, reject) => {
            console.log(`LoadingManager: Loading image ${path}`);
            const img = new Image();
            img.onload = () => {
                console.log(`LoadingManager: Successfully loaded ${path}`);
                this.imageCache.set(path, img);
                this.onAssetLoaded();
                resolve(img);
            };
            img.onerror = () => {
                console.error(`LoadingManager: Failed to load ${path}`);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
        });
    }
}

class SlotMachine {
    constructor() {
        this.init();
    }

    async init() {
        try {
            console.log('SlotMachine: Starting initialization');
            this.loadingManager = new LoadingManager();

            // Basic setup
            this.SYMBOL_SIZE = 60;
            this.SYMBOL_PADDING = 3;
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 10;

            // Initialize canvas
            this.canvas = document.getElementById('slotCanvas');
            if (!this.canvas) {
                throw new Error('SlotMachine: Canvas not found');
            }

            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            // Initialize reels
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));

            // Define symbols with correct paths
            const symbols = [
                { symbol: 'wooden_a', path: '/static/images/symbols/wooden_a.png' },
                { symbol: 'wooden_k', path: '/static/images/symbols/wooden_k.png' },
                { symbol: 'wooden_arch', path: '/static/images/symbols/wooden_arch.png' },
                { symbol: 'snake', path: '/static/images/symbols/snake.png' },
                { symbol: 'gorilla', path: '/static/images/symbols/gorilla.png' },
                { symbol: 'jaguar', path: '/static/images/symbols/jaguar.png' },
                { symbol: 'crocodile', path: '/static/images/symbols/crocodile.png' },
                { symbol: 'gator', path: '/static/images/symbols/gator.png' },
                { symbol: 'leopard', path: '/static/images/symbols/leopard.png' },
                { symbol: 'dragon', path: '/static/images/symbols/dragon.png' },
                { symbol: 'sloth', path: '/static/images/symbols/sloth.png' },
                { symbol: 'wild', path: '/static/images/symbols/wild_2x.png' }
            ];

            // Set total assets to load
            this.loadingManager.totalAssets = symbols.length;
            console.log(`SlotMachine: Loading ${symbols.length} symbols`);

            // Load all symbols
            for (const { symbol, path } of symbols) {
                try {
                    const img = await this.loadingManager.loadImage(path);
                    this.symbolImages.set(symbol, img);
                    console.log(`SlotMachine: Loaded symbol ${symbol}`);
                } catch (error) {
                    console.error(`SlotMachine: Failed to load symbol ${symbol}:`, error);
                    this.createFallbackSymbol(symbol);
                }
            }

            // Initialize game components
            this.initPaylines();
            this.initializeEventListeners();
            this.resizeCanvas();
            this.draw();

        } catch (error) {
            console.error('SlotMachine: Failed to initialize:', error);
        }
    }

    createFallbackSymbol(symbol) {
        console.log(`SlotMachine: Creating fallback for ${symbol}`);
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
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}]
        ];
    }

    resizeCanvas() {
        this.canvas.width = (this.SYMBOL_SIZE * 5) + (this.SYMBOL_PADDING * 6);
        this.canvas.height = (this.SYMBOL_SIZE * 3) + (this.SYMBOL_PADDING * 4);
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const symbol = this.reels[i][j];
                const x = this.SYMBOL_PADDING + i * (this.SYMBOL_SIZE + this.SYMBOL_PADDING);
                const y = this.SYMBOL_PADDING + j * (this.SYMBOL_SIZE + this.SYMBOL_PADDING);

                const img = this.symbolImages.get(symbol);
                if (img) {
                    this.ctx.drawImage(img, x, y, this.SYMBOL_SIZE, this.SYMBOL_SIZE);
                }
            }
        }
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }
    }

    async spin() {
        if (this.spinning) return;
        this.spinning = true;

        const spinButton = document.getElementById('spinButton');
        if (spinButton) spinButton.disabled = true;

        const result = Array(5).fill().map(() =>
            Array(3).fill().map(() => {
                const symbols = ['wooden_a', 'wooden_k', 'wooden_arch', 'snake', 'gorilla', 'jaguar',
                               'crocodile', 'gator', 'leopard', 'dragon', 'sloth', 'wild'];
                return symbols[Math.floor(Math.random() * symbols.length)];
            })
        );

        await this.animateSpin(result);

        this.reels = result;
        this.draw();

        if (spinButton) spinButton.disabled = false;
        this.spinning = false;
    }

    async animateSpin(finalResult) {
        const steps = 20;
        const stepDelay = 50;

        for (let step = 0; step < steps; step++) {
            for (let i = 0; i < 5; i++) {
                if (step < i * 2) continue;

                if (step < steps - 1) {
                    for (let j = 0; j < 3; j++) {
                        const symbols = ['wooden_a', 'wooden_k', 'wooden_arch', 'snake', 'gorilla'];
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

    isWildSymbol(symbol) {
        return symbol === 'wild';
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
}

// Initialize slot machine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, creating slot machine');
    window.slotMachine = new SlotMachine();
});