class BackgroundMusic {
    constructor() {
        this.audio = new Audio('/static/audio/background-music.mp3');
        this.audio.loop = true; // Включаем бесконечное воспроизведение
        this.initialized = false;
    }

    init() {
        // Инициализация при первом взаимодействии пользователя
        if (!this.initialized) {
            document.addEventListener('click', () => {
                this.play();
            }, { once: true });
            this.initialized = true;
        }
    }

    play() {
        this.audio.play().catch(error => {
            console.error('Error playing background music:', error);
        });
    }

    pause() {
        this.audio.pause();
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }
}

// Создаем и экспортируем один экземпляр
const backgroundMusic = new BackgroundMusic();
backgroundMusic.init();
