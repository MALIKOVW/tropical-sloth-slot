class LoadingManager {
    constructor() {
        console.log('LoadingManager: Constructor called');
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

        this.gameContent.style.display = 'none';
        this.loadingScreen.style.display = 'flex';
        this.updateProgress(0);
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
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
        }
    }

    loadImage(path) {
        return new Promise((resolve, reject) => {
            console.log(`LoadingManager: Starting to load ${path}`);
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
    }
}

class SlotMachine {
    constructor() {
        console.log('SlotMachine: Starting initialization');
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

            // Initialize LoadingManager
            this.loadingManager = new LoadingManager();

            // Define available symbols with actual paths
            const symbols = [
                // Basic symbols
                { name: 'wooden_a', path: '/static/images/symbols/wooden_a.png' },
                { name: 'wooden_k', path: '/static/images/symbols/wooden_k.png' },
                { name: 'wooden_arch', path: '/static/images/symbols/wooden_arch.png' },

                // Animal symbols
                { name: 'snake', path: '/static/images/symbols/snake.png' },
                { name: 'gorilla', path: '/static/images/symbols/gorilla.png' },
                { name: 'jaguar', path: '/static/images/symbols/jaguar.png' },
                { name: 'crocodile', path: '/static/images/symbols/crocodile.png' },
                { name: 'gator', path: '/static/images/symbols/gator.png' },
                { name: 'leopard', path: '/static/images/symbols/leopard.png' },
                { name: 'dragon', path: '/static/images/symbols/dragon.png' },

                // Special symbols
                { name: 'sloth', path: '/static/images/symbols/Picsart_25-02-25_16-45-12-270.png' },
                { name: 'wild_2x', path: '/static/images/symbols/Picsart_25-02-25_16-49-31-091.png' },
                { name: 'wild_3x', path: '/static/images/symbols/Picsart_25-02-25_18-10-53-970.png' },
                { name: 'wild_5x', path: '/static/images/symbols/Picsart_25-02-25_18-12-23-513.png' }
            ];

            // Set total assets
            this.loadingManager.totalAssets = symbols.length;
            console.log(`SlotMachine: Will load ${symbols.length} symbols`);

            // Load all symbols
            for (const symbol of symbols) {
                try {
                    console.log(`SlotMachine: Loading symbol ${symbol.name} from ${symbol.path}`);
                    const img = await this.loadingManager.loadImage(symbol.path);
                    this.symbolImages.set(symbol.name, img);
                    console.log(`SlotMachine: Successfully loaded ${symbol.name}`);
                } catch (error) {
                    console.error(`SlotMachine: Failed to load ${symbol.name}:`, error);
                    this.createFallbackSymbol(symbol.name);
                }
            }

            // Initialize reels with default symbol
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));

            // Initialize game components
            this.initPaylines();
            this.initializeEventListeners();
            this.resizeCanvas();
            this.draw();

            console.log('SlotMachine: Initialization complete');
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
        ctx.font = '12px Arial';
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
            // Горизонтальные линии (1-3)
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}], // Линия 1 - центр
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}], // Линия 2 - верх
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}], // Линия 3 - низ

            // V-образные линии (4-8)
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}], // Линия 4
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}], // Линия 5
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 4, y: 0}], // Линия 6
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 3, y: 2}, {x: 4, y: 2}], // Линия 7
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 1}], // Линия 8

            // Зигзагообразные линии (9-13)
            [{x: 0, y: 1}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 1}], // Линия 9
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 4, y: 1}], // Линия 10
            [{x: 0, y: 1}, {x: 1, y: 0}, {x: 2, y: 1}, {x: 3, y: 2}, {x: 4, y: 1}], // Линия 11
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 0}], // Линия 12
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 2}], // Линия 13

            // Сложные паттерны (14-20)
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 0}], // Линия 14
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 2}], // Линия 15
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 1}], // Линия 16
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 1}], // Линия 17
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 2}, {x: 3, y: 0}, {x: 4, y: 0}], // Линия 18
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 0}, {x: 3, y: 2}, {x: 4, y: 2}], // Линия 19
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 4, y: 1}]  // Линия 20
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
                } else {
                    console.error(`Missing image for symbol: ${symbol}`);
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

        // Get available symbols
        const regularSymbols = ['wooden_a', 'wooden_k', 'wooden_arch', 'snake', 'gorilla', 'jaguar',
                               'crocodile', 'gator', 'leopard', 'dragon', 'sloth'];
        const wildSymbols = ['wild_2x', 'wild_3x', 'wild_5x'];

        // Generate result for each reel
        const result = Array(5).fill().map((_, reelIndex) => {
            return Array(3).fill().map(() => {
                // Only add wild symbols to reels 2, 3, and 4 (index 1, 2, 3)
                if (reelIndex >= 1 && reelIndex <= 3) {
                    // 20% chance for wild symbol
                    if (Math.random() < 0.20) {
                        return wildSymbols[Math.floor(Math.random() * wildSymbols.length)];
                    }
                }
                // Regular symbols for all reels
                return regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
            });
        });

        await this.animateSpin(result);
        this.reels = result;
        this.draw();

        // Check for wins
        const winningLines = this.checkWinningLines();
        if (winningLines.length > 0) {
            let totalWinAmount = 0;
            for (const line of winningLines) {
                const winAmount = this.calculateWinAmount(line);
                totalWinAmount += winAmount;
                this.showWinningLine(line.positions);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            this.showWinPopup(totalWinAmount);
        }

        if (spinButton) spinButton.disabled = false;
        this.spinning = false;
    }

    async animateSpin(finalResult) {
        const steps = 30; // Увеличиваем количество шагов для более плавной анимации
        const baseStepDelay = 50;
        const bounceSteps = 3;

        // Определяем массивы символов
        const regularSymbols = ['wooden_a', 'wooden_k', 'wooden_arch', 'snake',
                              'gorilla', 'jaguar', 'crocodile', 'gator',
                              'leopard', 'dragon', 'sloth'];
        const wildSymbols = ['wild_2x', 'wild_3x', 'wild_5x'];

        // Массив для хранения позиций каждого барабана
        const reelPositions = Array(5).fill(0);
        const reelSpeeds = Array(5).fill(1);
        const stopOrder = [4, 3, 2, 1, 0]; // Изменен порядок остановки барабанов (справа налево)

        for (let step = 0; step < steps + stopOrder.length * bounceSteps; step++) {
            for (let i = 0; i < 5; i++) {
                // Определяем, должен ли барабан все еще вращаться
                const shouldSpin = step < steps - stopOrder.indexOf(i) * bounceSteps;

                if (shouldSpin) {
                    // Обновляем позицию барабана
                    reelPositions[i] += reelSpeeds[i];

                    // Генерируем символы для вращения
                    for (let j = 0; j < 3; j++) {
                        if (i >= 1 && i <= 3 && Math.random() < 0.20) {
                            // Wild символы только для барабанов 2,3,4
                            this.reels[i][j] = wildSymbols[Math.floor(Math.random() * wildSymbols.length)];
                        } else {
                            this.reels[i][j] = regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
                        }
                    }
                } else if (step >= steps - stopOrder.indexOf(i) * bounceSteps && 
                          step < steps - stopOrder.indexOf(i) * bounceSteps + bounceSteps) {
                    // Эффект bounce при остановке
                    let bounceIndex = step - (steps - stopOrder.indexOf(i) * bounceSteps);
                    if (bounceIndex % 2 === 0) {
                        this.reels[i] = finalResult[i];
                    } else {
                        let tempReel = [...finalResult[i]];
                        if (tempReel.length > 0) {
                            let randomIndex = Math.floor(Math.random() * tempReel.length);
                            let randomSymbol = regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
                            tempReel[randomIndex] = randomSymbol;
                            this.reels[i] = tempReel;
                        }
                    }
                    this.draw();
                    await new Promise(resolve => setTimeout(resolve, baseStepDelay / 2));
                }
            }

            // Отрисовываем текущее состояние
            this.draw();

            // Динамическая задержка - быстрее в начале, медленнее к концу
            const currentDelay = baseStepDelay + (step / (steps + stopOrder.length * bounceSteps)) * baseStepDelay;
            await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
        this.reels = finalResult;
    }

    isWildSymbol(symbol) {
        return symbol.startsWith('wild_');
    }

    getWildMultiplier(symbol) {
        if (symbol === 'wild_2x') return 2;
        if (symbol === 'wild_3x') return 3;
        if (symbol === 'wild_5x') return 5;
        return 1;
    }

    isSlothSymbol(symbol) {
        return symbol === 'sloth';
    }

    showWinningLine(positions) {
        if (!positions || !positions.length) return;

        const container = document.getElementById('paylineContainer');
        if (!container) return;

        container.innerHTML = '';

        try {
            const cellSize = this.SYMBOL_SIZE + this.SYMBOL_PADDING * 2;

            // Анимация символов
            positions.forEach(pos => {
                if (!this.reels[pos.x] || !this.reels[pos.x][pos.y]) return;

                const x = pos.x * cellSize;
                const y = pos.y * cellSize;
                const symbolKey = this.reels[pos.x][pos.y];
                const img = this.symbolImages.get(symbolKey);

                if (img) {
                    const symbol = document.createElement('div');
                    symbol.className = 'winning-symbol';
                    if (this.isWildSymbol(symbolKey)) {
                        symbol.classList.add('wild');
                    }
                    symbol.style.left = `${x}px`;
                    symbol.style.top = `${y}px`;
                    symbol.style.width = `${this.SYMBOL_SIZE}px`;
                    symbol.style.height = `${this.SYMBOL_SIZE}px`;

                    const symbolImg = document.createElement('img');
                    symbolImg.src = img.src;
                    symbolImg.style.width = '100%';
                    symbolImg.style.height = '100%';
                    symbolImg.style.objectFit = 'contain';
                    symbol.appendChild(symbolImg);

                    container.appendChild(symbol);

                    // Активируем анимацию с небольшой задержкой
                    requestAnimationFrame(() => {
                        symbol.classList.add('active');
                    });
                }
            });

            // Очистка анимаций через 2 секунды
            setTimeout(() => {
                container.innerHTML = '';
            }, 2000);
        } catch (error) {
            console.error('Error showing winning symbols:', error);
            container.innerHTML = '';
        }
    }

    calculateWinAmount(line) {
        const symbolValues = {
            'wooden_a': 2,
            'wooden_k': 3,
            'wooden_arch': 4,
            'snake': 5,
            'gorilla': 6,
            'jaguar': 8,
            'crocodile': 10,
            'gator': 15,
            'leopard': 20,
            'dragon': 50
        };

        if (!line || !line.symbol) return 0;

        const base_value = symbolValues[line.symbol] || 0;
        const count_multiplier = Math.min(line.count, 5); // Максимум 5 символов
        const wild_multiplier = line.multiplier || 1;

        return this.currentBet * base_value * count_multiplier * wild_multiplier;
    }

    checkWinningLines() {
        const winningLines = [];

        this.paylines.forEach((line, index) => {
            const symbols = line.map(pos => this.reels[pos.x][pos.y]);
            const firstSymbol = symbols[0];

            // Skip if first symbol is wild or sloth
            if (this.isWildSymbol(firstSymbol) || this.isSlothSymbol(firstSymbol)) return;

            let consecutiveCount = 1;
            let multiplier = 1;
            let wildCount = 0;

            for (let i = 1; i < symbols.length; i++) {
                const currentSymbol = symbols[i];
                if (currentSymbol === firstSymbol || this.isWildSymbol(currentSymbol)) {
                    consecutiveCount++;
                    if (this.isWildSymbol(currentSymbol)) {
                        wildCount++;
                        multiplier *= this.getWildMultiplier(currentSymbol);
                    }
                } else {
                    break;
                }
            }

            // Проверяем выигрышную комбинацию
            if (consecutiveCount >= 3) {
                winningLines.push({
                    lineIndex: index,
                    positions: line.slice(0, consecutiveCount),
                    symbol: firstSymbol,
                    count: consecutiveCount,
                    multiplier: multiplier,
                    wildCount: wildCount
                });
            }
        });

        return winningLines;
    }

    showWinPopup(winAmount) {
        if (!winAmount || winAmount <= 0) return;

        const popup = document.createElement('div');
        popup.className = 'win-animation';
        popup.innerHTML = `
            <div class="win-multiplier">${(winAmount / this.currentBet).toFixed(2)}x</div>
            <div class="win-amount">${winAmount.toFixed(2)}</div>
        `;

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 3000);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, creating slot machine');
    window.slotMachine = new SlotMachine();
});