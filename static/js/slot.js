class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.symbols = ['dog', 'house', 'bone', 'collar', 'paw'];
        this.reels = Array(5).fill().map(() => Array(3).fill('dog'));
        this.spinning = false;
        this.currentBet = 10;
        this.bonusSpinsRemaining = 0;
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

    async spin() {
        if (this.spinning) return;

        const credits = parseInt(document.getElementById('creditDisplay').textContent);
        if (!this.bonusSpinsRemaining && credits < this.currentBet) {
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

            if (result.bonus_spins_awarded > 0) {
                this.showBonusAnimation(result.bonus_spins_awarded);
                this.bonusSpinsRemaining = result.bonus_spins_remaining;
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

    async animateSpin() {
        const frames = 30;
        const duration = 2000;
        const frameTime = duration / frames;

        for (let i = 0; i < frames; i++) {
            this.reels = Array(5).fill().map(() => 
                Array(3).fill().map(() => this.symbols[Math.floor(Math.random() * this.symbols.length)])
            );
            this.draw();
            await new Promise(resolve => setTimeout(resolve, frameTime));
        }
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
                this.ctx.fillRect(x, y, symbolSize, symbolSize);

                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${symbolSize * 0.6}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                const symbol = this.reels[i] && this.reels[i][j] ? this.reels[i][j] : this.symbols[0];
                this.ctx.fillText(
                    this.getSymbolEmoji(symbol),
                    x + symbolSize/2,
                    y + symbolSize/2
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
            'paw': '🐾'
        };
        return emojiMap[symbol] || symbol;
    }
}

window.addEventListener('load', () => {
    audio.init();
    const slot = new SlotMachine();
});