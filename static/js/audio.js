class SlotAudio {
    constructor() {
        this.synth = new Tone.Synth().toDestination();
        this.ready = false;
        this.effectsVolume = 0.5;

        // Initialize sounds using Tone.js synthesizers
        this.sounds = {
            spin: new Tone.Synth({
                oscillator: { type: "sawtooth" },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.1
                }
            }).toDestination(),

            win: new Tone.PolySynth({
                maxPolyphony: 4,
                voice: Tone.Synth,
                options: {
                    oscillator: { type: "triangle" },
                    envelope: {
                        attack: 0.01,
                        decay: 0.1,
                        sustain: 0.3,
                        release: 0.5
                    }
                }
            }).toDestination(),

            click: new Tone.Synth({
                oscillator: { type: "square" },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0,
                    release: 0.1
                }
            }).toDestination()
        };

        this.setupVolumeControl();
    }

    setupVolumeControl() {
        const effectsSlider = document.getElementById('soundEffectsVolume');
        if (effectsSlider) {
            effectsSlider.addEventListener('input', (e) => {
                this.setEffectsVolume(e.target.value / 100);
            });
        }
    }

    setEffectsVolume(volume) {
        this.effectsVolume = volume;
        Object.values(this.sounds).forEach(sound => {
            sound.volume.value = Tone.gainToDb(volume);
        });
    }

    async init() {
        try {
            await Tone.start();
            this.ready = true;
            console.log("Audio system initialized");
            this.setEffectsVolume(this.effectsVolume);
        } catch (error) {
            console.error("Error initializing audio:", error);
            this.ready = false;
        }
    }

    playSpinSound() {
        if (!this.ready) return;
        try {
            this.sounds.spin.triggerAttackRelease("C4", "32n", undefined, this.effectsVolume);
            setTimeout(() => {
                this.sounds.spin.triggerAttackRelease("G3", "32n", undefined, this.effectsVolume);
            }, 100);
        } catch (error) {
            console.warn("Could not play spin sound:", error);
        }
    }

    stopSpinSound() {
        if (!this.ready) return;
        try {
            this.sounds.spin.triggerRelease();
        } catch (error) {
            console.warn("Could not stop spin sound:", error);
        }
    }

    playWinSound() {
        if (!this.ready) return;
        try {
            const notes = ["C4", "E4", "G4", "C5"];
            notes.forEach((note, i) => {
                setTimeout(() => {
                    this.sounds.win.triggerAttackRelease(note, "8n", undefined, this.effectsVolume);
                }, i * 100);
            });
        } catch (error) {
            console.warn("Could not play win sound:", error);
        }
    }

    playClickSound() {
        if (!this.ready) return;
        try {
            this.sounds.click.triggerAttackRelease("C4", "32n", undefined, this.effectsVolume);
        } catch (error) {
            console.warn("Could not play click sound:", error);
        }
    }
}

// Create single instance
const audio = new SlotAudio();

// Handle audio context resume on user interaction
document.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') {
        try {
            await Tone.context.resume();
            await audio.init();
            console.log("Audio context resumed");
        } catch (error) {
            console.warn("Could not resume audio context:", error);
        }
    }
}, { once: true });