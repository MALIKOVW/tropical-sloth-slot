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

        if (progress >= 100) {
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.gameContent.style.display = 'block';
            }, 500);
        }
    }

    onAssetLoaded() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);
    }

    createFallbackSymbol(symbolName) {
        console.log(`LoadingManager: Creating fallback for ${symbolName}`);
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');

        // Создаем градиентный фон
        const gradient = ctx.createLinearGradient(0, 0, 60, 60);
        gradient.addColorStop(0, '#2a2a2a');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 60, 60);

        // Добавляем рамку
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 56, 56);

        // Добавляем текст
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbolName, 30, 30);

        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    loadImage(path, symbolName) {
        return new Promise((resolve) => {
            console.log(`LoadingManager: Starting to load ${path}`);
            const img = new Image();
            img.onload = () => {
                console.log(`LoadingManager: Successfully loaded ${path}`);
                this.imageCache.set(symbolName, img);
                this.onAssetLoaded();
                resolve(img);
            };
            img.onerror = () => {
                console.log(`LoadingManager: Failed to load ${path}, creating fallback`);
                const fallbackImg = this.createFallbackSymbol(symbolName);
                this.imageCache.set(symbolName, fallbackImg);
                this.onAssetLoaded();
                resolve(fallbackImg);
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

            // Initialize game field
            this.gameField = document.querySelector('.game-field-wrapper');
            if (!this.gameField) {
                throw new Error('Game field not found');
            }

            // Initialize LoadingManager
            this.loadingManager = new LoadingManager();

            // Define available symbols with actual paths
            const symbols = [
                // Basic symbols (от низких к высоким)
                { name: '10', path: '/static/images/symbols/10.png' },
                { name: 'J', path: '/static/images/symbols/J.png' },
                { name: 'Q', path: '/static/images/symbols/Q.png' },
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

            // Load all symbols
            for (const symbol of symbols) {
                try {
                    console.log(`SlotMachine: Loading symbol ${symbol.name} from ${symbol.path}`);
                    const img = await this.loadingManager.loadImage(symbol.path, symbol.name);
                    this.symbolImages.set(symbol.name, img);
                    console.log(`SlotMachine: Successfully loaded ${symbol.name}`);
                } catch (error) {
                    console.error(`SlotMachine: Failed to load ${symbol.name}:`, error);
                    // Fallback already handled in LoadingManager
                }
            }

            // Initialize reels with default symbol
            this.reels = Array(5).fill().map(() => Array(3).fill('10'));

            // Initialize game components
            this.initPaylines();
            this.initializeEventListeners();
            this.draw();

            console.log('SlotMachine: Initialization complete');
        } catch (error) {
            console.error('SlotMachine: Failed to initialize:', error);
        }
    }

    createFallbackSymbol(symbolName) {
        console.log(`SlotMachine: Creating fallback for ${symbolName}`);
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
        ctx.fillText(symbolName, this.SYMBOL_SIZE / 2, this.SYMBOL_SIZE / 2);

        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    draw() {
        // Очищаем предыдущие символы
        const existingSymbols = this.gameField.querySelectorAll('.symbol');
        existingSymbols.forEach(symbol => symbol.remove());

        const cellSize = this.SYMBOL_SIZE + this.SYMBOL_PADDING * 2;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const symbol = this.reels[i][j];
                const x = this.SYMBOL_PADDING + i * cellSize;
                const y = this.SYMBOL_PADDING + j * cellSize;

                const img = this.symbolImages.get(symbol);
                if (img) {
                    // Создаем контейнер для символа
                    const symbolContainer = document.createElement('div');
                    symbolContainer.className = 'symbol';
                    symbolContainer.dataset.position = `${i}-${j}`;
                    symbolContainer.style.position = 'absolute';
                    symbolContainer.style.left = `${x}px`;
                    symbolContainer.style.top = `${y}px`;
                    symbolContainer.style.width = `${this.SYMBOL_SIZE}px`;
                    symbolContainer.style.height = `${this.SYMBOL_SIZE}px`;

                    // Создаем изображение символа
                    const symbolImg = document.createElement('img');
                    symbolImg.src = img.src;
                    symbolImg.style.width = '100%';
                    symbolImg.style.height = '100%';
                    symbolImg.style.objectFit = 'contain';

                    symbolContainer.appendChild(symbolImg);
                    this.gameField.appendChild(symbolContainer);
                }
            }
        }
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
        // Removed - canvas is no longer used
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
        const regularSymbols = ['10', 'J', 'Q', 'wooden_a', 'wooden_k', 'wooden_arch', 'snake', 'gorilla', 'jaguar',
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
        const regularSymbols = ['10', 'J', 'Q', 'wooden_a', 'wooden_k', 'wooden_arch', 'snake',
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

        try {
            // Анимация символов
            positions.forEach(pos => {
                const symbolElement = document.querySelector(`.symbol[data-position="${pos.x}-${pos.y}"]`);
                if (symbolElement) {
                    const symbolKey = this.reels[pos.x][pos.y];
                    symbolElement.classList.add('winning-symbol');
                    if (this.isWildSymbol(symbolKey)) {
                        symbolElement.classList.add('wild');
                    }
                }
            });

            // Очистка анимаций через 2 секунды
            setTimeout(() => {
                const symbols = document.querySelectorAll('.symbol');
                symbols.forEach(symbol => {
                    symbol.classList.remove('winning-symbol', 'wild');
                });
            }, 2000);
        } catch (error) {
            console.error('Error showing winning symbols:', error);
        }
    }

    calculateWinAmount(line) {
        const symbolValues = {
            // Базовые символы
            '10': 1,
            'J': 1.5,
            'Q': 1.8,
            'wooden_a': 2,
            'wooden_k': 3,
            'wooden_arch': 4,

            // Средние символы
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