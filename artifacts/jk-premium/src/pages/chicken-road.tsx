import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey, useUpdateBalance, useRecordGameRound } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type State = "IDLE" | "CROSSING" | "WIN" | "LOSS";

const LANES = 8;
const HIT_CHANCE = 0.40;
const MULTIPLIER_INC = 0.40;

export function ChickenRoad() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const queryClient = useQueryClient();
  const { data: userData } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const currentBalance = userData?.balance ?? user?.balance ?? 0;
  
  const updateBalance = useUpdateBalance();
  const recordRound = useRecordGameRound();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<State>("IDLE");
  const [bet, setBet] = useState(10);
  const [currentLane, setCurrentLane] = useState(-1); // -1 = start, 0 to LANES-1
  const [multiplier, setMultiplier] = useState(1.0);

  const startGame = () => {
    if (bet <= 0 || bet > currentBalance) {
      toast({ title: "Invalid Bet", description: "Please enter a valid bet amount.", variant: "destructive" });
      return;
    }
    setGameState("CROSSING");
    setCurrentLane(-1);
    setMultiplier(1.0);
  };

  const handleCross = () => {
    if (gameState !== "CROSSING") return;
    
    const hit = Math.random() < HIT_CHANCE;
    const nextLane = currentLane + 1;

    if (hit) {
      // Boom
      setCurrentLane(nextLane);
      setGameState("LOSS");
      
      updateBalance.mutate({ userId, data: { amount: -bet } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) })
      });
      recordRound.mutate({ data: { userId, betAmount: bet, multiplier: 1, cashoutMultiplier: null, won: false, profit: -bet } });
    } else {
      // Safe
      setCurrentLane(nextLane);
      setMultiplier(m => m + MULTIPLIER_INC);
      
      if (nextLane === LANES - 1) {
        // Auto cashout on last lane
        handleCashout(multiplier + MULTIPLIER_INC);
      }
    }
  };

  const handleCashout = (finalMult = multiplier) => {
    if (gameState !== "CROSSING" || currentLane === -1) return;
    
    setGameState("WIN");
    const profit = bet * finalMult - bet;
    
    updateBalance.mutate({ userId, data: { amount: profit } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) })
    });
    recordRound.mutate({ data: { userId, betAmount: bet, multiplier: finalMult, cashoutMultiplier: finalMult, won: true, profit } });
  };

  const resetGame = () => {
    setGameState("IDLE");
    setCurrentLane(-1);
    setMultiplier(1.0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto items-start">
      <Card className="w-full lg:w-80 bg-card border-border">
        <CardContent className="p-6 flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Bet Amount</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  value={bet} 
                  onChange={e => setBet(Number(e.target.value))}
                  disabled={gameState !== "IDLE"}
                  className="pl-7 bg-background font-mono text-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[10, 50, 100, 500].map(amt => (
                <Button key={amt} variant="outline" size="sm" onClick={() => setBet(amt)} disabled={gameState !== "IDLE"} className="text-xs font-mono">
                  {amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            {gameState === "IDLE" ? (
              <Button onClick={startGame} className="w-full h-14 text-lg font-bold tracking-wider" size="lg">
                START JOURNEY
              </Button>
            ) : gameState === "CROSSING" ? (
              <div className="space-y-3">
                <Button onClick={handleCross} className="w-full h-14 text-lg font-bold tracking-wider bg-primary text-primary-foreground" size="lg">
                  CROSS NEXT LANE
                </Button>
                <Button 
                  onClick={() => handleCashout()} 
                  disabled={currentLane === -1}
                  variant="outline"
                  className="w-full h-12 text-md font-bold tracking-wider border-green-500/50 text-green-500 hover:bg-green-500/10"
                >
                  CASHOUT {(bet * multiplier).toFixed(2)}
                </Button>
              </div>
            ) : (
              <Button onClick={resetGame} className="w-full h-14 text-lg font-bold tracking-wider" size="lg">
                PLAY AGAIN
              </Button>
            )}
          </div>
          
          <div className="p-4 bg-background border border-border rounded-lg text-center">
            <p className="text-xs font-mono text-muted-foreground mb-1">CURRENT MULTIPLIER</p>
            <p className="text-3xl font-mono font-bold text-primary">{multiplier.toFixed(2)}x</p>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 bg-card border-border w-full p-4 md:p-8 min-h-[600px] relative flex flex-col justify-end overflow-hidden">
        {/* Road lanes - render from top (LANES-1) to bottom (0) */}
        <div className="w-full h-full flex flex-col-reverse justify-around relative max-w-lg mx-auto bg-[#111] border-x-2 border-border p-4">
          {Array.from({ length: LANES }).map((_, i) => {
            const isPassed = currentLane > i && gameState !== "LOSS";
            const isCurrent = currentLane === i;
            const isHit = isCurrent && gameState === "LOSS";
            const targetMult = (1 + (i + 1) * MULTIPLIER_INC).toFixed(2);
            
            return (
              <div key={i} className={`h-12 w-full border-b border-dashed border-white/20 relative flex items-center justify-end pr-4 transition-colors duration-500 ${isPassed ? "bg-green-500/10 border-solid border-green-500/30" : isHit ? "bg-red-500/20 border-solid border-red-500/50" : isCurrent ? "bg-primary/10 border-solid border-primary/30" : ""}`}>
                <span className={`font-mono text-xs ${isPassed ? 'text-green-500' : 'text-muted-foreground'}`}>{targetMult}x</span>
              </div>
            );
          })}
          
          {/* Start area */}
          <div className="h-16 w-full border-t-4 border-solid border-white/40 bg-secondary flex flex-col items-center justify-center mt-auto" />

          {/* Chicken Marker */}
          <AnimatePresence>
            <motion.div
              initial={false}
              animate={{ 
                y: currentLane === -1 ? 0 : `-${(currentLane + 1) * (100 / (LANES + 1.5))}vh` 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-8 z-10"
            >
              {gameState === "LOSS" ? (
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-in zoom-in spin-in-12 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] text-white">
                  <Flame size={32} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(218,165,32,0.5)] text-primary-foreground">
                  <Zap size={24} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}