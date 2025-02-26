class SlotAudio {
    constructor() {
        // Create effects
        this.reverb = new Tone.Reverb(1.5).toDestination();
        this.delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
        this.effectsVolume = 0.5;

        // Initialize sounds using more sophisticated Tone.js synthesizers
        this.sounds = {
            spin: new Tone.Synth({
                oscillator: { type: "sine8" },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 0.8
                }
            }).connect(this.reverb),

            spinReel: new Tone.NoiseSynth({
                noise: { type: "brown" },
                envelope: {
                    attack: 0.1,
                    decay: 0.3,
                    sustain: 0.8,
                    release: 0.4
                }
            }).connect(this.reverb),

            reelStop: new Tone.MetalSynth({
                frequency: 150,
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    release: 0.2
                },
                harmonicity: 3.1,
                modulationIndex: 16,
                resonance: 2000,
                octaves: 1.2
            }).connect(this.reverb),

            win: new Tone.PolySynth({
                maxPolyphony: 6,
                voice: Tone.Synth,
                options: {
                    oscillator: { type: "triangle8" },
                    envelope: {
                        attack: 0.02,
                        decay: 0.3,
                        sustain: 0.4,
                        release: 1
                    }
                }
            }).connect(this.delay),

            click: new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 2,
                oscillator: { type: "sine" },
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0,
                    release: 0.2,
                    attackCurve: "exponential"
                }
            }).connect(this.reverb)
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
        this.reverb.wet.value = volume;
        this.delay.wet.value = volume * 0.5;
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
            // Keep original spin button sound
            this.sounds.spin.triggerAttackRelease("C5", "16n", undefined, this.effectsVolume);
            // Add continuous spinning sound
            this.sounds.spinReel.triggerAttack(undefined, this.effectsVolume * 0.4);
        } catch (error) {
            console.warn("Could not play spin sound:", error);
        }
    }

    stopSpinSound() {
        if (!this.ready) return;
        try {
            // Gradually release the spinning sound
            this.sounds.spinReel.triggerRelease();
        } catch (error) {
            console.warn("Could not stop spin sound:", error);
        }
    }

    playWinSound() {
        if (!this.ready) return;
        try {
            // Create a more celebratory win sound with ascending notes
            const notes = ["C4", "E4", "G4", "C5", "E5", "G5"];
            const times = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

            notes.forEach((note, i) => {
                setTimeout(() => {
                    this.sounds.win.triggerAttackRelease(note, "8n", undefined, 
                        this.effectsVolume * (0.5 + i * 0.1));
                }, times[i] * 1000);
            });
        } catch (error) {
            console.warn("Could not play win sound:", error);
        }
    }

    playClickSound() {
        if (!this.ready) return;
        try {
            // Keep the original click sound
            this.sounds.click.triggerAttackRelease("G2", "32n", undefined, this.effectsVolume * 0.7);
        } catch (error) {
            console.warn("Could not play click sound:", error);
        }
    }

    playReelStopSound() {
        if (!this.ready) return;
        try {
            // Play a more mechanical reel stop sound
            this.sounds.reelStop.triggerAttackRelease("16n", undefined, this.effectsVolume * 0.5);
        } catch (error) {
            console.warn("Could not play reel stop sound:", error);
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