import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey, useTransferPoints, useGetUserTransfers, getGetUserTransfersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export function Transfer() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");

  const { data: userData } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: transfers } = useGetUserTransfers(userId, { query: { enabled: !!userId, queryKey: getGetUserTransfersQueryKey(userId) } });
  
  const transferMutation = useTransferPoints();

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    
    if (!toUserId) {
      toast({ title: "Error", description: "Please enter a recipient ID.", variant: "destructive" });
      return;
    }
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    if (numAmount > (userData?.balance ?? 0)) {
      toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
      return;
    }

    transferMutation.mutate({
      data: {
        fromUserId: userId,
        toUserId,
        amount: numAmount
      }
    }, {
      onSuccess: () => {
        toast({ title: "Transfer Successful", description: `Sent $${numAmount.toFixed(2)}` });
        setToUserId("");
        setAmount("");
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetUserTransfersQueryKey(userId) });
      },
      onError: () => {
        toast({ title: "Transfer Failed", description: "Could not complete transfer.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card */}
        <Card className="bg-primary border-primary relative overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550565118-3a14e8d0386f?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover mix-blend-multiply" />
          <CardContent className="p-8 relative z-10 text-center text-primary-foreground">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Available Balance</h3>
            <p className="text-6xl font-black font-mono tracking-tighter drop-shadow-lg">
              ${(userData?.balance ?? user?.balance ?? 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="uppercase tracking-widest flex items-center gap-2 text-primary">
              <Send size={20} /> Send Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Recipient ID</label>
                <Input 
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  placeholder="Paste User ID here..."
                  className="bg-black/50 border-border font-mono py-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                  <Input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-black/50 border-border pl-8 font-mono py-6"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={transferMutation.isPending}
                className="w-full py-6 font-bold tracking-widest uppercase"
              >
                {transferMutation.isPending ? "Processing..." : "Transfer Now"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="uppercase tracking-widest text-white">Transfer Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers && transfers.length > 0 ? (
            <div className="space-y-2">
              {transfers.map((t) => {
                const isSent = t.fromUserId === userId;
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${isSent ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                        {isSent ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {isSent ? `Sent to ${t.toUsername || "Unknown"}` : `Received from ${t.fromUsername || "Unknown"}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "MMM d, yyyy h:mm a")}</p>
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-lg ${isSent ? 'text-destructive' : 'text-primary'}`}>
                      {isSent ? "-" : "+"}${t.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No transfers recorded.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
