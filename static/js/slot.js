class LoadingManager {
    constructor() {
        console.log('Initializing LoadingManager');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 13; // Total number of symbols including wilds
        this.loadedAssets = 0;
        this.lastProgress = 0;
        this.initializeLoading();
    }

    initializeLoading() {
        if (!this.loadingScreen || !this.loadingBar || !this.loadingText || !this.gameContent) {
            console.error('Loading screen elements not found, retrying...');
            setTimeout(() => this.initializeLoading(), 100);
            return;
        }

        this.loadingScreen.classList.remove('hidden');
        this.loadingScreen.style.display = 'flex';
        this.gameContent.style.display = 'none';
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) return;

        progress = Math.min(100, Math.max(0, progress));
        if (Math.abs(progress - this.lastProgress) >= 1) {
            this.lastProgress = progress;
            this.loadingBar.style.width = `${progress}%`;
            this.loadingText.textContent = `${Math.round(progress)}%`;
            console.log(`Loading progress: ${progress}%`);
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
        console.log(`Asset loaded: ${this.loadedAssets}/${this.totalAssets}`);
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);

        if (this.loadedAssets >= this.totalAssets) {
            console.log('All assets loaded');
            this.hideLoadingScreen();
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('Initializing Slot Machine');
        this.loadingManager = new LoadingManager();

        // Размеры символов
        this.SYMBOL_SIZE = 60;
        this.SYMBOL_PADDING = 3;

        setTimeout(() => {
            this.initializeCanvas();
            this.init();
        }, 100);

        // Определяем линии выплат (20 линий как в The Dog House)
        this.paylines = [
            // Горизонтальные линии
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}], // 1
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}], // 2
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}], // 3

            // V-образные и зигзагообразные
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}], // 4
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}], // 5
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 1}, {x: 3, y: 2}, {x: 4, y: 2}], // 6
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 4, y: 0}], // 7
            [{x: 0, y: 1}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 1}], // 8
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 1}], // 9
            [{x: 0, y: 1}, {x: 1, y: 0}, {x: 2, y: 1}, {x: 3, y: 2}, {x: 4, y: 1}], // 10
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 4, y: 1}], // 11
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 0}], // 12
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 2}], // 13
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 0}], // 14
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 2}], // 15
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 1}], // 16
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 1}], // 17
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 2}, {x: 3, y: 0}, {x: 4, y: 0}], // 18
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 0}, {x: 3, y: 2}, {x: 4, y: 2}], // 19
            [{x: 0, y: 0}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 0}]  // 20
        ];

        // Определяем на каких барабанах могут появляться wild символы
        this.wildReels = [1, 2, 3]; // индексы 1,2,3 соответствуют 2,3,4 барабанам
    }

    initializeCanvas() {
        console.log('Initializing canvas');
        this.canvas = document.getElementById('slotCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        try {
            this.ctx = this.canvas.getContext('2d');

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
                    path: '/static/images/symbols/Picsart_25-02-25_16-49-31-091.png',
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
                    path: '/static/images/symbols/Picsart_25-02-25_16-45-12-270.png',
                    multipliers: {3: 2, 4: 10, 5: 50}
                },
                'wild_2x': {
                    value: 0,
                    path: '/static/images/symbols/Picsart_25-02-25_18-10-53-970.png',
                    multiplier: 2,
                    isWild: true
                },
                'wild_3x': {
                    value: 0,
                    path: '/static/images/symbols/Picsart_25-02-25_18-12-23-513.png',
                    multiplier: 3,
                    isWild: true
                },
                'wild_5x': {
                    value: 0,
                    path: '/static/images/symbols/Picsart_25-02-25_18-13-55-519.png',
                    multiplier: 5,
                    isWild: true
                }
            };

            // Initialize game state
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 1.00;
            this.bonusSpinsRemaining = 0;

            this.loadSymbolImages();

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    loadSymbolImages() {
        const loadImage = (symbol, def) => {
            return new Promise((resolve, reject) => {
                console.log(`Loading image for symbol: ${symbol}, path: ${def.path}`);
                const img = new Image();

                img.onload = () => {
                    console.log(`Successfully loaded image for symbol: ${symbol}`);
                    this.symbolImages.set(symbol, img);
                    this.loadingManager.onAssetLoaded();
                    resolve();
                };

                img.onerror = (error) => {
                    console.error(`Failed to load image for symbol: ${symbol}`, error);
                    console.error('Attempted path:', def.path);
                    this.loadingManager.onAssetLoaded();
                    reject(error);
                };

                img.src = def.path;
            });
        };

        const loadPromises = Object.entries(this.symbolDefinitions).map(([symbol, def]) => {
            return loadImage(symbol, def);
        });

        Promise.all(loadPromises)
            .then(() => {
                console.log('All images loaded successfully');
                this.draw();
            })
            .catch(error => {
                console.error('Error loading some images:', error);
            });
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

            // Собираем все wild символы в линии
            const wilds = symbols.filter(symbol => this.isWildSymbol(symbol));
            const wildMultiplier = wilds.reduce((total, wild) => total * this.getWildMultiplier(wild), 1);

            // Если в линии есть wild, проверяем возможные комбинации
            if (wilds.length > 0) {
                // Получаем символы, исключая wild и scatter
                const nonWildSymbols = symbols.filter(symbol =>
                    !this.isWildSymbol(symbol) && symbol !== 'sloth'
                );

                // Если есть хотя бы один обычный символ, проверяем комбинацию
                if (nonWildSymbols.length > 0) {
                    const mainSymbol = nonWildSymbols[0];
                    let consecutiveCount = 0;

                    // Подсчитываем количество последовательных символов
                    for (let i = 0; i < symbols.length; i++) {
                        if (symbols[i] === mainSymbol || this.isWildSymbol(symbols[i])) {
                            consecutiveCount++;
                        } else {
                            break;
                        }
                    }

                    // Проверяем выигрышные комбинации для 3+ символов
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
                // Стандартная проверка без wild символов
                const firstSymbol = symbols[0];
                if (firstSymbol !== 'sloth') {
                    let consecutiveCount = 1;

                    // Подсчитываем количество последовательных символов
                    for (let i = 1; i < symbols.length; i++) {
                        if (symbols[i] === firstSymbol || this.isWildSymbol(symbols[i])) {
                            consecutiveCount++;
                        } else {
                            break;
                        }
                    }

                    // Проверяем выигрышные комбинации для 3+ символов
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


    resizeCanvas() {
        if (!this.ctx || !this.canvas) return;

        try {
            const numReels = 5;
            const numRows = 3;

            // Рассчитываем размеры холста на основе размера символов
            const totalWidth = (this.SYMBOL_SIZE + this.SYMBOL_PADDING) * numReels + this.SYMBOL_PADDING;
            const totalHeight = (this.SYMBOL_SIZE + this.SYMBOL_PADDING) * numRows + this.SYMBOL_PADDING;

            this.canvas.width = totalWidth;
            this.canvas.height = totalHeight;

            // Сохраняем логические размеры
            this.logicalWidth = totalWidth;
            this.logicalHeight = totalHeight;

            console.log(`Canvas resized to ${totalWidth}x${totalHeight}`);
            this.draw();
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw each symbol
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const symbol = this.reels[i][j];
                const x = i * (this.SYMBOL_SIZE + this.SYMBOL_PADDING) + this.SYMBOL_PADDING;
                const y = j * (this.SYMBOL_SIZE + this.SYMBOL_PADDING) + this.SYMBOL_PADDING;

                try {
                    const img = this.symbolImages.get(symbol);
                    if (img) {
                        console.log(`Drawing symbol ${symbol} at position ${i},${j}`);
                        this.ctx.drawImage(img, x, y, this.SYMBOL_SIZE, this.SYMBOL_SIZE);
                    } else {
                        console.warn(`No image found for symbol ${symbol}, using fallback`);
                        this.drawFallbackSymbol(symbol, x, y, this.SYMBOL_SIZE);
                    }
                } catch (error) {
                    console.error(`Error rendering symbol ${symbol}:`, error);
                    this.drawFallbackSymbol(symbol, x, y, this.SYMBOL_SIZE);
                }
            }
        }
    }

    drawFallbackSymbol(symbol, x, y, size) {
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${size * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.getSymbolDisplay(symbol), x + size / 2, y + size / 2);
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

            // Initialize event listeners
            this.initializeEventListeners();

            // Set up canvas size and start rendering
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            console.log('Slot machine initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(0.10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-0.10));
    }

    adjustBet(amount) {
        const newBet = Math.max(0.20, Math.min(100, this.currentBet + amount));
        this.currentBet = Number(newBet.toFixed(2));
        document.getElementById('currentBet').textContent = this.currentBet.toFixed(2);
    }

    // Метод для отображения выигрышной линии
    showWinningLine(linePositions) {
        const container = document.getElementById('paylineContainer');
        if (!container) return;

        // Очищаем предыдущие подсветки
        container.innerHTML = '';

        // Создаем элементы для подсветки символов и анимируем символы
        linePositions.forEach(pos => {
            // Точное вычисление позиций с учетом всех отступов
            const cellWidth = this.SYMBOL_SIZE + (this.SYMBOL_PADDING * 2);
            const x = pos.x * cellWidth;
            const y = pos.y * cellWidth;

            // Добавляем подсветку
            const highlight = document.createElement('div');
            highlight.className = 'symbol-highlight';
            highlight.style.left = `${x}px`;
            highlight.style.top = `${y}px`;
            highlight.style.width = `${cellWidth}px`;
            highlight.style.height = `${cellWidth}px`;
            container.appendChild(highlight);

            // Находим и анимируем сам символ
            const symbol = document.createElement('div');
            symbol.className = 'winning-symbol';
            symbol.style.position = 'absolute';
            symbol.style.left = `${x + this.SYMBOL_PADDING}px`;
            symbol.style.top = `${y + this.SYMBOL_PADDING}px`;
            symbol.style.width = `${this.SYMBOL_SIZE}px`;
            symbol.style.height = `${this.SYMBOL_SIZE}px`;

            // Копируем содержимое символа
            const img = this.symbolImages.get(this.reels[pos.x][pos.y]);
            if (img) {
                const symbolImg = document.createElement('img');
                symbolImg.src = img.src;
                symbolImg.style.width = '100%';
                symbolImg.style.height = '100%';
                symbol.appendChild(symbolImg);
            }

            container.appendChild(symbol);
        });

        // Автоматически убираем подсветку и анимацию через 1.5 секунды
        setTimeout(() => {
            container.innerHTML = '';
        }, 1500);
    }

    async spin() {
        if (this.spinning) return;

        const credits = parseFloat(document.getElementById('creditDisplay').textContent);
        if (!this.bonusSpinsRemaining && credits < this.currentBet) {
            alert('Insufficient credits!');
            return;
        }

        try {
            // Ensure audio is initialized
            if (Tone.context.state !== 'running') {
                await Tone.start();
                await audio.init();
            }

            // Play spin button sound
            audio.playClickSound();

            this.spinning = true;
            document.getElementById('spinButton').disabled = true;

            const formData = new FormData();
            formData.append('bet', this.currentBet);

            const response = await fetch('/spin', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            // Play spin sound when animation starts
            audio.playSpinSound();

            await this.animateSpin(result.result);

            // Stop spin sound when animation ends
            audio.stopSpinSound();

            this.reels = result.result;
            document.getElementById('creditDisplay').textContent = result.credits.toFixed(2);

            // Check winning lines
            const winningLines = this.checkWinningLines();

            // If there are winning lines, play win sound
            if (winningLines.length > 0) {
                audio.playWinSound();
            }

            // Show each winning line
            for (const line of winningLines) {
                this.showWinningLine(line.positions);
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            this.draw();

        } catch (error) {
            console.error('Error during spin:', error);
            alert('An error occurred during spin. Please try again.');
        } finally {
            this.spinning = false;
            document.getElementById('spinButton').disabled = false;
        }
    }

    async animateSpin(finalResult) {
        const totalSteps = 30;
        const stepDelay = 50;
        const symbols = Object.keys(this.symbolDefinitions).filter(symbol =>
            !this.symbolDefinitions[symbol].isWild
        );
        const wildSymbols = Object.keys(this.symbolDefinitions).filter(symbol =>
            this.symbolDefinitions[symbol].isWild
        );

        // Параметры для эластичного отскока
        const bounceAmplitude = 20;
        const bounceDuration = 300;

        // Анимация вращения
        for (let step = 0; step < totalSteps; step++) {
            const startTime = performance.now();

            for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
                // Задержка старта для каждого барабана
                if (step < reelIndex * 2) continue;

                // Рассчитываем скорость вращения (замедление к концу)
                const progress = step / totalSteps;
                const speedFactor = Math.pow(1 - progress, 2);

                // Генерируем случайные символы для анимации, кроме последнего шага
                if (step < totalSteps - 1) {
                    for (let j = 0; j < 3; j++) {
                        let randomSymbol;
                        // Для барабанов 2, 3, 4 (индексы 1, 2, 3) можем использовать wild символы
                        if (reelIndex >= 1 && reelIndex <= 3 && Math.random() < 0.2) {
                            const randomWildIndex = Math.floor(Math.random() * wildSymbols.length);
                            randomSymbol = wildSymbols[randomWildIndex];
                        } else {
                            // Для остальных барабанов используем только обычные символы
                            const randomIndex = Math.floor(Math.random() * symbols.length);
                            randomSymbol = symbols[randomIndex];
                        }
                        this.reels[reelIndex][j] = randomSymbol;
                    }
                } else {
                    // На последнем шаге устанавливаем финальные символы для этого барабана
                    for (let j = 0; j < 3; j++) {
                        this.reels[reelIndex][j] = finalResult[reelIndex][j];
                    }
                    // Play new reel stop sound for each reel stopping
                    audio.playReelStopSound();
                }
            }

            this.draw();

            const elapsedTime = performance.now() - startTime;
            const remainingDelay = Math.max(0, stepDelay - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }

        // Эффект отскока в конце
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

        // Финальная отрисовка
        this.draw();
    }
}

// Initialize slot machine when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, creating slot machine instance');
    const slot = new SlotMachine();
});