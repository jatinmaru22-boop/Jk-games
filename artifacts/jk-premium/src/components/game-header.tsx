import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

interface GameHeaderProps {
  title: string;
}

export function GameHeader({ title }: GameHeaderProps) {
  const { user } = useAuth();
  const balance = user?.balance ?? 0;
  const prevBalance = useRef(balance);
  const didIncrease = balance > prevBalance.current;
  prevBalance.current = balance;

  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <Link href="/">
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-back-lobby"
          className="gap-2 text-muted-foreground hover:text-primary uppercase tracking-widest text-xs font-bold shrink-0 border border-border hover:border-primary/40 transition-all"
        >
          <ArrowLeft size={15} />
          Lobby
        </Button>
      </Link>

      <h1 className="text-base sm:text-lg font-black font-mono tracking-widest text-foreground uppercase text-center flex-1">
        {title}
      </h1>

      <AnimatePresence mode="wait">
        <motion.div
          key={Math.round(balance)}
          initial={{ scale: 0.92, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 shrink-0 border shadow-[0_0_18px_rgba(218,165,32,0.25)] ${
            didIncrease
              ? "bg-primary/20 border-primary/60"
              : "bg-primary/10 border-primary/40"
          }`}
        >
          <Coins size={16} className="text-primary" />
          <span
            className="font-mono font-black text-primary text-lg tracking-wider"
            data-testid="text-balance"
          >
            {balance.toLocaleString("en-IN", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-primary/60 text-xs font-bold uppercase hidden sm:inline">
            pts
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
