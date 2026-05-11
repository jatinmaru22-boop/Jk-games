import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey, useGetGameStats, getGetGameStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, User as UserIcon, Trophy, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

function toJKId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return "JK-" + String((hash % 9000) + 1000);
}

export function Profile() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const jkId = userId ? toJKId(userId) : "JK-????";
  const { toast } = useToast();

  const { data: userData } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: stats } = useGetGameStats(userId, { query: { enabled: !!userId, queryKey: getGetGameStatsQueryKey(userId) } });

  const handleCopyId = () => {
    navigator.clipboard.writeText(jkId);
    toast({ title: "Copied!", description: `${jkId} copied to clipboard.` });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Identity Card */}
      <Card className="bg-card border-primary/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent" />
        <CardContent className="p-8 pt-12 relative z-10 text-center flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-black border-4 border-primary shadow-[0_0_30px_rgba(218,165,32,0.4)] flex items-center justify-center mb-4">
            <UserIcon size={48} className="text-primary" />
          </div>
          <h2 className="text-3xl font-black font-mono tracking-widest text-white mb-1">{userData?.username || user?.username}</h2>
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/50 px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(218,165,32,0.2)]">
              <span className="text-xs text-primary/70 uppercase tracking-widest font-bold">Unique ID</span>
              <span className="font-mono text-2xl font-black text-primary tracking-widest">{jkId}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary hover:bg-primary/10" onClick={handleCopyId}>
                <Copy size={15} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Share this ID so other players can send you points</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Member since {userData?.createdAt ? format(new Date(userData.createdAt), "MMMM yyyy") : "..."}
          </p>
        </CardContent>
      </Card>

      {/* Lifetime Stats */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-primary mb-4 border-b border-border/50 pb-2">Lifetime Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Trophy size={20} className="text-primary" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Total Wins</p>
            <p className="text-2xl font-mono text-white">{stats?.totalWon ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mx-auto w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-destructive rotate-180" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Total Losses</p>
            <p className="text-2xl font-mono text-white">{stats?.totalLost ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <DollarSign size={20} className="text-primary" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Biggest Win</p>
            <p className="text-2xl font-mono text-primary">${stats?.biggestWin.toFixed(2) ?? "0.00"}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mx-auto w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-white" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Net Profit</p>
            <p className={`text-2xl font-mono ${(stats?.totalProfit ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
              {(stats?.totalProfit ?? 0) >= 0 ? "+" : "-"}${Math.abs(stats?.totalProfit ?? 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
