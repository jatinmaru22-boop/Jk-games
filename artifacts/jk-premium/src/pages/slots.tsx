import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateBalance, useRecordGameRound } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/game-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Cherry, Sun, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = [
  { id: "7", type: "text", content: "7", color: "text-primary drop-shadow-[0_0_10px_rgba(218,165,32,0.8)]", weight: 1 },
  { id: "BAR", type: "text", content: "BAR", color: "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]", weight: 2 },
  { id: "BELL", type: "icon", content: Bell, color: "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]", weight: 3 },
  { id: "CHERRY", type: "icon", content: Cherry, color: "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]", weight: 4 },
  { id: "LEMON", type: "icon", content: Sun, color: "text-yellow-200 drop-shadow-[0_0_10px_rgba(253,230,138,0.8)]", weight: 5 },
  { id: "GRAPE", type: "icon", content: Circle, color: "text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] fill-current", weight: 6 },
];

const REEL_SIZE = 3; // rows
const SPIN_DURATION = [1, 1.5, 2]; // seconds per reel

function getRandomSymbol() {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const symbol of SYMBOLS) {
    if (random < symbol.weight) return symbol;
    random -= symbol.weight;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

export function Slots() {
  const { user, updateLocalBalance } = useAuth();
  const userId = user?.id || "";
  const queryClient = useQueryClient();
  const currentBalance = user?.balance ?? 0;
  
  const updateBalance = useUpdateBalance();
  const recordRound = useRecordGameRound();
  const { toast } = useToast();

  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<any[][]>([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[2], SYMBOLS[0], SYMBOLS[1]],
    [SYMBOLS[1], SYMBOLS[2], SYMBOLS[0]]
  ]);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const calculatePayout = (result: any[]) => {
    const [s1, s2, s3] = result.map(s => s.id);
    if (s1 === "7" && s2 === "7" && s3 === "7") return 50;
    if (s1 === "BAR" && s2 === "BAR" && s3 === "BAR") return 20;
    if (s1 === "BELL" && s2 === "BELL" && s3 === "BELL") return 10;
    if (s1 === "CHERRY" && s2 === "CHERRY" && s3 === "CHERRY") return 5;
    if (s1 === s2 && s2 === s3) return 3;
    if (s1 === s2) return 1.5;
    return -1;
  };

  const handleSpin = () => {
    if (spinning) return;
    if (bet <= 0 || bet > currentBalance) {
      toast({ title: "Invalid Bet", description: "Please enter a valid bet amount.", variant: "destructive" });
      return;
    }

    setSpinning(true);
    setLastWin(null);

    // Pre-calculate results
    const finalReels = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];

    // Simulate spin duration
    setTimeout(() => {
      setReels(finalReels);
      setSpinning(false);

      const payline = [finalReels[0][1], finalReels[1][1], finalReels[2][1]];
      const multiplier = calculatePayout(payline);
      const profit = multiplier > 0 ? bet * multiplier : -bet;
      const won = profit > 0;

      if (won) setLastWin({ amount: profit, multiplier });

      updateLocalBalance(profit);
      updateBalance.mutate({ userId, data: { amount: profit } });
      recordRound.mutate({ data: { userId, betAmount: bet, multiplier: Math.max(1, multiplier), cashoutMultiplier: Math.max(1, multiplier), won, profit } });
    }, Math.max(...SPIN_DURATION) * 1000);
  };

  const renderSymbol = (symbol: any) => {
    if (symbol.type === "text") {
      return <span className={`text-4xl md:text-6xl font-black font-mono tracking-tighter ${symbol.color}`}>{symbol.content}</span>;
    }
    const Icon = symbol.content;
    return <Icon className={`w-12 h-12 md:w-16 md:h-16 ${symbol.color}`} />;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <GameHeader title="SLOTS" />
      <div className="flex flex-col items-center justify-center gap-8">
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-6xl font-black font-mono tracking-widest text-primary drop-shadow-[0_0_20px_rgba(218,165,32,0.4)]">SLOTS</h1>
        <p className="text-muted-foreground uppercase tracking-widest mt-2">Spin the reels, hit the jackpot</p>
      </div>

      <div className="p-8 md:p-12 rounded-2xl bg-card border-2 border-border shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl pointer-events-none" />
        
        {/* Machine */}
        <div className="relative bg-background border-4 border-border rounded-lg p-2 md:p-4 flex gap-2 md:gap-4 overflow-hidden">
          {/* Payline highlight */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-24 md:h-32 bg-primary/10 border-y border-primary/30 z-10 pointer-events-none shadow-[0_0_20px_rgba(218,165,32,0.1)]" />

          {reels.map((reel, rIdx) => (
            <div key={rIdx} className="w-20 md:w-32 h-[200px] md:h-[300px] bg-secondary border border-border rounded flex flex-col justify-between overflow-hidden relative">
              <motion.div
                className="absolute w-full h-[600px] md:h-[900px] flex flex-col justify-around top-0 left-0 right-0"
                animate={spinning ? { y: ["0%", "-66.66%"] } : { y: 0 }}
                transition={spinning ? { 
                  duration: 0.3, 
                  repeat: SPIN_DURATION[rIdx] / 0.3, 
                  ease: "linear" 
                } : { type: "spring", stiffness: 100, damping: 20 }}
              >
                {/* When not spinning, show actual symbols. When spinning, show blurred duplicates */}
                {spinning ? 
                  Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex-1 flex items-center justify-center opacity-30 blur-sm">
                      {renderSymbol(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])}
                    </div>
                  ))
                : 
                  reel.map((symbol, sIdx) => (
                    <div key={sIdx} className="flex-1 flex items-center justify-center py-4">
                      {renderSymbol(symbol)}
                    </div>
                  ))
                }
              </motion.div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 max-w-sm mx-auto">
          {lastWin && (
            <div className="text-center animate-in zoom-in duration-300">
              <p className="text-sm font-mono text-primary mb-1">WINNER {lastWin.multiplier}x!</p>
              <p className="text-3xl font-mono text-green-500 font-bold drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">+${lastWin.amount.toFixed(2)}</p>
            </div>
          )}

          <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
            <span className="px-3 text-sm font-mono text-muted-foreground">BET</span>
            <Input 
              type="number" 
              value={bet} 
              onChange={e => setBet(Number(e.target.value))}
              disabled={spinning}
              className="bg-transparent border-none font-mono text-lg text-right focus-visible:ring-0"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map(amt => (
              <Button 
                key={amt} 
                variant="outline" 
                size="sm" 
                onClick={() => setBet(amt)}
                disabled={spinning}
                className="text-xs font-mono"
              >
                {amt}
              </Button>
            ))}
          </div>

          <Button 
            onClick={handleSpin} 
            disabled={spinning}
            className="w-full h-16 text-2xl font-black tracking-widest mt-4 shadow-[0_0_20px_rgba(218,165,32,0.3)] hover:shadow-[0_0_30px_rgba(218,165,32,0.6)]" 
            size="lg"
          >
            {spinning ? "SPINNING..." : "SPIN"}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}