/**
 * GearOpt X — Session History Panel Component
 * Displays telemetry run history from IndexedDB
 * with mini sparklines and delta comparisons.
 */

import { useState, useEffect } from 'react';
import { getRecentSessions, clearHistory, formatSessionTime, type SessionRecord } from '@/lib/session-history';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Trash2, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SessionHistoryPanel = () => {
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [expanded, setExpanded] = useState(false);

    const loadSessions = async () => {
        try {
            const data = await getRecentSessions(30);
            setSessions(data.reverse()); // Most recent first
        } catch (e) {
            console.warn('Failed to load sessions:', e);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        const interval = setInterval(loadSessions, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleClear = async () => {
        await clearHistory();
        setSessions([]);
    };

    const getDelta = (current: number, previous: number) => {
        if (previous === 0 || current === 0) return null;
        return current - previous;
    };

    const displaySessions = expanded ? sessions : sessions.slice(0, 5);

    return (
        <div className="glass-panel p-4 rounded-xl border border-panel/50">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    <h3 className="font-display text-[10px] tracking-[0.3em] text-primary uppercase font-bold">
                        Session History
                    </h3>
                </div>
                {sessions.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="text-[8px] font-mono text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 uppercase"
                    >
                        <Trash2 size={10} /> Clear
                    </button>
                )}
            </div>

            {sessions.length === 0 ? (
                <p className="text-[9px] font-mono text-muted-foreground text-center py-4 opacity-60">
                    No runs recorded yet. Run a simulation to start tracking.
                </p>
            ) : (
                <div className="space-y-1.5">
                    {displaySessions.map((session, i) => {
                        const prev = i < sessions.length - 1 ? sessions[i + 1] : null;
                        const delta = prev ? getDelta(session.accelTime, prev.accelTime) : null;

                        return (
                            <div
                                key={session.id}
                                className="flex items-center justify-between text-[9px] font-mono py-1.5 px-2 rounded bg-background/30 border border-panel/30 hover:border-primary/30 transition-all group overflow-hidden"
                            >
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="flex flex-col w-12 shrink-0">
                                        <span className="text-muted-foreground opacity-50 text-[8px] leading-tight">
                                            {formatSessionTime(session.timestamp).split(' ')[0]}
                                        </span>
                                        <span className="text-[7px] text-muted-foreground opacity-30 uppercase leading-none font-black -mt-0.5">
                                            {formatSessionTime(session.timestamp).split(' ')[1] || 'PM'}
                                        </span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] uppercase font-bold tracking-wider shrink-0 ${session.optimizer === 'quantum' ? 'bg-purple-500/10 text-purple-300' :
                                        session.optimizer === 'swarm' ? 'bg-orange-500/10 text-orange-300' :
                                            session.optimizer === 'genetic' ? 'bg-green-500/10 text-green-300' :
                                                session.optimizer === 'classical' ? 'bg-cyan-500/10 text-cyan-300' :
                                                    'bg-slate-500/10 text-slate-300'
                                        }`}>
                                        {session.optimizer.slice(0, 4)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 ml-2 flex-1 justify-end min-w-0">
                                    <span className="text-cyan-300 font-bold shrink-0">
                                        {session.accelTime > 0 ? `${session.accelTime.toFixed(3)}s` : '—'}
                                    </span>

                                    {/* Mini sparkline delta */}
                                    {delta !== null && (
                                        <span className={`flex items-center gap-0.5 text-[8px] shrink-0 ${delta < -0.001 ? 'text-green-400' :
                                            delta > 0.001 ? 'text-red-400' :
                                                'text-muted-foreground'
                                            }`}>
                                            {delta < -0.001 ? <TrendingDown size={8} /> :
                                                delta > 0.001 ? <TrendingUp size={8} /> :
                                                    <Minus size={8} />}
                                            {Math.abs(delta).toFixed(3)}
                                        </span>
                                    )}

                                    {/* Mini bar representing velocity */}
                                    <div className="w-14 h-1 bg-background/50 rounded-full overflow-hidden shrink-0 border border-white/5">
                                        <div
                                            className="h-full rounded-full bg-primary/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                                            style={{ width: `${Math.min(100, (session.peakVelocity / 280) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>


                        );
                    })}
                </div>
            )}

            {sessions.length > 5 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-2 text-[8px] font-mono text-primary/60 hover:text-primary uppercase tracking-widest text-center transition-colors"
                >
                    {expanded ? 'Show Less' : `Show All (${sessions.length})`}
                </button>
            )}
        </div>
    );
};

export default SessionHistoryPanel;
