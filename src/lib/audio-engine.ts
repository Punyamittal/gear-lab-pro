/**
 * GearOpt X — Engine Audio Synthesis Module
 * Pure Web Audio API — no audio files required.
 * Synthesizes a realistic engine note from oscillators + harmonics.
 */

export class EngineAudioSynth {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private oscillators: OscillatorNode[] = [];
    private gains: GainNode[] = [];
    private noiseGain: GainNode | null = null;
    private noiseSource: AudioBufferSourceNode | null = null;
    private isRunning = false;
    private isMuted = false;

    // Harmonic structure for a 4-cyl engine
    private readonly harmonics = [1, 2, 3, 4, 6, 8];
    private readonly harmonicGains = [0.5, 0.3, 0.15, 0.1, 0.05, 0.02];

    constructor() { }

    async start() {
        if (this.isRunning && this.ctx?.state === 'running') return;

        try {
            if (!this.ctx) {
                this.ctx = new AudioContext();
            }

            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            if (this.isRunning) return; // Already initialized nodes
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : 0.08; // Start quiet or muted
            this.masterGain.connect(this.ctx.destination);

            // Create harmonic oscillators
            this.harmonics.forEach((harmonic, i) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();

                osc.type = i < 2 ? 'sawtooth' : 'square';
                osc.frequency.value = 80 * harmonic; // Base ~80Hz for idle
                gain.gain.value = this.harmonicGains[i];

                osc.connect(gain);
                gain.connect(this.masterGain!);
                osc.start();

                this.oscillators.push(osc);
                this.gains.push(gain);
            });

            // Mechanical noise layer (filtered white noise)
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            this.noiseSource = this.ctx.createBufferSource();
            this.noiseSource.buffer = noiseBuffer;
            this.noiseSource.loop = true;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 800;
            bandpass.Q.value = 2;

            this.noiseGain = this.ctx.createGain();
            this.noiseGain.gain.value = 0.02;

            this.noiseSource.connect(bandpass);
            bandpass.connect(this.noiseGain);
            this.noiseGain.connect(this.masterGain);
            this.noiseSource.start();

            this.isRunning = true;
        } catch (e) {
            console.warn('Audio engine failed to initialize:', e);
        }
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.08, now, 0.05);
        }
    }

    /**
     * Update engine sound based on RPM and throttle position
     */
    setRPM(rpm: number, throttle: number = 100) {
        if (!this.isRunning || !this.ctx) return;

        const now = this.ctx.currentTime;
        const baseFreq = (rpm / 60) * 2; // 2-stroke firing freq equivalent for sound

        // Update each harmonic frequency
        this.oscillators.forEach((osc, i) => {
            const targetFreq = Math.max(20, baseFreq * this.harmonics[i]);
            osc.frequency.setTargetAtTime(targetFreq, now, 0.03);
        });

        // Throttle affects volume + noise
        const throttleNorm = Math.max(0, Math.min(1, throttle / 100));
        const volume = this.isMuted ? 0 : (0.03 + throttleNorm * 0.12);
        this.masterGain!.gain.setTargetAtTime(volume, now, 0.05);

        // Higher RPM = more mechanical noise
        const rpmNorm = Math.max(0, Math.min(1, (rpm - 2000) / 7000));
        if (this.noiseGain) {
            this.noiseGain.gain.setTargetAtTime(0.01 + rpmNorm * 0.04, now, 0.05);
        }

        // Adjust harmonic balance at high RPM (more aggressive)
        this.gains.forEach((gain, i) => {
            const highRpmBoost = i < 3 ? 1 + rpmNorm * 0.3 : 1 - rpmNorm * 0.2;
            gain.gain.setTargetAtTime(this.harmonicGains[i] * highRpmBoost, now, 0.05);
        });
    }

    /**
     * Trigger a gear shift sound — sharp percussive crack
     */
    triggerShift() {
        if (!this.isRunning || !this.ctx) return;

        const now = this.ctx.currentTime;

        // Brief volume dip (lift-off simulation)
        this.masterGain!.gain.setTargetAtTime(0.01, now, 0.01);
        this.masterGain!.gain.setTargetAtTime(0.1, now + 0.08, 0.03);

        // Click/crack sound
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.value = 150;
        clickGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        clickOsc.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.06);
    }

    /**
     * Trigger a redline warning beep
     */
    triggerRedline() {
        if (!this.isRunning || !this.ctx) return;

        const now = this.ctx.currentTime;
        const beep = this.ctx.createOscillator();
        const beepGain = this.ctx.createGain();
        beep.type = 'sine';
        beep.frequency.value = 2000;
        beepGain.gain.setValueAtTime(this.isMuted ? 0 : 0.06, now);
        beepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        beep.connect(beepGain);
        beepGain.connect(this.ctx.destination);
        beep.start(now);
        beep.stop(now + 0.1);
    }

    stop() {
        if (!this.isRunning) return;

        this.oscillators.forEach(osc => { try { osc.stop(); } catch (e) { } });
        try { this.noiseSource?.stop(); } catch (e) { }
        try { this.ctx?.close(); } catch (e) { }

        this.oscillators = [];
        this.gains = [];
        this.noiseSource = null;
        this.noiseGain = null;
        this.masterGain = null;
        this.ctx = null;
        this.isRunning = false;
    }

    get active() { return this.isRunning; }
}

// Singleton
export const engineAudio = new EngineAudioSynth();
