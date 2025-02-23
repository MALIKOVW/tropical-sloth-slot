class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Updated symbols list
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

        // Initialize
        this.resizeCanvas();
        this.draw();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.initializeEventListeners();
        this.updateBonusDisplay();
        this.fetchStatistics();
        setInterval(() => this.fetchStatistics(), 60000);
        this.winningLines = [];
        this.animatingWin = false;
        this.paylineContainer = document.createElement('div');
        this.paylineContainer.id = 'paylineContainer';
        document.querySelector('.game-container').appendChild(this.paylineContainer);
    }

    initializeEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.textContent = 'SPIN';  // Add text to button
            spinButton.addEventListener('click', () => this.spin());
        }

        document.getElementById('increaseBet').textContent = '+';
        document.getElementById('decreaseBet').textContent = '-';
        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(0.10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-0.10));
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

    drawSymbol(symbol, x, y, size) {
        // Background for symbol
        this.ctx.fillStyle = 'rgba(51, 51, 51, 0.2)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, size, size, 10);
        this.ctx.fill();

        // Symbol text with gradient
        this.ctx.save();
        const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);

        // Different colors for different symbol types
        if (this.lowSymbols.includes(symbol)) {
            gradient.addColorStop(0, '#4a90e2');
            gradient.addColorStop(1, '#2171cd');
        } else if (this.highSymbols.includes(symbol)) {
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#d35400');
        } else if (symbol === 'wild') {
            gradient.addColorStop(0, '#ff9f43');
            gradient.addColorStop(1, '#ff7f00');
        } else if (symbol === 'scatter') {
            gradient.addColorStop(0, '#95a5a6');
            gradient.addColorStop(1, '#7f8c8d');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.font = `bold ${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw symbol with outer glow
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(this.getSymbolDisplay(symbol), x + size/2, y + size/2);
        this.ctx.restore();

        // Add special effects for wild and scatter
        if (symbol === 'wild' || symbol === 'scatter') {
            this.ctx.save();
            this.ctx.strokeStyle = symbol === 'wild' ? '#ff9f43' : '#95a5a6';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
            this.ctx.restore();
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const reelWidth = this.canvas.width / 5;
        const symbolSize = reelWidth * 0.8;
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const verticalPadding = (this.canvas.height - (symbolSize * 3)) / 4;

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
        //loadedImages.forEach(([symbol, img]) => {
        //    this.symbolImages[symbol] = img;
        //});
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
        this.canvas.width = Math.min(800, containerWidth - 40);
        this.canvas.height = this.canvas.width * 0.75;
        this.draw();
    }

    adjustBet(amount) {
        const newBet = Math.max(0.20, Math.min(100, this.currentBet + amount));
        this.currentBet = Number(newBet.toFixed(2));
        document.getElementById('currentBet').textContent = this.currentBet.toFixed(2);
        audio.playClickSound();
    }

    updateBonusDisplay() {
        const bonusDisplay = document.getElementById('bonusSpinsCount');
        if (this.bonusSpinsRemaining > 0) {
            bonusDisplay.textContent = `Free Spins: ${this.bonusSpinsRemaining}`;
            bonusDisplay.style.display = 'inline-block';
        } else {
            bonusDisplay.style.display = 'none';
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

            if (result.bonus_spins_awarded > 0) {
                this.showBonusAnimation(result.bonus_spins_awarded);
                this.bonusSpinsRemaining = result.bonus_spins_remaining;
                this.wildPositions = result.wild_positions || [];
                this.updateBonusDisplay();
            }

            if (result.winnings > 0) {
                audio.playWinSound();
                await this.showWinAnimation(result.winnings, result.winning_lines);
            }

            this.updateStats(result.winnings);
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
        const totalSteps = 20;
        const stepDelay = 50;
        const reelDelay = 4;

        const reelStates = Array(5).fill().map(() => ({
            symbols: Array(6).fill().map(() => this.symbols[Math.floor(Math.random() * this.symbols.length)]),
            currentStep: 0
        }));

        const drawFrame = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const reelWidth = this.canvas.width / 5;
            const symbolSize = reelWidth * 0.8;
            const horizontalPadding = (reelWidth - symbolSize) / 2;
            const verticalPadding = (this.canvas.height - (symbolSize * 3)) / 4;

            reelStates.forEach((reel, reelIndex) => {
                for (let i = 0; i < 3; i++) {
                    const symbolIndex = (reel.currentStep + i) % reel.symbols.length;
                    const symbol = reel.symbols[symbolIndex];

                    this.drawSymbol(symbol, reelIndex * reelWidth + horizontalPadding, i * (symbolSize + verticalPadding) + verticalPadding, symbolSize);
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
        const reelWidth = this.canvas.width / 5;
        const symbolSize = reelWidth * 0.8;
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const verticalPadding = (this.canvas.height - (symbolSize * 3)) / 4;

        // Получаем позицию канваса для корректного позиционирования подсветки
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

        // Подсветка символов с учетом позиции канваса
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

    showBonusAnimation(spinsAwarded) {
        const bonusMessage = document.createElement('div');
        bonusMessage.className = 'win-animation bonus-award';
        bonusMessage.textContent = `${spinsAwarded} FREE SPINS!`;
        document.body.appendChild(bonusMessage);
        setTimeout(() => bonusMessage.remove(), 2000);
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
}

window.addEventListener('load', () => {
    if (typeof audio !== 'undefined') {
        audio.init();
    }
    const slot = new SlotMachine();
});