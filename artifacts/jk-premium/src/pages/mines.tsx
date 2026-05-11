import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateBalance, useRecordGameRound } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/game-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Diamond, Bomb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type Difficulty = "Easy" | "Medium" | "Hard";
type State = "IDLE" | "PLAYING" | "WIN" | "LOSS";

const GRID_SIZE = 25;

export function Mines() {
  const { user, updateLocalBalance } = useAuth();
  const userId = user?.id || "";
  const queryClient = useQueryClient();
  const currentBalance = user?.balance ?? 0;
  
  const updateBalance = useUpdateBalance();
  const recordRound = useRecordGameRound();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<State>("IDLE");
  const [bet, setBet] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [diamondsRevealed, setDiamondsRevealed] = useState(0);
  const bombsRef = useRef<number[]>([]);
  const [bombHitIndex, setBombHitIndex] = useState<number | null>(null);

  const getBombCount = (diff: Difficulty) => {
    if (diff === "Easy") return 3;
    if (diff === "Medium") return 5;
    return 8;
  };

  const currentMultiplier = Math.max(1.0, 1.0 + (diamondsRevealed * 0.35) + (difficulty === "Hard" ? 0.2 : difficulty === "Medium" ? 0.1 : 0));

  const startGame = () => {
    if (bet < 1 || bet > currentBalance) {
      toast({ title: "Invalid Bet", description: `Minimum bet is 1. Maximum is your balance (${currentBalance}).`, variant: "destructive" });
      return;
    }
    
    // Generate bombs
    const bombCount = getBombCount(difficulty);
    const newBombs: number[] = [];
    while (newBombs.length < bombCount) {
      const idx = Math.floor(Math.random() * GRID_SIZE);
      if (!newBombs.includes(idx)) newBombs.push(idx);
    }
    bombsRef.current = newBombs;
    
    setRevealedTiles([]);
    setDiamondsRevealed(0);
    setBombHitIndex(null);
    setGameState("PLAYING");
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "PLAYING" || revealedTiles.includes(index)) return;

    const newRevealed = [...revealedTiles, index];
    setRevealedTiles(newRevealed);

    if (bombsRef.current.includes(index)) {
      // Hit a bomb
      setBombHitIndex(index);
      setGameState("LOSS");
      
      const profit = -bet;
      updateLocalBalance(profit);
      updateBalance.mutate({ userId, data: { amount: profit } });
      recordRound.mutate({ data: { userId, betAmount: bet, multiplier: 1, cashoutMultiplier: null, won: false, profit } });
    } else {
      // Hit a diamond
      setDiamondsRevealed(d => d + 1);
      // Auto cashout check if all diamonds found
      if (newRevealed.length === GRID_SIZE - getBombCount(difficulty)) {
        handleCashout();
      }
    }
  };

  const handleCashout = () => {
    if (gameState !== "PLAYING" || diamondsRevealed === 0) return;
    
    setGameState("WIN");
    const profit = bet * currentMultiplier - bet;
    
    updateLocalBalance(profit);
    updateBalance.mutate({ userId, data: { amount: profit } });
    recordRound.mutate({ data: { userId, betAmount: bet, multiplier: currentMultiplier, cashoutMultiplier: currentMultiplier, won: true, profit } });
  };

  const resetGame = () => {
    setGameState("IDLE");
    setRevealedTiles([]);
    setDiamondsRevealed(0);
    setBombHitIndex(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <GameHeader title="MINES" />
      <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Sidebar Controls */}
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
              {[1, 5, 10, 50].map(amt => (
                <Button 
                  key={amt} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setBet(amt)}
                  disabled={gameState !== "IDLE"}
                  className="text-xs font-mono"
                >
                  {amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map(d => (
                <Button 
                  key={d} 
                  variant={difficulty === d ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setDifficulty(d)}
                  disabled={gameState !== "IDLE"}
                  className={difficulty === d ? "bg-primary text-primary-foreground" : ""}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            {gameState === "IDLE" ? (
              <Button onClick={startGame} className="w-full h-14 text-lg font-bold tracking-wider" size="lg">
                START GAME
              </Button>
            ) : gameState === "PLAYING" ? (
              <Button 
                onClick={handleCashout} 
                disabled={diamondsRevealed === 0}
                className="w-full h-14 text-lg font-bold tracking-wider bg-green-500 hover:bg-green-600 text-white" 
                size="lg"
              >
                CASHOUT {(bet * currentMultiplier).toFixed(2)}
              </Button>
            ) : (
              <Button onClick={resetGame} className="w-full h-14 text-lg font-bold tracking-wider" size="lg">
                PLAY AGAIN
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Grid */}
      <Card className="flex-1 bg-card border-border w-full flex items-center justify-center p-4 md:p-8 min-h-[500px] relative overflow-hidden">
        {gameState === "WIN" && (
          <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-pulse" />
        )}
        {gameState === "LOSS" && (
          <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
        )}
        
        <div className="w-full max-w-[500px]">
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              const isRevealed = revealedTiles.includes(i) || gameState === "WIN" || gameState === "LOSS";
              const isBomb = bombsRef.current.includes(i);
              const isHitBomb = bombHitIndex === i;

              return (
                <button
                  key={i}
                  disabled={gameState !== "PLAYING" || revealedTiles.includes(i)}
                  onClick={() => handleTileClick(i)}
                  className={`relative aspect-square rounded-md overflow-hidden transition-colors ${
                    !isRevealed 
                      ? "bg-secondary hover:bg-primary/20 hover:border-primary/50 border-2 border-transparent cursor-pointer" 
                      : isBomb 
                        ? isHitBomb ? "bg-red-500/20 border-2 border-red-500" : "bg-secondary/50 border-2 border-transparent opacity-50"
                        : "bg-teal-500/20 border-2 border-teal-500/50"
                  }`}
                >
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {isBomb ? (
                          <Bomb className={`w-8 h-8 md:w-10 md:h-10 ${isHitBomb ? "text-red-500" : "text-red-500/50"}`} />
                        ) : (
                          <Diamond className="w-8 h-8 md:w-10 md:h-10 text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center flex justify-between items-center px-4 bg-background/50 p-4 rounded-lg border border-border">
            <div>
              <p className="text-xs font-mono text-muted-foreground">MULTIPLIER</p>
              <p className="text-2xl font-mono text-primary font-bold">{currentMultiplier.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground">DIAMONDS</p>
              <p className="text-2xl font-mono text-white font-bold">{diamondsRevealed}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground">PROFIT</p>
              <p className={`text-2xl font-mono font-bold ${
                gameState === "WIN" ? "text-green-500" : gameState === "LOSS" ? "text-red-500" : "text-white"
              }`}>
                {gameState === "WIN" ? `+${(bet * currentMultiplier - bet).toFixed(2)}` : gameState === "LOSS" ? `-${bet.toFixed(2)}` : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}