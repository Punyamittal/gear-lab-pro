/**
 * GearOpt X — Voice Command Pit Wall
 * Web Speech API for hands-free dashboard control.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface VoiceCommand {
    phrase: string;
    aliases: string[];
    action: () => void;
}

export function useVoiceControl(commands: VoiceCommand[]) {
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [supported, setSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognitionRef.current = recognition;
        }
    }, []);

    const startListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        recognition.onresult = (event: any) => {
            const last = event.results[event.results.length - 1];
            if (last.isFinal) {
                const transcript = last[0].transcript.toLowerCase().trim();
                setLastCommand(transcript);

                // Match against registered commands
                for (const cmd of commands) {
                    const allPhrases = [cmd.phrase, ...cmd.aliases].map(p => p.toLowerCase());
                    if (allPhrases.some(p => transcript.includes(p))) {
                        cmd.action();
                        break;
                    }
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.warn('[VOICE] Error:', event.error);

            if (event.error === 'not-allowed') {
                alert('Microphone access was denied. Please enable it in your browser settings to use voice commands.');
                setIsListening(false);
                recognitionRef.current = null; // Prevent auto-restart loops
            } else if (event.error !== 'no-speech') {
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Auto-restart if still supposed to be listening
            if (isListening) {
                try { recognition.start(); } catch (e) { }
            }
        };

        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.warn('[VOICE] Failed to start:', e);
        }
    }, [commands, isListening]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition) {
            try { recognition.stop(); } catch (e) { }
        }
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        lastCommand,
        supported,
        startListening,
        stopListening,
        toggleListening,
    };
}
