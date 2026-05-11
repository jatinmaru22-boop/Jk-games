import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRegisterUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2 } from "lucide-react";

export function Login() {
  const [username, setUsername] = useState("");
  const { saveUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({ data: { username } }, {
      onSuccess: (data) => {
        saveUser(data);
        setLocation("/");
        toast({
          title: "Welcome to J&K Premium",
          description: "Your VIP experience begins now.",
        });
      },
      onError: (error) => {
        toast({
          title: "Authentication Failed",
          description: "Could not enter the casino. Try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-card border border-card-border p-8 rounded-xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-full mb-6 shadow-[0_0_30px_rgba(218,165,32,0.2)]">
            <Gamepad2 size={32} className="text-primary" />
          </div>
          <h1 className="text-4xl font-black font-mono tracking-widest text-primary mb-2">J&K</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm font-semibold">Premium Casino</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Enter Username</label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="HighRoller99"
              className="bg-black/50 border-border text-center text-lg py-6 focus-visible:ring-primary/50 font-mono tracking-wider"
              data-testid="input-username"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 text-lg tracking-widest uppercase font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(218,165,32,0.3)] transition-all hover:shadow-[0_0_30px_rgba(218,165,32,0.5)]"
            disabled={registerMutation.isPending}
            data-testid="button-login"
          >
            {registerMutation.isPending ? "Authenticating..." : "Enter VIP Room"}
          </Button>
        </form>
      </div>
    </div>
  );
}
