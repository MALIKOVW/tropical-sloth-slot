class BackgroundMusic {
    constructor() {
        console.log('Initializing background music');
        this.audio = new Audio('/static/audio/background-music.mp3');
        this.audio.loop = true;
        this.initialized = false;
        this.isMuted = false;
        this.setupControls();

        // Add event listeners for audio loading
        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio file loaded successfully');
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Error loading audio file:', e);
        });
    }

    setupControls() {
        // Setup settings button
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                try {
                    const settingsModal = document.getElementById('settingsModal');
                    const modal = new bootstrap.Modal(settingsModal);
                    modal.show();

                    // Add hidden event listener to clean up modal
                    settingsModal.addEventListener('hidden.bs.modal', () => {
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                    });
                } catch (error) {
                    console.error('Error showing settings modal:', error);
                }
            });
        }

        // Setup volume sliders
        const backgroundSlider = document.getElementById('backgroundMusicVolume');
        if (backgroundSlider) {
            backgroundSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
        }

        // Setup mute button
        const soundButton = document.getElementById('toggleSound');
        if (soundButton) {
            soundButton.addEventListener('click', () => {
                this.toggleSound();
            });
        } else {
            console.warn('Sound control button not found');
        }
    }

    toggleSound() {
        const soundButton = document.getElementById('toggleSound');
        if (this.isMuted) {
            this.audio.volume = document.getElementById('backgroundMusicVolume').value / 100;
            if (soundButton) {
                soundButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        } else {
            this.audio.volume = 0;
            if (soundButton) {
                soundButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            }
        }
        this.isMuted = !this.isMuted;
    }

    init() {
        if (!this.initialized) {
            document.addEventListener('click', () => {
                console.log('First user interaction, starting music');
                this.play();
            }, { once: true });
            this.initialized = true;
        }
    }

    play() {
        console.log('Attempting to play background music');
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

// Create and initialize instance
window.addEventListener('load', () => {
    console.log('Page loaded, initializing background music');
    const backgroundMusic = new BackgroundMusic();
    backgroundMusic.init();
    // Set initial volume to 50%
    backgroundMusic.setVolume(0.5);
});