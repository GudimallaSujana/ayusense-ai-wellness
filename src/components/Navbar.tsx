import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 text-primary">
          <span className="text-2xl">🌿</span>
          <span className="font-serif text-2xl font-bold tracking-wide">Ayusense</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#" className="text-foreground/80 hover:text-primary transition-colors">Home</a>
          <a href="#about" className="text-foreground/80 hover:text-primary transition-colors">About</a>
          <a href="#contact" className="text-foreground/80 hover:text-primary transition-colors">Contact</a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3 text-sm font-medium">
          <a href="#" className="text-foreground/80 hover:text-primary transition-colors" onClick={() => setOpen(false)}>Home</a>
          <a href="#about" className="text-foreground/80 hover:text-primary transition-colors" onClick={() => setOpen(false)}>About</a>
          <a href="#contact" className="text-foreground/80 hover:text-primary transition-colors" onClick={() => setOpen(false)}>Contact</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
