// Simple loader implementation
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');

        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.imageCache = new Map();

        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            throw new Error('Required loading elements not found');
        }

        // Initial state
        this.gameContent.style.display = 'none';
        this.loadingScreen.style.display = 'flex';
    }

    setTotalAssets(count) {
        this.totalAssets = count;
        this.updateProgress(0);
    }

    updateProgress(progress) {
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.textContent = `${Math.round(progress)}%`;
    }

    onAssetLoaded() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);

        if (this.loadedAssets >= this.totalAssets) {
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.gameContent.style.display = 'block';
            }, 500);
        }
    }

    async loadImage(path) {
        if (this.imageCache.has(path)) {
            return this.imageCache.get(path);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(path, img);
                this.onAssetLoaded();
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
        });
    }
}

// Slot machine implementation
class SlotMachine {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            // Create loading manager first
            this.loadingManager = new LoadingManager();

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

            // Initialize reels
            this.reels = Array(5).fill().map(() => Array(3).fill('10'));

            // Define symbols to load
            const symbols = {
                '10': '/static/images/symbols/10.png',
                'J': '/static/images/symbols/J.png',
                'Q': '/static/images/symbols/Q.png',
                'K': '/static/images/symbols/K.png',
                'A': '/static/images/symbols/A.png',
                'dog1': '/static/images/symbols/dog1.png',
                'dog2': '/static/images/symbols/dog2.png',
                'dog3': '/static/images/symbols/dog3.png',
                'toy1': '/static/images/symbols/toy1.png',
                'toy2': '/static/images/symbols/toy2.png',
                'scatter': '/static/images/symbols/scatter.png',
                'wild': '/static/images/symbols/wild.png'
            };

            // Set total assets and start loading
            this.loadingManager.setTotalAssets(Object.keys(symbols).length);

            // Load all images
            for (const [symbol, path] of Object.entries(symbols)) {
                try {
                    const img = await this.loadingManager.loadImage(path);
                    this.symbolImages.set(symbol, img);
                } catch (error) {
                    this.createFallbackSymbol(symbol);
                }
            }

            // Initialize other components
            this.resizeCanvas();
            this.initializeEventListeners();
            this.draw();

        } catch (error) {
            console.error('Failed to initialize slot:', error);
        }
    }

    createFallbackSymbol(symbol) {
        const canvas = document.createElement('canvas');
        canvas.width = this.SYMBOL_SIZE;
        canvas.height = this.SYMBOL_SIZE;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, canvas.width / 2, canvas.height / 2);

        const img = new Image();
        img.src = canvas.toDataURL();
        this.symbolImages.set(symbol, img);
        this.loadingManager.onAssetLoaded();
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
                const symbols = ['10', 'J', 'Q', 'K', 'A', 'dog1', 'dog2', 'dog3', 'toy1', 'toy2'];
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
        const winningLines = this.checkWinningLines();
        let totalWin = 0;
        winningLines.forEach(line => {
            const winAmount = this.calculateWinAmount(line);
            this.showWinningLine(line.positions);
            totalWin += winAmount;
        })
        if(totalWin > 0) {
            this.showWinPopup(totalWin);
            const creditDisplay = document.getElementById('creditDisplay');
            creditDisplay.textContent = (parseFloat(creditDisplay.textContent) + totalWin).toFixed(2);

        }
    }

    async animateSpin(finalResult) {
        const steps = 30;
        const stepDelay = 50;

        for (let step = 0; step < steps; step++) {
            for (let i = 0; i < 5; i++) {
                if (step < i * 2) continue;

                if (step < steps - 1) {
                    for (let j = 0; j < 3; j++) {
                        const symbols = ['10', 'J', 'Q', 'K', 'A', 'dog1', 'dog2', 'dog3', 'toy1', 'toy2'];
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
    initPaylines() {
        this.paylines = [
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}],
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}],
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}],
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}],
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}]
        ];
    }
    showWinningLine(linePositions) {
        const container = document.getElementById('paylineContainer');
        if (!container) return;

        try {
            container.innerHTML = '';

            const startPos = linePositions[0];
            const endPos = linePositions[linePositions.length - 1];

            const cellSize = this.SYMBOL_SIZE + (this.SYMBOL_PADDING * 2);
            const startX = startPos.x * cellSize + cellSize / 2;
            const startY = startPos.y * cellSize + cellSize / 2;
            const endX = endPos.x * cellSize + cellSize / 2;
            const endY = endPos.y * cellSize + cellSize / 2;

            const line = document.createElement('div');
            line.className = 'payline';

            const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

            line.style.width = `${length}px`;
            line.style.left = `${startX}px`;
            line.style.top = `${startY}px`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.transformOrigin = 'left center';

            container.appendChild(line);

            const symbolElements = [];
            for (const pos of linePositions) {
                const x = pos.x * cellSize;
                const y = pos.y * cellSize;

                const symbolKey = this.reels[pos.x][pos.y];
                const img = this.symbolImages.get(symbolKey);

                if (img) {
                    const symbol = document.createElement('div');
                    symbol.className = 'winning-symbol';
                    symbol.style.position = 'absolute';
                    symbol.style.left = `${x + this.SYMBOL_PADDING}px`;
                    symbol.style.top = `${y + this.SYMBOL_PADDING}px`;
                    symbol.style.width = `${this.SYMBOL_SIZE}px`;
                    symbol.style.height = `${this.SYMBOL_SIZE}px`;
                    symbol.style.zIndex = '4';

                    const symbolImg = document.createElement('img');
                    symbolImg.src = img.src;
                    symbolImg.style.width = '100%';
                    symbolImg.style.height = '100%';
                    symbol.appendChild(symbolImg);

                    container.appendChild(symbol);
                    symbolElements.push(symbol);
                }
            }

            setTimeout(() => {
                line.classList.add('active');
                line.style.animation = 'paylineGlow 1.5s infinite';
                symbolElements.forEach(symbol => symbol.classList.add('active'));
            }, 50);

            container.addEventListener('click', () => {
                container.innerHTML = '';
            }, { once: true });

            setTimeout(() => {
                container.innerHTML = '';
            }, 2000);

        } catch (error) {
            console.error('Error showing winning line:', error);
            container.innerHTML = '';
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
                        console.log(`Winning line found with ${consecutiveCount} symbols(including wilds). Wild multiplier: ${wildMultiplier}`);
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
                        console.log(`Regular winning line found with ${consecutiveCount} symbols`);
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
    isWildSymbol(symbol) {
        return this.symbolDefinitions[symbol]?.isWild || false;
    }

    getWildMultiplier(symbol) {
        return this.symbolDefinitions[symbol]?.multiplier || 1;
    }
    calculateWinAmount(line) {
        const payoutTable = {
            '10': { 3: 10, 4: 20, 5: 100 },
            'J': { 3: 10, 4: 20, 5: 100 },
            'Q': { 3: 15, 4: 30, 5: 150 },
            'K': { 3: 20, 4: 40, 5: 200 },
            'A': { 3: 25, 4: 50, 5: 250 },
            'dog1': { 3: 30, 4: 60, 5: 300 },
            'dog2': { 3: 40, 4: 80, 5: 400 },
            'dog3': { 3: 50, 4: 100, 5: 500 },
            'toy1': { 3: 60, 4: 120, 5: 600 },
            'toy2': { 3: 70, 4: 140, 5: 700 }

        };
        const symbol = line.symbol;
        const count = line.count;
        const multiplier = line.multiplier;
        const baseWin = payoutTable[symbol]?.[count] || 0;
        return baseWin * this.currentBet * multiplier;

    }
    showWinPopup(winAmount) {
        const multiplier = winAmount / this.currentBet;
        const popup = document.getElementById('winPopup');
        const title = popup.querySelector('.win-title');
        const multiplierElement = popup.querySelector('.win-multiplier');
        const amountElement = popup.querySelector('.win-amount');

        if (popup.style.display === 'block') {
            return;
        }

        let finalWinClass = '';
        let finalWinText = '';
        if (multiplier >= 10000) {
            finalWinClass = 'max-win';
            finalWinText = 'MAX WIN';
        } else if (multiplier >= 500) {
            finalWinClass = 'epic-win';
            finalWinText = 'EPIC WIN';
        } else if (multiplier >= 100) {
            finalWinClass = 'mega-win';
            finalWinText = 'MEGA WIN';
        } else if (multiplier >= 20) {
            finalWinClass = 'big-win';
            finalWinText = 'BIG WIN';
        } else {
            return;
        }

        popup.className = 'win-popup big-win';
        title.textContent = 'BIG WIN';
        popup.style.display = 'block';

        let currentMultiplier = 20;
        let currentAmount = this.currentBet * 20;
        let currentClass = 'big-win';
        let currentText = 'BIG WIN';
        let animationSpeed = 1;
        let updateInterval = 200;

        let lastUpdate = performance.now();
        let animationFrame;

        const animate = (currentTime) => {
            const deltaTime = currentTime - lastUpdate;

            if (deltaTime >= updateInterval) {
                const step = Math.max(1, Math.floor((multiplier - currentMultiplier) / 50));
                currentMultiplier = Math.min(currentMultiplier + step, multiplier);
                currentAmount = this.currentBet * currentMultiplier;

                if (currentMultiplier >= 10000 && currentClass !== 'max-win') {
                    currentClass = 'max-win';
                    currentText = 'MAX WIN';
                    popup.className = `win-popup ${currentClass}`;
                    title.textContent = currentText;
                } else if (currentMultiplier >= 500 && currentClass !== 'epic-win' && currentMultiplier < 10000) {
                    currentClass = 'epic-win';
                    currentText = 'EPIC WIN';
                    popup.className = `win-popup ${currentClass}`;
                    title.textContent = currentText;
                } else if (currentMultiplier >= 100 && currentClass !== 'mega-win' && currentMultiplier < 500) {
                    currentClass = 'mega-win';
                    currentText = 'MEGA WIN';
                    popup.className = `win-popup ${currentClass}`;
                    title.textContent = currentText;
                }

                multiplierElement.textContent = `${currentMultiplier.toFixed(2)}x`;
                amountElement.textContent = currentAmount.toFixed(2);

                lastUpdate = currentTime;

                animationSpeed *= 1.01;
                updateInterval = Math.max(50, Math.floor(200 / animationSpeed));
            }

            if (currentMultiplier < multiplier) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    popup.style.display = 'none';
                }, 15000);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        const closeButton = popup.querySelector('.close-button');
        const closePopup = () => {
            cancelAnimationFrame(animationFrame);
            popup.style.display = 'none';
            closeButton.removeEventListener('click', closePopup);
        };
        closeButton.addEventListener('click', closePopup);

        popup.addEventListener('click', (e) => {
            if (e.target !== closeButton) {
                cancelAnimationFrame(animationFrame);
                popup.className = `win-popup ${finalWinClass}`;
                title.textContent = finalWinText;
                multiplierElement.textContent = `${multiplier.toFixed(2)}x`;
                amountElement.textContent = winAmount.toFixed(2);
            }
        });
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
    async init() {
        try {
            console.log('Starting slot machine initialization');

            this.wildReels = [1, 2, 3];
            console.log('Slot machine initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
}

// Initialize the slot machine
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.slotMachine = new SlotMachine();
    } catch (error) {
        console.error('Failed to create slot machine:', error);
    }
});