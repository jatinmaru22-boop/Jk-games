import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRegisterUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Loader2, UserCircle2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export function Login() {
  const { saveUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const registerMutation = useRegisterUser();

  const enterLobby = (data: { id: string; username: string; balance: number; createdAt: string }) => {
    saveUser(data);
    setLocation("/");
    toast({ title: `Welcome, ${data.username}!`, description: "10,000 demo coins loaded. Good luck!" });
  };

  const handleGuestLogin = () => {
    setIsGuestLoading(true);
    const guestName = `Guest_${Math.floor(Math.random() * 90000) + 10000}`;
    registerMutation.mutate(
      { data: { username: guestName } },
      {
        onSuccess: (data) => enterLobby(data),
        onError: () => {
          toast({ title: "Failed", description: "Could not create guest session.", variant: "destructive" });
          setIsGuestLoading(false);
        },
      },
    );
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const displayName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Player";
      const username = displayName.replace(/\s+/g, "_").slice(0, 20);
      registerMutation.mutate(
        { data: { username } },
        {
          onSuccess: (data) => enterLobby(data),
          onError: () => {
            toast({ title: "Authentication Failed", description: "Could not create your account.", variant: "destructive" });
            setIsGoogleLoading(false);
          },
        },
      );
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        toast({ title: "Google Sign-In Failed", description: "Please try again.", variant: "destructive" });
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-card-border p-10 rounded-2xl shadow-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-full mb-6 shadow-[0_0_40px_rgba(218,165,32,0.25)]">
            <Gamepad2 size={36} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black font-mono tracking-widest text-primary mb-2">J&K</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-xs font-semibold">Premium Casino</p>
        </div>

        <div className="space-y-3">
          {/* Guest Login — primary CTA */}
          <Button
            type="button"
            onClick={handleGuestLogin}
            disabled={isGuestLoading || isGoogleLoading}
            data-testid="button-guest-login"
            className="w-full py-7 text-lg tracking-widest uppercase font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_24px_rgba(218,165,32,0.4)] hover:shadow-[0_0_36px_rgba(218,165,32,0.65)] transition-all duration-200 flex items-center gap-3 justify-center"
          >
            {isGuestLoading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <UserCircle2 size={22} />
            )}
            {isGuestLoading ? "Entering Lobby..." : "Play as Guest"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign-In — secondary */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGuestLoading || isGoogleLoading}
            data-testid="button-google-login"
            className="w-full py-6 text-sm tracking-widest uppercase font-bold bg-white/10 hover:bg-white/15 text-foreground border border-border transition-all duration-200 flex items-center gap-3 justify-center"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SiGoogle size={18} />
            )}
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All new players receive{" "}
          <span className="text-primary font-bold">10,000 demo coins</span>
        </p>
      </div>
    </div>
  );
}
