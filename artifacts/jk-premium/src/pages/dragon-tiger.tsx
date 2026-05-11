import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateBalance, useRecordGameRound } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/game-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type State = "IDLE" | "DEALING" | "RESULT";
type Selection = "DRAGON" | "TIE" | "TIGER";

type CardData = { rank: string; suit: string; value: number; color: string };

const SUITS = [
  { s: "♠", c: "text-foreground" },
  { s: "♥", c: "text-red-500" },
  { s: "♦", c: "text-red-500" },
  { s: "♣", c: "text-foreground" }
];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function getRandomCard(): CardData {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rankIdx = Math.floor(Math.random() * RANKS.length);
  return { rank: RANKS[rankIdx], suit: suit.s, value: rankIdx + 1, color: suit.c };
}

export function DragonTiger() {
  const { user, updateLocalBalance } = useAuth();
  const userId = user?.id || "";
  const queryClient = useQueryClient();
  const currentBalance = user?.balance ?? 0;
  
  const updateBalance = useUpdateBalance();
  const recordRound = useRecordGameRound();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<State>("IDLE");
  const [bet, setBet] = useState(1);
  const [selection, setSelection] = useState<Selection | null>(null);
  
  const [dragonCard, setDragonCard] = useState<CardData | null>(null);
  const [tigerCard, setTigerCard] = useState<CardData | null>(null);
  const [winner, setWinner] = useState<Selection | null>(null);
  const [profit, setProfit] = useState(0);

  const placeBet = (sel: Selection) => {
    if (gameState !== "IDLE") return;
    if (bet < 1 || bet > currentBalance) {
      toast({ title: "Invalid Bet", description: `Minimum bet is 1. Maximum is your balance (${currentBalance}).`, variant: "destructive" });
      return;
    }

    setSelection(sel);
    setGameState("DEALING");

    setTimeout(() => {
      const dCard = getRandomCard();
      const tCard = getRandomCard();
      
      setDragonCard(dCard);
      setTigerCard(tCard);

      let actualWinner: Selection = "TIE";
      if (dCard.value > tCard.value) actualWinner = "DRAGON";
      if (tCard.value > dCard.value) actualWinner = "TIGER";

      setWinner(actualWinner);

      let roundProfit = -bet;
      let multiplier = 1;
      
      if (actualWinner === sel) {
        if (sel === "TIE") {
          roundProfit = bet * 7;
          multiplier = 8;
        } else {
          roundProfit = bet;
          multiplier = 2;
        }
      } else if (actualWinner === "TIE" && sel !== "TIE") {
        // Push
        roundProfit = 0;
        multiplier = 1;
      }

      setProfit(roundProfit);
      setGameState("RESULT");

      updateLocalBalance(roundProfit);
      updateBalance.mutate({ userId, data: { amount: roundProfit } });
      recordRound.mutate({ data: { userId, betAmount: bet, multiplier, cashoutMultiplier: null, won: roundProfit > 0, profit: roundProfit } });

    }, 1500);
  };

  const reset = () => {
    setGameState("IDLE");
    setSelection(null);
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);
    setProfit(0);
  };

  const renderCard = (card: CardData | null, side: Selection) => {
    const isWinner = winner === side || winner === "TIE";
    const highlight = gameState === "RESULT" && isWinner ? "shadow-[0_0_30px_rgba(218,165,32,0.8)] border-primary" : "border-border";

    return (
      <div className={`w-32 md:w-48 aspect-[2.5/3.5] rounded-xl bg-card border-2 flex flex-col relative transition-shadow duration-500 ${highlight}`}>
        {card ? (
          <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="absolute inset-0 bg-white rounded-xl p-4 flex flex-col justify-between">
            <div className={`text-2xl md:text-4xl font-bold ${card.color}`}>{card.rank}</div>
            <div className={`text-6xl md:text-8xl self-center ${card.color}`}>{card.suit}</div>
            <div className={`text-2xl md:text-4xl font-bold self-end rotate-180 ${card.color}`}>{card.rank}</div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background border-2 border-primary/20 rounded-xl m-2 opacity-50 flex items-center justify-center">
            <div className="w-12 h-12 border border-primary/30 rounded-full rotate-45" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GameHeader title="DRAGON TIGER" />
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-black font-mono tracking-widest text-primary drop-shadow-[0_0_20px_rgba(218,165,32,0.4)]">DRAGON TIGER</h1>
        <p className="text-muted-foreground uppercase tracking-widest mt-2">Higher card wins</p>
      </div>

      <div className="flex justify-center items-center gap-8 md:gap-24 py-8">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-mono text-red-500 font-bold uppercase tracking-widest">Dragon</h2>
          {renderCard(dragonCard, "DRAGON")}
        </div>
        
        <div className="flex flex-col items-center justify-center text-4xl font-mono font-black text-muted-foreground opacity-50">
          VS
        </div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-mono text-blue-500 font-bold uppercase tracking-widest">Tiger</h2>
          {renderCard(tigerCard, "TIGER")}
        </div>
      </div>

      {gameState === "RESULT" && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
          <h3 className="text-2xl font-mono uppercase tracking-widest">
            {winner === "TIE" ? "IT'S A TIE!" : `${winner} WINS!`}
          </h3>
          <p className={`text-4xl font-mono font-bold mt-2 ${profit > 0 ? "text-green-500" : profit < 0 ? "text-red-500" : "text-muted-foreground"}`}>
            {profit > 0 ? "+" : ""}{profit.toFixed(2)}
          </p>
          <Button onClick={reset} className="mt-6" size="lg" variant="outline">NEXT ROUND</Button>
        </motion.div>
      )}

      {gameState === "IDLE" && (
        <Card className="bg-card border-border mt-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 max-w-sm mx-auto mb-8">
              <span className="text-sm font-mono text-muted-foreground">BET</span>
              <Input 
                type="number" 
                value={bet} 
                onChange={e => setBet(Number(e.target.value))}
                className="font-mono text-lg"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={() => placeBet("DRAGON")} className="h-24 text-xl font-bold bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-500">
                DRAGON<br/><span className="text-xs font-normal ml-2">1:1</span>
              </Button>
              <Button onClick={() => placeBet("TIE")} className="h-24 text-xl font-bold bg-green-950 hover:bg-green-900 border border-green-500/50 text-green-500">
                TIE<br/><span className="text-xs font-normal ml-2">8:1</span>
              </Button>
              <Button onClick={() => placeBet("TIGER")} className="h-24 text-xl font-bold bg-blue-950 hover:bg-blue-900 border border-blue-500/50 text-blue-500">
                TIGER<br/><span className="text-xs font-normal ml-2">1:1</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}