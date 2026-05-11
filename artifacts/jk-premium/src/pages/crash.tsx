import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateBalance, useRecordGameRound, getGetUserQueryKey, getGetGameHistoryQueryKey, getGetGameStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

type GameState = "IDLE" | "WAITING" | "FLYING" | "CRASHED";

export function Crash() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBalance = useUpdateBalance();
  const recordRound = useRecordGameRound();

  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [betAmount, setBetAmount] = useState<string>("10");
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(1.00);
  const [history, setHistory] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutValue, setCashoutValue] = useState(0);

  const multiplierTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const PRESETS = [10, 50, 100, 500];

  const generateCrashPoint = () => {
    const r = Math.random();
    if (r < 0.05) return 1.00;
    return Math.max(1.00, Math.floor(100 / (1 - r * 0.95)) / 100);
  };

  const startGame = () => {
    const bet = Number(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast({ title: "Invalid Bet", description: "Please enter a valid bet amount.", variant: "destructive" });
      return;
    }
    
    setGameState("WAITING");
    setCountdown(5);
    setHasCashedOut(false);
    setCurrentMultiplier(1.00);
    setCrashPoint(generateCrashPoint());
  };

  const cashOut = useCallback(() => {
    if (gameState !== "FLYING" || hasCashedOut) return;
    
    setHasCashedOut(true);
    setCashoutValue(currentMultiplier);
    const bet = Number(betAmount);
    const profit = (bet * currentMultiplier) - bet;

    updateBalance.mutate({ userId, data: { amount: profit } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
      }
    });

    toast({
      title: "CASHED OUT!",
      description: `You won $${(bet * currentMultiplier).toFixed(2)}!`,
    });
  }, [gameState, hasCashedOut, currentMultiplier, betAmount, updateBalance, userId, queryClient, toast]);

  useEffect(() => {
    if (gameState === "WAITING") {
      countdownTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            setGameState("FLYING");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === "FLYING") {
      const startTime = Date.now();
      multiplierTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Exponential growth
        const nextMultiplier = 1.00 + Math.pow(elapsed / 2000, 2);
        
        if (nextMultiplier >= crashPoint) {
          if (multiplierTimerRef.current) clearInterval(multiplierTimerRef.current);
          setCurrentMultiplier(crashPoint);
          setGameState("CRASHED");
        } else {
          setCurrentMultiplier(nextMultiplier);
        }
      }, 50);
    }
    return () => {
      if (multiplierTimerRef.current) clearInterval(multiplierTimerRef.current);
    };
  }, [gameState, crashPoint]);

  useEffect(() => {
    if (gameState === "CRASHED") {
      setHistory(prev => [crashPoint, ...prev].slice(0, 10));
      
      const bet = Number(betAmount);
      
      if (!hasCashedOut) {
        // Lost
        updateBalance.mutate({ userId, data: { amount: -bet } }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
          }
        });
      }

      recordRound.mutate({
        data: {
          userId,
          betAmount: bet,
          multiplier: crashPoint,
          cashoutMultiplier: hasCashedOut ? cashoutValue : null,
          won: hasCashedOut,
          profit: hasCashedOut ? (bet * cashoutValue) - bet : -bet
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetGameHistoryQueryKey(userId) });
          queryClient.invalidateQueries({ queryKey: getGetGameStatsQueryKey(userId) });
        }
      });
      
      const timer = setTimeout(() => {
        setGameState("IDLE");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, crashPoint, hasCashedOut, cashoutValue, betAmount, userId, updateBalance, recordRound, queryClient]);

  // Graph calculation
  const graphProgress = Math.min(currentMultiplier / 10, 1); // Normalize up to 10x for visual

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* History Bar */}
      <div className="flex items-center gap-2 overflow-x-auto bg-card border border-border p-3 rounded-lg hide-scrollbar">
        <span className="text-xs font-bold uppercase text-muted-foreground mr-2 shrink-0">Recent:</span>
        {history.map((m, i) => (
          <div 
            key={i} 
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono shrink-0 border ${m >= 2 ? 'bg-primary/20 text-primary border-primary/50' : 'bg-destructive/20 text-destructive border-destructive/50'}`}
          >
            {m.toFixed(2)}x
          </div>
        ))}
        {history.length === 0 && <span className="text-sm text-muted-foreground">No recent games</span>}
      </div>

      {/* Main Game Area */}
      <div className="aspect-video w-full bg-black border border-card-border rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* State Display */}
        <div className="relative z-10 flex flex-col items-center">
          {gameState === "IDLE" && (
            <h2 className="text-4xl font-mono text-muted-foreground tracking-widest font-black uppercase">Ready</h2>
          )}
          
          {gameState === "WAITING" && (
            <div className="text-center">
              <p className="text-primary text-xl font-bold uppercase tracking-widest mb-4">Starting in</p>
              <div className="text-8xl font-mono font-black text-white">{countdown}</div>
            </div>
          )}

          {gameState === "FLYING" && (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-8xl md:text-[10rem] font-mono font-black ${hasCashedOut ? 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]' : 'text-primary drop-shadow-[0_0_20px_rgba(218,165,32,0.8)]'}`}
            >
              {currentMultiplier.toFixed(2)}x
            </motion.div>
          )}

          {gameState === "CRASHED" && (
            <div className="text-center animate-in zoom-in duration-300">
              <p className="text-destructive text-2xl font-bold uppercase tracking-widest mb-4 animate-pulse">Crashed At</p>
              <div className="text-8xl font-mono font-black text-destructive drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                {crashPoint.toFixed(2)}x
              </div>
            </div>
          )}
        </div>

        {/* Canvas / SVG Graph */}
        {(gameState === "FLYING" || gameState === "CRASHED") && (
          <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.1, ease: "linear" }}
              d={`M 0,100 Q ${30 * graphProgress},${100 - (20 * graphProgress)} ${100 * graphProgress},${100 - (100 * graphProgress)}`}
              fill="none"
              stroke={gameState === "CRASHED" ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              strokeWidth="1.5"
              className="drop-shadow-[0_0_10px_rgba(218,165,32,0.5)]"
            />
            {gameState === "FLYING" && (
              <circle 
                cx={100 * graphProgress} 
                cy={100 - (100 * graphProgress)} 
                r="2" 
                fill="hsl(var(--primary))" 
                className="animate-pulse drop-shadow-[0_0_10px_rgba(218,165,32,1)]"
              />
            )}
          </svg>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bet Amount */}
        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Bet Amount</label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(e.target.value)} 
              disabled={gameState !== "IDLE"}
              className="font-mono text-xl py-6 bg-black border-border"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <Button 
                key={p} 
                variant="outline" 
                disabled={gameState !== "IDLE"}
                onClick={() => setBetAmount(p.toString())}
                className="font-mono bg-black/50 border-border hover:border-primary hover:text-primary"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-end">
          {gameState === "IDLE" || gameState === "CRASHED" ? (
            <Button 
              onClick={startGame} 
              disabled={gameState === "CRASHED"}
              className="w-full h-full min-h-[80px] text-2xl tracking-widest uppercase font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(218,165,32,0.2)]"
            >
              Place Bet
            </Button>
          ) : gameState === "WAITING" ? (
            <Button 
              disabled
              className="w-full h-full min-h-[80px] text-xl tracking-widest uppercase font-black bg-muted text-muted-foreground"
            >
              Waiting...
            </Button>
          ) : (
            <Button 
              onClick={cashOut}
              disabled={hasCashedOut}
              className={`w-full h-full min-h-[80px] text-2xl tracking-widest uppercase font-black ${hasCashedOut ? 'bg-muted text-muted-foreground' : 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]'}`}
            >
              {hasCashedOut ? `Cashed Out ${cashoutValue.toFixed(2)}x` : `Cash Out ${(Number(betAmount) * currentMultiplier).toFixed(2)}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
