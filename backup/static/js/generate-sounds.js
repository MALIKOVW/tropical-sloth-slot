async function generateSpinSound() {
    const synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1
        }
    }).toDestination();

    // Generate spinning sound
    synth.triggerAttackRelease("C4", "8n");
    await Tone.context.rawContext.exportAsAudioData();
}

async function generateWinSound() {
    const synth = new Tone.PolySynth().toDestination();
    
    // Generate victory fanfare
    const notes = ["C4", "E4", "G4", "C5"];
    notes.forEach((note, i) => {
        synth.triggerAttackRelease(note, "8n", Tone.now() + i * 0.1);
    });
    await Tone.context.rawContext.exportAsAudioData();
}
