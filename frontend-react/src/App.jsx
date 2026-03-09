import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import AnalysisForm from './components/AnalysisForm';
import Results from './components/Results';
import Knowledge from './components/Knowledge';
import About from './components/About';
import HealthRiskModule from './components/HealthRiskModule';
import HealthKnowledge from './components/HealthKnowledge';
import HealthReports from './components/HealthReports';

function App() {
  const [currentPage, setCurrentPage] = useState('analyzer');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [datasets, setDatasets] = useState(null);

  // Utility functions
  const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normCas = (s) => String(s ?? "").trim().replace(/\r/g, "");
  const isCas = (s) => /^\d{2,7}-\d{2}-\d$/.test(normCas(s));
  const toNumber = (v) => {
    const s = String(v ?? "").trim().replace(/\r/g, "");
    return s ? Number(s.replace(",", ".")) : NaN;
  };

  const pickKey = (obj, candidates, fallback) => {
    if (!obj) return null;
    const keys = Object.keys(obj);
    const normalizedKeys = keys.map(k => ({ original: k, normalized: norm(k) }));
    
    for (const candidate of candidates) {
      const found = normalizedKeys.find(k => k.normalized === norm(candidate));
      if (found) return found.original;
    }
    
    if (fallback) {
      const found = normalizedKeys.find(k => k.normalized.includes(norm(fallback)));
      if (found) return found.original;
    }
    return null;
  };

  // Simplified CSV parser
  function parseCsv(text) {
    const lines = text.replace(/\r\n/g, "\n").split("\n").filter(line => line.trim());
    if (!lines.length) return [];

    // Skip comment lines
    let headerIdx = 0;
    while (headerIdx < lines.length && lines[headerIdx].startsWith('#')) headerIdx++;
    if (headerIdx >= lines.length) return [];

    const headers = lines[headerIdx].replace(/^\uFEFF/, "").split(";").map(h => h.trim());
    const rows = [];

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      const values = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ';' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else current += char;
      }
      values.push(current.trim());

      const obj = {};
      headers.forEach((h, idx) => obj[h] = values[idx] || "");
      if (Object.values(obj).some(v => v)) rows.push(obj);
    }
    return rows;
  }

  // Scoring functions
  function scoreInflammability(sub) {
    if (!sub) return 0;
    
    const classKey = pickKey(sub, ['classification_ghs'], 'classification');
    const fpKey = pickKey(sub, ['point_eclair_celsius'], 'point');
    
    const ghs = norm(sub[classKey] || "");
    const fp = toNumber(sub[fpKey]);

    if (ghs.includes("flam") && ghs.includes("liq")) {
      if (ghs.includes("1")) return 30;
      if (ghs.includes("2")) return 20;
      if (ghs.includes("3")) return 10;
    }

    if (!isNaN(fp)) {
      if (fp < 0) return 30;
      if (fp < 23) return 20;
      if (fp < 60) return 10;
    }
    return 0;
  }

  function scoreToxicity(vmeRow, sub) {
    // VME data priority
    if (vmeRow) {
      const gravKey = pickKey(vmeRow, ['gravite_toxicologique'], 'gravite');
      const grav = norm(vmeRow[gravKey] || "");
      
      if (grav.includes("tres") && (grav.includes("elev") || grav.includes("elevee"))) return 35;
      if (grav.includes("elev") || grav.includes("elevee")) return 25;
      if (grav.includes("moy") || grav.includes("mod")) return 15;
      if (grav.includes("faib")) return 5;
      return 0; // No specific toxicity data found in VME
    }

    // GHS fallback
    if (sub) {
      const classKey = pickKey(sub, ['classification_ghs'], 'classification');
      const toxKey = pickKey(sub, ['toxicite'], 'tox');
      const ghs = norm(sub[classKey] || "");
      const toxValue = norm(sub[toxKey] || "");

      // Check toxicite field first
      if (toxValue.includes("elev") || toxValue.includes("élev")) return 25;
      if (toxValue.includes("mod") || toxValue.includes("moy")) return 15;
      if (toxValue.includes("faib")) return 8;

      // GHS patterns
      if (ghs.includes("carc") || ghs.includes("muta") || ghs.includes("repr")) return 25;
      if (ghs.includes("acute tox")) return 20;
      if (ghs.includes("corr") || ghs.includes("skin")) return 18;
      if (ghs.includes("ox.") || ghs.includes("oxid")) return 15;
      if (ghs.includes("tox")) return 15;
      if (ghs.includes("irrit") || ghs.includes("eye") || ghs.includes("resp")) return 10;
      if (ghs.includes("harm")) return 8;
    }
    return 0;
  }

  function scoreIncompatibilities(uniqueCas, incompatRows) {
    if (!Array.isArray(uniqueCas) || uniqueCas.length < 2 || !incompatRows?.length) return { score: 0, reactions: [] };

    const casSet = new Set(uniqueCas.map(cas => normCas(cas)));
    
    const dataRows = incompatRows.filter(row => {
      const firstValue = Object.values(row)[0];
      return !(typeof firstValue === 'string' && firstValue.startsWith('#')) && 
             row.cas_a && row.cas_a.trim();
    });

    let maxScore = 0;
    let reactions = [];
    
    for (const row of dataRows) {
      const a = normCas(row.cas_a || '');
      const b = normCas(row.cas_b || '');

      if (isCas(a) && isCas(b) && casSet.has(a) && casSet.has(b)) {
        const niveau = norm(row.niveau_risque || "");
        let score = 0;
        if (niveau.includes("tres") && (niveau.includes("elev") || niveau.includes("elevee"))) score = 50;
        else if (niveau.includes("elev") || niveau.includes("élevé")) score = 35;
        else if (niveau.includes("moyen")) score = 20;
        else if (niveau.includes("faible")) score = 8;
        else score = 10;
        
        if (score > 0) {
          reactions.push({
            substances: `${row.substance_a || ''} + ${row.substance_b || ''}`,
            product: row.produit_reaction || 'Produits de réaction non spécifiés',
            formula: row.formule_produit || '',
            equation: row.equation_reaction || '',
            risk_level: row.niveau_risque || '',
            justification: row.justification || ''
          });
        }
        
        maxScore = Math.max(maxScore, score);
      }
    }
    return { score: Math.min(maxScore, 35), reactions };
  }

  // Load CSV data
  useEffect(() => {
    (async () => {
      try {
        const [substancesText, vmeText, incompatText] = await Promise.all([
          fetch("/substances.csv").then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status}`)),
          fetch("/limites_exposition.csv").then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status}`)),
          fetch("/incompatibilites.csv").then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status}`))
        ]);

        const [substances, vme, incompat] = [substancesText, vmeText, incompatText].map(parseCsv);
        
        // Auto-detect keys and build indexes
        const sample = { sub: substances[0] || {}, vme: vme[0] || {}, incompat: incompat[0] || {} };
        
        const keys = {
          substance: {
            cas: pickKey(sample.sub, ['cas'], 'cas'),
            nom: pickKey(sample.sub, ['nom'], 'nom')
          },
          vme: { cas: pickKey(sample.vme, ['cas'], 'cas') }
        };

        const subByCas = new Map();
        const subByName = new Map();
        const vmeByCas = new Map();

        substances.forEach(s => {
          const cas = s[keys.substance.cas];
          const nom = s[keys.substance.nom];
          if (cas && isCas(cas)) subByCas.set(normCas(cas), s);
          if (nom) subByName.set(norm(nom), s);
        });

        vme.forEach(v => {
          const cas = v[keys.vme.cas];
          if (cas && isCas(cas)) vmeByCas.set(normCas(cas), v);
        });

        setDatasets({ substances, vme, incompat, subByCas, subByName, vmeByCas, keys });
        
      } catch (err) {
        setError(`Erreur de chargement CSV: ${err}`);
      }
    })();
  }, []);

  // Warmup backend to prevent cold start on Render
  useEffect(() => {
    const warmupBackend = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'https://l-ia-dans-la-gestion-des-risques-qviy.onrender.com';
        const response = await fetch(`${backendUrl}/warmup`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          console.log('✅ Backend warmup successful');
        }
      } catch (err) {
        console.warn('⚠️ Backend warmup failed (non-critical):', err.message);
      }
    };

    // Initial warmup on page load
    warmupBackend();

    // Periodic warmup every 10 minutes to prevent sleep on Render free tier
    const interval = setInterval(warmupBackend, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Utility: Fetch with retry logic
  const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    let lastError;
    const delays = [1000, 3000, 5000]; // 1s, 3s, 5s

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Tentative ${attempt + 1}/${maxRetries + 1}: ${options.method || 'GET'} ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`✅ Succès à la tentative ${attempt + 1}`);
          return response;
        }

        // If 5xx error, retry
        if (response.status >= 500) {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          if (attempt < maxRetries) {
            console.warn(`⚠️ Erreur ${response.status}, attente ${delays[attempt]}ms avant retry...`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
            continue;
          }
        }

        // If 4xx error, don't retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (err) {
        if (err.name === 'AbortError') {
          lastError = new Error('Timeout de la requête (30s)');
        } else {
          lastError = err;
        }

        if (attempt < maxRetries) {
          console.warn(`❌ Tentative ${attempt + 1} échouée:`, err.message);
          console.log(`⏳ Attente ${delays[attempt]}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        }
      }
    }

    throw lastError || new Error('Échec de la requête après plusieurs tentatives');
  };

  // Analysis function
  const handleAnalyze = async (formData) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      if (!datasets) throw new Error("Les données CSV ne sont pas encore chargées.");

      // Extract input lines
      let lines = [];
      if (Array.isArray(formData?.substances)) {
        lines = formData.substances.map(String).map(s => s.trim()).filter(Boolean);
      } else if (formData?.substanceA || formData?.substanceB) {
        // Handle the new format with separate inputs
        if (formData.substanceA?.trim()) lines.push(formData.substanceA.trim());
        if (formData.substanceB?.trim()) lines.push(formData.substanceB.trim());
      } else if (formData?.substancesText || formData?.substances) {
        const text = formData.substancesText || formData.substances;
        lines = String(text).split("\n").map(s => s.trim()).filter(Boolean);
      }

      if (!lines.length) throw new Error("Veuillez saisir au moins une substance.");

      // Prepare data to send to backend
      const requestData = {
        substances: lines,
        contexte_labo: {
          ventilation: formData.ventilation !== false,
          temperature_c: formData.temperature ? parseFloat(formData.temperature) : 22,
          humidite_percent: formData.humidity ? parseFloat(formData.humidity) : 50
        }
      };

      console.log("🚀 Envoi au backend:", requestData);

      // Call backend API with retry logic
      const backendUrl = import.meta.env.VITE_API_URL || 'https://l-ia-dans-la-gestion-des-risques-qviy.onrender.com';
      console.log("📡 Backend URL:", backendUrl);
      
      const response = await fetchWithRetry(`${backendUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        timeout: 30000
      }, 2); // Max 2 retries (3 attempts total)

      const result = await response.json();
      console.log("✅ Réponse backend:", result);

      setAnalysisResult(result);

    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
      console.error("❌ Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Header setCurrentPage={setCurrentPage} currentPage={currentPage} />

        <main className="flex-grow">
          {currentPage === 'analyzer' && (
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl relative">
              {/* Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-200/20 dark:bg-emerald-700/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-200/20 dark:bg-cyan-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                
                <div className="lg:col-span-5 w-full">
                  <AnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} error={error} />
                </div>

                <div className="lg:col-span-7 w-full">
                  {analysisResult ? (
                    <Results data={analysisResult} />
                  ) : (
                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/50 dark:to-cyan-900/50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
                        🧪
                      </div>
                      <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-2">En attente d'analyse</h3>
                      <p className="max-w-xs mx-auto text-sm">
                        Remplissez le formulaire à gauche et lancez l'analyse pour voir les résultats.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {currentPage === 'health-risk' && <HealthRiskModule />}

          {currentPage === 'health-knowledge' && <HealthKnowledge />}

          {currentPage === 'health-reports' && <HealthReports />}

          {currentPage === 'knowledge' && <Knowledge />}

          {currentPage === 'about' && <About />}
        </main>

        <footer className="bg-slate-900 dark:bg-black text-slate-400 dark:text-slate-500 py-8 text-center text-sm border-t border-slate-800 dark:border-slate-800">
          <div className="container mx-auto px-4">
            <p className="mb-2">© 2026 - Projet IUT Génie Chimique</p>
            <p className="text-xs text-slate-500 dark:text-slate-600 max-w-2xl mx-auto">
              Avertissement : Ce système est un outil pédagogique. Il ne remplace pas l'avis d'un expert en sécurité.
            </p>
          </div>
        </footer>
      </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;