import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, UserCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "signup";

function randomGuestId() {
  return "guest-" + Math.random().toString(36).slice(2, 11);
}

export function Login() {
  const { signIn, signUp, saveUser } = useAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (mode === "signup" && !username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, username.trim());
      } else {
        await signIn(email.trim(), password);
      }
      setLocation("/");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("email-already-in-use")) {
        setError("Email already registered. Try logging in instead.");
      } else if (
        code.includes("user-not-found") ||
        code.includes("wrong-password") ||
        code.includes("invalid-credential") ||
        code.includes("invalid-email")
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (code.includes("too-many-requests")) {
        setError("Too many attempts. Please wait and try again.");
      } else if (code.includes("network-request-failed")) {
        setError("Network error. Check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const enterAsGuest = () => {
    const gid = randomGuestId();
    saveUser({
      uid: gid,
      id: gid,
      username: `Guest_${Math.floor(Math.random() * 90000) + 10000}`,
      balance: 50,
      jkId: "JK-GUEST",
      createdAt: new Date().toISOString(),
      isGuest: true,
    });
    setLocation("/");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-full mb-5 shadow-[0_0_50px_rgba(218,165,32,0.3)]">
            <Gamepad2 size={36} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black font-mono tracking-widest text-primary mb-1">J&K</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-xs font-semibold">Premium Casino</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${
                  mode === m
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={20}
                      className="pl-10 bg-background border-border h-12 font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background border-border h-12 font-mono"
                autoComplete={mode === "login" ? "email" : "new-email"}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-background border-border h-12 font-mono"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-destructive text-sm"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-4 text-base font-black tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_24px_rgba(218,165,32,0.35)] hover:shadow-[0_0_40px_rgba(218,165,32,0.65)] transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {mode === "signup" ? "Creating account..." : "Logging in..."}
                </span>
              ) : mode === "signup" ? (
                "Create Account"
              ) : (
                "Log In"
              )}
            </Button>

            {mode === "signup" && (
              <p className="text-center text-xs text-muted-foreground">
                New accounts start with{" "}
                <span className="text-primary font-bold">50 demo coins</span> and a unique JK-ID
              </p>
            )}
          </form>

          <div className="px-8 pb-8 pt-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              onClick={enterAsGuest}
              variant="outline"
              className="w-full py-5 font-bold uppercase tracking-widest text-sm border-border hover:border-primary/50 hover:text-primary transition-all flex items-center gap-2 justify-center"
            >
              <UserCircle2 size={18} />
              Continue as Guest (50 coins)
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          J&K Premium Casino — For entertainment only
        </p>
      </motion.div>
    </div>
  );
}
