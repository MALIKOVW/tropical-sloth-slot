class SlotAudio {
    constructor() {
        this.synth = new Tone.Synth().toDestination();
        this.ready = false;
        
        // Initialize sounds
        this.sounds = {
            spin: new Tone.Player({
                url: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==",
                loop: true
            }).toDestination(),
            
            win: new Tone.Player({
                url: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==",
                loop: false
            }).toDestination(),
            
            click: new Tone.Player({
                url: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==",
                loop: false
            }).toDestination()
        };
    }

    async init() {
        await Tone.start();
        this.ready = true;
    }

    playSpinSound() {
        if (!this.ready) return;
        this.sounds.spin.start();
    }

    stopSpinSound() {
        if (!this.ready) return;
        this.sounds.spin.stop();
    }

    playWinSound() {
        if (!this.ready) return;
        this.sounds.win.start();
    }

    playClickSound() {
        if (!this.ready) return;
        this.sounds.click.start();
    }
}

const audio = new SlotAudio();
