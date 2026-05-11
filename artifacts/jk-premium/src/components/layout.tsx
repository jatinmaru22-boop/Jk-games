import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Gamepad2, Send, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, saveUser } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  const links = [
    { href: "/", label: "Lobby", icon: Home },
    { href: "/crash", label: "Crash", icon: Gamepad2 },
    { href: "/transfer", label: "Transfer", icon: Send },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold font-mono tracking-wider text-primary text-center">J&K <span className="text-foreground">PREMIUM</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 uppercase tracking-widest font-semibold text-sm ${isActive ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <UserIcon size={18} className="text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground">{user.username}</p>
              <p className="text-xs text-primary font-mono">${user.balance.toFixed(2)}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 border-sidebar-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => saveUser(null)}
          >
            <LogOut size={16} />
            LOG OUT
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <h1 className="text-xl font-bold font-mono tracking-wider text-primary">J&K</h1>
          <div className="flex gap-2">
            {links.map(link => {
               const Icon = link.icon;
               const isActive = location === link.href;
               return (
                 <Link key={link.href} href={link.href} className={`p-2 rounded-md ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                   <Icon size={20} />
                 </Link>
               )
            })}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
