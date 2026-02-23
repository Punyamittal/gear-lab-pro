import { useRef, useEffect } from 'react';

interface TelemetryConsoleProps {
  logs: string[];
}

const TelemetryConsole = ({ logs }: TelemetryConsoleProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-32 border-t border-panel bg-console/80 backdrop-blur-md px-4 py-3 overflow-y-auto custom-scrollbar relative scanline">
      {/* Decorative side accent — red racing stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{
        background: 'repeating-linear-gradient(to bottom, hsl(0 85% 50%) 0px, hsl(0 85% 50%) 4px, transparent 4px, transparent 8px)'
      }} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-neon shadow-[0_0_8px_hsl(var(--neon-green))]" />
          <span className="font-display text-[10px] tracking-[0.2em] text-primary uppercase font-bold">
            🎧 Pit Wall Radio
          </span>
        </div>
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">
          🟢 Race Active
        </span>
      </div>

      <div className="space-y-1">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`text-[10px] font-mono leading-relaxed border-l border-panel/30 pl-3 ${log.includes('═══') ? 'neon-text-cyan font-bold py-1' :
              log.includes('ERROR') ? 'text-neon-red font-semibold' :
                log.includes('HAPTIC') ? 'text-neon-orange italic' :
                  'text-muted-foreground/80'
              }`}
          >
            <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            {log}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default TelemetryConsole;
