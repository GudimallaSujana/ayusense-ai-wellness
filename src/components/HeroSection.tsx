const HeroSection = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-slate-50 to-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute right-0 bottom-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-fade-in-up">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight">
          Ayusense
        </h1>
        <p className="font-serif text-xl md:text-2xl text-accent font-semibold mb-4 italic">
          Intelligent Ayurvedic Wellness
        </p>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Combining Ancient Wisdom with Artificial Intelligence for Personalized Natural Healing.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
