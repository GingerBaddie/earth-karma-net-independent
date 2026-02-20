import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/submit", label: "Submit Activity" },
        { to: "/events", label: "Events" },
        { to: "/coupons", label: "Coupons" },
        { to: "/leaderboard", label: "Leaderboard" },
        ...(role === "organizer" ? [{ to: "/admin", label: "Admin Panel" }] : []),
        ...(role === "admin" ? [{ to: "/admin", label: "Admin Panel" }, { to: "/super-admin", label: "Super Admin" }] : []),
      ]
    : [];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <Leaf className="h-6 w-6" />
          EcoTrack
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
          <Button variant="ghost" size="icon" onClick={toggle} className="ml-1" aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-1">
              <LogOut className="mr-1 h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <div className="ml-2 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log In</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Sign Up</Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <button onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setOpen(false); }}>Log In</Button>
                <Button size="sm" onClick={() => { navigate("/register"); setOpen(false); }}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
