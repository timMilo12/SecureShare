import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: number;
  className?: string;
}

export function CountdownTimer({ expiresAt, className = "" }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining("Expired");
        setPercentage(0);
        return;
      }

      const totalDuration = 24 * 60 * 60 * 1000;
      const elapsed = totalDuration - remaining;
      const pct = Math.max(0, ((totalDuration - elapsed) / totalDuration) * 100);
      setPercentage(pct);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const warningThreshold = 2 * 60 * 60 * 1000;
  const showWarning = !isExpired && (expiresAt - Date.now()) < warningThreshold;

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="countdown-timer">
      <Clock className={`h-4 w-4 ${isExpired ? 'text-destructive' : showWarning ? 'text-amber-500' : 'text-muted-foreground'}`} />
      <span className={`text-sm font-medium font-mono ${isExpired ? 'text-destructive' : showWarning ? 'text-amber-500' : 'text-foreground'}`}>
        {isExpired ? 'Expired' : `Expires in: ${timeRemaining}`}
      </span>
      {!isExpired && (
        <div className="flex-1 max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${showWarning ? 'bg-amber-500' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
