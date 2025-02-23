class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.lowSymbols = ['10', 'J', 'Q', 'K', 'A'];
        this.highSymbols = ['dog1', 'dog2', 'dog3', 'toy1', 'toy2'];
        this.specialSymbols = ['wild', 'scatter'];

        this.symbols = [...this.lowSymbols, ...this.highSymbols, ...this.specialSymbols];
        this.reels = Array(5).fill().map(() => Array(3).fill('A'));
        this.spinning = false;
        this.currentBet = 0.20;
        this.bonusSpinsRemaining = 0;
        this.wildPositions = [];
        this.stats = {
            totalSpins: 0,
            totalWins: 0,
            biggestWin: 0,
            totalBet: 0,
            totalWon: 0
        };

        // Initialize responsive canvas
        this.resizeCanvas();
        this.draw();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });

        // Disable overscroll/bounce effect on mobile
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('#slotCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Handle touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.spinning) {
                this.spin();
            }
        });

        this.initializeEventListeners();
        this.initializeNewEventListeners();
        this.updateBonusDisplay();
        this.fetchStatistics();
        setInterval(() => this.fetchStatistics(), 60000);

        // Initialize other properties
        this.winningLines = [];
        this.animatingWin = false;
        this.paylineContainer = document.createElement('div');
        this.paylineContainer.id = 'paylineContainer';
        document.querySelector('.game-container').appendChild(this.paylineContainer);

        this.turboMode = false;
        this.autoSpinning = false;
        this.autoSpinCount = 0;
        this.stopBalance = 0;
        this.spinDelay = 50;
        this.turboDelay = 25;

        this.autoSpinModal = new bootstrap.Modal(document.getElementById('autoSpinModal'));
        this.buyFreespinsModal = new bootstrap.Modal(document.getElementById('buyFreespinsModal'));

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
                this.draw();
            }, 100);
        });
    }

    getSymbolDisplay(symbol) {
        const symbolMap = {
            '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
            'dog1': '🐕', 'dog2': '🐶', 'dog3': '🐩',
            'toy1': '🎾', 'toy2': '🦴',
            'wild': '🏠', 'scatter': '⭐'
        };
        return symbolMap[symbol] || symbol;
    }

    drawSymbol(symbol, x, y, size, isStatic = false) {
        const padding = size * 0.1;
        const symbolSize = size - (padding * 2);
        const symbolX = x + padding;
        const symbolY = y + padding;

        // Рисуем фон с закругленными углами
        this.ctx.fillStyle = isStatic ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(symbolX, symbolY, symbolSize, symbolSize, 10);
        this.ctx.fill();

        // Создаем градиент для символа
        const gradient = this.ctx.createLinearGradient(symbolX, symbolY, symbolX + symbolSize, symbolY + symbolSize);

        if (isStatic && symbol === 'wild') {
            // Специальный градиент для статичного вилда
            gradient.addColorStop(0, '#ffd700');
            gradient.addColorStop(1, '#ff8c00');
        } else if (this.lowSymbols.includes(symbol)) {
            gradient.addColorStop(0, '#5a9ff2');
            gradient.addColorStop(1, '#3181dd');
        } else if (this.highSymbols.includes(symbol)) {
            gradient.addColorStop(0, '#ff9f22');
            gradient.addColorStop(1, '#e36410');
        } else if (symbol === 'wild') {
            gradient.addColorStop(0, '#ffaf53');
            gradient.addColorStop(1, '#ff8f10');
        } else if (symbol === 'scatter') {
            gradient.addColorStop(0, '#a5b5b6');
            gradient.addColorStop(1, '#8f9c9d');
        }

        // Применяем стили для текста
        this.ctx.fillStyle = gradient;
        this.ctx.font = `bold ${symbolSize * 0.7}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Добавляем эффект свечения
        this.ctx.shadowColor = isStatic ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = symbolSize * (isStatic ? 0.2 : 0.1);
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Рисуем символ по центру ячейки
        const textX = symbolX + symbolSize / 2;
        const textY = symbolY + symbolSize / 2;
        this.ctx.fillText(this.getSymbolDisplay(symbol), textX, textY);

        // Сбрасываем эффекты
        this.ctx.shadowBlur = 0;

        // Добавляем рамку для специальных символов
        if (symbol === 'wild' || symbol === 'scatter') {
            this.ctx.strokeStyle = symbol === 'wild' ? (isStatic ? '#ffd700' : '#ff9f43') : '#95a5a6';
            this.ctx.lineWidth = Math.max(2, symbolSize * (isStatic ? 0.05 : 0.03));
            this.ctx.strokeRect(symbolX + padding / 2, symbolY + padding / 2, symbolSize - padding, symbolSize - padding);
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        // Очищаем канвас
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Вычисляем размеры для барабанов
        const reelWidth = this.logicalWidth / 5;
        const symbolSize = Math.min(reelWidth * 0.9, this.logicalHeight / 3.5);

        // Вычисляем отступы для центрирования
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const totalSymbolsHeight = symbolSize * 3;
        const verticalPadding = (this.logicalHeight - totalSymbolsHeight) / 4;

        // Рисуем символы
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * reelWidth + horizontalPadding;
                const y = j * (symbolSize + verticalPadding) + verticalPadding;

                const symbol = this.reels[i] && this.reels[i][j] ? this.reels[i][j] : this.symbols[0];
                this.drawSymbol(symbol, x, y, symbolSize);
            }
        }
    }


    async loadImages() {
        const loadImage = (symbol) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve([symbol, img]);
                img.onerror = reject;
                img.src = `/static/images/symbols/${symbol}.png`;
            });
        };

        const imagePromises = this.symbols.map(loadImage);
        const loadedImages = await Promise.all(imagePromises);
    }
    loadSymbols() {
        fetch('/static/svg/symbols.svg')
            .then(response => response.text())
            .then(svgData => {
                const container = document.createElement('div');
                container.style.display = 'none';
                container.innerHTML = svgData;
                document.body.appendChild(container);
            });
    }

    createSymbolElement(symbol) {
        const container = document.createElement('div');
        container.className = `symbol-container symbol ${symbol}`;

        const symbolElement = document.createElement('div');
        symbolElement.className = 'symbol';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${symbol}`);

        svg.appendChild(use);
        symbolElement.appendChild(svg);
        container.appendChild(symbolElement);

        return container;
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;

        // Определяем максимальную ширину для канваса (80% от контейнера на мобильных)
        const maxWidth = Math.min(800, window.innerWidth < 768 ? containerWidth * 0.8 : containerWidth);

        // Устанавливаем соотношение сторон 4:3
        const aspectRatio = 4 / 3;
        const height = maxWidth / aspectRatio;

        // Устанавливаем размеры отображения
        this.canvas.style.width = `${maxWidth}px`;
        this.canvas.style.height = `${height}px`;

        // Устанавливаем физические размеры с учетом плотности пикселей
        const scale = window.devicePixelRatio || 1;
        this.canvas.width = maxWidth * scale;
        this.canvas.height = height * scale;

        // Сохраняем логические размеры для расчетов
        this.logicalWidth = maxWidth;
        this.logicalHeight = height;

        // Нормализуем систему координат
        this.ctx.scale(scale, scale);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    adjustBet(amount) {
        const newBet = Math.max(0.20, Math.min(100, this.currentBet + amount));
        this.currentBet = Number(newBet.toFixed(2));
        document.getElementById('currentBet').textContent = this.currentBet.toFixed(2);
        audio.playClickSound();
    }

    updateBonusDisplay() {
        const bonusDisplay = document.getElementById('bonusSpinsCount');
        const buyFreespinsBtn = document.getElementById('buyFreespinsBtn');

        if (this.bonusSpinsRemaining > 0) {
            bonusDisplay.textContent = `Free Spins: ${this.bonusSpinsRemaining}`;
            bonusDisplay.style.display = 'inline-block';
            bonusDisplay.classList.add('active-bonus');
            // Disable buy button during bonus round
            buyFreespinsBtn.disabled = true;
            buyFreespinsBtn.classList.add('disabled');
        } else {
            bonusDisplay.style.display = 'none';
            bonusDisplay.classList.remove('active-bonus');
            // Enable buy button when bonus round ends
            buyFreespinsBtn.disabled = false;
            buyFreespinsBtn.classList.remove('disabled');
        }
    }

    async spin(isRespin = false) {
        if (this.spinning) return;

        const credits = parseFloat(document.getElementById('creditDisplay').textContent);
        if (!this.bonusSpinsRemaining && !isRespin && credits < this.currentBet) {
            alert('Insufficient credits!');
            return;
        }

        this.spinning = true;
        document.getElementById('spinButton').disabled = true;
        audio.playSpinSound();

        try {
            await this.animateSpin();

            const formData = new FormData();
            formData.append('bet', this.currentBet);
            formData.append('is_respin', isRespin);

            const response = await fetch('/spin', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                alert(result.error);
                return;
            }

            this.reels = result.result;
            document.getElementById('creditDisplay').textContent = result.credits.toFixed(2);

            // Handle bonus spins award
            if (result.bonus_spins_awarded > 0) {
                await this.showBonusAnimation(result.bonus_spins_awarded);
                this.bonusSpinsRemaining = result.bonus_spins_remaining;
                this.wildPositions = result.wild_positions || [];
                this.updateBonusDisplay();
                audio.playBonusSound();
            }

            // Update bonus spins count
            if (this.bonusSpinsRemaining !== result.bonus_spins_remaining) {
                const previousBonusSpins = this.bonusSpinsRemaining;
                this.bonusSpinsRemaining = result.bonus_spins_remaining;
                this.updateBonusDisplay();

                // Show bonus results when free spins end
                if (previousBonusSpins > 0 && this.bonusSpinsRemaining === 0) {
                    await this.showBonusResults(result.bonus_total_win);
                }

                // Clear wild positions when bonus round ends
                if (this.bonusSpinsRemaining === 0) {
                    this.wildPositions = [];
                }
            }

            if (result.winnings > 0) {
                audio.playWinSound();
                await this.showWinAnimation(result.winnings, result.winning_lines);
            }

            this.updateStats(result.winnings);

            // Auto-trigger next free spin if available
            if (this.bonusSpinsRemaining > 0 && this.autoSpinning) {
                setTimeout(() => this.spin(), 1000);
            }

        } catch (error) {
            console.error('Error during spin:', error);
            alert('An error occurred during spin. Please try again.');
        } finally {
            audio.stopSpinSound();
            this.spinning = false;
            document.getElementById('spinButton').disabled = false;
            this.draw();
        }
    }

    async animateSpin() {
        const totalSteps = this.turboMode ? 10 : 20;
        const stepDelay = this.turboMode ? this.turboDelay : this.spinDelay;
        const reelDelay = 4;

        const reelStates = Array(5).fill().map(() => ({
            symbols: Array(6).fill().map(() => this.symbols[Math.floor(Math.random() * this.symbols.length)]),
            currentStep: 0
        }));

        const drawFrame = () => {
            this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

            const reelWidth = this.logicalWidth / 5;
            const symbolSize = reelWidth * 0.9;
            const horizontalPadding = (reelWidth - symbolSize) / 2;
            const verticalPadding = (this.logicalHeight - (symbolSize * 3)) / 4;

            // Draw static wilds first
            if (this.bonusSpinsRemaining > 0 && this.wildPositions.length > 0) {
                this.wildPositions.forEach(([row, col]) => {
                    const x = col * reelWidth + horizontalPadding;
                    const y = row * (symbolSize + verticalPadding) + verticalPadding;
                    this.drawSymbol('wild', x, y, symbolSize, true); // true indicates it's a static wild
                });
            }

            // Draw animated symbols
            reelStates.forEach((reel, reelIndex) => {
                for (let i = 0; i < 3; i++) {
                    // Skip if this position has a static wild
                    if (this.bonusSpinsRemaining > 0 &&
                        this.wildPositions.some(([row, col]) => row === i && col === reelIndex)) {
                        continue;
                    }

                    const symbolIndex = (reel.currentStep + i) % reel.symbols.length;
                    const symbol = reel.symbols[symbolIndex];

                    this.drawSymbol(
                        symbol,
                        reelIndex * reelWidth + horizontalPadding,
                        i * (symbolSize + verticalPadding) + verticalPadding,
                        symbolSize,
                        false
                    );
                }
            });
        };

        for (let step = 0; step < totalSteps; step++) {
            for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
                if (step < reelIndex * reelDelay) continue;

                const reel = reelStates[reelIndex];
                reel.currentStep = (reel.currentStep + 1) % reel.symbols.length;

                if (step % 2 === 0) {
                    reel.symbols.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
                    if (reel.symbols.length > 6) {
                        reel.symbols.shift();
                    }
                }
            }

            drawFrame();
            await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
    }

    showRespinAnimation() {
        const message = document.createElement('div');
        message.className = 'win-animation respin-message';
        message.textContent = 'RESPIN!';
        document.body.appendChild(message);
        return new Promise(resolve => setTimeout(() => {
            message.remove();
            resolve();
        }, 2000));
    }

    updateStats(winnings) {
        this.stats.totalSpins++;
        if (winnings > 0) {
            this.stats.totalWins++;
            this.stats.biggestWin = Math.max(this.stats.biggestWin, winnings);
        }
        this.stats.totalBet += this.currentBet;
        this.stats.totalWon += winnings;

        document.getElementById('totalSpins').textContent = this.stats.totalSpins;
        document.getElementById('winRate').textContent =
            `${((this.stats.totalWins / this.stats.totalSpins) * 100).toFixed(1)}%`;
        document.getElementById('biggestWin').textContent = this.stats.biggestWin.toFixed(2);
        document.getElementById('rtp').textContent =
            `${((this.stats.totalWon / this.stats.totalBet) * 100).toFixed(1)}%`;
    }

    async showWinAnimation(amount, winningLines = []) {
        this.animatingWin = true;
        this.winningLines = winningLines;

        const winDisplay = document.createElement('div');
        winDisplay.className = 'win-animation';
        winDisplay.textContent = `WIN! ${amount.toFixed(2)}`;
        document.body.appendChild(winDisplay);

        this.clearPaylines();

        for (const line of winningLines) {
            await this.animatePayline(line);
            await new Promise(resolve => setTimeout(resolve, 800));
            this.clearPaylines();
        }

        setTimeout(() => {
            winDisplay.remove();
            this.animatingWin = false;
        }, 2000);
    }

    async animatePayline(line) {
        const reelWidth = this.logicalWidth / 5;
        const symbolSize = reelWidth * 0.9;
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const verticalPadding = (this.logicalHeight - (symbolSize * 3)) / 4;

        const canvasRect = this.canvas.getBoundingClientRect();

        if (line.length >= 2) {
            const points = line.map(([row, col]) => ({
                x: col * reelWidth + horizontalPadding + symbolSize / 2 + canvasRect.left,
                y: row * (symbolSize + verticalPadding) + verticalPadding + symbolSize / 2 + canvasRect.top
            }));

            for (let i = 0; i < points.length - 1; i++) {
                const start = points[i];
                const end = points[i + 1];

                const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

                const payline = document.createElement('div');
                payline.className = 'payline';
                payline.style.width = `${length}px`;
                payline.style.left = `${start.x}px`;
                payline.style.top = `${start.y}px`;
                payline.style.transform = `rotate(${angle}deg)`;

                this.paylineContainer.appendChild(payline);
            }
        }

        for (const [row, col] of line) {
            const x = col * reelWidth + horizontalPadding + canvasRect.left;
            const y = row * (symbolSize + verticalPadding) + verticalPadding + canvasRect.top;

            const highlight = document.createElement('div');
            highlight.className = 'symbol-highlight';
            highlight.style.left = `${x}px`;
            highlight.style.top = `${y}px`;
            highlight.style.width = `${symbolSize}px`;
            highlight.style.height = `${symbolSize}px`;
            this.paylineContainer.appendChild(highlight);
        }

        audio.playWinSound();
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    clearPaylines() {
        if (this.paylineContainer) {
            this.paylineContainer.innerHTML = '';
        }
    }

    async showBonusAnimation(spinsAwarded) {
        const bonusMessage = document.createElement('div');
        bonusMessage.className = 'win-animation bonus-award';
        bonusMessage.innerHTML = `
            <div class="bonus-title">BONUS GAME!</div>
            <div class="spins-awarded">${spinsAwarded} FREE SPINS!</div>
        `;
        document.body.appendChild(bonusMessage);

        // Add celebration particles or effects here

        await new Promise(resolve => setTimeout(resolve, 2000));
        bonusMessage.remove();
    }

    async fetchStatistics() {
        try {
            const response = await fetch('/statistics');
            const stats = await response.json();

            document.getElementById('totalSpins').textContent = stats.total_spins;
            document.getElementById('winRate').textContent = `${stats.win_rate}%`;
            document.getElementById('biggestWin').textContent = stats.biggest_win.toFixed(2);
            document.getElementById('rtp').textContent = `${stats.rtp}%`;
            document.getElementById('totalBonusGames').textContent = stats.total_bonus_games;
            document.getElementById('totalWon').textContent = stats.total_won.toFixed(2);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    }

    async startAutoSpin() {
        if (this.spinning) return;

        this.autoSpinning = true;
        document.getElementById('autoSpinBtn').classList.add('active');

        while (this.autoSpinning) {
            const credits = parseFloat(document.getElementById('creditDisplay').textContent);

            if (this.stopBalance > 0 && credits <= this.stopBalance) {
                this.stopAutoSpin();
                alert('Auto spin stopped: Balance limit reached');
                break;
            }

            if (this.autoSpinCount > 0) {
                this.autoSpinCount--;
                if (this.autoSpinCount === 0) {
                    this.stopAutoSpin();
                }
            }

            await this.spin();

            if (this.autoSpinning && !this.spinning) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    stopAutoSpin() {
        this.autoSpinning = false;
        this.autoSpinCount = 0;
        document.getElementById('autoSpinBtn').classList.remove('active');
    }

    async buyFreespins() {
        const cost = this.currentBet * 10;
        const credits = parseFloat(document.getElementById('creditDisplay').textContent);

        if (credits < cost) {
            alert('Insufficient credits!');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('bet', this.currentBet);
            formData.append('buy_freespins', true);

            const response = await fetch('/buy_freespins', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                alert(result.error);
                return;
            }

            document.getElementById('creditDisplay').textContent = result.credits.toFixed(2);
            this.bonusSpinsRemaining = result.bonus_spins_remaining;
            this.updateBonusDisplay();
            this.showBonusAnimation(result.bonus_spins_awarded);

        } catch (error) {
            console.error('Error buying free spins:', error);
            alert('An error occurred while buying free spins');
        } finally {
            this.buyFreespinsModal.hide();
        }
    }
    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.textContent = 'SPIN';
            spinButton.addEventListener('click', () => this.spin());
        }

        document.getElementById('increaseBet').textContent = '+';
        document.getElementById('decreaseBet').textContent = '-';
        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(0.10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-0.10));
    }

    initializeNewEventListeners() {
        document.getElementById('turboSpinBtn').addEventListener('click', () => {
            this.turboMode = !this.turboMode;
            const btn = document.getElementById('turboSpinBtn');
            btn.classList.toggle('active');
            this.spinDelay = this.turboMode ? this.turboDelay : 50;
        });

        document.getElementById('autoSpinBtn').addEventListener('click', () => {
            if (this.autoSpinning) {
                this.stopAutoSpin();
            } else {
                this.autoSpinModal.show();
            }
        });

        document.getElementById('startAutoSpin').addEventListener('click', () => {
            const selectedCount = document.querySelector('input[name="autoSpinCount"]:checked');
            const stopBalance = document.getElementById('stopBalance').value;

            if (!selectedCount) {
                alert('Please select number of spins');
                return;
            }

            this.autoSpinCount = parseInt(selectedCount.value);
            this.stopBalance = parseFloat(stopBalance) || 0;
            this.autoSpinModal.hide();
            this.startAutoSpin();
        });

        document.getElementById('buyFreespinsBtn').addEventListener('click', () => {
            const cost = this.currentBet * 10;
            document.getElementById('freespinsCost').textContent = cost.toFixed(2);
            this.buyFreespinsModal.show();
        });

        document.getElementById('confirmBuyFreespins').addEventListener('click', () => {
            this.buyFreespins();
        });
    }

    async showBonusResults(totalWin) {
        const bonusResults = document.createElement('div');
        bonusResults.className = 'win-animation bonus-results';
        bonusResults.innerHTML = `
            <div class="bonus-results-title">Поздравляем!</div>
            <div class="bonus-results-text">Вы выиграли</div>
            <div class="bonus-results-win">${totalWin.toFixed(2)} FUNS</div>
            <div class="bonus-results-text">в 10 бесплатных спинах!</div>
        `;
        document.body.appendChild(bonusResults);

        // Play celebration sound
        audio.playBonusSound();

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 3000));
        bonusResults.remove();
    }
}

window.addEventListener('load', () => {
    if (typeof audio !== 'undefined') {
        audio.init();
    }
    const slot = new SlotMachine();

    // Prevent double-tap zoom on mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});