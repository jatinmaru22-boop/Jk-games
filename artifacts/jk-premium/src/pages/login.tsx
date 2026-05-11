import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRegisterUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Loader2 } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { SiGoogle } from "react-icons/si";

export function Login() {
  const { saveUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const registerMutation = useRegisterUser();

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
          onSuccess: (data) => {
            saveUser(data);
            setLocation("/");
            toast({
              title: `Welcome, ${data.username}`,
              description: "Your VIP experience begins now.",
            });
          },
          onError: () => {
            toast({
              title: "Authentication Failed",
              description: "Could not create your account. Please try again.",
              variant: "destructive",
            });
            setIsGoogleLoading(false);
          },
        },
      );
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        toast({
          title: "Google Sign-In Failed",
          description: "Could not sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
      setIsGoogleLoading(false);
    }
  };

  const isLoading = isGoogleLoading || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-card-border p-10 rounded-2xl shadow-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-full mb-6 shadow-[0_0_40px_rgba(218,165,32,0.25)]">
            <Gamepad2 size={36} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black font-mono tracking-widest text-primary mb-2">
            J&K
          </h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-xs font-semibold">
            Premium Casino
          </p>
        </div>

        <div className="space-y-4">
          {/* Divider text */}
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Sign in to enter
          </p>

          {/* Google Sign-In */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            data-testid="button-google-login"
            className="w-full py-6 text-base tracking-widest uppercase font-bold bg-white hover:bg-white/90 text-black border border-white/20 shadow-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-3 justify-center"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <SiGoogle size={20} />
            )}
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          New players receive{" "}
          <span className="text-primary font-bold">10,000 coins</span> on sign up
        </p>
      </div>
    </div>
  );
}
