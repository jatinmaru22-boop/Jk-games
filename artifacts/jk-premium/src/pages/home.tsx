import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey, useGetGameStats, getGetGameStatsQueryKey, useGetGameHistory, getGetGameHistoryQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, History, Play, Rocket } from "lucide-react";
import { format } from "date-fns";

export function Home() {
  const { user } = useAuth();
  const userId = user?.id || "";

  const { data: userData } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: stats } = useGetGameStats(userId, { query: { enabled: !!userId, queryKey: getGetGameStatsQueryKey(userId) } });
  const { data: history } = useGetGameHistory(userId, { query: { enabled: !!userId, queryKey: getGetGameHistoryQueryKey(userId) } });

  const currentBalance = userData?.balance ?? user?.balance ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Hero Balance */}
      <div className="text-center py-12 border-b border-border/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none rounded-t-3xl" />
        <h2 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-2">Total Balance</h2>
        <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter text-primary drop-shadow-[0_0_20px_rgba(218,165,32,0.4)]">
          ${currentBalance.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Featured Card */}
        <Card className="lg:col-span-2 border-primary/30 bg-card overflow-hidden relative group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=2070&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
          <CardContent className="p-8 relative h-full flex flex-col justify-end min-h-[300px]">
            <div className="mb-auto self-start bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-xs uppercase tracking-widest font-bold rounded flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live Now
            </div>
            <h3 className="text-4xl font-black font-mono tracking-widest text-white mb-2 flex items-center gap-3">
              <Rocket className="text-primary" size={36} /> AVIATOR CRASH
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">Cash out before the multiplier crashes. The higher it goes, the more you win. High risk, high reward.</p>
            <Link href="/crash">
              <Button size="lg" className="w-full sm:w-auto text-lg tracking-widest uppercase font-bold px-12 py-6 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(218,165,32,0.3)] hover:shadow-[0_0_30px_rgba(218,165,32,0.6)]">
                <Play className="mr-2" /> Play Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Trophy size={16} className="text-primary" /> Biggest Win
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono text-white">${stats?.biggestWin.toFixed(2) ?? "0.00"}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono text-white">
                {stats?.totalRounds ? Math.round((stats.totalWon / stats.totalRounds) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History size={16} className="text-primary" /> Total Rounds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono text-white">{stats?.totalRounds ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <h3 className="text-lg font-semibold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
          <History className="text-primary" size={20} /> Recent Games
        </h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {history && history.length > 0 ? (
            <div className="divide-y divide-border/50">
              {history.slice(0, 5).map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-mono text-lg font-bold">
                      ${game.betAmount.toFixed(2)} <span className="text-muted-foreground text-sm font-sans mx-2">→</span> 
                      <span className={game.won ? "text-primary" : "text-destructive"}>
                        {game.won ? `${game.cashoutMultiplier?.toFixed(2)}x` : `Crashed at ${game.multiplier.toFixed(2)}x`}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(game.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                  <div className={`font-mono text-xl font-bold ${game.won ? "text-primary" : "text-destructive"}`}>
                    {game.won ? "+" : "-"}${Math.abs(game.profit ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No recent games. Place your first bet!</div>
          )}
        </div>
      </div>
    </div>
  );
}
