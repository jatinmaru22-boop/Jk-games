import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Gamepad2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiGoogle } from "react-icons/si";

function randomId() {
  return "guest-" + Math.random().toString(36).slice(2, 11);
}

export function Login() {
  const { saveUser } = useAuth();
  const [, setLocation] = useLocation();

  const enterAsGuest = () => {
    const guestUser = {
      id: randomId(),
      username: `Guest_${Math.floor(Math.random() * 90000) + 10000}`,
      balance: 10000,
      createdAt: new Date().toISOString(),
    };
    saveUser(guestUser);
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-card-border p-10 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-full mb-6 shadow-[0_0_40px_rgba(218,165,32,0.25)]">
            <Gamepad2 size={36} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black font-mono tracking-widest text-primary mb-2">J&K</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-xs font-semibold">Premium Casino</p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={enterAsGuest}
            data-testid="button-guest-login"
            className="w-full py-7 text-lg tracking-widest uppercase font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_24px_rgba(218,165,32,0.4)] hover:shadow-[0_0_40px_rgba(218,165,32,0.7)] transition-all duration-200 flex items-center gap-3 justify-center"
          >
            <UserCircle2 size={24} />
            Play as Guest
          </Button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            disabled
            data-testid="button-google-login"
            className="w-full py-6 text-sm tracking-widest uppercase font-bold bg-white/5 text-muted-foreground border border-border cursor-not-allowed opacity-50 flex items-center gap-3 justify-center"
          >
            <SiGoogle size={18} />
            Continue with Google (Coming Soon)
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Guest players start with{" "}
          <span className="text-primary font-bold">10,000 demo coins</span>
        </p>
      </div>
    </div>
  );
}
