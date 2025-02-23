class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.symbols = ['dog', 'house', 'bone', 'collar', 'paw', 'wild'];
        this.reels = Array(5).fill().map(() => Array(3).fill('dog'));
        this.spinning = false;
        this.currentBet = 10;
        this.bonusSpinsRemaining = 0;
        this.wildPositions = [];
        this.stats = {
            totalSpins: 0,
            totalWins: 0,
            biggestWin: 0,
            totalBet: 0,
            totalWon: 0
        };

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.initializeEventListeners();
        this.updateBonusDisplay();
        this.draw();
        this.fetchStatistics();
        setInterval(() => this.fetchStatistics(), 60000);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        this.canvas.width = Math.min(800, containerWidth - 40);
        this.canvas.height = this.canvas.width * 0.75;
        this.draw();
    }

    initializeEventListeners() {
        document.getElementById('spinButton').addEventListener('click', () => this.spin());
        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(10));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-10));
    }

    adjustBet(amount) {
        const newBet = Math.max(10, Math.min(100, this.currentBet + amount));
        this.currentBet = newBet;
        document.getElementById('currentBet').textContent = newBet;
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

        const credits = parseInt(document.getElementById('creditDisplay').textContent);
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

            if (Array.isArray(result.result) && result.result.length === 3) {
                this.reels = Array(5).fill().map((_, i) =>
                    result.result.map(row => row[i] || this.symbols[0])
                );
            } else {
                console.error('Invalid result format:', result.result);
                this.reels = Array(5).fill().map(() => Array(3).fill(this.symbols[0]));
            }

            document.getElementById('creditDisplay').textContent = result.credits;

            if (result.needs_respin) {
                await this.showRespinAnimation();
                await this.spin(true);
            }

            if (result.bonus_spins_awarded > 0) {
                this.showBonusAnimation(result.bonus_spins_awarded);
                this.bonusSpinsRemaining = result.bonus_spins_remaining;
                this.wildPositions = result.wild_positions || [];
                this.updateBonusDisplay();
            }

            if (result.winnings > 0) {
                audio.playWinSound();
                this.showWinAnimation(result.winnings);
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

    async showRespinAnimation() {
        const message = document.createElement('div');
        message.className = 'win-animation respin-message';
        message.textContent = 'RESPIN!';
        document.body.appendChild(message);
        await new Promise(resolve => setTimeout(resolve, 2000));
        message.remove();
    }

    async animateSpin() {
        const frames = 30;
        const duration = 2000; // Total duration in ms
        const frameTime = duration / frames;
        const reelStopDelay = 200; // Delay between each reel stopping

        // Create temporary canvas for symbol blur effect
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Animation state for each reel
        const reelStates = Array(5).fill().map(() => ({
            symbols: [],
            offset: 0,
            speed: 30,
            stopping: false
        }));

        // Initialize symbols for each reel
        reelStates.forEach(state => {
            state.symbols = Array(10).fill().map(() =>
                this.symbols[Math.floor(Math.random() * this.symbols.length)]
            );
        });

        const easeOutBack = (x) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        };

        // Animation loop
        const startTime = Date.now();
        const animate = async () => {
            const currentTime = Date.now() - startTime;
            const progress = Math.min(currentTime / duration, 1);

            // Clear both canvases
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Update and draw each reel
            reelStates.forEach((state, reelIndex) => {
                const reelWidth = this.canvas.width / 5;
                const symbolSize = reelWidth * 0.8;
                const horizontalPadding = (reelWidth - symbolSize) / 2;
                const verticalPadding = (this.canvas.height - (symbolSize * 3)) / 4; // Accessing verticalPadding

                // Calculate reel-specific progress
                const reelDelay = reelIndex * reelStopDelay;
                const reelProgress = Math.max(0, Math.min(1, (currentTime - reelDelay) / (duration - reelDelay * 4)));

                // Update offset based on progress
                if (reelProgress < 1) {
                    state.offset += state.speed;
                    state.offset %= symbolSize * state.symbols.length;
                } else {
                    const finalOffset = easeOutBack(Math.min(1, (currentTime - (duration - reelDelay * 4)) / 300));
                    state.offset = finalOffset * symbolSize;
                }

                // Draw symbols with blur effect during high-speed spinning
                const blur = reelProgress < 0.8 ? 2 : 0;
                if (blur > 0) {
                    tempCtx.filter = `blur(${blur}px)`;
                }

                // Draw symbols
                for (let i = -1; i < 4; i++) {
                    const y = i * symbolSize + state.offset;
                    const symbolIndex = Math.floor(((state.symbols.length - i) + Math.floor(state.offset / symbolSize)) % state.symbols.length);
                    const symbol = state.symbols[symbolIndex];

                    const ctx = blur > 0 ? tempCtx : this.ctx;
                    ctx.fillStyle = '#444';
                    ctx.fillRect(
                        reelIndex * reelWidth + horizontalPadding,
                        y + verticalPadding,
                        symbolSize,
                        symbolSize
                    );

                    ctx.fillStyle = '#fff';
                    ctx.font = `${symbolSize * 0.6}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        this.getSymbolEmoji(symbol),
                        reelIndex * reelWidth + horizontalPadding + symbolSize / 2,
                        y + verticalPadding + symbolSize / 2
                    );
                }

                // Apply blur effect to main canvas
                if (blur > 0) {
                    this.ctx.drawImage(tempCanvas, 0, 0);
                }
            });

            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        // Start animation loop
        await new Promise(resolve => {
            animate();
            setTimeout(resolve, duration);
        });
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
        document.getElementById('biggestWin').textContent = this.stats.biggestWin;
        document.getElementById('rtp').textContent =
            `${((this.stats.totalWon / this.stats.totalBet) * 100).toFixed(1)}%`;
    }

    showWinAnimation(amount) {
        const winDisplay = document.createElement('div');
        winDisplay.className = 'win-animation';
        winDisplay.textContent = `WIN! ${amount}`;
        document.body.appendChild(winDisplay);
        setTimeout(() => winDisplay.remove(), 2000);
    }

    showBonusAnimation(spinsAwarded) {
        const bonusMessage = document.createElement('div');
        bonusMessage.className = 'win-animation bonus-award';
        bonusMessage.textContent = `${spinsAwarded} FREE SPINS!`;
        document.body.appendChild(bonusMessage);
        setTimeout(() => bonusMessage.remove(), 2000);
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const reelWidth = this.canvas.width / 5;
        const symbolSize = reelWidth * 0.8;
        const horizontalPadding = (reelWidth - symbolSize) / 2;
        const verticalPadding = (this.canvas.height - (symbolSize * 3)) / 4;

        for (let i = 0; i < this.reels.length; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * reelWidth + horizontalPadding;
                const y = j * (symbolSize + verticalPadding) + verticalPadding;

                this.ctx.fillStyle = '#444';
                if (this.bonusSpinsRemaining > 0 && this.wildPositions.some(pos => pos[0] === j && pos[1] === i)) {
                    this.ctx.fillStyle = '#664400';
                }
                this.ctx.fillRect(x, y, symbolSize, symbolSize);

                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${symbolSize * 0.6}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                const symbol = this.reels[i] && this.reels[i][j] ? this.reels[i][j] : this.symbols[0];
                this.ctx.fillText(
                    this.getSymbolEmoji(symbol),
                    x + symbolSize / 2,
                    y + symbolSize / 2
                );
            }
        }
    }

    getSymbolEmoji(symbol) {
        const emojiMap = {
            'dog': '🐕',
            'house': '🏠',
            'bone': '🦴',
            'collar': '📿',
            'paw': '🐾',
            'wild': '⭐'
        };
        return emojiMap[symbol] || symbol;
    }

    async fetchStatistics() {
        try {
            const response = await fetch('/statistics');
            const stats = await response.json();

            document.getElementById('totalSpins').textContent = stats.total_spins;
            document.getElementById('winRate').textContent = `${stats.win_rate}%`;
            document.getElementById('biggestWin').textContent = stats.biggest_win;
            document.getElementById('rtp').textContent = `${stats.rtp}%`;
            document.getElementById('totalBonusGames').textContent = stats.total_bonus_games;
            document.getElementById('totalWon').textContent = stats.total_won;
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    }
}

window.addEventListener('load', () => {
    audio.init();
    const slot = new SlotMachine();
});