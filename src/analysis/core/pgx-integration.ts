// ============================================================================
// PGx Integration Module for DNA Analysis App
// ============================================================================
// Drop this into your project and call analyzePGx(genotypes) to get results
// ============================================================================

import type { Genotype } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface StarAlleleDefinition {
  allele: string;
  function: "Normal" | "Decreased" | "No function" | "Increased" | "Unknown";
  activityScore?: number;
  definingVariants: string[];
}

export interface Diplotype {
  gene: string;
  allele1: string;
  allele2: string;
  diplotype: string;
}

export interface PhenotypePrediction {
  gene: string;
  diplotype: string;
  phenotype: "Ultrarapid Metabolizer" | "Rapid Metabolizer" | "Normal Metabolizer" | 
             "Intermediate Metabolizer" | "Poor Metabolizer" | "Unknown" | "Indeterminate";
  activityScore?: number;
  confidence: "Definitive" | "Moderate" | "Low";
}

export interface DrugRecommendation {
  drug: string;
  gene: string;
  phenotype: string;
  recommendation: string;
  implication: string;
  strength: "Strong" | "Moderate" | "Optional";
  source: string;
}

export interface PGxResult {
  gene: string;
  diplotype: Diplotype;
  phenotype: PhenotypePrediction;
  recommendations: DrugRecommendation[];
  warnings: string[];
  affectedDrugs: string[];
}

// ============================================================================
// STAR ALLELE DEFINITIONS
// ============================================================================

const GENE_DEFINITIONS: Record<string, {
  gene: string;
  chromosome: string;
  alleles: StarAlleleDefinition[];
  hasCNV?: boolean;
  activityScoreBased?: boolean;
}> = {
  CYP2D6: {
    gene: "CYP2D6",
    chromosome: "22",
    hasCNV: true,
    activityScoreBased: true,
    alleles: [
      { allele: "*1", function: "Normal", activityScore: 1.0, definingVariants: [] },
      { allele: "*2", function: "Normal", activityScore: 1.0, definingVariants: ["rs16947"] },
      { allele: "*3", function: "No function", activityScore: 0, definingVariants: ["rs35742686"] },
      { allele: "*4", function: "No function", activityScore: 0, definingVariants: ["rs3892097"] },
      { allele: "*6", function: "No function", activityScore: 0, definingVariants: ["rs5030655"] },
      { allele: "*9", function: "Decreased", activityScore: 0.5, definingVariants: ["rs5030656"] },
      { allele: "*10", function: "Decreased", activityScore: 0.25, definingVariants: ["rs1065852"] },
      { allele: "*17", function: "Decreased", activityScore: 0.5, definingVariants: ["rs28371706"] },
      { allele: "*29", function: "Decreased", activityScore: 0.5, definingVariants: ["rs59421388"] },
      { allele: "*41", function: "Decreased", activityScore: 0.5, definingVariants: ["rs28371725"] },
    ]
  },
  
  CYP2C19: {
    gene: "CYP2C19",
    chromosome: "10",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*2", function: "No function", definingVariants: ["rs4244285"] },
      { allele: "*3", function: "No function", definingVariants: ["rs4986893"] },
      { allele: "*17", function: "Increased", definingVariants: ["rs12248560"] },
    ]
  },
  
  CYP2C9: {
    gene: "CYP2C9",
    chromosome: "10",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*2", function: "Decreased", definingVariants: ["rs1799853"] },
      { allele: "*3", function: "No function", definingVariants: ["rs1057910"] },
      { allele: "*5", function: "No function", definingVariants: ["rs28371686"] },
      { allele: "*6", function: "No function", definingVariants: ["rs9332131"] },
      { allele: "*8", function: "Decreased", definingVariants: ["rs7900194"] },
      { allele: "*11", function: "Decreased", definingVariants: ["rs28371685"] },
    ]
  },

  CYP3A5: {
    gene: "CYP3A5",
    chromosome: "7",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*3", function: "No function", definingVariants: ["rs776746"] },
    ]
  },

  VKORC1: {
    gene: "VKORC1",
    chromosome: "16",
    hasCNV: false,
    alleles: [
      { allele: "G", function: "Normal", definingVariants: [] },
      { allele: "A", function: "Decreased", definingVariants: ["rs9923231"] },
    ]
  },

  SLCO1B1: {
    gene: "SLCO1B1",
    chromosome: "12",
    hasCNV: false,
    alleles: [
      { allele: "*1a", function: "Normal", definingVariants: [] },
      { allele: "*1b", function: "Normal", definingVariants: ["rs2306283"] },
      { allele: "*5", function: "Decreased", definingVariants: ["rs4149056"] },
    ]
  },

  TPMT: {
    gene: "TPMT",
    chromosome: "6",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*2", function: "No function", definingVariants: ["rs1800462"] },
      { allele: "*3A", function: "No function", definingVariants: ["rs1800460", "rs1142345"] },
      { allele: "*3B", function: "No function", definingVariants: ["rs1800460"] },
      { allele: "*3C", function: "No function", definingVariants: ["rs1142345"] },
    ]
  },

  DPYD: {
    gene: "DPYD",
    chromosome: "1",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*2A", function: "No function", definingVariants: ["rs3918290"] },
      { allele: "*13", function: "No function", definingVariants: ["rs55886062"] },
      { allele: "c.2846A>T", function: "Decreased", definingVariants: ["rs67376798"] },
      { allele: "HapB3", function: "Decreased", definingVariants: ["rs56038477"] },
    ]
  },

  NUDT15: {
    gene: "NUDT15",
    chromosome: "13",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*2", function: "No function", definingVariants: ["rs116855232"] },
      { allele: "*3", function: "No function", definingVariants: ["rs147390019"] },
    ]
  },

  NAT2: {
    gene: "NAT2",
    chromosome: "8",
    hasCNV: false,
    alleles: [
      { allele: "*4", function: "Normal", definingVariants: [] },
      { allele: "*5", function: "Decreased", definingVariants: ["rs1801280"] },
      { allele: "*6", function: "Decreased", definingVariants: ["rs1799930"] },
      { allele: "*7", function: "Decreased", definingVariants: ["rs1799931"] },
    ]
  },

  CYP2B6: {
    gene: "CYP2B6",
    chromosome: "19",
    hasCNV: false,
    alleles: [
      { allele: "*1", function: "Normal", definingVariants: [] },
      { allele: "*6", function: "Decreased", definingVariants: ["rs3745274"] },
      { allele: "*18", function: "No function", definingVariants: ["rs28399499"] },
    ]
  },

  ABCG2: {
    gene: "ABCG2",
    chromosome: "4",
    hasCNV: false,
    alleles: [
      { allele: "C", function: "Normal", definingVariants: [] },
      { allele: "A", function: "Decreased", definingVariants: ["rs2231142"] },
    ]
  }
};

// Phenotype mappings
const CYP2D6_ACTIVITY_SCORE_PHENOTYPE: Record<string, string> = {
  "0": "Poor Metabolizer",
  "0.25": "Poor Metabolizer",
  "0.5": "Intermediate Metabolizer",
  "1": "Intermediate Metabolizer",
  "1.5": "Normal Metabolizer",
  "2": "Normal Metabolizer",
  ">2": "Ultrarapid Metabolizer",
};

const PHENOTYPE_TABLES: Record<string, Record<string, string>> = {
  CYP2C19: {
    "*1/*1": "Normal Metabolizer",
    "*1/*2": "Intermediate Metabolizer",
    "*1/*3": "Intermediate Metabolizer",
    "*1/*17": "Rapid Metabolizer",
    "*2/*2": "Poor Metabolizer",
    "*2/*3": "Poor Metabolizer",
    "*2/*17": "Intermediate Metabolizer",
    "*17/*17": "Ultrarapid Metabolizer",
  },
  CYP2C9: {
    "*1/*1": "Normal Metabolizer",
    "*1/*2": "Intermediate Metabolizer",
    "*1/*3": "Intermediate Metabolizer",
    "*2/*2": "Poor Metabolizer",
    "*2/*3": "Poor Metabolizer",
    "*3/*3": "Poor Metabolizer",
  },
  TPMT: {
    "*1/*1": "Normal Metabolizer",
    "*1/*2": "Intermediate Metabolizer",
    "*1/*3A": "Intermediate Metabolizer",
    "*1/*3B": "Intermediate Metabolizer",
    "*1/*3C": "Intermediate Metabolizer",
    "*2/*2": "Poor Metabolizer",
    "*3A/*3A": "Poor Metabolizer",
    "*3B/*3B": "Poor Metabolizer",
    "*3C/*3C": "Poor Metabolizer",
  }
};

// Drug recommendations database
const DRUG_DB: DrugRecommendation[] = [
  // CYP2D6 - Codeine
  {
    drug: "Codeine",
    gene: "CYP2D6",
    phenotype: "Ultrarapid Metabolizer",
    recommendation: "⛔ AVOID codeine. Use alternative analgesic. Risk of fatal toxicity.",
    implication: "Greatly increased morphine formation → higher toxicity risk",
    strength: "Strong",
    source: "CPIC"
  },
  {
    drug: "Codeine",
    gene: "CYP2D6",
    phenotype: "Poor Metabolizer",
    recommendation: "⛔ AVOID codeine. Insufficient pain relief.",
    implication: "Greatly reduced morphine formation",
    strength: "Strong",
    source: "CPIC"
  },

  // CYP2D6 - Tamoxifen
  {
    drug: "Tamoxifen",
    gene: "CYP2D6",
    phenotype: "Poor Metabolizer",
    recommendation: "Consider aromatase inhibitor instead. Reduced tamoxifen efficacy.",
    implication: "Reduced endoxifen formation",
    strength: "Moderate",
    source: "CPIC"
  },

  // CYP2C19 - Clopidogrel
  {
    drug: "Clopidogrel",
    gene: "CYP2C19",
    phenotype: "Poor Metabolizer",
    recommendation: "⛔ Use alternative (prasugrel/ticagrelor). FDA boxed warning.",
    implication: "Reduced activation → increased CV event risk",
    strength: "Strong",
    source: "CPIC/FDA"
  },
  {
    drug: "Clopidogrel",
    gene: "CYP2C19",
    phenotype: "Intermediate Metabolizer",
    recommendation: "Consider alternative or higher dose (150mg loading).",
    implication: "Reduced clopidogrel activation",
    strength: "Moderate",
    source: "CPIC/FDA"
  },

  // SLCO1B1 - Statins
  {
    drug: "Simvastatin",
    gene: "SLCO1B1",
    phenotype: "Poor function",
    recommendation: "⛔ AVOID high-dose simvastatin (>40mg). Use alternative statin.",
    implication: "17-fold increased myopathy risk at 80mg dose",
    strength: "Strong",
    source: "CPIC/FDA"
  },

  // TPMT - Thiopurines
  {
    drug: "Azathioprine/6-MP",
    gene: "TPMT",
    phenotype: "Poor Metabolizer",
    recommendation: "⛔ CRITICAL: AVOID or reduce to 10% dose. Risk of FATAL myelosuppression.",
    implication: "Absent TPMT activity → severe bone marrow toxicity",
    strength: "Strong",
    source: "CPIC/FDA"
  },
  {
    drug: "Azathioprine/6-MP",
    gene: "TPMT",
    phenotype: "Intermediate Metabolizer",
    recommendation: "Reduce dose to 30-80%. Monitor CBC weekly × 4 weeks.",
    implication: "Reduced TPMT activity → increased toxicity risk",
    strength: "Strong",
    source: "CPIC/FDA"
  },

  // NUDT15 - Thiopurines
  {
    drug: "Azathioprine/6-MP/Thioguanine",
    gene: "NUDT15",
    phenotype: "Poor function",
    recommendation: "⛔ CRITICAL: AVOID or reduce to 10% dose. Severe leukopenia risk.",
    implication: "Absent NUDT15 activity → early severe toxicity",
    strength: "Strong",
    source: "CPIC"
  },

  // DPYD - Fluoropyrimidines
  {
    drug: "5-Fluorouracil/Capecitabine",
    gene: "DPYD",
    phenotype: "Poor Metabolizer",
    recommendation: "⛔ CRITICAL: AVOID fluoropyrimidines. Risk of FATAL toxicity.",
    implication: "Absent DPD enzyme → toxic drug accumulation",
    strength: "Strong",
    source: "CPIC/FDA"
  },
  {
    drug: "5-Fluorouracil/Capecitabine",
    gene: "DPYD",
    phenotype: "Intermediate Metabolizer",
    recommendation: "⚠️ Reduce starting dose by 50%. Monitor closely.",
    implication: "Reduced DPD activity → increased toxicity risk",
    strength: "Strong",
    source: "CPIC/FDA"
  },

  // CYP2C9/VKORC1 - Warfarin
  {
    drug: "Warfarin",
    gene: "CYP2C9",
    phenotype: "Poor Metabolizer",
    recommendation: "Start with 25-50% reduced dose. Monitor INR closely.",
    implication: "Decreased warfarin metabolism → higher bleeding risk",
    strength: "Strong",
    source: "CPIC/FDA"
  },
  {
    drug: "Warfarin",
    gene: "VKORC1",
    phenotype: "High sensitivity",
    recommendation: "Start with low dose (0.5-2mg). Monitor INR closely.",
    implication: "Increased warfarin sensitivity",
    strength: "Strong",
    source: "CPIC/FDA"
  },

  // CYP3A5 - Tacrolimus
  {
    drug: "Tacrolimus",
    gene: "CYP3A5",
    phenotype: "Expresser",
    recommendation: "Consider 1.5-2x higher starting dose. Monitor levels.",
    implication: "Active metabolism → higher clearance",
    strength: "Strong",
    source: "CPIC"
  }
];

// ============================================================================
// DIPLOTYPE INFERENCE ENGINE
// ============================================================================

function inferDiplotype(gene: string, genotypes: Map<string, Genotype>): Diplotype | null {
  const geneDefinition = GENE_DEFINITIONS[gene];
  if (!geneDefinition) return null;

  const matchedAlleles: string[] = [];

  for (const allele of geneDefinition.alleles) {
    if (allele.allele.includes("*1") && allele.definingVariants.length === 0) {
      continue; // Handle reference allele last
    }

    const allVariantsPresent = allele.definingVariants.every(rsid => {
      const genotype = genotypes.get(rsid);
      if (!genotype) return false;
      // Check if homozygous for alt or heterozygous
      const bases = genotype.genotype.split('');
      return bases.some(b => b !== genotype.genotype[0] || genotype.genotype.length === 1);
    });

    if (allVariantsPresent) {
      matchedAlleles.push(allele.allele);
    }
  }

  // Default to *1 if no variants found
  if (matchedAlleles.length === 0) {
    matchedAlleles.push("*1", "*1");
  } else if (matchedAlleles.length === 1) {
    matchedAlleles.push("*1");
  }

  matchedAlleles.sort();

  return {
    gene,
    allele1: matchedAlleles[0] || "*1",
    allele2: matchedAlleles[1] || "*1",
    diplotype: `${matchedAlleles[0] || "*1"}/${matchedAlleles[1] || "*1"}`
  };
}

function calculateActivityScore(gene: string, diplotype: Diplotype): number {
  const geneDefinition = GENE_DEFINITIONS[gene];
  if (!geneDefinition || !geneDefinition.activityScoreBased) return 0;

  const allele1 = geneDefinition.alleles.find(a => a.allele === diplotype.allele1);
  const allele2 = geneDefinition.alleles.find(a => a.allele === diplotype.allele2);

  const score1 = allele1?.activityScore ?? 1.0;
  const score2 = allele2?.activityScore ?? 1.0;

  return score1 + score2;
}

function predictPhenotype(gene: string, diplotype: Diplotype): PhenotypePrediction {
  const geneDefinition = GENE_DEFINITIONS[gene];
  if (!geneDefinition) {
    return {
      gene,
      diplotype: diplotype.diplotype,
      phenotype: "Unknown",
      confidence: "Low"
    };
  }

  // Activity score-based (CYP2D6)
  if (geneDefinition.activityScoreBased) {
    const activityScore = calculateActivityScore(gene, diplotype);
    const phenotypeKey = activityScore > 2 ? ">2" : activityScore.toString();
    const phenotype = CYP2D6_ACTIVITY_SCORE_PHENOTYPE[phenotypeKey] || "Indeterminate";

    return {
      gene,
      diplotype: diplotype.diplotype,
      phenotype: phenotype as PhenotypePrediction['phenotype'],
      activityScore,
      confidence: "Definitive"
    };
  }

  // Lookup table-based
  let phenotype: string | undefined;
  if (PHENOTYPE_TABLES[gene]) {
    phenotype = PHENOTYPE_TABLES[gene][diplotype.diplotype];
  }

  // Generic function-based
  if (!phenotype) {
    const allele1 = geneDefinition.alleles.find(a => a.allele === diplotype.allele1);
    const allele2 = geneDefinition.alleles.find(a => a.allele === diplotype.allele2);

    if (allele1?.function === "No function" && allele2?.function === "No function") {
      phenotype = "Poor Metabolizer";
    } else if (allele1?.function === "Normal" && allele2?.function === "Normal") {
      phenotype = "Normal Metabolizer";
    } else if (allele1?.function === "Increased" || allele2?.function === "Increased") {
      phenotype = "Rapid Metabolizer";
    } else {
      phenotype = "Intermediate Metabolizer";
    }
  }

  return {
    gene,
    diplotype: diplotype.diplotype,
    phenotype: (phenotype || "Unknown") as PhenotypePrediction['phenotype'],
    confidence: "Definitive"
  };
}

function getDrugRecommendations(gene: string, phenotype: string): DrugRecommendation[] {
  return DRUG_DB.filter(rec => 
    rec.gene === gene && 
    (rec.phenotype === phenotype || 
     (phenotype.includes("Poor") && rec.phenotype.includes("Poor")) ||
     (phenotype.includes("function") && rec.phenotype.includes("function")))
  );
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzePGx(genotypes: Map<string, Genotype>): PGxResult[] {
  const results: PGxResult[] = [];

  for (const gene of Object.keys(GENE_DEFINITIONS)) {
    const diplotype = inferDiplotype(gene, genotypes);
    if (!diplotype) continue;

    const phenotype = predictPhenotype(gene, diplotype);
    const recommendations = getDrugRecommendations(gene, phenotype.phenotype);

    const warnings: string[] = [];
    const affectedDrugs = recommendations.map(r => r.drug);

    // Critical warnings
    if (phenotype.phenotype === "Poor Metabolizer" && gene === "TPMT") {
      warnings.push("⛔ CRITICAL: Avoid standard-dose thiopurines - risk of fatal bone marrow toxicity");
    }
    if (phenotype.phenotype === "Poor Metabolizer" && gene === "DPYD") {
      warnings.push("⛔ CRITICAL: Avoid fluoropyrimidines (5-FU, capecitabine) - risk of life-threatening toxicity");
    }
    if ((phenotype.phenotype === "Poor Metabolizer" || phenotype.phenotype.includes("Poor function")) && gene === "NUDT15") {
      warnings.push("⛔ CRITICAL: Avoid standard-dose thiopurines - risk of severe early leukopenia");
    }
    if (phenotype.phenotype === "Ultrarapid Metabolizer" && gene === "CYP2D6") {
      warnings.push("⚠️ WARNING: Avoid codeine - risk of morphine overdose toxicity");
    }
    if (gene === "SLCO1B1" && phenotype.phenotype.includes("Poor")) {
      warnings.push("⚠️ WARNING: Increased statin myopathy risk - avoid high-dose simvastatin");
    }

    results.push({
      gene,
      diplotype,
      phenotype,
      recommendations,
      warnings,
      affectedDrugs
    });
  }

  return results;
}
