/**
 * GearOpt X — Haptic Feedback Module
 * Uses the Gamepad API to deliver vibration patterns
 * that correspond to real-time G-forces and shift events.
 */

export class HapticEngine {
    private gamepadIndex: number | null = null;
    private pollInterval: number | null = null;
    private isActive = false;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
                this.gamepadIndex = e.gamepad.index;
                this.isActive = true;
                console.log(`[HAPTIC] Gamepad connected: ${e.gamepad.id}`);
            });

            window.addEventListener('gamepaddisconnected', () => {
                this.gamepadIndex = null;
                this.isActive = false;
                console.log('[HAPTIC] Gamepad disconnected');
            });
        }
    }

    private getGamepad(): Gamepad | null {
        if (this.gamepadIndex === null) return null;
        const gamepads = navigator.getGamepads();
        return gamepads[this.gamepadIndex] || null;
    }

    /**
     * Vibrate proportional to G-force (0-2G range)
     */
    pulseForG(gForce: number) {
        const gamepad = this.getGamepad();
        if (!gamepad || !('vibrationActuator' in gamepad)) return;

        const intensity = Math.min(1, Math.max(0, gForce / 2));
        const duration = 50;

        try {
            (gamepad as any).vibrationActuator?.playEffect('dual-rumble', {
                startDelay: 0,
                duration,
                weakMagnitude: intensity * 0.5,
                strongMagnitude: intensity,
            });
        } catch (e) {
            // Silently fail if vibration not supported
        }
    }

    /**
     * Sharp shift vibration pattern
     */
    shiftPulse() {
        const gamepad = this.getGamepad();
        if (!gamepad || !('vibrationActuator' in gamepad)) return;

        try {
            (gamepad as any).vibrationActuator?.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 80,
                weakMagnitude: 1.0,
                strongMagnitude: 0.8,
            });
        } catch (e) { }
    }

    /**
     * Sustained rumble for braking zones
     */
    brakeRumble(intensity: number) {
        const gamepad = this.getGamepad();
        if (!gamepad || !('vibrationActuator' in gamepad)) return;

        try {
            (gamepad as any).vibrationActuator?.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 100,
                weakMagnitude: intensity * 0.3,
                strongMagnitude: intensity * 0.6,
            });
        } catch (e) { }
    }

    get connected() { return this.isActive; }

    destroy() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        this.isActive = false;
    }
}

// Singleton
export const hapticEngine = new HapticEngine();
