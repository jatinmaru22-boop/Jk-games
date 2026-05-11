import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Rocket, Bomb, LayoutGrid, Zap, Swords, Send, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, saveUser } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  const gameLinks = [
    { href: "/", label: "Lobby", icon: Home },
    { href: "/crash", label: "Aviator", icon: Rocket },
    { href: "/mines", label: "Mines", icon: Bomb },
    { href: "/slots", label: "Slots", icon: LayoutGrid },
    { href: "/chicken-road", label: "Chicken Road", icon: Zap },
    { href: "/dragon-tiger", label: "Dragon Tiger", icon: Swords },
  ];

  const accountLinks = [
    { href: "/transfer", label: "Transfer", icon: Send },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  const renderNavLinks = (links: typeof gameLinks) => {
    return links.map((link) => {
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
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold font-mono tracking-wider text-primary text-center">J&K <span className="text-foreground">PREMIUM</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-6">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 mb-2">Games</h2>
            <nav className="space-y-1">
              {renderNavLinks(gameLinks)}
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 mb-2">Account</h2>
            <nav className="space-y-1">
              {renderNavLinks(accountLinks)}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border mt-auto shrink-0 bg-sidebar">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
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
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
          <h1 className="text-xl font-bold font-mono tracking-wider text-primary">J&K</h1>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[...gameLinks, ...accountLinks].map(link => {
               const Icon = link.icon;
               const isActive = location === link.href;
               return (
                 <Link key={link.href} href={link.href} className={`p-2 shrink-0 rounded-md ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                   <Icon size={20} />
                 </Link>
               )
            })}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}