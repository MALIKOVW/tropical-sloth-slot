class LoadingManager {
    constructor() {
        console.log('Initializing LoadingManager');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingBar = document.getElementById('loadingBar');
        this.loadingText = document.getElementById('loadingText');
        this.gameContent = document.getElementById('gameContent');
        this.totalAssets = 14;
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

        console.log('Loading screen initialized');
        this.loadingScreen.classList.remove('hidden');
        this.loadingScreen.style.display = 'flex';
        this.gameContent.style.display = 'none';
    }

    updateProgress(progress) {
        if (!this.loadingBar || !this.loadingText) {
            console.error('Loading elements not found during progress update');
            return;
        }

        progress = Math.min(100, Math.max(0, progress));
        if (Math.abs(progress - this.lastProgress) >= 1) {
            this.lastProgress = progress;
            this.loadingBar.style.width = `${progress}%`;
            this.loadingText.textContent = `${Math.round(progress)}%`;
            console.log(`Loading progress: ${progress}%`);
        }
    }

    hideLoadingScreen() {
        if (!this.loadingScreen || !this.gameContent) {
            console.error('Elements not found while hiding loading screen');
            return;
        }

        console.log('Hiding loading screen');
        this.loadingScreen.classList.add('hidden');
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.gameContent.style.display = 'block';
            console.log('Game content shown');
        }, 500);
    }

    onAssetLoaded() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.updateProgress(progress);
        console.log(`Asset loaded (${this.loadedAssets}/${this.totalAssets})`);

        if (this.loadedAssets >= this.totalAssets) {
            console.log('All assets loaded');
            this.hideLoadingScreen();
        }
    }
}

class SlotMachine {
    constructor() {
        console.log('Initializing Slot Machine');
        try {
            this.loadingManager = new LoadingManager();

            this.SYMBOL_SIZE = 60;
            this.SYMBOL_PADDING = 3;

            this.spinning = false;
            this.isAnimatingWin = false;
            this.skipWinAnimation = false;

            this.animatedSymbols = new Map();
            this.preloadedElements = new Map();

            setTimeout(() => {
                console.log('Starting canvas initialization');
                this.initializeCanvas();
                this.init();
            }, 100);

            // Определяем линии выплат (20 линий)
            this.paylines = [
                [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}], // 1
                [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}], // 2
                [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}], // 3
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

            this.wildReels = [1, 2, 3]; // индексы 1,2,3 соответствуют 2,3,4 барабанам
            console.log('Slot Machine initialized successfully');
        } catch (error) {
            console.error('Error during Slot Machine initialization:', error);
        }
    }

    preloadElements() {
        Object.entries(this.symbolDefinitions).forEach(([symbol, def]) => {
            // Создаем шаблон для анимированного символа
            const symbolElement = document.createElement('div');
            symbolElement.className = 'winning-symbol';
            symbolElement.style.position = 'absolute';
            symbolElement.style.width = `${this.SYMBOL_SIZE}px`;
            symbolElement.style.height = `${this.SYMBOL_SIZE}px`;

            const symbolImg = document.createElement('img');
            symbolImg.src = def.path;
            symbolImg.style.width = '100%';
            symbolImg.style.height = '100%';
            symbolElement.appendChild(symbolImg);

            this.preloadedElements.set(symbol, symbolElement);
        });
    }

    async showWinningLine(linePositions) {
        const container = document.getElementById('paylineContainer');
        if (!container) return;

        try {
            // Очищаем предыдущие подсветки
            container.innerHTML = '';

            // Создаем линию выплаты
            const startPos = linePositions[0];
            const endPos = linePositions[linePositions.length - 1];

            const cellSize = this.SYMBOL_SIZE + (this.SYMBOL_PADDING * 2);
            const startX = startPos.x * cellSize + cellSize / 2;
            const startY = startPos.y * cellSize + cellSize / 2;
            const endX = endPos.x * cellSize + cellSize / 2;
            const endY = endPos.y * cellSize + cellSize / 2;

            // Создаем элемент линии
            const line = document.createElement('div');
            line.className = 'payline';

            // Вычисляем длину и угол линии
            const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

            // Устанавливаем стили линии
            line.style.width = `${length}px`;
            line.style.left = `${startX}px`;
            line.style.top = `${startY}px`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.transformOrigin = 'left center';

            container.appendChild(line);

            // Анимируем символы вдоль линии
            const symbolElements = [];
            for (const pos of linePositions) {
                const x = pos.x * cellSize;
                const y = pos.y * cellSize;

                const symbolKey = this.reels[pos.x][pos.y];
                const img = this.symbolImages.get(symbolKey);

                if (img) {
                    // Создаем и добавляем символ
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

            // Активируем анимации
            await new Promise(resolve => setTimeout(resolve, 50));

            // Показываем линию с анимацией
            line.classList.add('active');
            line.style.animation = 'paylineGlow 1.5s infinite';

            // Активируем символы по очереди
            for (const symbol of symbolElements) {
                await new Promise(resolve => setTimeout(resolve, 100));
                symbol.classList.add('active');
            }

            // Добавляем возможность пропустить анимацию по клику
            container.addEventListener('click', () => {
                container.innerHTML = '';
            }, { once: true });

            // Автоматически убираем подсветку через 2 секунды
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (container.innerHTML !== '') {
                container.innerHTML = '';
            }

        } catch (error) {
            console.error('Error showing winning line:', error);
            container.innerHTML = '';
        }
    }

    async spin() {
        if (this.spinning) return;

        const credits = parseFloat(document.getElementById('creditDisplay').textContent);
        if (!this.bonusSpinsRemaining && credits < this.currentBet) {
            alert('Недостаточно кредитов!');
            return;
        }

        try {
            // Ensure audio is initialized
            if (Tone.context.state !== 'running') {
                await Tone.start();
                await audio.init();
            }

            this.spinning = true;
            document.getElementById('spinButton').disabled = true;

            // Вычитаем ставку из баланса перед спином
            if (!this.bonusSpinsRemaining) {
                const newCredits = credits - this.currentBet;
                document.getElementById('creditDisplay').textContent = newCredits.toFixed(2);
            }

            // Play spin button sound
            audio.playClickSound();

            // Создаем массивы символов
            const regularSymbols = ['wooden_a', 'wooden_k', 'wooden_arch', 'snake', 'gorilla', 'jaguar', 'crocodile', 'gator', 'leopard', 'dragon'];
            const wildSymbols = ['wild_2x', 'wild_3x', 'wild_5x'];
            const scatterSymbol = 'sloth';

            // Генерируем случайный результат
            const testResult = {
                result: Array(5).fill().map((_, reelIndex) => {
                    return Array(3).fill().map(() => {
                        // Для барабанов 2,3,4 (индексы 1,2,3) можем добавить wild символы с некоторой вероятностью
                        if (reelIndex >= 1 && reelIndex <= 3 && Math.random() < 0.2) {
                            return wildSymbols[Math.floor(Math.random() * wildSymbols.length)];
                        }
                        // С небольшой вероятностью добавляем scatter
                        if (Math.random() < 0.1) {
                            return scatterSymbol;
                        }
                        // В остальных случаях используем обычные символы
                        return regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
                    });
                }),
                win: 0
            };

            // Play spin sound
            audio.playSpinSound();

            // Очищаем предыдущие анимации
            const container = document.getElementById('paylineContainer');
            if (container) {
                container.innerHTML = '';
            }

            // Анимация вращения
            await this.animateSpin(testResult.result);

            // Stop spin sound
            audio.stopSpinSound();

            // Обновляем состояние
            this.reels = testResult.result;

            // Проверяем выигрышные линии и считаем выигрыш
            const winningLines = this.checkWinningLines();
            let totalWin = 0;

            // Рассчитываем общий выигрыш
            winningLines.forEach(line => {
                const symbol = this.symbolDefinitions[line.symbol];
                if (symbol && symbol.multipliers[line.count]) {
                    totalWin += symbol.multipliers[line.count] * this.currentBet * line.multiplier;
                }
            });

            // Ограничиваем максимальный выигрыш до 10000x ставки
            const maxWin = this.currentBet * 10000;
            if (totalWin > maxWin) {
                totalWin = maxWin;
            }

            testResult.win = totalWin;

            // Добавляем выигрыш к балансу
            if (testResult.win > 0) {
                const currentCredits = parseFloat(document.getElementById('creditDisplay').textContent);
                const newCredits = currentCredits + testResult.win;
                document.getElementById('creditDisplay').textContent = newCredits.toFixed(2);

                // Показываем окно выигрыша если он достаточно большой
                this.showWinPopup(testResult.win);
            }

            // Разблокируем кнопку через 1 секунду
            setTimeout(() => {
                document.getElementById('spinButton').disabled = false;
                this.spinning = false;
            }, 1000);

            // Если есть выигрышные линии
            if (winningLines.length > 0) {
                audio.playWinSound();

                for (const line of winningLines) {
                    if (!this.spinning) {
                        await this.showWinningLine(line.positions);
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

        // Определяем конечный тип выигрыша
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
            return; // Не показываем окно для маленьких выигрышей
        }

        // Начинаем с BIG WIN
        popup.className = 'win-popup big-win';
        title.textContent = 'BIG WIN';
        popup.style.display = 'block';

        // Инициализируем начальные значения для анимации
        let currentMultiplier = 20;
        let currentAmount = this.currentBet * 20;
        let currentClass = 'big-win';
        let currentText = 'BIG WIN';
        let animationSpeed = 1;
        let updateInterval = 50;

        // Функция обновления значений
        const updateValues = () => {
            // Увеличиваем значения
            const step = Math.max(1, Math.floor((multiplier - currentMultiplier) / 10));
            currentMultiplier = Math.min(currentMultiplier + step, multiplier);
            currentAmount = this.currentBet * currentMultiplier;

            // Обновляем класс и текст в зависимости от текущего множителя
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

            // Обновляем отображение
            multiplierElement.textContent = `${currentMultiplier.toFixed(2)}x`;
            amountElement.textContent = currentAmount.toFixed(2);

            // Продолжаем анимацию если не достигли целевых значений
            if (currentMultiplier < multiplier) {
                // Увеличиваем скорость
                animationSpeed *= 1.1;
                updateInterval = Math.max(10, Math.floor(50 / animationSpeed));
                setTimeout(updateValues, updateInterval);
            }
        };

        // Запускаем анимацию
        updateValues();

        // Добавляем обработчик для кнопки закрытия
        const closeButton = popup.querySelector('.close-button');
        const closePopup = () => {
            popup.style.display = 'none';
            closeButton.removeEventListener('click', closePopup);
        };
        closeButton.addEventListener('click', closePopup);

        // Автоматически закрываем через 5 секунд после окончания анимации
        setTimeout(closePopup, 8000);
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

    initializeCanvas() {
        console.log('Initializing canvas');
        this.canvas = document.getElementById('slotCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        try {
            this.ctx = this.canvas.getContext('2d');

            // Initialize game state
            this.reels = Array(5).fill().map(() => Array(3).fill('wooden_a'));
            this.symbolImages = new Map();
            this.spinning = false;
            this.currentBet = 10; // Начальная ставка 10
            this.bonusSpinsRemaining = 0;

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

            this.loadSymbolImages();

            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Error initializing canvas:', error);
        }
    }

    loadSymbolImages() {
        const loadImage = (symbol, def) => {
            return new Promise((resolve) => {
                const img = new Image();

                img.onload = () => {
                    console.log(`Successfully loaded image for symbol: ${symbol} from path: ${def.path}`);
                    this.symbolImages.set(symbol, img);
                    this.loadingManager.onAssetLoaded();
                    resolve();
                };

                img.onerror = (error) => {
                    console.error(`Failed to load image for symbol: ${symbol}`, error);
                    console.error('Attempted path:', def.path);
                    // Создаем fallback изображение с текстовой меткой
                    const canvas = document.createElement('canvas');
                    canvas.width = this.SYMBOL_SIZE;
                    canvas.height = this.SYMBOL_SIZE;
                    const ctx = canvas.getContext('2d');

                    // Рисуем фон
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Добавляем текст
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(symbol, canvas.width / 2, canvas.height / 2);

                    const fallbackImg = new Image();
                    fallbackImg.src = canvas.toDataURL();
                    this.symbolImages.set(symbol, fallbackImg);
                    this.loadingManager.onAssetLoaded();
                    resolve();
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
                this.preloadElements();
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
                        console.log(`Winning line found with ${consecutiveCount} symbols (including wilds). Wild multiplier: ${wildMultiplier}`);
                        winningLines.push({
                            lineIndex: index,
                            positions: line.slice(0, consecutiveCount),
                            symbol:mainSymbol,
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



    resizeCanvas() {
        if (!this.ctx || !this.canvas) return;

        try {
            const numReels = 5;
            const numRows = 3;

            // Calculate total size with padding
            const horizontalPadding = this.SYMBOL_PADDING * 6; // 6 gaps (5 between symbols + 2 edges)
            const verticalPadding = this.SYMBOL_PADDING * 4;   // 4 gaps (3 between symbols + 2 edges)

            const totalWidth = (this.SYMBOL_SIZE * numReels) + horizontalPadding;
            const totalHeight = (this.SYMBOL_SIZE * numRows) + verticalPadding;

            this.canvas.width = totalWidth;
            this.canvas.height = totalHeight;

            // Save logical dimensions
            this.logicalWidth = totalWidth;
            this.logicalHeight = totalHeight;

            this.draw();
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas - исправляем ошибку в параметрах
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate exact positions for symbols
        const totalWidth = this.canvas.width;
        const totalHeight = this.canvas.height;
        const symbolWidth = this.SYMBOL_SIZE;
        const symbolHeight = this.SYMBOL_SIZE;

        // Calculate gaps between symbols
        const horizontalGap = (totalWidth - (5 * symbolWidth)) / 6;
        const verticalGap = (totalHeight - (3 * symbolHeight)) / 4;

        // Draw each symbol
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const symbol = this.reels[i][j];
                const x = horizontalGap + i * (symbolWidth + horizontalGap);
                const y = verticalGap + j * (symbolHeight + verticalGap);

                try {
                    const img = this.symbolImages.get(symbol);
                    if (img) {
                        this.ctx.drawImage(img, x, y, symbolWidth, symbolHeight);
                    } else {
                        this.drawFallbackSymbol(symbol, x, y, symbolWidth);
                    }
                } catch (error) {
                    console.error(`Error rendering symbol ${symbol}:`, error);
                    this.drawFallbackSymbol(symbol, x, y, symbolWidth);
                }
            }
        }
    }

    drawFallbackSymbol(symbol, x, y, size) {
        if (!this.ctx) return;

        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${size * 0.3}px Arial`;
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

        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(1));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-1));
    }

    adjustBet(amount) {
        const betValues = [10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 40000, 50000, 100000];
        const currentIndex = betValues.indexOf(this.currentBet);
        let newIndex;

        if (amount > 0) {
            newIndex = Math.min(currentIndex + 1, betValues.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }

        this.currentBet = betValues[newIndex];
        document.getElementById('currentBet').textContent = this.currentBet.toFixed(2);
    }
}

// Initialize slot machine when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, creating slot machine instance');
    try {
        const slot = new SlotMachine();
        window.slotMachine = slot; // Сохраняем экземпляр для отладки
    } catch (error) {
        console.error('Failed to create SlotMachine instance:', error);
    }
});