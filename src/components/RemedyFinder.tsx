import { useState } from "react";
import { ArrowLeft, Search, Loader2, AlertTriangle, Heart, Salad, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { findRemedy, type RemedyResult } from "@/lib/api";

const RemedyFinder = ({ onBack }: { onBack: () => void }) => {
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RemedyResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const data = await findRemedy(symptoms, location || undefined);
      setResult(data);
    } catch (err: any) {
      toast({
        title: "Analysis Failed",
        description: err.message || "Could not analyze symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Back to options
      </button>

      <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">Find Ayurvedic Remedy</h2>
      <p className="text-muted-foreground mb-8">Enter your symptoms for AI-powered personalized Ayurvedic recommendations.</p>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/80 mb-1 block">Symptoms / Disease</label>
          <Input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. stress, headache, insomnia, fatigue, joint pain"
            className="bg-background/50"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground/80 mb-1 block">Location (optional — for regional plant availability)</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Mumbai, Maharashtra"
            className="bg-background/50"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !symptoms.trim()}
          className="w-full golden-glow bg-primary hover:bg-secondary text-primary-foreground"
        >
          {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Analyzing Suitable Remedies ....</> : <><Search className="mr-2" size={16} /> Find Remedies</>}
        </Button>
      </form>

      {result && (
        <div className="mt-8 space-y-6 animate-fade-in-up">
          {/* Dosha Analysis Card */}
          {(result.doshaAnalysis || result.prakritiInsight) && (
            <div className="glass-card p-6 border-l-4 border-accent">
              <h3 className="font-serif text-xl font-bold text-primary mb-3 flex items-center gap-2">
                <Heart size={18} /> Dosha & Prakriti Analysis
              </h3>
              {result.doshaAnalysis && (
                <div className="mb-3">
                  <h4 className="font-semibold text-sm text-accent mb-1">Dosha Imbalance</h4>
                  <p className="text-sm text-foreground/80">{result.doshaAnalysis}</p>
                </div>
              )}
              {result.prakritiInsight && (
                <div>
                  <h4 className="font-semibold text-sm text-accent mb-1">Constitution Insight</h4>
                  <p className="text-sm text-foreground/80">{result.prakritiInsight}</p>
                </div>
              )}
              {result.severity && (
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="bg-accent/10 text-accent px-3 py-1 rounded-full">Severity: {result.severity}</span>
                  {result.duration && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Duration: {result.duration}</span>}
                </div>
              )}
            </div>
          )}

          {/* Matched Conditions */}
          {result.matchedConditions && result.matchedConditions.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground">Matched conditions:</span>
              {result.matchedConditions.map((c, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{c}</span>
              ))}
            </div>
          )}

          {/* Plant Recommendations */}
          {result.plants.map((plant, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-xl font-bold text-primary">{plant.name}</h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {plant.confidence}% match
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-accent mb-1">🧠 Why Recommended</h4>
                  <p className="text-foreground/80">{plant.reason}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent mb-1">⚙️ How It Works</h4>
                  <p className="text-foreground/80">{plant.mechanism}</p>
                </div>
                {plant.doshaEffect && (
                  <div>
                    <h4 className="font-semibold text-accent mb-1">🕉️ Dosha Effect</h4>
                    <p className="text-foreground/80">{plant.doshaEffect}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-accent mb-1">🏡 Safe Home Remedy</h4>
                  <p className="text-foreground/80">{plant.remedy}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <h4 className="font-semibold text-destructive mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> Precautions
                  </h4>
                  <p className="text-foreground/80">{plant.precautions}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Diet & Yoga */}
          {(result.dietRecommendations || result.yogaRecommendations) && (
            <div className="grid md:grid-cols-2 gap-6">
              {result.dietRecommendations && (
                <div className="glass-card p-6">
                  <h4 className="font-semibold text-sm text-accent mb-2 flex items-center gap-2">
                    <Salad size={16} /> Diet & Lifestyle
                  </h4>
                  <p className="text-sm text-foreground/80">{result.dietRecommendations}</p>
                </div>
              )}
              {result.yogaRecommendations && (
                <div className="glass-card p-6">
                  <h4 className="font-semibold text-sm text-accent mb-2 flex items-center gap-2">
                    <Dumbbell size={16} /> Yoga & Therapy
                  </h4>
                  <p className="text-sm text-foreground/80">{result.yogaRecommendations}</p>
                </div>
              )}
            </div>
          )}

          {/* Alternatives */}
          {result.alternatives && result.alternatives.length > 0 && (
            <div className="glass-card p-6">
              <h4 className="font-semibold text-sm text-accent mb-2">🔄 Alternative Plant Suggestions</h4>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((a, i) => (
                  <span key={i} className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="text-xs text-muted-foreground text-center p-4 border border-border/50 rounded-lg">
              ⚕️ {result.disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RemedyFinder;
