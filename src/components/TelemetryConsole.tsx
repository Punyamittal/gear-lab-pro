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
    <div className="h-28 border-t border-panel bg-console px-3 py-2 overflow-y-auto scanline">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-neon" />
        <span className="font-display text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
          Telemetry Console
        </span>
      </div>
      <div className="space-y-0.5">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`text-[11px] font-mono leading-tight ${
              log.includes('═══') ? 'neon-text-cyan font-bold' :
              log.includes('ERROR') ? 'text-neon-red' :
              log.includes('HAPTIC') ? 'text-neon-orange' :
              'text-muted-foreground'
            }`}
          >
            {log}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default TelemetryConsole;
