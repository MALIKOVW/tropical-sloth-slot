class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 14;
        this.loadedAssets = 0;
        this.lastProgress = 0;
        this.imageCache = new Map();
    }

    async init() {
        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('Loading screen elements not found');
            return false;
        }

        this.loadingScreen.style.display = 'flex';
        this.gameContent.style.display = 'none';
        return true;
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) return;

        progress = Math.min(100, Math.max(0, progress));
        if (Math.abs(progress - this.lastProgress) >= 1) {
            this.lastProgress = progress;
            requestAnimationFrame(() => {
                this.loadingBar.style.width = `${progress}%`;
                this.loadingText.textContent = `${Math.round(progress)}%`;
            });
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
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);

        if (this.loadedAssets >= this.totalAssets) {
            this.hideLoadingScreen();
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
            img.onerror = (error) => {
                console.error(`Failed to load image: ${path}`, error);
                reject(error);
            };
            img.src = path;
        });
    }
}

class SlotMachine {
    constructor() {
        this.loadingManager = new LoadingManager();
        this.SYMBOL_SIZE = 60;
        this.SYMBOL_PADDING = 3;
        this.symbolImages = new Map();
        this.spinning = false;
        this.currentBet = 10;
        this.initializeCanvas();
        this.initPaylines();
    }

    initPaylines() {
        this.paylines = [
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}], // 1
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}], // 2
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}], // 3
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}], // 4
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}]  // 5
        ];
    }

    async initializeCanvas() {
        try {
            await this.loadingManager.init();

            this.canvas = document.getElementById('slotCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            // Initialize game state
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));

            // Define symbols and their properties
            this.symbolDefinitions = {
                'wooden_a': {
                    value: 5,
                    path: '/static/images/symbols/wooden_a.png',
                    multipliers: {3: 5, 4: 10, 5: 20}
                },
                'wooden_k': {
                    value: 5,
                    path: '/static/images/symbols/wooden_k.png',
                    multipliers: {3: 5, 4: 10, 5: 20}
                },
                'wooden_arch': {
                    value: 10,
                    path: '/static/images/symbols/wooden_arch.png',
                    multipliers: {3: 10, 4: 20, 5: 50}
                },
                'snake': {
                    value: 15,
                    path: '/static/images/symbols/snake.png',
                    multipliers: {3: 15, 4: 30, 5: 75}
                },
                'gorilla': {
                    value: 20,
                    path: '/static/images/symbols/gorilla.png',
                    multipliers: {3: 20, 4: 40, 5: 100}
                },
                'jaguar': {
                    value: 25,
                    path: '/static/images/symbols/jaguar.png',
                    multipliers: {3: 25, 4: 50, 5: 125}
                },
                'crocodile': {
                    value: 30,
                    path: '/static/images/symbols/crocodile.png',
                    multipliers: {3: 30, 4: 60, 5: 150}
                },
                'gator': {
                    value: 40,
                    path: '/static/images/symbols/gator.png',
                    multipliers: {3: 40, 4: 80, 5: 200}
                },
                'leopard': {
                    value: 50,
                    path: '/static/images/symbols/leopard.png',
                    multipliers: {3: 50, 4: 100, 5: 250}
                },
                'dragon': {
                    value: 100,
                    path: '/static/images/symbols/dragon.png',
                    multipliers: {3: 100, 4: 200, 5: 500}
                },
                'sloth': {
                    value: 0,
                    path: '/static/images/symbols/sloth.png',
                    isScatter: true,
                    multipliers: {3: 2, 4: 10, 5: 50}
                },
                'wild_2x': {
                    value: 0,
                    path: '/static/images/symbols/wild_2x.png',
                    multiplier: 2,
                    isWild: true
                },
                'wild_3x': {
                    value: 0,
                    path: '/static/images/symbols/wild_3x.png',
                    multiplier: 3,
                    isWild: true
                },
                'wild_5x': {
                    value: 0,
                    path: '/static/images/symbols/wild_5x.png',
                    multiplier: 5,
                    isWild: true
                }
            };

            await this.loadSymbolImages();
            this.initializeEventListeners();
            this.resizeCanvas();
            this.draw();

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    async loadSymbolImages() {
        try {
            const loadPromises = Object.entries(this.symbolDefinitions).map(async ([symbol, def]) => {
                try {
                    const img = await this.loadingManager.loadImage(def.path);
                    this.symbolImages.set(symbol, img);
                } catch (error) {
                    console.error(`Failed to load image for symbol: ${symbol}`, error);
                    this.createFallbackImage(symbol);
                }
            });

            await Promise.all(loadPromises);
            console.log('All symbol images loaded');
        } catch (error) {
            console.error('Error loading symbol images:', error);
        }
    }

    createFallbackImage(symbol) {
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
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        const increaseBetButton = document.getElementById('increaseBet');
        const decreaseBetButton = document.getElementById('decreaseBet');

        if (increaseBetButton) {
            increaseBetButton.addEventListener('click', () => this.adjustBet(1));
        }
        if (decreaseBetButton) {
            decreaseBetButton.addEventListener('click', () => this.adjustBet(-1));
        }
    }

    adjustBet(amount) {
        const betValues = [10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000];
        const currentIndex = betValues.indexOf(this.currentBet);
        let newIndex;

        if (amount > 0) {
            newIndex = Math.min(currentIndex + 1, betValues.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }

        this.currentBet = betValues[newIndex];
        const currentBetElement = document.getElementById('currentBet');
        if (currentBetElement) {
            currentBetElement.textContent = this.currentBet.toFixed(2);
        }
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

    resizeCanvas() {
        if (!this.ctx || !this.canvas) return;

        const numReels = 5;
        const numRows = 3;
        const horizontalPadding = this.SYMBOL_PADDING * 6;
        const verticalPadding = this.SYMBOL_PADDING * 4;

        this.canvas.width = (this.SYMBOL_SIZE * numReels) + horizontalPadding;
        this.canvas.height = (this.SYMBOL_SIZE * numRows) + verticalPadding;

        this.draw();
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

    async spin() {
        if (this.spinning) return;

        const credits = parseFloat(document.getElementById('creditDisplay').textContent);
        if (credits < this.currentBet) {
            alert('Недостаточно кредитов!');
            return;
        }

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
                await audio.init();
            }

            this.spinning = true;
            document.getElementById('spinButton').disabled = true;

            const newCredits = credits - this.currentBet;
            document.getElementById('creditDisplay').textContent = newCredits.toFixed(2);


            audio.playClickSound();

            const regularSymbols = ['wooden_a', 'wooden_k', 'wooden_arch', 'snake', 'gorilla', 'jaguar', 'crocodile', 'gator', 'leopard', 'dragon'];
            const wildSymbols = ['wild_2x', 'wild_3x', 'wild_5x'];
            const scatterSymbol = 'sloth';

            const testResult = {
                result: Array(5).fill().map((_, reelIndex) => {
                    return Array(3).fill().map(() => {
                        if (reelIndex >= 1 && reelIndex <= 3 && Math.random() < 0.2) {
                            return wildSymbols[Math.floor(Math.random() * wildSymbols.length)];
                        }
                        if (Math.random() < 0.1) {
                            return scatterSymbol;
                        }
                        return regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
                    });
                }),
                win: 0
            };

            audio.playSpinSound();

            const container = document.getElementById('paylineContainer');
            if (container) {
                container.innerHTML = '';
            }

            await this.animateSpin(testResult.result);

            audio.stopSpinSound();

            this.reels = testResult.result;

            const winningLines = this.checkWinningLines();
            let totalWin = 0;

            winningLines.forEach(line => {
                const symbol = this.symbolDefinitions[line.symbol];
                if (symbol && symbol.multipliers[line.count]) {
                    totalWin += symbol.multipliers[line.count] * this.currentBet * line.multiplier;
                }
            });

            const maxWin = this.currentBet * 10000;
            if (totalWin > maxWin) {
                totalWin = maxWin;
            }

            testResult.win = totalWin;

            if (testResult.win > 0) {
                const currentCredits = parseFloat(document.getElementById('creditDisplay').textContent);
                const newCredits = currentCredits + testResult.win;
                document.getElementById('creditDisplay').textContent = newCredits.toFixed(2);

                this.showWinPopup(testResult.win);
            }

            setTimeout(() => {
                document.getElementById('spinButton').disabled = false;
                this.spinning = false;
            }, 1000);

            if (winningLines.length > 0) {
                audio.playWinSound();

                for (const line of winningLines) {
                    if (!this.spinning) {
                        this.showWinningLine(line.positions);
                    } else {
                        break;
                    }
                }
            }

            this.draw();

        } catch (error) {
            console.error('Error during spin:', error);
            alert('Произошла ошибка во время вращения. Пожалуйста, попробуйте снова.');
            this.spinning = false;
            document.getElementById('spinButton').disabled = false;
        }
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

    async animateSpin(finalResult) {
        const totalSteps = 30;
        const stepDelay = 50;
        const symbols = Object.keys(this.symbolDefinitions).filter(symbol =>
            !this.symbolDefinitions[symbol].isWild && !this.symbolDefinitions[symbol].isScatter
        );
        const wildSymbols = Object.keys(this.symbolDefinitions).filter(symbol =>
            this.symbolDefinitions[symbol].isWild
        );

        const bounceAmplitude = 20;
        const bounceDuration = 300;

        for (let step = 0; step < totalSteps; step++) {
            const startTime = performance.now();

            for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
                if (step < reelIndex * 2) continue;

                const progress = step / totalSteps;
                const speedFactor = Math.pow(1 - progress, 2);

                if (step < totalSteps - 1) {
                    for (let j = 0; j < 3; j++) {
                        let randomSymbol;
                        if (reelIndex >= 1 && reelIndex <= 3 && Math.random() < 0.2) {
                            const randomWildIndex = Math.floor(Math.random() * wildSymbols.length);
                            randomSymbol = wildSymbols[randomWildIndex];
                        } else {
                            const randomIndex = Math.floor(Math.random() * symbols.length);
                            randomSymbol = symbols[randomIndex];
                        }
                        this.reels[reelIndex][j] = randomSymbol;
                    }
                } else {
                    for (let j = 0; j < 3; j++) {
                        this.reels[reelIndex][j] = finalResult[reelIndex][j];
                    }
                    audio.playReelStopSound();
                }
            }

            this.draw();

            const elapsedTime = performance.now() - startTime;
            const remainingDelay = Math.max(0, stepDelay - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }

        const bounceStart = performance.now();
        while (performance.now() - bounceStart < bounceDuration) {
            const bounceProgress = (performance.now() - bounceStart) / bounceDuration;
            const offset = Math.sin(bounceProgress * Math.PI) * bounceAmplitude * (1 - bounceProgress);

            this.ctx.save();
            this.ctx.translate(0, offset);
            this.draw();
            this.ctx.restore();

            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        this.draw();
    }

    isWildSymbol(symbol) {
        return this.symbolDefinitions[symbol]?.isWild || false;
    }

    getWildMultiplier(symbol) {
        return this.symbolDefinitions[symbol]?.multiplier || 1;
    }

    checkWinningLines() {
        const winningLines = [];

        this.paylines.forEach((line, index) => {
            const symbols = line.map(pos => this.reels[pos.x][pos.y]);

            const wilds = symbols.filter(symbol => this.isWildSymbol(symbol));
            const wildMultiplier = wilds.reduce((total, wild) => total * this.getWildMultiplier(wild), 1);

            if (wilds.length > 0) {
                const nonWildSymbols = symbols.filter(symbol =>
                    !this.isWildSymbol(symbol) && symbol !== 'sloth'
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
                if (firstSymbol !== 'sloth') {
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
            'wooden_a': 'A', 'wooden_k': 'K', 'wooden_arch': 'Arch',
            'snake': '🐍', 'gorilla': '🦍', 'jaguar': '🐆',
            'crocodile': '🐊', 'gator': '🐊', 'leopard': '🐆',
            'dragon': '🐲', 'sloth': '🦥',
            'wild_2x': 'Wild 2x', 'wild_3x': 'Wild 3x', 'wild_5x': 'Wild 5x'
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

// Initialize the slot machine when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing slot machine');
    window.slotMachine = new SlotMachine();
});