class LoadingManager {
    constructor() {
        console.log('Initializing LoadingManager');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 11;
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

        // Константы для размеров
        this.SYMBOL_SIZE = 120; // Фиксированный размер символа
        this.SYMBOL_PADDING = 10; // Отступ между символами

        setTimeout(() => {
            this.initializeCanvas();
            this.init();
        }, 100);

        // Добавляем определение линий выплат
        this.paylines = [
            // Горизонтальные линии
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}], // Верхняя
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}], // Средняя
            [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}], // Нижняя

            // V-образные линии
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 0}], // V
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 2}], // Перевернутая V

            // Зигзагообразные линии
            [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1}, {x: 4, y: 0}],
            [{x: 0, y: 2}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}, {x: 4, y: 2}],

            // Дополнительные линии
            [{x: 0, y: 1}, {x: 1, y: 0}, {x: 2, y: 1}, {x: 3, y: 2}, {x: 4, y: 1}],
            [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 3, y: 0}, {x: 4, y: 1}]
        ];
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
                'wooden_a': { value: 10, path: '/static/images/symbols/pic1.png' },
                'wooden_k': { value: 15, path: '/static/images/symbols/pic2.png' },
                'wooden_arch': { value: 20, path: '/static/images/symbols/pic3.png' },
                'snake': { value: 30, path: '/static/images/symbols/pic4.png' },
                'gorilla': { value: 40, path: '/static/images/symbols/pic5.png' },
                'jaguar': { value: 50, path: '/static/images/symbols/pic6.png' },
                'crocodile': { value: 60, path: '/static/images/symbols/pic7.png' },
                'gator': { value: 70, path: '/static/images/symbols/pic8.png' },
                'leopard': { value: 80, path: '/static/images/symbols/pic9.png' },
                'dragon': { value: 100, path: '/static/images/symbols/pic10.png' },
                'sloth': { value: 0, path: '/static/images/symbols/pic11.png' }
            };

            // Initialize game state
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 1.00;
            this.bonusSpinsRemaining = 0;

            // Load symbol images
            this.loadSymbolImages();

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    loadSymbolImages() {
        console.log('Starting to load symbol images');
        Object.entries(this.symbolDefinitions).forEach(([symbol, def]) => {
            console.log(`Loading image for symbol: ${symbol}, path: ${def.path}`);
            const img = new Image();

            img.onload = () => {
                console.log(`Successfully loaded image for symbol: ${symbol}`);
                this.symbolImages.set(symbol, img);
                this.loadingManager.onAssetLoaded();
                this.draw(); // Перерисовываем после загрузки каждого изображения
            };

            img.onerror = (error) => {
                console.error(`Failed to load image for symbol: ${symbol}`, error);
                console.error('Attempted path:', def.path);
                this.loadingManager.onAssetLoaded();
            };

            img.src = def.path;
        });
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
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Draw each symbol
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * (this.SYMBOL_SIZE + this.SYMBOL_PADDING) + this.SYMBOL_PADDING;
                const y = j * (this.SYMBOL_SIZE + this.SYMBOL_PADDING) + this.SYMBOL_PADDING;
                const symbol = this.reels[i][j];

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
            'dragon': '🐲', 'sloth': '🦥'
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

    // Метод для проверки выигрышных линий
    checkWinningLines() {
        const winningLines = [];

        this.paylines.forEach((line, index) => {
            const symbols = line.map(pos => this.reels[pos.x][pos.y]);
            const firstSymbol = symbols[0];

            // Проверяем, все ли символы в линии одинаковые
            const isWinning = symbols.every(symbol => symbol === firstSymbol);

            if (isWinning) {
                winningLines.push({
                    lineIndex: index,
                    positions: line,
                    symbol: firstSymbol
                });
            }
        });

        return winningLines;
    }

    // Метод для отображения выигрышной линии
    showWinningLine(linePositions) {
        const container = document.getElementById('paylineContainer');

        // Очищаем предыдущие линии
        container.innerHTML = '';

        // Создаем элементы для подсветки символов
        linePositions.forEach(pos => {
            const symbolRect = this.getSymbolRect(pos.x, pos.y);
            const highlight = document.createElement('div');
            highlight.className = 'symbol-highlight';
            highlight.style.left = symbolRect.left + 'px';
            highlight.style.top = symbolRect.top + 'px';
            highlight.style.width = this.SYMBOL_SIZE + 'px';
            highlight.style.height = this.SYMBOL_SIZE + 'px';
            container.appendChild(highlight);
        });

        // Создаем линию между символами
        const line = document.createElement('div');
        line.className = 'payline';

        // Вычисляем позиции для линии
        const startPos = this.getSymbolRect(linePositions[0].x, linePositions[0].y);
        const endPos = this.getSymbolRect(linePositions[4].x, linePositions[4].y);

        // Устанавливаем размеры и позицию линии
        const length = Math.sqrt(
            Math.pow(endPos.left - startPos.left, 2) +
            Math.pow(endPos.top - startPos.top, 2)
        );

        const angle = Math.atan2(
            endPos.top - startPos.top,
            endPos.left - startPos.left
        );

        line.style.width = length + 'px';
        line.style.left = (startPos.left + this.SYMBOL_SIZE / 2) + 'px';
        line.style.top = (startPos.top + this.SYMBOL_SIZE / 2) + 'px';
        line.style.transform = `rotate(${angle}rad)`;

        container.appendChild(line);
    }

    // Вспомогательный метод для получения координат символа
    getSymbolRect(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            left: rect.left + x * (this.SYMBOL_SIZE + this.SYMBOL_PADDING) + this.SYMBOL_PADDING,
            top: rect.top + y * (this.SYMBOL_SIZE + this.SYMBOL_PADDING) + this.SYMBOL_PADDING
        };
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

            await this.animateSpin(result.result);

            this.reels = result.result;
            document.getElementById('creditDisplay').textContent = result.credits.toFixed(2);

            // Проверяем выигрышные линии
            const winningLines = this.checkWinningLines();

            // Показываем каждую выигрышную линию по очереди
            for (const line of winningLines) {
                this.showWinningLine(line.positions);
                await new Promise(resolve => setTimeout(resolve, 1000));
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
        const symbols = Object.keys(this.symbolDefinitions);

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
                        const randomIndex = Math.floor(Math.random() * symbols.length);
                        this.reels[reelIndex][j] = symbols[randomIndex];
                    }
                } else {
                    // На последнем шаге устанавливаем финальные символы для этого барабана
                    for (let j = 0; j < 3; j++) {
                        this.reels[reelIndex][j] = finalResult[reelIndex][j];
                    }
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