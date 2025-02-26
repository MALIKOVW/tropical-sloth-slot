class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');

        console.log('LoadingManager: Initializing with DOM elements', {
            loadingScreen: !!this.loadingScreen,
            loadingBar: !!this.loadingBar,
            loadingText: !!this.loadingText,
            gameContent: !!this.gameContent
        });

        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('Required loading elements not found');
            return;
        }

        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.imageCache = new Map();

        // Initial state
        this.gameContent.style.display = 'none';
        this.loadingScreen.style.display = 'flex';
        this.updateProgress(0);
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) return;
        progress = Math.min(100, Math.max(0, progress));
        console.log(`LoadingManager: Updating progress to ${progress}%`);
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
        this.loadingScreen.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
        }, 500);
    }

    async loadImage(path) {
        try {
            if (this.imageCache.has(path)) {
                return this.imageCache.get(path);
            }

            console.log(`LoadingManager: Loading image ${path}`);
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`LoadingManager: Successfully loaded ${path}`);
                    this.imageCache.set(path, img);
                    this.onAssetLoaded();
                    resolve(img);
                };
                img.onerror = (error) => {
                    console.error(`LoadingManager: Failed to load ${path}`, error);
                    reject(new Error(`Failed to load image: ${path}`));
                };
                img.src = path;
            });
        } catch (error) {
            console.error(`LoadingManager: Error in loadImage: ${path}`, error);
            throw error;
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('SlotMachine: Constructor called');
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
                throw new Error('Canvas element not found');
            }

            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            // Initialize reels
            this.reels = Array(5).fill().map(() => Array(3).fill('10'));

            // Define symbols and their properties
            this.symbolDefinitions = {
                '10': { value: 5, path: '/static/images/symbols/pic1.png', multipliers: {3: 5, 4: 10, 5: 20} },
                'J': { value: 5, path: '/static/images/symbols/pic2.png', multipliers: {3: 5, 4: 10, 5: 20} },
                'Q': { value: 10, path: '/static/images/symbols/pic3.png', multipliers: {3: 10, 4: 20, 5: 50} },
                'K': { value: 15, path: '/static/images/symbols/pic4.png', multipliers: {3: 15, 4: 30, 5: 75} },
                'A': { value: 20, path: '/static/images/symbols/pic5.png', multipliers: {3: 20, 4: 40, 5: 100} },
                'dog1': { value: 25, path: '/static/images/symbols/pic6.png', multipliers: {3: 25, 4: 50, 5: 125} },
                'dog2': { value: 30, path: '/static/images/symbols/pic7.png', multipliers: {3: 30, 4: 60, 5: 150} },
                'dog3': { value: 40, path: '/static/images/symbols/pic8.png', multipliers: {3: 40, 4: 80, 5: 200} },
                'toy1': { value: 50, path: '/static/images/symbols/pic9.png', multipliers: {3: 50, 4: 100, 5: 250} },
                'toy2': { value: 100, path: '/static/images/symbols/pic10.png', multipliers: {3: 100, 4: 200, 5: 500} },
                'scatter': { value: 0, path: '/static/images/symbols/pic11.png', isScatter: true },
                'wild': { value: 0, path: '/static/images/symbols/wild_2x.png', multiplier: 2, isWild: true }
            };

            // Load images
            await this.loadSymbols();

            // Initialize game components
            this.initPaylines();
            this.initializeEventListeners();
            this.resizeCanvas();
            this.draw();

            // Show game content
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('gameContent').style.display = 'block';

            console.log('SlotMachine: Initialization complete');
        } catch (error) {
            console.error('SlotMachine: Initialization failed:', error);
        }
    }

    async loadSymbols() {
        console.log('SlotMachine: Loading symbols...');
        for (const [symbol, def] of Object.entries(this.symbolDefinitions)) {
            try {
                const img = await this.loadImage(def.path);
                this.symbolImages.set(symbol, img);
                console.log(`SlotMachine: Loaded symbol ${symbol}`);
            } catch (error) {
                console.error(`SlotMachine: Failed to load symbol ${symbol}:`, error);
                this.createFallbackSymbol(symbol);
            }
        }
    }

    loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.error(`Failed to load image: ${path}`);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
        });
    }

    createFallbackSymbol(symbol) {
        const canvas = document.createElement('canvas');
        canvas.width = this.SYMBOL_SIZE;
        canvas.height = this.SYMBOL_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, this.SYMBOL_SIZE, this.SYMBOL_SIZE);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.SYMBOL_SIZE * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, this.SYMBOL_SIZE / 2, this.SYMBOL_SIZE / 2);
        this.symbolImages.set(symbol, canvas);
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
        if (!this.ctx || !this.canvas) return;

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
                } else {
                    this.drawFallbackSymbol(symbol, x, y);
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
        let newIndex = amount > 0
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

        // Generate result
        const result = Array(5).fill().map(() =>
            Array(3).fill().map(() => {
                const symbols = Object.keys(this.symbolDefinitions);
                return symbols[Math.floor(Math.random() * symbols.length)];
            })
        );

        // Animation
        await this.animateSpin(result);

        // Update state and draw
        this.reels = result;
        this.draw();

        // Check win
        const winningLines = this.checkWinningLines();
        let totalWin = 0;

        winningLines.forEach(line => {
            const winAmount = this.calculateWinAmount(line);
            this.showWinningLine(line.positions);
            totalWin += winAmount;
        });

        if (totalWin > 0) {
            this.showWinPopup(totalWin);
            if (creditDisplay) {
                creditDisplay.textContent = (parseFloat(creditDisplay.textContent) + totalWin).toFixed(2);
            }
        }

        // Unblock button
        if (spinButton) spinButton.disabled = false;
        this.spinning = false;
    }

    async animateSpin(finalResult) {
        const totalSteps = 30;
        const stepDelay = 50;
        const symbolPool = Object.keys(this.symbolDefinitions);

        let lastFrameTime = performance.now();
        const targetFrameTime = 1000 / 60; // 60 FPS

        for (let step = 0; step < totalSteps; step++) {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastFrameTime;

            if (deltaTime >= targetFrameTime) {
                for (let i = 0; i < 5; i++) {
                    if (step < i * 2) continue;

                    if (step < totalSteps - 1) {
                        for (let j = 0; j < 3; j++) {
                            this.reels[i][j] = symbolPool[Math.floor(Math.random() * symbolPool.length)];
                        }
                    } else {
                        this.reels[i] = finalResult[i];
                    }
                }

                this.draw();
                lastFrameTime = currentTime;
            }

            await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
    }

    checkWinningLines() {
        const winningLines = [];

        this.paylines.forEach((line, index) => {
            const symbols = line.map(pos => this.reels[pos.x][pos.y]);

            const wilds = symbols.filter(symbol => this.isWildSymbol(symbol));
            const wildMultiplier = wilds.reduce((total, wild) => total * this.getWildMultiplier(wild), 1);

            if (wilds.length > 0) {
                const nonWildSymbols = symbols.filter(symbol =>
                    !this.isWildSymbol(symbol) && symbol !== 'scatter'
                );

                if (nonWildSymbols.length > 0) {
                    const mainSymbol = nonWildSymbols[0];
                    let consecutiveCount = 0;

                    for (let i = 0; i < symbols.length; i++) {
                        if (symbols[i] === mainSymbol || this.isWildSymbol(symbols[i])) {
                            consecutiveCount++;
                        } else {
                            break;
                        }
                    }

                    if (consecutiveCount >= 3) {
                        winningLines.push({
                            lineIndex: index,
                            positions: line.slice(0, consecutiveCount),
                            symbol: mainSymbol,
                            count: consecutiveCount,
                            multiplier: wildMultiplier
                        });
                    }
                }
            } else {
                const firstSymbol = symbols[0];
                if (firstSymbol !== 'scatter') {
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
                            count: consecutiveCount,
                            multiplier: 1
                        });
                    }
                }
            }
        });

        return winningLines;
    }

    calculateWinAmount(line) {
        const symbol = line.symbol;
        const count = line.count;
        const multiplier = line.multiplier;
        const baseWin = this.symbolDefinitions[symbol].multipliers[count] || 0;
        return baseWin * this.currentBet * multiplier;
    }

    showWinPopup(winAmount) {
        const popup = document.getElementById('winPopup');
        const title = popup.querySelector('.win-title');
        const multiplierElement = popup.querySelector('.win-multiplier');
        const amountElement = popup.querySelector('.win-amount');
        const multiplier = winAmount / this.currentBet;

        popup.style.display = 'block';
        title.textContent = 'BIG WIN';
        multiplierElement.textContent = `${multiplier.toFixed(2)}x`;
        amountElement.textContent = winAmount.toFixed(2);

        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
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

    isWildSymbol(symbol) {
        return this.symbolDefinitions[symbol]?.isWild || false;
    }

    getWildMultiplier(symbol) {
        return this.symbolDefinitions[symbol]?.multiplier || 1;
    }
    drawFallbackSymbol(symbol, x, y) {
        if (!this.ctx) return;

        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, this.SYMBOL_SIZE, this.SYMBOL_SIZE);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${this.SYMBOL_SIZE * 0.3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.getSymbolDisplay(symbol), x + this.SYMBOL_SIZE / 2, y + this.SYMBOL_SIZE / 2);
    }

    getSymbolDisplay(symbol) {
        const symbolMap = {
            '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
            'dog1': '🐶', 'dog2': '🐕', 'dog3': '🐩',
            'toy1': '🧸', 'toy2': '🎁',
            'scatter': 'Scatter',
            'wild': 'Wild'
        };
        return symbolMap[symbol] || symbol;
    }
}

// Initialize slot machine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating slot machine');
    window.slotMachine = new SlotMachine();
});