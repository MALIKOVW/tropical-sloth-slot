class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.symbols = ['dog', 'house', 'bone', 'collar', 'paw'];
        this.reels = Array(5).fill().map(() => Array(3).fill('dog'));
        this.spinning = false;
        this.currentBet = 10;
        this.stats = {
            totalSpins: 0,
            totalWins: 0,
            biggestWin: 0,
            totalBet: 0,
            totalWon: 0
        };

        this.initializeEventListeners();
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

    async spin() {
        if (this.spinning) return;

        const credits = parseInt(document.getElementById('creditDisplay').textContent);
        if (credits < this.currentBet) {
            alert('Insufficient credits!');
            return;
        }

        this.spinning = true;
        document.getElementById('spinButton').disabled = true;
        audio.playSpinSound();

        try {
            // Animate spinning
            await this.animateSpin();

            // Create form data
            const formData = new FormData();
            formData.append('bet', this.currentBet);

            // Make server request
            const response = await fetch('/spin', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                alert(result.error);
                this.spinning = false;
                document.getElementById('spinButton').disabled = false;
                return;
            }

            // Update display
            this.reels = result.result;
            document.getElementById('creditDisplay').textContent = result.credits;

            // Update statistics
            this.updateStats(result.winnings);

            if (result.winnings > 0) {
                audio.playWinSound();
                this.showWinAnimation(result.winnings);
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
        const frames = 30;
        const duration = 2000; // 2 seconds
        const frameTime = duration / frames;

        for (let i = 0; i < frames; i++) {
            this.reels = this.reels.map(reel => 
                reel.map(() => this.symbols[Math.floor(Math.random() * this.symbols.length)])
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

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const symbolSize = this.canvas.width / 6;
        const padding = symbolSize / 4;

        for (let i = 0; i < this.reels.length; i++) {
            for (let j = 0; j < this.reels[i].length; j++) {
                const x = i * (symbolSize + padding) + padding;
                const y = j * (symbolSize + padding) + padding;

                // Draw symbol background
                this.ctx.fillStyle = '#444';
                this.ctx.fillRect(x, y, symbolSize, symbolSize);

                // Draw symbol
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${symbolSize/2}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    this.getSymbolEmoji(this.reels[i][j]),
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

// Initialize the slot machine when the page loads
window.addEventListener('load', () => {
    audio.init();
    const slot = new SlotMachine();
});