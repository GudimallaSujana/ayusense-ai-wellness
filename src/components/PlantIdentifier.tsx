import { useState, useRef } from "react";
import { Upload, ArrowLeft, Leaf, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { identifyPlant, type PlantIdentificationResult } from "@/lib/api";

const PlantIdentifier = ({ onBack }: { onBack: () => void }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleIdentify = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const data = await identifyPlant(image);
      setResult(data);
    } catch (err: any) {
      toast({
        title: "Identification Failed",
        description: err.message || "Could not identify the plant. Please try again.",
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

      <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">Identify Medicinal Plant</h2>
      <p className="text-muted-foreground mb-8">Upload a plant image to discover its Ayurvedic benefits powered by AI.</p>

      <div className="glass-card p-8">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {!image ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <Upload size={40} className="text-muted-foreground" />
            <span className="text-muted-foreground">Click to upload a plant image</span>
          </button>
        ) : (
          <div className="space-y-4">
            <img src={image} alt="Uploaded plant" className="w-full max-h-72 object-contain rounded-lg" />
            <div className="flex gap-3">
              <Button onClick={() => { setImage(null); setResult(null); }} variant="outline" className="flex-1">
                Change Image
              </Button>
              <Button onClick={handleIdentify} disabled={loading} className="flex-1 golden-glow bg-primary hover:bg-secondary text-primary-foreground">
                {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Analyzing with AI...</> : <><Leaf className="mr-2" size={16} /> Identify Plant</>}
              </Button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-8 space-y-6 animate-fade-in-up">
          {/* Database match indicator */}
          {result.databaseMatch !== undefined && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${result.databaseMatch ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
              {result.databaseMatch ? '✅ Verified match from our database of 704+ medicinal herbs' : '⚠️ ' + (result.warning || 'Plant not found in verified database. Results are AI-generated.')}
            </div>
          )}

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-primary">{result.plantName}</h3>
                <p className="text-muted-foreground italic">{result.scientificName}</p>
                {result.family && <p className="text-xs text-muted-foreground">Family: {result.family}</p>}
                {result.description && <p className="text-sm text-foreground/70 mt-2">{result.description}</p>}
              </div>
              <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {result.confidence}% confidence
              </span>
            </div>

            {result.ayurvedicProfile && (
              <div className="mb-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <h4 className="font-semibold text-sm text-accent mb-3">🕉️ Ayurvedic Profile (Dravyaguna)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="font-medium text-foreground/60">Rasa:</span> <span className="text-foreground/80">{result.ayurvedicProfile.rasa.join(", ")}</span></div>
                  <div><span className="font-medium text-foreground/60">Guna:</span> <span className="text-foreground/80">{result.ayurvedicProfile.guna.join(", ")}</span></div>
                  <div><span className="font-medium text-foreground/60">Virya:</span> <span className="text-foreground/80">{result.ayurvedicProfile.virya}</span></div>
                  <div><span className="font-medium text-foreground/60">Vipaka:</span> <span className="text-foreground/80">{result.ayurvedicProfile.vipaka}</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.ayurvedicProfile.doshaEffect.pacifies.map((d, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Pacifies {d}</span>
                  ))}
                  {result.ayurvedicProfile.doshaEffect.aggravates.map((d, i) => (
                    <span key={i} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Aggravates {d}</span>
                  ))}
                </div>
                {result.ayurvedicProfile.prabhav.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-foreground/60">Prabhav: </span>
                    <span className="text-xs text-foreground/80">{result.ayurvedicProfile.prabhav.join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Treated Conditions from Database */}
            {result.treatedConditions && result.treatedConditions.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-sm text-primary mb-3">🏥 Conditions This Plant Treats (from Database)</h4>
                <div className="grid gap-3">
                  {result.treatedConditions.slice(0, 8).map((tc, i) => (
                    <div key={i} className="p-3 rounded bg-background/50 border border-border/50">
                      <p className="font-medium text-sm text-foreground">{tc.disease}</p>
                      <p className="text-xs text-muted-foreground mt-1">Symptoms: {tc.symptoms}</p>
                      {tc.formulation && <p className="text-xs text-primary mt-1">💊 {tc.formulation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm text-accent mb-2">🌿 Health Benefits</h4>
                <ul className="space-y-1 text-sm text-foreground/80">
                  {result.benefits.map((b, i) => <li key={i}>• {b}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-accent mb-2">🏡 Safe Home Remedies</h4>
                <ul className="space-y-1 text-sm text-foreground/80">
                  {result.remedies.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-sm text-accent mb-1">🌤️ Climate Suitability</h4>
                <p className="text-sm text-foreground/80">{result.climate}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-accent mb-1">📍 Regional Availability</h4>
                <p className="text-sm text-foreground/80">{result.availability}</p>
              </div>
            </div>

            {result.precautions && result.precautions.length > 0 && (
              <div className="mt-6 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <h4 className="font-semibold text-sm text-destructive mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} /> Precautions
                </h4>
                <ul className="space-y-1 text-sm text-foreground/80">
                  {result.precautions.map((p, i) => <li key={i}>• {p}</li>)}
                </ul>
              </div>
            )}

            {result.traditionalUses && (
              <div className="mt-6">
                <h4 className="font-semibold text-sm text-accent mb-1">📜 Traditional Ayurvedic Uses</h4>
                <p className="text-sm text-foreground/80">{result.traditionalUses}</p>
              </div>
            )}

            <div className="mt-6">
              <h4 className="font-semibold text-sm text-accent mb-2">🔄 Alternative Plants</h4>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((a, i) => (
                  <span key={i} className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-serif text-xl font-bold text-primary mb-3">🧠 AI Analysis Explanation</h3>
            <p className="text-sm text-foreground/80 mb-4">
              {result.whyIdentified || `The AI model detected key morphological features with ${result.confidence}% confidence based on visual analysis.`}
            </p>
            <h4 className="font-semibold text-sm text-accent mb-2">Key Features Detected</h4>
            <div className="flex flex-wrap gap-2">
              {result.features.map((f, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantIdentifier;
