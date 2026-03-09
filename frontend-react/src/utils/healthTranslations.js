export const healthTranslations = {
    fr: {
        // HealthRiskModule
        healthRiskAssessment: "Évaluation des Risques Sanitaires",
        evaluateLongTerm: "Évaluez les risques sanitaires à long terme des substances chimiques, notamment la cancérogénicité, la mutagénicité et la toxicité chronique.",
        
        searchChemical: "Rechercher une Substance",
        chemicalNameOrCAS: "Nom de la substance ou numéro CAS",
        placeholderExample: "ex: Benzène, 71-43-2",
        exposureRoute: "Voie d'Exposition (Optionnel)",
        exposureDuration: "Durée d'Exposition (Optionnel)",
        inhalation: "Inhalation",
        dermalContact: "Contact Cutané",
        ingestion: "Ingestion",
        shortTerm: "Court Terme",
        repeated: "Répétée",
        chronic: "Chronique",
        analyze: "Analyser",
        noAnalysisYet: "Aucune analyse pour le moment",
        enterChemicalToBegin: "Entrez un nom de substance ou un numéro CAS pour commencer l'évaluation des risques sanitaires.",
        tip: "Conseil: Entrez un nom de substance ou un numéro CAS pour obtenir une évaluation complète des risques sanitaires.",
        
        // Results cards
        carcinogenicity: "Cancérogénicité",
        mutagenicity: "Mutagénicité",
        genotoxicity: "Génotoxicité",
        chronicToxicity: "Toxicité Chronique",
        exposureRoutes: "Voies d'Exposition",
        targetOrgans: "Organes Cibles",
        mechanisms: "Mécanismes d'Action",
        summary: "Résumé du Risque",
        
        riskLevel: "Niveau de Risque",
        critical: "CRITIQUE",
        high: "ÉLEVÉ",
        moderate: "MODÉRÉ",
        low: "FAIBLE",
        
        iarc1: "Cancérogène avéré pour l'homme",
        iarc2a: "Probablement cancérogène pour l'homme",
        iarc2b: "Peut-être cancérogène pour l'homme",
        iarcOther: "Non classé",
        
        // HealthKnowledge
        carcinogenicSubstances: "Substances Cancérigènes",
        learnAboutCarcinogens: "Découvrez les substances reconnues comme cancérigènes selon la classification du CIRC (Centre International de Recherche sur le Cancer).",
        
        group1: "Groupe 1: Cancérigène Avéré",
        group1Desc: "(Preuves suffisantes de cancérogénicité chez l'homme)",
        group2a: "Groupe 2A: Probablement Cancérigène",
        group2aDesc: "(Preuves limitées chez l'homme, suffisantes chez l'animal)",
        group2b: "Groupe 2B: Peut-être Cancérigène",
        group2bDesc: "(Preuves insuffisantes chez l'homme, limitées chez l'animal)",
        others: "Autres Classifications",
        
        iarcClassification: "Classification CIRC",
        legend: "Légende",
        carcinogenic: "Cancérigène",
        mutagenic: "Mutagène",
        reproductiveToxic: "Toxique pour la Reproduction",
        
        cas: "CAS",
        chemicalName: "Nom de la Substance",
        searchByName: "Rechercher par nom ou CAS...",
        
        noResultsFound: "Aucun résultat trouvé",
        noMatchingChemicals: "Aucune substance ne correspond à votre recherche."
    },
    
    en: {
        // HealthRiskModule
        healthRiskAssessment: "Health Risk Assessment",
        evaluateLongTerm: "Evaluate the long-term health hazards of chemical substances, including carcinogenicity, mutagenicity, and chronic toxicity.",
        
        searchChemical: "Search Substance",
        chemicalNameOrCAS: "Substance Name or CAS Number",
        placeholderExample: "e.g., Benzene, 71-43-2",
        exposureRoute: "Exposure Route (Optional)",
        exposureDuration: "Exposure Duration (Optional)",
        inhalation: "Inhalation",
        dermalContact: "Dermal Contact",
        ingestion: "Ingestion",
        shortTerm: "Short Term",
        repeated: "Repeated",
        chronic: "Chronic",
        analyze: "Analyze",
        noAnalysisYet: "No analysis yet",
        enterChemicalToBegin: "Enter a substance name or CAS number to begin the health risk assessment.",
        tip: "Tip: Enter a substance name or CAS number to get a comprehensive health risk assessment.",
        
        // Results cards
        carcinogenicity: "Carcinogenicity",
        mutagenicity: "Mutagenicity",
        genotoxicity: "Genotoxicity",
        chronicToxicity: "Chronic Toxicity",
        exposureRoutes: "Exposure Routes",
        targetOrgans: "Target Organs",
        mechanisms: "Action Mechanisms",
        summary: "Risk Summary",
        
        riskLevel: "Risk Level",
        critical: "CRITICAL",
        high: "HIGH",
        moderate: "MODERATE",
        low: "LOW",
        
        iarc1: "Carcinogenic to humans",
        iarc2a: "Probably carcinogenic to humans",
        iarc2b: "Possibly carcinogenic to humans",
        iarcOther: "Not classified",
        
        // HealthKnowledge
        carcinogenicSubstances: "Carcinogenic Substances",
        learnAboutCarcinogens: "Learn about substances recognized as carcinogenic according to the IARC (International Agency for Research on Cancer) classification.",
        
        group1: "Group 1: Carcinogenic to Humans",
        group1Desc: "(Sufficient evidence of carcinogenicity in humans)",
        group2a: "Group 2A: Probably Carcinogenic",
        group2aDesc: "(Limited evidence in humans, sufficient in animals)",
        group2b: "Group 2B: Possibly Carcinogenic",
        group2bDesc: "(Insufficient evidence in humans, limited in animals)",
        others: "Other Classifications",
        
        iarcClassification: "IARC Classification",
        legend: "Legend",
        carcinogenic: "Carcinogenic",
        mutagenic: "Mutagenic",
        reproductiveToxic: "Reproductive Toxic",
        
        cas: "CAS",
        chemicalName: "Substance Name",
        searchByName: "Search by name or CAS...",
        
        noResultsFound: "No results found",
        noMatchingChemicals: "No substances match your search."
    }
};

export const getTranslation = (language, key) => {
    return healthTranslations[language]?.[key] || healthTranslations.fr[key] || key;
};
