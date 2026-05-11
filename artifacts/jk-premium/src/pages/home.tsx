import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey, useGetGameStats, getGetGameStatsQueryKey, useGetGameHistory, getGetGameHistoryQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, History, Play, Rocket, Bomb, LayoutGrid, Zap, Swords } from "lucide-react";
import { format } from "date-fns";

const GAMES = [
  { id: 'crash', name: 'Aviator Crash', desc: 'Cash out before the multiplier crashes', icon: Rocket, route: '/crash', color: 'from-blue-950 to-background border-blue-900/50' },
  { id: 'mines', name: 'Mines', desc: 'Reveal diamonds, dodge the bombs', icon: Bomb, route: '/mines', color: 'from-teal-950 to-background border-teal-900/50' },
  { id: 'slots', name: 'Slots', desc: 'Spin the reels, hit the jackpot', icon: LayoutGrid, route: '/slots', color: 'from-purple-950 to-background border-purple-900/50' },
  { id: 'chicken', name: 'Chicken Road', desc: 'Cross the road, dodge the cars', icon: Zap, route: '/chicken-road', color: 'from-yellow-950 to-background border-yellow-900/50' },
  { id: 'dragon', name: 'Dragon Tiger', desc: 'Pick Dragon or Tiger, higher card wins', icon: Swords, route: '/dragon-tiger', color: 'from-red-950 to-background border-red-900/50' }
];

export function Home() {
  const { user } = useAuth();
  const userId = user?.id || "";

  const { data: userData } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: stats } = useGetGameStats(userId, { query: { enabled: !!userId, queryKey: getGetGameStatsQueryKey(userId) } });
  const { data: history } = useGetGameHistory(userId, { query: { enabled: !!userId, queryKey: getGetGameHistoryQueryKey(userId) } });

  const currentBalance = userData?.balance ?? user?.balance ?? 0;

  return (
    <div className="space-y-12 animate-in fade-in zoom-in duration-500 pb-12">
      {/* Hero Balance */}
      <div className="text-center py-12 border-b border-border/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none rounded-t-3xl" />
        <h2 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-2">Total Balance</h2>
        <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter text-primary drop-shadow-[0_0_20px_rgba(218,165,32,0.4)]">
          ${currentBalance.toFixed(2)}
        </div>
      </div>

      {/* Game Grid */}
      <div>
        <h3 className="text-xl font-mono font-bold tracking-widest uppercase mb-6 flex items-center gap-3">
          <Play className="text-primary" /> Select Game
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAMES.map(game => (
            <Card key={game.id} className={`overflow-hidden border group bg-gradient-to-br ${game.color}`}>
              <CardContent className="p-8 flex flex-col items-start gap-4">
                <div className="p-4 rounded-full bg-background/50 border border-border group-hover:scale-110 transition-transform duration-300">
                  <game.icon size={32} className="text-primary" />
                </div>
                <div>
                  <h4 className="text-2xl font-black font-mono tracking-widest text-white mb-2">{game.name}</h4>
                  <p className="text-sm text-muted-foreground">{game.desc}</p>
                </div>
                <Link href={game.route} className="mt-auto w-full">
                  <Button className="w-full font-bold tracking-widest uppercase" variant="outline">
                    PLAY NOW
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* History */}
      <div>
        <h3 className="text-lg font-semibold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
          <History className="text-primary" size={20} /> Recent Games
        </h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {history && history.length > 0 ? (
            <div className="divide-y divide-border/50">
              {history.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-mono text-lg font-bold">
                      ${g.betAmount.toFixed(2)} <span className="text-muted-foreground text-sm font-sans mx-2">→</span> 
                      <span className={g.won ? "text-primary" : "text-destructive"}>
                        {g.won ? `${g.cashoutMultiplier?.toFixed(2)}x` : `Lost`}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(g.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                  <div className={`font-mono text-xl font-bold ${g.won ? "text-primary" : "text-destructive"}`}>
                    {g.won ? "+" : "-"}${Math.abs(g.profit ?? 0).toFixed(2)}
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