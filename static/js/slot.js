// Оптимизированный менеджер загрузки
class LoadingManager {
    constructor() {
        // Получаем элементы загрузки
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');

        // Проверяем наличие всех элементов
        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('Required loading elements not found');
            return;
        }

        // Состояние загрузки
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.imageCache = new Map();
        this.lastProgress = 0;

        // Инициализация начального состояния
        this.initializeLoadingScreen();
    }

    initializeLoadingScreen() {
        // Добавляем CSS transitions для плавности
        this.loadingScreen.style.transition = 'opacity 0.5s ease-in-out';
        this.gameContent.style.transition = 'opacity 0.5s ease-in-out';
        this.loadingBar.style.transition = 'width 0.3s ease-out';

        // Скрываем игровой контент и показываем экран загрузки
        this.gameContent.style.opacity = '0';
        this.gameContent.style.display = 'none';

        this.loadingScreen.style.opacity = '1';
        this.loadingScreen.style.display = 'flex';

        // Сбрасываем прогресс
        this.updateProgress(0);
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) return;

        // Нормализуем прогресс
        progress = Math.min(100, Math.max(0, progress));

        // Обновляем только при значимых изменениях
        if (Math.abs(progress - this.lastProgress) >= 1) {
            this.lastProgress = progress;

            // Используем requestAnimationFrame для плавной анимации
            requestAnimationFrame(() => {
                this.loadingBar.style.width = `${progress}%`;
                this.loadingText.textContent = `${Math.round(progress)}%`;
            });
        }
    }

    onAssetLoaded() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);

        // Если все ассеты загружены, показываем игру
        if (this.loadedAssets >= this.totalAssets) {
            this.showGameContent();
        }
    }

    showGameContent() {
        // Плавно скрываем экран загрузки
        this.loadingScreen.style.opacity = '0';

        // Показываем игровой контент после скрытия экрана загрузки
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';

            // Плавно показываем игровой контент
            requestAnimationFrame(() => {
                this.gameContent.style.opacity = '1';
            });
        }, 500); // Время должно совпадать с transition
    }

    async loadImage(path) {
        try {
            // Проверяем кэш
            if (this.imageCache.has(path)) {
                return this.imageCache.get(path);
            }

            // Загружаем новое изображение
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load image: ${path}`));
                image.src = path;
            });

            // Кэшируем и обновляем прогресс
            this.imageCache.set(path, img);
            this.onAssetLoaded();
            return img;

        } catch (error) {
            console.error(`Failed to load image: ${path}`, error);
            throw error;
        }
    }
}

class SlotMachine {
    constructor() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    async initialize() {
        try {
            console.log('Initializing slot machine...');

            // Создаем загрузчик
            this.loadingManager = new LoadingManager();

            // Базовая инициализация
            this.SYMBOL_SIZE = 60;
            this.SYMBOL_PADDING = 3;
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 10;

            // Определяем символы
            this.symbolDefinitions = {
                '10': { value: 5, path: '/static/images/symbols/10.png', multipliers: {3: 5, 4: 10, 5: 20} },
                'J': { value: 5, path: '/static/images/symbols/J.png', multipliers: {3: 5, 4: 10, 5: 20} },
                'Q': { value: 10, path: '/static/images/symbols/Q.png', multipliers: {3: 10, 4: 20, 5: 50} },
                'K': { value: 15, path: '/static/images/symbols/K.png', multipliers: {3: 15, 4: 30, 5: 75} },
                'A': { value: 20, path: '/static/images/symbols/A.png', multipliers: {3: 20, 4: 40, 5: 100} },
                'dog1': { value: 25, path: '/static/images/symbols/dog1.png', multipliers: {3: 25, 4: 50, 5: 125} },
                'dog2': { value: 30, path: '/static/images/symbols/dog2.png', multipliers: {3: 30, 4: 60, 5: 150} },
                'dog3': { value: 40, path: '/static/images/symbols/dog3.png', multipliers: {3: 40, 4: 80, 5: 200} },
                'toy1': { value: 50, path: '/static/images/symbols/toy1.png', multipliers: {3: 50, 4: 100, 5: 250} },
                'toy2': { value: 100, path: '/static/images/symbols/toy2.png', multipliers: {3: 100, 4: 200, 5: 500} },
                'scatter': { value: 0, path: '/static/images/symbols/scatter.png', isScatter: true },
                'wild': { value: 0, path: '/static/images/symbols/wild.png', multiplier: 2, isWild: true }
            };

            // Инициализация канваса
            this.canvas = document.getElementById('slotCanvas');
            if (!this.canvas) {
                throw new Error('Canvas not found');
            }

            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            // Установка количества ассетов
            this.loadingManager.totalAssets = Object.keys(this.symbolDefinitions).length;

            // Загрузка изображений
            await this.loadSymbols();

            // Инициализация игры
            this.initializeGame();
            this.initializeEventListeners();
            this.draw();

            console.log('Slot machine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize slot machine:', error);
        }
    }

    async loadSymbols() {
        const loadPromises = Object.entries(this.symbolDefinitions).map(async ([symbol, def]) => {
            try {
                const img = await this.loadingManager.loadImage(def.path);
                this.symbolImages.set(symbol, img);
                console.log(`Loaded symbol: ${symbol}`);
            } catch (error) {
                console.error(`Failed to load symbol ${symbol}:`, error);
                this.createFallbackSymbol(symbol);
            }
        });

        await Promise.all(loadPromises);
    }

    initializeGame() {
        // Инициализация барабанов
        this.reels = Array(5).fill().map(() => Array(3).fill('10'));

        // Линии выплат
        this.paylines = [
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}],
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}],
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}],
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}],
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}]
        ];

        // Настройка размеров
        this.resizeCanvas();
    }

    resizeCanvas() {
        if (!this.canvas) return;

        const numReels = 5;
        const numRows = 3;
        const horizontalPadding = this.SYMBOL_PADDING * 6;
        const verticalPadding = this.SYMBOL_PADDING * 4;

        this.canvas.width = (this.SYMBOL_SIZE * numReels) + horizontalPadding;
        this.canvas.height = (this.SYMBOL_SIZE * numRows) + verticalPadding;
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

        // Оптимизация ресайза
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                this.draw();
            }, 250);
        });
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        // Очистка canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const totalWidth = this.canvas.width;
        const totalHeight = this.canvas.height;
        const symbolWidth = this.SYMBOL_SIZE;
        const symbolHeight = this.SYMBOL_SIZE;

        const horizontalGap = (totalWidth - (5 * symbolWidth)) / 6;
        const verticalGap = (totalHeight - (3 * symbolHeight)) / 4;

        // Оптимизированная отрисовка символов
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

        // Обновление кредитов
        const newCredits = credits - this.currentBet;
        const creditDisplay = document.getElementById('creditDisplay');
        if (creditDisplay) creditDisplay.textContent = newCredits.toFixed(2);

        // Генерация результата
        const result = Array(5).fill().map(() =>
            Array(3).fill().map(() => {
                const symbols = Object.keys(this.symbolDefinitions);
                return symbols[Math.floor(Math.random() * symbols.length)];
            })
        );

        // Анимация вращения
        await this.animateSpin(result);

        // Обновление состояния и отрисовка
        this.reels = result;
        this.draw();

        // Проверка выигрыша
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

        // Разблокировка кнопки
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
        const multiplier = line.multiplier;
        const symbol = line.symbol;
        const count = line.count;
        const baseWin = this.symbolDefinitions[symbol].multipliers[count] || 0;
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
        ctx.fillText(this.getSymbolDisplay(symbol), this.SYMBOL_SIZE / 2, this.SYMBOL_SIZE / 2);
        this.symbolImages.set(symbol, canvas);
    }

    symbolDefinitions = {
        'wild': { isWild: true, multiplier: 2 }
    };
}

// Инициализация слота
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.slotMachine = new SlotMachine();
    } catch (error) {
        console.error('Failed to create slot machine:', error);
    }
});