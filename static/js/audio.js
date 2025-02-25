class SlotAudio {
    constructor() {
        this.synth = new Tone.Synth().toDestination();
        this.ready = false;

        // Initialize sounds using Tone.js synthesizers instead of audio files
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
    }

    async init() {
        try {
            await Tone.start();
            this.ready = true;
            console.log("Audio system initialized");
        } catch (error) {
            console.error("Error initializing audio:", error);
            this.ready = false;
        }
    }

    playSpinSound() {
        if (!this.ready) return;
        try {
            // Play a repeating sequence for spin sound
            this.sounds.spin.triggerAttackRelease("C4", "32n", undefined, 0.3);
            setTimeout(() => {
                this.sounds.spin.triggerAttackRelease("G3", "32n", undefined, 0.3);
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
            // Play victory arpeggio
            const notes = ["C4", "E4", "G4", "C5"];
            notes.forEach((note, i) => {
                setTimeout(() => {
                    this.sounds.win.triggerAttackRelease(note, "8n", undefined, 0.5);
                }, i * 100);
            });
        } catch (error) {
            console.warn("Could not play win sound:", error);
        }
    }

    playClickSound() {
        if (!this.ready) return;
        try {
            this.sounds.click.triggerAttackRelease("C4", "32n", undefined, 0.5);
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