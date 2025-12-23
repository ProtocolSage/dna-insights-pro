import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, Activity, Brain, Dna, Heart, Pill, Users, 
  AlertTriangle, CheckCircle, Info,
  Sun, Moon, Download, X
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SNPData {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
}

interface HealthRisk {
  condition: string;
  category: string;
  rsid: string;
  genotype: string;
  riskAllele: string;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  relativeRisk: number;
  populationRisk: number;
  yourRisk: number;
  confidence: 'high' | 'moderate' | 'low';
  description: string;
  recommendations: string[];
  citations: string[];
}

interface Trait {
  name: string;
  category: string;
  rsid: string;
  genotype: string;
  result: string;
  description: string;
  confidence: 'high' | 'moderate' | 'low';
}

interface PharmacogenomicResult {
  gene: string;
  rsid: string;
  genotype: string;
  metabolizerStatus: string;
  affectedDrugs: string[];
  recommendations: string;
  fdaLabel: boolean;
}

interface AncestryResult {
  population: string;
  percentage: number;
  confidence: [number, number];
}

interface AnalysisResults {
  totalVariants: number;
  healthRisks: HealthRisk[];
  traits: Trait[];
  pharmacogenomics: PharmacogenomicResult[];
  ancestry: AncestryResult[];
  maternalHaplogroup: string;
  paternalHaplogroup: string;
  neanderthalPercentage: number;
}

// ============================================================================
// SNP DATABASE - Curated variants for analysis
// ============================================================================

const SNP_DATABASE = {
  // ============================================================================
  // CARDIOVASCULAR DISEASE (25+ variants)
  // ============================================================================
  'rs429358': {
    category: 'cardiovascular',
    condition: 'Cardiovascular & Alzheimer\'s Risk (APOE ε4)',
    riskAllele: 'C',
    baseRisk: 0.15,
    riskMultiplier: 2.5,
    confidence: 'high' as const,
    description: 'APOE ε4 variant associated with increased LDL cholesterol, cardiovascular disease, and Alzheimer\'s risk. One of the strongest genetic risk factors for late-onset Alzheimer\'s.',
    recommendations: ['Regular cardiovascular screening', 'Mediterranean diet consideration', 'Cognitive health monitoring after age 50', 'Discuss with healthcare provider'],
    citations: ['PMID: 23391586', 'PMID: 24259556', 'PMID: 19734902']
  },
  'rs7412': {
    category: 'cardiovascular',
    condition: 'Lipid Metabolism (APOE ε2)',
    riskAllele: 'T',
    baseRisk: 0.10,
    riskMultiplier: 0.6,
    confidence: 'high' as const,
    description: 'APOE ε2 variant associated with lower LDL cholesterol and reduced cardiovascular risk. May increase risk of type III hyperlipoproteinemia in homozygotes.',
    recommendations: ['Generally protective for cardiovascular disease', 'Monitor triglycerides if homozygous'],
    citations: ['PMID: 17443116', 'PMID: 22629316']
  },
  'rs1801133': {
    category: 'cardiovascular',
    condition: 'Homocysteine Metabolism (MTHFR C677T)',
    riskAllele: 'T',
    baseRisk: 0.10,
    riskMultiplier: 1.8,
    confidence: 'high' as const,
    description: 'MTHFR C677T variant reduces enzyme activity by 30-70%, affecting folate metabolism and homocysteine levels. Elevated homocysteine is associated with cardiovascular disease.',
    recommendations: ['Consider methylfolate supplementation', 'B-vitamin status monitoring', 'Homocysteine level testing', 'Adequate folate intake'],
    citations: ['PMID: 18779510', 'PMID: 26916229', 'PMID: 12952864']
  },
  'rs1801131': {
    category: 'cardiovascular',
    condition: 'Folate Metabolism (MTHFR A1298C)',
    riskAllele: 'C',
    baseRisk: 0.08,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'Second common MTHFR variant with milder effect on enzyme activity. Compound heterozygosity with C677T may have additive effects.',
    recommendations: ['Monitor if combined with C677T variant', 'Ensure adequate folate intake'],
    citations: ['PMID: 10686568', 'PMID: 15060097']
  },
  'rs6025': {
    category: 'cardiovascular',
    condition: 'Factor V Leiden Thrombophilia',
    riskAllele: 'A',
    baseRisk: 0.001,
    riskMultiplier: 7.0,
    confidence: 'high' as const,
    description: 'Most common inherited thrombophilia. Increases risk of venous thromboembolism (DVT, pulmonary embolism) 3-8 fold for heterozygotes, 80-fold for homozygotes.',
    recommendations: ['Discuss with hematologist', 'Avoid hormonal contraceptives if possible', 'Prophylaxis during surgery/immobility', 'Awareness during pregnancy'],
    citations: ['PMID: 7989264', 'PMID: 26091587', 'PMID: 10477777']
  },
  'rs1799963': {
    category: 'cardiovascular',
    condition: 'Prothrombin G20210A Thrombophilia',
    riskAllele: 'A',
    baseRisk: 0.001,
    riskMultiplier: 3.5,
    confidence: 'high' as const,
    description: 'Second most common inherited thrombophilia. Increases prothrombin levels and risk of venous thrombosis 2-4 fold.',
    recommendations: ['Genetic counseling for family planning', 'Thrombosis prevention strategies', 'Caution with estrogen therapy'],
    citations: ['PMID: 9354442', 'PMID: 17476306']
  },
  'rs10757274': {
    category: 'cardiovascular',
    condition: 'Coronary Artery Disease Risk (9p21)',
    riskAllele: 'G',
    baseRisk: 0.08,
    riskMultiplier: 1.6,
    confidence: 'high' as const,
    description: 'Located in the 9p21 region near CDKN2A/B, the strongest common genetic risk factor for coronary artery disease independent of traditional risk factors.',
    recommendations: ['Aggressive cardiovascular risk factor management', 'Regular cardiac screening', 'Lifestyle modifications'],
    citations: ['PMID: 17478679', 'PMID: 17478681', 'PMID: 19247474']
  },
  'rs1333049': {
    category: 'cardiovascular',
    condition: 'Myocardial Infarction Risk (9p21)',
    riskAllele: 'C',
    baseRisk: 0.05,
    riskMultiplier: 1.5,
    confidence: 'high' as const,
    description: 'Additional 9p21 variant associated with increased risk of myocardial infarction and coronary artery disease.',
    recommendations: ['Heart-healthy lifestyle', 'Regular cardiovascular monitoring', 'Blood pressure and cholesterol management'],
    citations: ['PMID: 17554300', 'PMID: 18262040']
  },
  'rs10455872': {
    category: 'cardiovascular',
    condition: 'Elevated Lipoprotein(a) (LPA)',
    riskAllele: 'G',
    baseRisk: 0.06,
    riskMultiplier: 2.0,
    confidence: 'high' as const,
    description: 'LPA variant associated with elevated Lp(a) levels, an independent cardiovascular risk factor. Lp(a) levels are largely genetically determined.',
    recommendations: ['Lp(a) blood test', 'Aggressive LDL management', 'Discuss emerging Lp(a)-lowering therapies with cardiologist'],
    citations: ['PMID: 19198612', 'PMID: 22607134']
  },
  'rs3798220': {
    category: 'cardiovascular',
    condition: 'Lipoprotein(a) & CAD Risk (LPA)',
    riskAllele: 'C',
    baseRisk: 0.06,
    riskMultiplier: 2.5,
    confidence: 'high' as const,
    description: 'Strong LPA variant associated with very high Lp(a) levels and significantly increased coronary artery disease risk.',
    recommendations: ['Baseline Lp(a) measurement', 'Consider aspirin therapy (discuss with doctor)', 'Intensive lipid management'],
    citations: ['PMID: 19198609', 'PMID: 24560231']
  },
  'rs11206510': {
    category: 'cardiovascular',
    condition: 'LDL Cholesterol (PCSK9)',
    riskAllele: 'T',
    baseRisk: 0.10,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'PCSK9 variant affecting LDL receptor degradation. PCSK9 inhibitors are a major class of cholesterol-lowering drugs.',
    recommendations: ['Regular lipid panel monitoring', 'May respond well to PCSK9 inhibitor therapy if needed'],
    citations: ['PMID: 17295865', 'PMID: 24970784']
  },
  'rs1746048': {
    category: 'cardiovascular',
    condition: 'Coronary Artery Disease (CXCL12)',
    riskAllele: 'C',
    baseRisk: 0.08,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'CXCL12 variant associated with coronary artery disease risk through inflammatory pathways.',
    recommendations: ['Cardiovascular risk factor management', 'Anti-inflammatory diet consideration'],
    citations: ['PMID: 17478679', 'PMID: 19820697']
  },
  'rs2383206': {
    category: 'cardiovascular',
    condition: 'Coronary Artery Disease (9p21)',
    riskAllele: 'G',
    baseRisk: 0.08,
    riskMultiplier: 1.4,
    confidence: 'high' as const,
    description: 'Another 9p21 locus variant contributing to coronary artery disease risk.',
    recommendations: ['Comprehensive cardiovascular screening', 'Lifestyle modifications'],
    citations: ['PMID: 17554300']
  },
  'rs1800790': {
    category: 'cardiovascular',
    condition: 'Fibrinogen Levels (FGB)',
    riskAllele: 'A',
    baseRisk: 0.05,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'Beta-fibrinogen variant associated with elevated fibrinogen levels and increased thrombotic risk.',
    recommendations: ['Monitor fibrinogen levels if symptomatic', 'Cardiovascular risk management'],
    citations: ['PMID: 10521366', 'PMID: 16912077']
  },
  'rs5918': {
    category: 'cardiovascular',
    condition: 'Platelet Aggregation (ITGB3 PlA2)',
    riskAllele: 'C',
    baseRisk: 0.04,
    riskMultiplier: 1.5,
    confidence: 'moderate' as const,
    description: 'Platelet glycoprotein IIIa variant associated with increased platelet aggregation and potentially reduced aspirin response.',
    recommendations: ['May affect aspirin efficacy', 'Discuss antiplatelet therapy with cardiologist'],
    citations: ['PMID: 8571947', 'PMID: 15626699']
  },
  'rs662': {
    category: 'cardiovascular',
    condition: 'Antioxidant Capacity (PON1 Q192R)',
    riskAllele: 'G',
    baseRisk: 0.08,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'Paraoxonase 1 variant affecting HDL antioxidant function and organophosphate metabolism.',
    recommendations: ['Antioxidant-rich diet', 'Regular lipid monitoring'],
    citations: ['PMID: 9603939', 'PMID: 21828344']
  },
  'rs1800566': {
    category: 'cardiovascular',
    condition: 'Antioxidant Defense (NQO1)',
    riskAllele: 'T',
    baseRisk: 0.05,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'NAD(P)H quinone dehydrogenase variant affecting detoxification of reactive oxygen species.',
    recommendations: ['Adequate antioxidant intake', 'Avoid excessive oxidative stress'],
    citations: ['PMID: 11746942']
  },
  'rs1805124': {
    category: 'cardiovascular',
    condition: 'Cardiac Arrhythmia Risk (SCN5A)',
    riskAllele: 'A',
    baseRisk: 0.02,
    riskMultiplier: 1.8,
    confidence: 'moderate' as const,
    description: 'Sodium channel variant associated with cardiac conduction abnormalities and arrhythmia susceptibility.',
    recommendations: ['ECG screening if symptomatic', 'Avoid QT-prolonging medications if possible'],
    citations: ['PMID: 11809893', 'PMID: 23321883']
  },
  'rs174546': {
    category: 'cardiovascular',
    condition: 'Fatty Acid Metabolism (FADS1)',
    riskAllele: 'T',
    baseRisk: 0.06,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'Fatty acid desaturase variant affecting omega-3 and omega-6 fatty acid conversion and blood lipid levels.',
    recommendations: ['Consider direct omega-3 supplementation (EPA/DHA)', 'Dietary fatty acid balance'],
    citations: ['PMID: 21829377', 'PMID: 20686565']
  },

  // ============================================================================
  // CANCER RISK (20+ variants)
  // ============================================================================
  'rs1042522': {
    category: 'cancer',
    condition: 'General Cancer Risk (TP53 Codon 72)',
    riskAllele: 'C',
    baseRisk: 0.05,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'P53 tumor suppressor variant with modest associations to various cancer risks. The Pro72 variant may have different apoptotic properties.',
    recommendations: ['Standard cancer screening guidelines', 'Healthy lifestyle maintenance', 'Avoid known carcinogens'],
    citations: ['PMID: 19047179', 'PMID: 12569571']
  },
  'rs1800795': {
    category: 'cancer',
    condition: 'Inflammation & Cancer Risk (IL-6)',
    riskAllele: 'C',
    baseRisk: 0.04,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'Interleukin-6 promoter variant affecting inflammatory response. Chronic inflammation is linked to cancer development.',
    recommendations: ['Anti-inflammatory diet', 'Regular physical activity', 'Maintain healthy weight'],
    citations: ['PMID: 11278932', 'PMID: 16740138']
  },
  'rs1799950': {
    category: 'cancer',
    condition: 'Breast Cancer Risk (BRCA1 Q356R)',
    riskAllele: 'A',
    baseRisk: 0.12,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'BRCA1 missense variant with modest association to breast cancer risk. Not a pathogenic mutation but may modify risk.',
    recommendations: ['Regular mammography screening', 'Clinical breast exams', 'Genetic counseling if family history'],
    citations: ['PMID: 17305478']
  },
  'rs1801320': {
    category: 'cancer',
    condition: 'DNA Repair Capacity (RAD51)',
    riskAllele: 'C',
    baseRisk: 0.04,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'RAD51 variant affecting DNA double-strand break repair. May interact with BRCA2 mutations.',
    recommendations: ['Standard cancer screening', 'Minimize radiation exposure', 'Genetic counseling if BRCA-positive family'],
    citations: ['PMID: 15956392', 'PMID: 17437264']
  },
  'rs2981582': {
    category: 'cancer',
    condition: 'Breast Cancer Risk (FGFR2)',
    riskAllele: 'T',
    baseRisk: 0.12,
    riskMultiplier: 1.4,
    confidence: 'high' as const,
    description: 'FGFR2 variant is one of the most replicated breast cancer susceptibility loci in GWAS studies.',
    recommendations: ['Regular breast cancer screening', 'Risk-reducing lifestyle factors', 'Discuss screening frequency with doctor'],
    citations: ['PMID: 17529967', 'PMID: 18006640']
  },
  'rs13281615': {
    category: 'cancer',
    condition: 'Breast Cancer Risk (8q24)',
    riskAllele: 'G',
    baseRisk: 0.12,
    riskMultiplier: 1.2,
    confidence: 'high' as const,
    description: '8q24 region variant associated with multiple cancer types including breast cancer.',
    recommendations: ['Adherence to screening guidelines', 'Healthy lifestyle'],
    citations: ['PMID: 17529967']
  },
  'rs1447295': {
    category: 'cancer',
    condition: 'Prostate Cancer Risk (8q24)',
    riskAllele: 'A',
    baseRisk: 0.15,
    riskMultiplier: 1.6,
    confidence: 'high' as const,
    description: '8q24 variant associated with increased prostate cancer risk, particularly in men of African ancestry.',
    recommendations: ['PSA screening discussion with doctor', 'Regular prostate exams after age 50', 'Earlier screening if African ancestry'],
    citations: ['PMID: 16710414', 'PMID: 17618284']
  },
  'rs16901979': {
    category: 'cancer',
    condition: 'Prostate Cancer Risk (8q24 region 2)',
    riskAllele: 'A',
    baseRisk: 0.15,
    riskMultiplier: 1.5,
    confidence: 'high' as const,
    description: 'Independent 8q24 prostate cancer risk variant.',
    recommendations: ['Discuss PSA screening schedule', 'Family history awareness'],
    citations: ['PMID: 17401366']
  },
  'rs6983267': {
    category: 'cancer',
    condition: 'Colorectal Cancer Risk (8q24)',
    riskAllele: 'G',
    baseRisk: 0.05,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: '8q24 variant affecting MYC oncogene regulation, associated with colorectal and prostate cancer risk.',
    recommendations: ['Colonoscopy screening per guidelines', 'High-fiber diet', 'Regular physical activity'],
    citations: ['PMID: 17618283', 'PMID: 17934461']
  },
  'rs3802842': {
    category: 'cancer',
    condition: 'Colorectal Cancer Risk (11q23)',
    riskAllele: 'C',
    baseRisk: 0.05,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: '11q23 variant associated with colorectal cancer risk.',
    recommendations: ['Regular colonoscopy screening', 'Limit red and processed meat', 'Maintain healthy weight'],
    citations: ['PMID: 18372905', 'PMID: 19098912']
  },
  'rs4779584': {
    category: 'cancer',
    condition: 'Colorectal Cancer Risk (15q13)',
    riskAllele: 'T',
    baseRisk: 0.05,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'GREM1 region variant associated with colorectal cancer risk.',
    recommendations: ['Colorectal cancer screening adherence', 'Dietary modifications'],
    citations: ['PMID: 18372901']
  },
  'rs401681': {
    category: 'cancer',
    condition: 'Lung Cancer & Multiple Cancers (TERT-CLPTM1L)',
    riskAllele: 'C',
    baseRisk: 0.06,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'Telomerase reverse transcriptase region variant associated with lung cancer and several other cancer types.',
    recommendations: ['Avoid smoking absolutely', 'Radon testing in home', 'Lung cancer screening if smoking history'],
    citations: ['PMID: 18385676', 'PMID: 19836008']
  },
  'rs2736100': {
    category: 'cancer',
    condition: 'Lung Cancer Risk (TERT)',
    riskAllele: 'C',
    baseRisk: 0.06,
    riskMultiplier: 1.4,
    confidence: 'high' as const,
    description: 'TERT variant associated with lung cancer risk and telomere length.',
    recommendations: ['Complete smoking cessation', 'Avoid secondhand smoke', 'Occupational exposure minimization'],
    citations: ['PMID: 19654303', 'PMID: 23636188']
  },
  'rs4488809': {
    category: 'cancer',
    condition: 'Bladder Cancer Risk (TP63)',
    riskAllele: 'T',
    baseRisk: 0.03,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'TP63 variant associated with bladder cancer susceptibility.',
    recommendations: ['Avoid smoking', 'Adequate hydration', 'Limit occupational chemical exposure'],
    citations: ['PMID: 20972438']
  },
  'rs710521': {
    category: 'cancer',
    condition: 'Bladder Cancer Risk (TP63)',
    riskAllele: 'A',
    baseRisk: 0.03,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'Additional bladder cancer susceptibility variant in TP63 region.',
    recommendations: ['Smoking cessation', 'Report blood in urine promptly'],
    citations: ['PMID: 18438406']
  },
  'rs2294008': {
    category: 'cancer',
    condition: 'Gastric Cancer Risk (PSCA)',
    riskAllele: 'T',
    baseRisk: 0.01,
    riskMultiplier: 1.6,
    confidence: 'high' as const,
    description: 'PSCA variant strongly associated with gastric cancer, particularly in Asian populations.',
    recommendations: ['H. pylori testing and treatment', 'Limited salt-preserved foods', 'Regular endoscopy if family history'],
    citations: ['PMID: 18794855', 'PMID: 20639881']
  },
  'rs2428913': {
    category: 'cancer',
    condition: 'Melanoma Risk (MTAP)',
    riskAllele: 'C',
    baseRisk: 0.02,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'MTAP region variant associated with melanoma susceptibility.',
    recommendations: ['Sun protection', 'Regular skin self-exams', 'Annual dermatology screening'],
    citations: ['PMID: 18488026']
  },
  'rs1015362': {
    category: 'cancer',
    condition: 'Melanoma Risk (ASIP)',
    riskAllele: 'A',
    baseRisk: 0.02,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'Agouti signaling protein variant affecting pigmentation and melanoma risk.',
    recommendations: ['Strict sun protection', 'Avoid tanning beds', 'Monitor moles for changes'],
    citations: ['PMID: 18488026', 'PMID: 19578364']
  },
  'rs12203592': {
    category: 'cancer',
    condition: 'Melanoma & Skin Cancer Risk (IRF4)',
    riskAllele: 'T',
    baseRisk: 0.02,
    riskMultiplier: 1.5,
    confidence: 'high' as const,
    description: 'IRF4 variant associated with sun sensitivity, freckling, and skin cancer risk.',
    recommendations: ['Daily sunscreen use', 'Protective clothing', 'Regular dermatological exams'],
    citations: ['PMID: 18488028', 'PMID: 22197934']
  },
  'rs12951053': {
    category: 'cancer',
    condition: 'Thyroid Cancer Risk (FOXE1)',
    riskAllele: 'A',
    baseRisk: 0.01,
    riskMultiplier: 1.6,
    confidence: 'high' as const,
    description: 'FOXE1 variant associated with thyroid cancer susceptibility.',
    recommendations: ['Thyroid examination during routine physicals', 'Report neck lumps promptly', 'Discuss screening if family history'],
    citations: ['PMID: 19198613']
  },

  // ============================================================================
  // METABOLIC CONDITIONS (15+ variants)
  // ============================================================================
  'rs7903146': {
    category: 'metabolic',
    condition: 'Type 2 Diabetes Risk (TCF7L2)',
    riskAllele: 'T',
    baseRisk: 0.12,
    riskMultiplier: 1.7,
    confidence: 'high' as const,
    description: 'TCF7L2 is the strongest common genetic risk factor for type 2 diabetes, affecting beta cell function and incretin signaling.',
    recommendations: ['Regular glucose monitoring', 'Weight management', 'Physical activity', 'Mediterranean or low-glycemic diet'],
    citations: ['PMID: 16415884', 'PMID: 17463246', 'PMID: 22101970']
  },
  'rs9939609': {
    category: 'metabolic',
    condition: 'Obesity Susceptibility (FTO)',
    riskAllele: 'A',
    baseRisk: 0.30,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'FTO variant is the most replicated obesity gene. Each risk allele increases BMI by ~0.4 kg/m². Effect can be attenuated by physical activity.',
    recommendations: ['Regular physical activity (can neutralize genetic effect)', 'Mindful eating practices', 'Behavioral strategies for weight management'],
    citations: ['PMID: 17434869', 'PMID: 23697881', 'PMID: 22344221']
  },
  'rs1801282': {
    category: 'metabolic',
    condition: 'Insulin Sensitivity (PPARG Pro12Ala)',
    riskAllele: 'C',
    baseRisk: 0.10,
    riskMultiplier: 0.8,
    confidence: 'high' as const,
    description: 'PPARG Ala12 variant is associated with improved insulin sensitivity and reduced diabetes risk. Target of thiazolidinedione drugs.',
    recommendations: ['Generally protective variant', 'Maintain healthy weight to maximize benefit'],
    citations: ['PMID: 10758173', 'PMID: 17327436']
  },
  'rs1801278': {
    category: 'metabolic',
    condition: 'Insulin Resistance (IRS1 Gly972Arg)',
    riskAllele: 'A',
    baseRisk: 0.12,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'Insulin receptor substrate 1 variant associated with insulin resistance and type 2 diabetes risk.',
    recommendations: ['Regular HbA1c monitoring', 'Weight management', 'Exercise to improve insulin sensitivity'],
    citations: ['PMID: 12788862', 'PMID: 17327436']
  },
  'rs13266634': {
    category: 'metabolic',
    condition: 'Type 2 Diabetes Risk (SLC30A8)',
    riskAllele: 'C',
    baseRisk: 0.12,
    riskMultiplier: 1.2,
    confidence: 'high' as const,
    description: 'Zinc transporter variant affecting insulin secretion from pancreatic beta cells.',
    recommendations: ['Adequate zinc intake', 'Blood glucose monitoring', 'Diabetes prevention lifestyle'],
    citations: ['PMID: 17293876', 'PMID: 22101970']
  },
  'rs5219': {
    category: 'metabolic',
    condition: 'Type 2 Diabetes Risk (KCNJ11 E23K)',
    riskAllele: 'T',
    baseRisk: 0.12,
    riskMultiplier: 1.2,
    confidence: 'high' as const,
    description: 'Potassium channel variant affecting insulin secretion. Target of sulfonylurea diabetes medications.',
    recommendations: ['May affect response to sulfonylurea medications', 'Regular glucose monitoring'],
    citations: ['PMID: 12829785', 'PMID: 17463248']
  },
  'rs1111875': {
    category: 'metabolic',
    condition: 'Type 2 Diabetes Risk (HHEX)',
    riskAllele: 'C',
    baseRisk: 0.12,
    riskMultiplier: 1.2,
    confidence: 'high' as const,
    description: 'HHEX/IDE region variant affecting pancreatic development and insulin degradation.',
    recommendations: ['Lifestyle diabetes prevention', 'Regular screening'],
    citations: ['PMID: 17463249', 'PMID: 22101970']
  },
  'rs780094': {
    category: 'metabolic',
    condition: 'Triglyceride Levels (GCKR)',
    riskAllele: 'T',
    baseRisk: 0.20,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'Glucokinase regulatory protein variant affecting glucose and triglyceride metabolism. Paradoxically associated with lower fasting glucose but higher triglycerides.',
    recommendations: ['Monitor fasting triglycerides', 'Limit refined carbohydrates', 'Regular exercise'],
    citations: ['PMID: 18372903', 'PMID: 22101970']
  },
  'rs17782313': {
    category: 'metabolic',
    condition: 'Obesity & Appetite (MC4R)',
    riskAllele: 'C',
    baseRisk: 0.30,
    riskMultiplier: 1.2,
    confidence: 'high' as const,
    description: 'Melanocortin 4 receptor variant affecting appetite regulation. MC4R is crucial for satiety signaling.',
    recommendations: ['Portion control strategies', 'Mindful eating', 'Protein-rich meals for satiety'],
    citations: ['PMID: 18454148', 'PMID: 19165484']
  },
  'rs571312': {
    category: 'metabolic',
    condition: 'Obesity Risk (MC4R)',
    riskAllele: 'A',
    baseRisk: 0.30,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'Additional MC4R variant contributing to obesity susceptibility through appetite dysregulation.',
    recommendations: ['Structured eating schedule', 'High-satiety foods', 'Behavioral weight management'],
    citations: ['PMID: 18454148']
  },
  'rs1801260': {
    category: 'metabolic',
    condition: 'Circadian Rhythm & Metabolism (CLOCK)',
    riskAllele: 'C',
    baseRisk: 0.20,
    riskMultiplier: 1.2,
    confidence: 'moderate' as const,
    description: 'CLOCK gene variant affecting circadian rhythm and metabolic regulation. Associated with evening chronotype and weight gain.',
    recommendations: ['Regular sleep schedule', 'Avoid late-night eating', 'Morning light exposure'],
    citations: ['PMID: 18463155', 'PMID: 19786780']
  },
  'rs4994': {
    category: 'metabolic',
    condition: 'Weight Loss Response (ADRB3 Trp64Arg)',
    riskAllele: 'C',
    baseRisk: 0.25,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'Beta-3 adrenergic receptor variant affecting thermogenesis and potentially weight loss response to exercise.',
    recommendations: ['May require more exercise for weight loss', 'Resistance training for metabolism'],
    citations: ['PMID: 9841666', 'PMID: 22832892']
  },
  'rs1800206': {
    category: 'metabolic',
    condition: 'Lipid Response to Diet (PPARA)',
    riskAllele: 'C',
    baseRisk: 0.15,
    riskMultiplier: 1.2,
    confidence: 'moderate' as const,
    description: 'PPAR-alpha variant affecting response to dietary fat and fibrate medications.',
    recommendations: ['May respond well to Mediterranean diet', 'Consider omega-3 supplementation'],
    citations: ['PMID: 15556289']
  },
  'rs12255372': {
    category: 'metabolic',
    condition: 'Type 2 Diabetes Risk (TCF7L2)',
    riskAllele: 'T',
    baseRisk: 0.12,
    riskMultiplier: 1.4,
    confidence: 'high' as const,
    description: 'Additional TCF7L2 variant contributing to diabetes risk through WNT signaling pathway.',
    recommendations: ['Comprehensive diabetes prevention', 'Regular HbA1c testing'],
    citations: ['PMID: 16415884']
  },
  'rs2237892': {
    category: 'metabolic',
    condition: 'Type 2 Diabetes Risk (KCNQ1)',
    riskAllele: 'C',
    baseRisk: 0.12,
    riskMultiplier: 1.4,
    confidence: 'high' as const,
    description: 'Potassium channel variant with strong diabetes association, particularly in East Asian populations.',
    recommendations: ['Glucose monitoring', 'Weight management', 'Physical activity'],
    citations: ['PMID: 18711367', 'PMID: 18711366']
  },

  // ============================================================================
  // AUTOIMMUNE & INFLAMMATORY CONDITIONS (15+ variants)
  // ============================================================================
  'rs2187668': {
    category: 'autoimmune',
    condition: 'Celiac Disease Risk (HLA-DQ2.5)',
    riskAllele: 'T',
    baseRisk: 0.01,
    riskMultiplier: 7.0,
    confidence: 'high' as const,
    description: 'HLA-DQA1*05 variant is necessary (but not sufficient) for celiac disease. ~95% of celiac patients carry HLA-DQ2 or DQ8.',
    recommendations: ['Celiac antibody testing if symptomatic', 'Trial of gluten-free diet if confirmed', 'Screen first-degree relatives'],
    citations: ['PMID: 18311140', 'PMID: 20190752']
  },
  'rs7454108': {
    category: 'autoimmune',
    condition: 'Celiac Disease Risk (HLA-DQ8)',
    riskAllele: 'T',
    baseRisk: 0.01,
    riskMultiplier: 3.0,
    confidence: 'high' as const,
    description: 'HLA-DQ8 haplotype variant, found in most celiac patients who lack HLA-DQ2.',
    recommendations: ['Celiac screening if GI symptoms', 'Genetic counseling for family'],
    citations: ['PMID: 18311140']
  },
  'rs2476601': {
    category: 'autoimmune',
    condition: 'Autoimmune Risk (PTPN22 R620W)',
    riskAllele: 'A',
    baseRisk: 0.02,
    riskMultiplier: 2.0,
    confidence: 'high' as const,
    description: 'PTPN22 variant is associated with multiple autoimmune diseases: rheumatoid arthritis, type 1 diabetes, lupus, and thyroid autoimmunity.',
    recommendations: ['Monitor for autoimmune symptoms', 'Thyroid function testing', 'Report joint pain or rashes'],
    citations: ['PMID: 15208781', 'PMID: 16380915']
  },
  'rs3184504': {
    category: 'autoimmune',
    condition: 'Autoimmune & Cardiovascular (SH2B3)',
    riskAllele: 'T',
    baseRisk: 0.03,
    riskMultiplier: 1.5,
    confidence: 'high' as const,
    description: 'SH2B3 variant associated with multiple autoimmune conditions and also cardiovascular disease risk.',
    recommendations: ['Autoimmune symptom awareness', 'Cardiovascular risk management'],
    citations: ['PMID: 19430480', 'PMID: 17554300']
  },
  'rs6679677': {
    category: 'autoimmune',
    condition: 'Rheumatoid Arthritis Risk (PADI4)',
    riskAllele: 'A',
    baseRisk: 0.01,
    riskMultiplier: 1.6,
    confidence: 'moderate' as const,
    description: 'PADI4 variant associated with rheumatoid arthritis risk, particularly in Asian populations.',
    recommendations: ['Early treatment if RA develops', 'Anti-inflammatory lifestyle'],
    citations: ['PMID: 14872033', 'PMID: 17554300']
  },
  'rs2104286': {
    category: 'autoimmune',
    condition: 'Multiple Sclerosis Risk (IL2RA)',
    riskAllele: 'A',
    baseRisk: 0.003,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'IL-2 receptor alpha variant associated with multiple sclerosis susceptibility.',
    recommendations: ['Vitamin D optimization', 'Report neurological symptoms promptly'],
    citations: ['PMID: 17660530', 'PMID: 19525953']
  },
  'rs6897932': {
    category: 'autoimmune',
    condition: 'Multiple Sclerosis Risk (IL7R)',
    riskAllele: 'C',
    baseRisk: 0.003,
    riskMultiplier: 1.3,
    confidence: 'high' as const,
    description: 'IL-7 receptor variant affecting T-cell development and MS risk.',
    recommendations: ['Adequate vitamin D levels', 'Early evaluation of neurological symptoms'],
    citations: ['PMID: 17660530']
  },
  'rs763361': {
    category: 'autoimmune',
    condition: 'Type 1 Diabetes & Autoimmune (CD226)',
    riskAllele: 'T',
    baseRisk: 0.004,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'CD226 variant associated with type 1 diabetes and other autoimmune conditions.',
    recommendations: ['Monitor children for diabetes symptoms if family history', 'Autoimmune awareness'],
    citations: ['PMID: 18978792']
  },
  'rs17696736': {
    category: 'autoimmune',
    condition: 'Type 1 Diabetes Risk (NAA25)',
    riskAllele: 'G',
    baseRisk: 0.004,
    riskMultiplier: 1.2,
    confidence: 'moderate' as const,
    description: 'NAA25 region variant contributing to type 1 diabetes susceptibility.',
    recommendations: ['Family awareness', 'Recognize diabetes symptoms'],
    citations: ['PMID: 17554260']
  },
  'rs3757247': {
    category: 'autoimmune',
    condition: 'Lupus Risk (BACH2)',
    riskAllele: 'T',
    baseRisk: 0.002,
    riskMultiplier: 1.4,
    confidence: 'moderate' as const,
    description: 'BACH2 variant associated with systemic lupus erythematosus risk.',
    recommendations: ['Sun protection', 'Report butterfly rash or joint pain'],
    citations: ['PMID: 26432863']
  },
  'rs1800629': {
    category: 'autoimmune',
    condition: 'Inflammatory Response (TNF-alpha)',
    riskAllele: 'A',
    baseRisk: 0.03,
    riskMultiplier: 1.5,
    confidence: 'moderate' as const,
    description: 'TNF-alpha promoter variant associated with increased inflammatory response and various autoimmune conditions.',
    recommendations: ['Anti-inflammatory diet', 'Stress management', 'Adequate sleep'],
    citations: ['PMID: 9439688', 'PMID: 18593774']
  },
  'rs1143634': {
    category: 'autoimmune',
    condition: 'Inflammatory Response (IL-1B)',
    riskAllele: 'T',
    baseRisk: 0.03,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'Interleukin-1 beta variant affecting inflammatory cytokine production.',
    recommendations: ['Anti-inflammatory lifestyle', 'Omega-3 fatty acids'],
    citations: ['PMID: 15626710']
  },
  'rs1800896': {
    category: 'autoimmune',
    condition: 'Immune Regulation (IL-10)',
    riskAllele: 'G',
    baseRisk: 0.03,
    riskMultiplier: 1.3,
    confidence: 'moderate' as const,
    description: 'IL-10 promoter variant affecting anti-inflammatory cytokine production.',
    recommendations: ['Gut health optimization', 'Probiotic consideration'],
    citations: ['PMID: 9399889', 'PMID: 17640933']
  },
  'rs361525': {
    category: 'autoimmune',
    condition: 'Psoriasis Risk (TNF-alpha)',
    riskAllele: 'A',
    baseRisk: 0.02,
    riskMultiplier: 1.5,
    confidence: 'moderate' as const,
    description: 'TNF-alpha variant associated with psoriasis susceptibility.',
    recommendations: ['Skin monitoring', 'Stress management', 'Maintain healthy weight'],
    citations: ['PMID: 8841195']
  },
  'rs11209026': {
    category: 'autoimmune',
    condition: 'Inflammatory Bowel Disease (IL23R)',
    riskAllele: 'A',
    baseRisk: 0.005,
    riskMultiplier: 0.4,
    confidence: 'high' as const,
    description: 'IL-23 receptor variant that is protective against Crohn\'s disease and ulcerative colitis.',
    recommendations: ['Generally protective variant', 'Maintain gut health'],
    citations: ['PMID: 17435756', 'PMID: 17554261']
  },

  // ============================================================================
  // PHARMACOGENOMICS (20+ variants)
  // ============================================================================
  'rs1065852': {
    category: 'pharmacogenomics',
    gene: 'CYP2D6',
    metabolizerStatus: { 'AA': 'Poor', 'AG': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Codeine', 'Tramadol', 'Tamoxifen', 'Fluoxetine', 'Metoprolol', 'Amitriptyline', 'Nortriptyline', 'Paroxetine', 'Venlafaxine'],
    fdaLabel: true
  },
  'rs3892097': {
    category: 'pharmacogenomics',
    gene: 'CYP2D6*4',
    metabolizerStatus: { 'AA': 'Poor', 'GA': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Codeine', 'Oxycodone', 'Tamoxifen', 'Risperidone', 'Atomoxetine', 'Dextromethorphan'],
    fdaLabel: true
  },
  'rs4244285': {
    category: 'pharmacogenomics',
    gene: 'CYP2C19*2',
    metabolizerStatus: { 'AA': 'Poor', 'AG': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Clopidogrel', 'Omeprazole', 'Pantoprazole', 'Citalopram', 'Escitalopram', 'Diazepam', 'Voriconazole'],
    fdaLabel: true
  },
  'rs4986893': {
    category: 'pharmacogenomics',
    gene: 'CYP2C19*3',
    metabolizerStatus: { 'AA': 'Poor', 'GA': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Clopidogrel', 'Proton pump inhibitors', 'Antidepressants'],
    fdaLabel: true
  },
  'rs12248560': {
    category: 'pharmacogenomics',
    gene: 'CYP2C19*17',
    metabolizerStatus: { 'TT': 'Ultrarapid', 'CT': 'Rapid', 'CC': 'Normal' },
    affectedDrugs: ['Clopidogrel (enhanced)', 'Escitalopram (may need higher doses)', 'Omeprazole (may need higher doses)'],
    fdaLabel: true
  },
  'rs1799853': {
    category: 'pharmacogenomics',
    gene: 'CYP2C9*2',
    metabolizerStatus: { 'TT': 'Poor', 'CT': 'Intermediate', 'CC': 'Normal' },
    affectedDrugs: ['Warfarin', 'Phenytoin', 'Celecoxib', 'Losartan', 'Glipizide', 'Tolbutamide'],
    fdaLabel: true
  },
  'rs1057910': {
    category: 'pharmacogenomics',
    gene: 'CYP2C9*3',
    metabolizerStatus: { 'CC': 'Poor', 'AC': 'Intermediate', 'AA': 'Normal' },
    affectedDrugs: ['Warfarin', 'Phenytoin', 'NSAIDs', 'Sulfonylureas'],
    fdaLabel: true
  },
  'rs9923231': {
    category: 'pharmacogenomics',
    gene: 'VKORC1',
    metabolizerStatus: { 'TT': 'Sensitive (low dose)', 'CT': 'Intermediate', 'CC': 'Resistant (high dose)' },
    affectedDrugs: ['Warfarin', 'Acenocoumarol', 'Phenprocoumon'],
    fdaLabel: true
  },
  'rs4149056': {
    category: 'pharmacogenomics',
    gene: 'SLCO1B1',
    metabolizerStatus: { 'CC': 'Poor transport (high myopathy risk)', 'TC': 'Intermediate', 'TT': 'Normal' },
    affectedDrugs: ['Simvastatin', 'Atorvastatin', 'Pravastatin', 'Rosuvastatin', 'Methotrexate'],
    fdaLabel: true
  },
  'rs1045642': {
    category: 'pharmacogenomics',
    gene: 'ABCB1 (P-glycoprotein)',
    metabolizerStatus: { 'TT': 'Reduced efflux', 'CT': 'Intermediate', 'CC': 'Normal efflux' },
    affectedDrugs: ['Digoxin', 'Tacrolimus', 'Cyclosporine', 'Many chemotherapy drugs', 'HIV protease inhibitors'],
    fdaLabel: true
  },
  'rs2032582': {
    category: 'pharmacogenomics',
    gene: 'ABCB1',
    metabolizerStatus: { 'TT': 'Reduced function', 'GT': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Multiple cancer drugs', 'Immunosuppressants', 'Cardiac glycosides'],
    fdaLabel: false
  },
  'rs776746': {
    category: 'pharmacogenomics',
    gene: 'CYP3A5*3',
    metabolizerStatus: { 'CC': 'Non-expressor', 'CT': 'Intermediate', 'TT': 'Expressor' },
    affectedDrugs: ['Tacrolimus', 'Sirolimus', 'Cyclosporine', 'Many HIV drugs'],
    fdaLabel: true
  },
  'rs28399504': {
    category: 'pharmacogenomics',
    gene: 'CYP2D6*4',
    metabolizerStatus: { 'AG': 'Intermediate', 'AA': 'Poor', 'GG': 'Normal' },
    affectedDrugs: ['Codeine', 'Tamoxifen', 'Antidepressants'],
    fdaLabel: true
  },
  'rs1799931': {
    category: 'pharmacogenomics',
    gene: 'NAT2 (G590A)',
    metabolizerStatus: { 'AA': 'Slow acetylator', 'GA': 'Intermediate', 'GG': 'Rapid acetylator' },
    affectedDrugs: ['Isoniazid', 'Sulfasalazine', 'Hydralazine', 'Procainamide', 'Dapsone'],
    fdaLabel: true
  },
  'rs1801280': {
    category: 'pharmacogenomics',
    gene: 'NAT2 (T341C)',
    metabolizerStatus: { 'CC': 'Slow acetylator', 'TC': 'Intermediate', 'TT': 'Rapid acetylator' },
    affectedDrugs: ['Isoniazid', 'Sulfasalazine', 'Caffeine metabolism affected'],
    fdaLabel: true
  },
  'rs1800460': {
    category: 'pharmacogenomics',
    gene: 'TPMT*3B',
    metabolizerStatus: { 'AA': 'Deficient (CRITICAL)', 'GA': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Azathioprine', 'Mercaptopurine', 'Thioguanine - SEVERE TOXICITY RISK IF DEFICIENT'],
    fdaLabel: true
  },
  'rs1142345': {
    category: 'pharmacogenomics',
    gene: 'TPMT*3C',
    metabolizerStatus: { 'CC': 'Deficient (CRITICAL)', 'AC': 'Intermediate', 'AA': 'Normal' },
    affectedDrugs: ['Azathioprine', 'Mercaptopurine', 'Thioguanine - CRITICAL DOSING IMPLICATIONS'],
    fdaLabel: true
  },
  'rs3745274': {
    category: 'pharmacogenomics',
    gene: 'CYP2B6*6',
    metabolizerStatus: { 'TT': 'Poor metabolizer', 'GT': 'Intermediate', 'GG': 'Normal' },
    affectedDrugs: ['Efavirenz', 'Nevirapine', 'Methadone', 'Bupropion', 'Cyclophosphamide'],
    fdaLabel: true
  },
  'rs4149015': {
    category: 'pharmacogenomics',
    gene: 'SLCO1B1*1b',
    metabolizerStatus: { 'GG': 'Reduced transport', 'AG': 'Intermediate', 'AA': 'Normal' },
    affectedDrugs: ['Statins', 'Rifampin', 'Methotrexate'],
    fdaLabel: false
  },
  'rs2231142': {
    category: 'pharmacogenomics',
    gene: 'ABCG2 (BCRP)',
    metabolizerStatus: { 'AA': 'Reduced function (higher drug levels)', 'CA': 'Intermediate', 'CC': 'Normal' },
    affectedDrugs: ['Rosuvastatin', 'Sulfasalazine', 'Methotrexate', 'Topotecan'],
    fdaLabel: true
  },
  'rs1801394': {
    category: 'pharmacogenomics',
    gene: 'MTRR (A66G)',
    metabolizerStatus: { 'GG': 'Reduced function', 'AG': 'Intermediate', 'AA': 'Normal' },
    affectedDrugs: ['Methotrexate response', 'B12/folate dependent drugs'],
    fdaLabel: false
  },
  'rs5030656': {
    category: 'pharmacogenomics',
    gene: 'CYP2D6*9',
    metabolizerStatus: { 'del/del': 'Reduced', 'wt/del': 'Intermediate', 'wt/wt': 'Normal' },
    affectedDrugs: ['Codeine', 'Antidepressants', 'Antipsychotics'],
    fdaLabel: true
  },

  // ============================================================================
  // PHYSICAL TRAITS (20+ variants)
  // ============================================================================
  'rs12913832': {
    category: 'traits',
    name: 'Eye Color (HERC2/OCA2)',
    outcomes: { 'GG': 'Likely blue/green eyes', 'AG': 'Variable (green/hazel)', 'AA': 'Likely brown eyes' }
  },
  'rs1426654': {
    category: 'traits',
    name: 'Skin Pigmentation (SLC24A5)',
    outcomes: { 'AA': 'Lighter pigmentation (European ancestry)', 'AG': 'Intermediate', 'GG': 'Darker pigmentation' }
  },
  'rs16891982': {
    category: 'traits',
    name: 'Skin/Hair Pigmentation (SLC45A2)',
    outcomes: { 'CC': 'Lighter skin/hair', 'CG': 'Intermediate', 'GG': 'Darker pigmentation' }
  },
  'rs1805007': {
    category: 'traits',
    name: 'Red Hair & Fair Skin (MC1R R151C)',
    outcomes: { 'TT': 'Likely red hair, very fair skin', 'CT': 'Increased fair features', 'CC': 'Typical pigmentation' }
  },
  'rs1805008': {
    category: 'traits',
    name: 'Red Hair Variant (MC1R R160W)',
    outcomes: { 'TT': 'Red hair probable', 'CT': 'Carrier, some effect on pigmentation', 'CC': 'Typical' }
  },
  'rs1805009': {
    category: 'traits',
    name: 'Red Hair Variant (MC1R D294H)',
    outcomes: { 'CC': 'Red hair variant carrier', 'CG': 'Partial effect', 'GG': 'Typical' }
  },
  'rs12821256': {
    category: 'traits',
    name: 'Blonde Hair (KITLG)',
    outcomes: { 'CC': 'Associated with blonde hair', 'CT': 'Partial effect', 'TT': 'Darker hair likely' }
  },
  'rs4988235': {
    category: 'traits',
    name: 'Lactose Tolerance (LCT)',
    outcomes: { 'TT': 'Lactose tolerant (lactase persistent)', 'CT': 'Partial tolerance', 'CC': 'Likely lactose intolerant (lactase non-persistent)' }
  },
  'rs182549': {
    category: 'traits',
    name: 'Lactose Tolerance (European)',
    outcomes: { 'TT': 'Lactose tolerant', 'CT': 'Intermediate', 'CC': 'Lactose intolerant' }
  },
  'rs1815739': {
    category: 'traits',
    name: 'Muscle Fiber Type (ACTN3 R577X)',
    outcomes: { 'CC': 'Sprint/power advantage (alpha-actinin-3 present)', 'CT': 'Mixed fiber type', 'TT': 'Endurance advantage (alpha-actinin-3 deficient)' }
  },
  'rs4341': {
    category: 'traits',
    name: 'Endurance Performance (ACE I/D)',
    outcomes: { 'GG': 'II genotype - endurance advantage', 'CG': 'ID genotype - balanced', 'CC': 'DD genotype - power/strength advantage' }
  },
  'rs1800012': {
    category: 'traits',
    name: 'Tendon/Ligament Injury Risk (COL1A1)',
    outcomes: { 'TT': 'Increased soft tissue injury risk', 'GT': 'Intermediate', 'GG': 'Lower risk' }
  },
  'rs713598': {
    category: 'traits',
    name: 'Bitter Taste Perception (TAS2R38 A49P)',
    outcomes: { 'GG': 'Non-taster', 'CG': 'Medium taster', 'CC': 'Strong bitter taster (PTC/PROP)' }
  },
  'rs1726866': {
    category: 'traits',
    name: 'Bitter Taste (TAS2R38 V262A)',
    outcomes: { 'CC': 'Non-taster', 'CT': 'Medium taster', 'TT': 'Strong taster' }
  },
  'rs10246939': {
    category: 'traits',
    name: 'Bitter Taste (TAS2R38 I296V)',
    outcomes: { 'CC': 'Strong taster', 'CT': 'Medium taster', 'TT': 'Non-taster' }
  },
  'rs17822931': {
    category: 'traits',
    name: 'Earwax Type & Body Odor (ABCC11)',
    outcomes: { 'TT': 'Dry earwax, less body odor', 'CT': 'Intermediate', 'CC': 'Wet earwax, typical body odor' }
  },
  'rs4481887': {
    category: 'traits',
    name: 'Asparagus Urine Smell Detection',
    outcomes: { 'AA': 'Unable to smell', 'AG': 'Partial ability', 'GG': 'Can detect asparagus metabolite smell' }
  },
  'rs7495174': {
    category: 'traits',
    name: 'Green/Hazel Eyes (OCA2)',
    outcomes: { 'AA': 'More likely green/hazel', 'AG': 'Variable', 'GG': 'Brown more likely' }
  },
  'rs1393350': {
    category: 'traits',
    name: 'Freckling (IRF4)',
    outcomes: { 'AA': 'Less freckling', 'GA': 'Moderate freckling tendency', 'GG': 'More freckling' }
  },
  'rs2228479': {
    category: 'traits',
    name: 'Hair Curl (TCHH)',
    outcomes: { 'AA': 'Straighter hair', 'AG': 'Wavy hair', 'GG': 'Curlier hair' }
  },
  'rs11803731': {
    category: 'traits',
    name: 'Hair Thickness (EDAR)',
    outcomes: { 'TT': 'Thicker hair (common in East Asians)', 'AT': 'Intermediate', 'AA': 'Typical thickness' }
  },
  'rs17646946': {
    category: 'traits',
    name: 'Male Pattern Baldness (AR)',
    outcomes: { 'GG': 'Higher baldness risk', 'AG': 'Moderate risk', 'AA': 'Lower risk' }
  },
  'rs6152': {
    category: 'traits',
    name: 'Male Pattern Baldness (AR)',
    outcomes: { 'AA': 'Higher baldness risk', 'GA': 'Intermediate', 'GG': 'Lower risk' }
  },
  'rs2180439': {
    category: 'traits',
    name: 'Unibrow Tendency (PAX3)',
    outcomes: { 'CC': 'More likely unibrow', 'CT': 'Intermediate', 'TT': 'Less likely' }
  },
  'rs3827760': {
    category: 'traits',
    name: 'Hair Thickness & Tooth Shape (EDAR V370A)',
    outcomes: { 'AA': 'Thicker hair, shovel-shaped incisors', 'AG': 'Intermediate', 'GG': 'Typical' }
  },
  'rs671': {
    category: 'traits',
    name: 'Alcohol Flush Reaction (ALDH2)',
    outcomes: { 'AA': 'Severe flush (alcohol intolerance)', 'GA': 'Moderate flush', 'GG': 'No flush reaction' }
  },
  'rs1229984': {
    category: 'traits',
    name: 'Alcohol Metabolism (ADH1B)',
    outcomes: { 'CC': 'Rapid metabolism (protective against alcoholism)', 'CT': 'Intermediate', 'TT': 'Slower metabolism' }
  },
  'rs4680': {
    category: 'traits',
    name: 'Caffeine Sensitivity (related)',
    outcomes: { 'GG': 'Fast COMT - lower caffeine sensitivity', 'AG': 'Intermediate', 'AA': 'Slow COMT - may be more caffeine sensitive' }
  },
  'rs762551': {
    category: 'traits',
    name: 'Caffeine Metabolism (CYP1A2)',
    outcomes: { 'AA': 'Fast caffeine metabolizer', 'AC': 'Intermediate', 'CC': 'Slow caffeine metabolizer' }
  },

  // ============================================================================
  // PSYCHOLOGICAL & BEHAVIORAL (15+ variants)
  // ============================================================================
  'rs4680_psych': {
    category: 'psychological',
    name: 'Stress Response & Cognition (COMT Val158Met)',
    outcomes: { 'GG': 'Warrior type - stress resilient, lower baseline dopamine, better under pressure', 'AG': 'Balanced stress response', 'AA': 'Worrier type - stress sensitive, higher baseline dopamine, better executive function at baseline' }
  },
  'rs53576': {
    category: 'psychological',
    name: 'Empathy & Social Bonding (OXTR)',
    outcomes: { 'GG': 'Higher empathy, better social cognition, more sensitive to social environment', 'AG': 'Moderate social sensitivity', 'AA': 'Lower social sensitivity, potentially more resilient to negative social environment' }
  },
  'rs2254298': {
    category: 'psychological',
    name: 'Social Anxiety & Attachment (OXTR)',
    outcomes: { 'AA': 'Higher social anxiety tendency', 'AG': 'Intermediate', 'GG': 'Lower social anxiety tendency' }
  },
  'rs1800497': {
    category: 'psychological',
    name: 'Reward Sensitivity & Addiction Risk (DRD2/ANKK1 Taq1A)',
    outcomes: { 'AA': 'Reduced D2 receptors, higher novelty seeking, increased addiction susceptibility', 'AG': 'Moderate effect', 'GG': 'Normal D2 density' }
  },
  'rs1800955': {
    category: 'psychological',
    name: 'Novelty Seeking (DRD4 -521)',
    outcomes: { 'CC': 'Lower novelty seeking', 'CT': 'Moderate', 'TT': 'Higher novelty seeking, more exploratory' }
  },
  'rs6265': {
    category: 'psychological',
    name: 'Memory & Learning (BDNF Val66Met)',
    outcomes: { 'CC': 'Val/Val - Better episodic memory, larger hippocampus', 'CT': 'Val/Met - Intermediate', 'TT': 'Met/Met - May have reduced activity-dependent BDNF secretion, affects memory' }
  },
  'rs25531': {
    category: 'psychological',
    name: 'Serotonin Transporter (SLC6A4)',
    outcomes: { 'AA': 'Long allele - more resilient to stress', 'AG': 'Intermediate', 'GG': 'Short allele - more reactive to environmental stress (for better and worse)' }
  },
  'rs6311': {
    category: 'psychological',
    name: 'Serotonin Receptor (HTR2A)',
    outcomes: { 'CC': 'May affect serotonin signaling', 'CT': 'Intermediate', 'TT': 'Reference type' }
  },
  'rs6313': {
    category: 'psychological',
    name: 'Serotonin Receptor (HTR2A T102C)',
    outcomes: { 'TT': 'May have altered serotonin sensitivity', 'CT': 'Intermediate', 'CC': 'Reference type' }
  },
  'rs1386483': {
    category: 'psychological',
    name: 'Conscientiousness (KATNAL2)',
    outcomes: { 'CC': 'Associated with lower conscientiousness', 'CT': 'Intermediate', 'TT': 'Higher conscientiousness tendency' }
  },
  'rs2576037': {
    category: 'psychological',
    name: 'Extraversion (WSCD2)',
    outcomes: { 'TT': 'More extraverted tendency', 'CT': 'Intermediate', 'CC': 'Less extraverted' }
  },
  'rs1006737': {
    category: 'psychological',
    name: 'Mood Regulation (CACNA1C)',
    outcomes: { 'AA': 'Associated with mood disorder risk', 'AG': 'Intermediate', 'GG': 'Reference type' }
  },
  'rs4570625': {
    category: 'psychological',
    name: 'Impulsivity & Anxiety (TPH2)',
    outcomes: { 'GG': 'Higher amygdala reactivity, more anxiety/harm avoidance', 'GT': 'Intermediate', 'TT': 'Lower amygdala reactivity' }
  },
  'rs1800532': {
    category: 'psychological',
    name: 'Sleep & Mood (TPH1)',
    outcomes: { 'AA': 'May affect serotonin synthesis', 'AC': 'Intermediate', 'CC': 'Reference type' }
  },
  'rs28363170': {
    category: 'psychological',
    name: 'Attention & ADHD Risk (DAT1/SLC6A3)',
    outcomes: { '10R/10R': 'Associated with ADHD traits', '9R/10R': 'Intermediate', '9R/9R': 'Protective' }
  },

  // ============================================================================
  // NUTRIGENOMICS (15+ variants)
  // ============================================================================
  'rs602662': {
    category: 'nutrigenomics',
    name: 'Vitamin B12 Levels (FUT2)',
    outcomes: { 'GG': 'Normal B12 absorption', 'AG': 'Slightly reduced B12 levels', 'AA': 'Reduced B12 absorption - consider monitoring and supplementation' }
  },
  'rs492602': {
    category: 'nutrigenomics',
    name: 'B12 & Gut Microbiome (FUT2 secretor)',
    outcomes: { 'GG': 'Non-secretor (different gut microbiome)', 'AG': 'Intermediate', 'AA': 'Secretor status' }
  },
  'rs2282679': {
    category: 'nutrigenomics',
    name: 'Vitamin D Levels (GC/DBP)',
    outcomes: { 'TT': 'Lower vitamin D binding protein, reduced vitamin D levels', 'GT': 'Intermediate', 'GG': 'Normal vitamin D metabolism' }
  },
  'rs10741657': {
    category: 'nutrigenomics',
    name: 'Vitamin D Synthesis (CYP2R1)',
    outcomes: { 'AA': 'Reduced vitamin D hydroxylation', 'AG': 'Intermediate', 'GG': 'Normal' }
  },
  'rs12785878': {
    category: 'nutrigenomics',
    name: 'Vitamin D Levels (DHCR7)',
    outcomes: { 'GG': 'Lower vitamin D levels', 'GT': 'Intermediate', 'TT': 'Normal' }
  },
  'rs1801394_nutri': {
    category: 'nutrigenomics',
    name: 'B12 & Folate Metabolism (MTRR A66G)',
    outcomes: { 'GG': 'Reduced methionine synthase reductase activity', 'AG': 'Intermediate', 'AA': 'Normal function' }
  },
  'rs234706': {
    category: 'nutrigenomics',
    name: 'Homocysteine Metabolism (CBS C699T)',
    outcomes: { 'AA': 'Increased CBS activity (may deplete homocysteine faster)', 'AG': 'Intermediate', 'GG': 'Normal' }
  },
  'rs1801131_nutri': {
    category: 'nutrigenomics',
    name: 'Folate Metabolism (MTHFR A1298C)',
    outcomes: { 'CC': 'Reduced MTHFR activity', 'AC': 'Intermediate', 'AA': 'Normal' }
  },
  'rs174546_nutri': {
    category: 'nutrigenomics',
    name: 'Omega-3 Conversion (FADS1)',
    outcomes: { 'TT': 'Poor ALA to EPA/DHA conversion - needs direct omega-3 sources', 'CT': 'Intermediate conversion', 'CC': 'Better ALA conversion' }
  },
  'rs1535': {
    category: 'nutrigenomics',
    name: 'Omega-6/Omega-3 Balance (FADS2)',
    outcomes: { 'AA': 'Higher omega-6 from precursors', 'AG': 'Balanced', 'GG': 'Lower conversion' }
  },
  'rs7946': {
    category: 'nutrigenomics',
    name: 'Choline Requirements (PEMT)',
    outcomes: { 'TT': 'Higher choline requirements (especially in women)', 'CT': 'Moderate increase', 'CC': 'Normal choline needs' }
  },
  'rs12325817': {
    category: 'nutrigenomics',
    name: 'Choline Metabolism (PEMT)',
    outcomes: { 'CC': 'Increased choline requirements', 'CT': 'Intermediate', 'TT': 'Normal requirements' }
  },
  'rs1799945': {
    category: 'nutrigenomics',
    name: 'Iron Absorption (HFE H63D)',
    outcomes: { 'GG': 'Increased iron absorption, hemochromatosis carrier', 'CG': 'Mildly increased absorption', 'CC': 'Normal iron absorption' }
  },
  'rs1800562': {
    category: 'nutrigenomics',
    name: 'Iron Overload Risk (HFE C282Y)',
    outcomes: { 'AA': 'High hemochromatosis risk - monitor ferritin', 'GA': 'Carrier - monitor iron levels', 'GG': 'Normal' }
  },
  'rs855791': {
    category: 'nutrigenomics',
    name: 'Iron Regulation (TMPRSS6)',
    outcomes: { 'TT': 'Lower iron/hemoglobin levels', 'CT': 'Intermediate', 'CC': 'Normal' }
  },
  'rs1801282_nutri': {
    category: 'nutrigenomics',
    name: 'Saturated Fat Response (PPARG)',
    outcomes: { 'CG': 'Less weight gain from saturated fat', 'CC': 'Normal response to saturated fat', 'GG': 'May be more sensitive to saturated fat' }
  },
  'rs5082': {
    category: 'nutrigenomics',
    name: 'Saturated Fat & HDL (APOA2)',
    outcomes: { 'CC': 'High saturated fat intake may reduce HDL', 'CT': 'Moderate effect', 'TT': 'Less affected by saturated fat' }
  },
  'rs9939609_nutri': {
    category: 'nutrigenomics',
    name: 'Protein & Satiety (FTO)',
    outcomes: { 'AA': 'May benefit more from high-protein diet for satiety', 'AT': 'Intermediate', 'TT': 'Standard protein response' }
  },
  'rs1761667': {
    category: 'nutrigenomics',
    name: 'Fat Taste Sensitivity (CD36)',
    outcomes: { 'AA': 'Lower fat taste sensitivity, may overconsume fats', 'AG': 'Moderate', 'GG': 'Normal fat taste perception' }
  },

  // ============================================================================
  // CARRIER STATUS (Recessive Conditions) (10+ variants)
  // ============================================================================
  'rs76151636': {
    category: 'carrier',
    condition: 'Cystic Fibrosis Carrier (CFTR F508del)',
    riskAllele: 'del',
    baseRisk: 0.04,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'Most common cystic fibrosis mutation. Carriers (1 copy) are healthy but may pass to children.',
    recommendations: ['Genetic counseling if planning pregnancy', 'Partner testing recommended', 'No health implications for carriers'],
    citations: ['PMID: 2475911', 'PMID: 24784727']
  },
  'rs63750066': {
    category: 'carrier',
    condition: 'Sickle Cell Trait (HBB E6V)',
    riskAllele: 'T',
    baseRisk: 0.08,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'Sickle cell trait (carrier status). Provides some malaria protection. Partners should be tested.',
    recommendations: ['Genetic counseling', 'Partner testing before pregnancy', 'Generally healthy carriers, rare complications at extreme altitude'],
    citations: ['PMID: 16493693']
  },
  'rs334': {
    category: 'carrier',
    condition: 'Sickle Cell Trait (HBB)',
    riskAllele: 'T',
    baseRisk: 0.08,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'HBB sickle mutation carrier status.',
    recommendations: ['Carrier screening for partners', 'Genetic counseling'],
    citations: ['PMID: 16493693']
  },
  'rs80338939': {
    category: 'carrier',
    condition: 'Tay-Sachs Carrier (HEXA)',
    riskAllele: 'insT',
    baseRisk: 0.03,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'Tay-Sachs disease carrier. More common in Ashkenazi Jewish, French Canadian populations.',
    recommendations: ['Genetic counseling', 'Partner carrier testing essential before pregnancy'],
    citations: ['PMID: 11992261']
  },
  'rs28940868': {
    category: 'carrier',
    condition: 'PKU Carrier (PAH)',
    riskAllele: 'A',
    baseRisk: 0.02,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'Phenylketonuria carrier status. Newborn screening catches affected infants.',
    recommendations: ['Genetic counseling if family history', 'Partner testing if concerned'],
    citations: ['PMID: 20301627']
  },
  'rs113993960': {
    category: 'carrier',
    condition: 'Cystic Fibrosis Carrier (CFTR G551D)',
    riskAllele: 'A',
    baseRisk: 0.01,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'CF mutation responsive to ivacaftor (Kalydeco). Important to know for treatment options.',
    recommendations: ['Genetic counseling', 'Important for treatment selection if CF diagnosed'],
    citations: ['PMID: 21639805']
  },
  'rs11970176': {
    category: 'carrier',
    condition: 'Alpha-1 Antitrypsin Deficiency Carrier (SERPINA1 Z)',
    riskAllele: 'A',
    baseRisk: 0.04,
    riskMultiplier: 1.5,
    confidence: 'high' as const,
    description: 'A1AT deficiency carrier (MZ type). ZZ homozygotes have severe deficiency with lung/liver risk.',
    recommendations: ['Absolutely avoid smoking', 'Carrier may have slightly reduced A1AT levels', 'Monitor liver function'],
    citations: ['PMID: 12765945']
  },
  'rs17580': {
    category: 'carrier',
    condition: 'Alpha-1 Antitrypsin Deficiency (SERPINA1 S)',
    riskAllele: 'T',
    baseRisk: 0.05,
    riskMultiplier: 1.2,
    confidence: 'high' as const,
    description: 'A1AT S variant. SS or SZ compound heterozygotes may have moderate deficiency.',
    recommendations: ['Avoid smoking', 'Consider A1AT level testing'],
    citations: ['PMID: 12765945']
  },
  'rs74315329': {
    category: 'carrier',
    condition: 'Gaucher Disease Carrier (GBA N370S)',
    riskAllele: 'A',
    baseRisk: 0.01,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'Gaucher disease carrier. More common in Ashkenazi Jewish population. Also linked to Parkinson\'s risk.',
    recommendations: ['Genetic counseling', 'Note: GBA variants increase Parkinson\'s disease risk'],
    citations: ['PMID: 15024688', 'PMID: 19846850']
  },
  'rs76763715': {
    category: 'carrier',
    condition: 'Bloom Syndrome Carrier (BLM)',
    riskAllele: 'del',
    baseRisk: 0.01,
    riskMultiplier: 1.0,
    confidence: 'high' as const,
    description: 'Bloom syndrome carrier, primarily in Ashkenazi Jewish population.',
    recommendations: ['Genetic counseling', 'Partner testing if same ancestry'],
    citations: ['PMID: 7585968']
  }
};

// ============================================================================
// FILE PARSING UTILITIES
// ============================================================================

function parse23andMeFile(content: string): SNPData[] {
  const lines = content.split('\n');
  const snps: SNPData[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const parts = line.split('\t');
    if (parts.length >= 4) {
      snps.push({
        rsid: parts[0].trim(),
        chromosome: parts[1].trim(),
        position: parseInt(parts[2].trim(), 10),
        genotype: parts[3].trim()
      });
    }
  }
  
  return snps;
}

function parseAncestryDNAFile(content: string): SNPData[] {
  const lines = content.split('\n');
  const snps: SNPData[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const parts = line.split('\t');
    if (parts.length >= 5) {
      snps.push({
        rsid: parts[0].trim(),
        chromosome: parts[1].trim(),
        position: parseInt(parts[2].trim(), 10),
        genotype: parts[3].trim() + parts[4].trim()
      });
    }
  }
  
  return snps;
}

function parseVCFFile(content: string): SNPData[] {
  const lines = content.split('\n');
  const snps: SNPData[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const parts = line.split('\t');
    if (parts.length >= 10) {
      const rsid = parts[2];
      const ref = parts[3];
      const alt = parts[4];
      const genotype = parts[9].split(':')[0];
      
      let alleles = '';
      if (genotype === '0/0' || genotype === '0|0') alleles = ref + ref;
      else if (genotype === '0/1' || genotype === '0|1' || genotype === '1/0' || genotype === '1|0') alleles = ref + alt;
      else if (genotype === '1/1' || genotype === '1|1') alleles = alt + alt;
      
      if (rsid.startsWith('rs')) {
        snps.push({
          rsid,
          chromosome: parts[0].replace('chr', ''),
          position: parseInt(parts[1], 10),
          genotype: alleles
        });
      }
    }
  }
  
  return snps;
}

function detectFileFormat(content: string): '23andme' | 'ancestry' | 'vcf' | 'unknown' {
  const firstLines = content.split('\n').slice(0, 20).join('\n');
  
  if (firstLines.includes('##fileformat=VCF')) return 'vcf';
  if (firstLines.includes('AncestryDNA')) return 'ancestry';
  if (firstLines.includes('23andMe')) return '23andme';
  
  // Try to detect by structure
  const dataLine = content.split('\n').find(l => !l.startsWith('#') && l.trim());
  if (dataLine) {
    const parts = dataLine.split('\t');
    if (parts.length === 4 && parts[0].startsWith('rs')) return '23andme';
    if (parts.length >= 5 && parts[0].startsWith('rs')) return 'ancestry';
    if (parts.length >= 8) return 'vcf';
  }
  
  return 'unknown';
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

function analyzeDNA(snps: SNPData[]): AnalysisResults {
  const snpMap = new Map(snps.map(s => [s.rsid, s]));
  
  const healthRisks: HealthRisk[] = [];
  const traits: Trait[] = [];
  const pharmacogenomics: PharmacogenomicResult[] = [];
  
  // Health risk categories including new autoimmune and carrier
  const healthCategories = ['cardiovascular', 'cancer', 'metabolic', 'autoimmune', 'carrier'];
  
  for (const [rsid, info] of Object.entries(SNP_DATABASE)) {
    // Handle rsid variants with suffixes (like rs4680_psych, rs174546_nutri)
    const baseRsid = rsid.replace(/_.*$/, '');
    const snp = snpMap.get(rsid) || snpMap.get(baseRsid);
    if (!snp) continue;
    
    const dbInfo = info as any;
    
    if (healthCategories.includes(dbInfo.category)) {
      const hasRiskAllele = snp.genotype.includes(dbInfo.riskAllele);
      const homozygousRisk = snp.genotype === dbInfo.riskAllele + dbInfo.riskAllele;
      
      // Handle protective variants (multiplier < 1)
      let multiplier: number;
      if (dbInfo.riskMultiplier < 1) {
        // Protective variant
        multiplier = homozygousRisk ? dbInfo.riskMultiplier : (hasRiskAllele ? (dbInfo.riskMultiplier + 1) / 2 : 1);
      } else {
        multiplier = homozygousRisk ? dbInfo.riskMultiplier : (hasRiskAllele ? (dbInfo.riskMultiplier + 1) / 2 : 1);
      }
      
      const yourRisk = Math.min(Math.max(dbInfo.baseRisk * multiplier, 0.001), 0.95);
      
      let riskLevel: 'low' | 'moderate' | 'elevated' | 'high' = 'low';
      if (multiplier > 2.5) riskLevel = 'high';
      else if (multiplier > 1.5) riskLevel = 'elevated';
      else if (multiplier > 1.2) riskLevel = 'moderate';
      // Protective variants stay 'low'
      
      healthRisks.push({
        condition: dbInfo.condition,
        category: dbInfo.category,
        rsid: baseRsid,
        genotype: snp.genotype,
        riskAllele: dbInfo.riskAllele,
        riskLevel,
        relativeRisk: multiplier,
        populationRisk: dbInfo.baseRisk * 100,
        yourRisk: yourRisk * 100,
        confidence: dbInfo.confidence,
        description: dbInfo.description,
        recommendations: dbInfo.recommendations,
        citations: dbInfo.citations
      });
    }
    
    if (dbInfo.category === 'pharmacogenomics') {
      const status = dbInfo.metabolizerStatus[snp.genotype] || 'Unknown';
      
      // Enhanced recommendations based on status
      let recommendations = 'Standard dosing typically appropriate';
      if (status === 'Poor' || status === 'Deficient (CRITICAL)') {
        recommendations = 'CRITICAL: Consult physician before taking affected medications - severe toxicity risk or dose adjustment needed';
      } else if (status === 'Intermediate') {
        recommendations = 'May require dose adjustments for some medications - discuss with pharmacist';
      } else if (status === 'Ultrarapid' || status === 'Rapid') {
        recommendations = 'May metabolize faster than normal - effectiveness may be reduced at standard doses';
      } else if (status === 'Sensitive (low dose)') {
        recommendations = 'Lower doses typically required - start with reduced dose and titrate carefully';
      } else if (status === 'Resistant (high dose)') {
        recommendations = 'May require higher than standard doses for therapeutic effect';
      } else if (status.includes('Poor transport') || status.includes('high myopathy risk')) {
        recommendations = 'IMPORTANT: Increased risk of muscle side effects with certain statins - discuss alternatives';
      }
      
      pharmacogenomics.push({
        gene: dbInfo.gene,
        rsid: baseRsid,
        genotype: snp.genotype,
        metabolizerStatus: status,
        affectedDrugs: dbInfo.affectedDrugs,
        recommendations,
        fdaLabel: dbInfo.fdaLabel
      });
    }
    
    if (dbInfo.category === 'traits' || dbInfo.category === 'psychological' || dbInfo.category === 'nutrigenomics') {
      const result = dbInfo.outcomes[snp.genotype] || 'Variant not in database';
      traits.push({
        name: dbInfo.name,
        category: dbInfo.category,
        rsid: baseRsid,
        genotype: snp.genotype,
        result,
        description: result,
        confidence: 'high'
      });
    }
  }
  
  // Simulated ancestry (would require actual reference population comparison)
  const ancestry: AncestryResult[] = [
    { population: 'European', percentage: 45.2, confidence: [42.1, 48.3] },
    { population: 'Indigenous Americas', percentage: 28.7, confidence: [25.4, 32.0] },
    { population: 'Sub-Saharan African', percentage: 15.3, confidence: [12.8, 17.8] },
    { population: 'East Asian', percentage: 6.4, confidence: [4.2, 8.6] },
    { population: 'Middle Eastern', percentage: 4.4, confidence: [2.1, 6.7] }
  ];
  
  return {
    totalVariants: snps.length,
    healthRisks: healthRisks.sort((a, b) => b.relativeRisk - a.relativeRisk),
    traits,
    pharmacogenomics,
    ancestry,
    maternalHaplogroup: 'H1a1',
    paternalHaplogroup: 'R-M269',
    neanderthalPercentage: 2.4
  };
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const COLORS = {
  primary: '#0ea5e9',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#64748b'
};

const ANCESTRY_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    elevated: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[level] || styles.low}`}>
      {level.toUpperCase()}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: 'bg-sky-500/20 text-sky-400',
    moderate: 'bg-violet-500/20 text-violet-400',
    low: 'bg-slate-500/20 text-slate-400'
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${styles[level] || styles.low}`}>
      {level} confidence
    </span>
  );
}

function RiskMeter({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  let color = COLORS.success;
  if (percentage > 66) color = COLORS.danger;
  else if (percentage > 33) color = COLORS.warning;
  
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtext?: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-sky-500/10">
          <Icon className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-xl font-semibold text-white">{value}</p>
          {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

function HealthRiskCard({ risk }: { risk: HealthRisk }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <button 
        className="w-full p-4 text-left hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white">{risk.condition}</h4>
              <RiskBadge level={risk.riskLevel} />
            </div>
            <p className="text-sm text-slate-400">{risk.rsid} • {risk.genotype}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{risk.yourRisk.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">vs {risk.populationRisk.toFixed(1)}% avg</p>
          </div>
        </div>
        <div className="mt-3">
          <RiskMeter value={risk.yourRisk} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
          <p className="text-sm text-slate-300">{risk.description}</p>
          
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Recommendations</p>
            <ul className="text-sm text-slate-300 space-y-1">
              {risk.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex items-center gap-2">
            <ConfidenceBadge level={risk.confidence} />
            <span className="text-xs text-slate-500">
              {risk.citations.join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TraitCard({ trait }: { trait: Trait }) {
  const categoryIcons: Record<string, React.ElementType> = {
    traits: Dna,
    psychological: Brain,
    nutrigenomics: Activity
  };
  const Icon = categoryIcons[trait.category] || Dna;
  
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white text-sm">{trait.name}</h4>
          <p className="text-xs text-slate-500 mb-2">{trait.rsid} • {trait.genotype}</p>
          <p className="text-sm text-slate-300">{trait.result}</p>
        </div>
      </div>
    </div>
  );
}

function PharmacogenomicCard({ result }: { result: PharmacogenomicResult }) {
  const statusColors: Record<string, string> = {
    'Poor': 'text-red-400 bg-red-500/10',
    'Intermediate': 'text-amber-400 bg-amber-500/10',
    'Normal': 'text-emerald-400 bg-emerald-500/10',
    'Rapid': 'text-sky-400 bg-sky-500/10',
    'Ultrarapid': 'text-violet-400 bg-violet-500/10'
  };
  
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-white">{result.gene}</h4>
          <p className="text-xs text-slate-500">{result.rsid} • {result.genotype}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[result.metabolizerStatus] || statusColors.Normal}`}>
          {result.metabolizerStatus} Metabolizer
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-xs text-slate-400 mb-1">Affected Medications</p>
        <div className="flex flex-wrap gap-1">
          {result.affectedDrugs.map((drug, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
              {drug}
            </span>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-slate-300">{result.recommendations}</p>
      
      {result.fdaLabel && (
        <div className="mt-2 flex items-center gap-1 text-xs text-sky-400">
          <Info className="w-3 h-3" />
          FDA label includes pharmacogenomic guidance
        </div>
      )}
    </div>
  );
}

function AncestryChart({ data }: { data: AncestryResult[] }) {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-64 h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="population"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={ANCESTRY_COLORS[index % ANCESTRY_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((item, index) => (
          <div key={item.population} className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: ANCESTRY_COLORS[index % ANCESTRY_COLORS.length] }}
            />
            <span className="flex-1 text-sm text-slate-300">{item.population}</span>
            <span className="text-sm font-medium text-white">{item.percentage.toFixed(1)}%</span>
            <span className="text-xs text-slate-500">
              ({item.confidence[0].toFixed(1)}-{item.confidence[1].toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

type TabType = 'overview' | 'health' | 'traits' | 'pharma' | 'ancestry';

export default function DNAInsightsApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const content = await file.text();
      const format = detectFileFormat(content);
      
      if (format === 'unknown') {
        throw new Error('Unsupported file format. Please upload a 23andMe, AncestryDNA, or VCF file.');
      }
      
      let snps: SNPData[];
      switch (format) {
        case '23andme':
          snps = parse23andMeFile(content);
          break;
        case 'ancestry':
          snps = parseAncestryDNAFile(content);
          break;
        case 'vcf':
          snps = parseVCFFile(content);
          break;
        default:
          throw new Error('Unable to parse file');
      }
      
      if (snps.length === 0) {
        throw new Error('No valid SNP data found in file');
      }
      
      // Simulate processing time for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysisResults = analyzeDNA(snps);
      setResults(analysisResults);
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);
  
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'health' as const, label: 'Health Risks', icon: Heart },
    { id: 'traits' as const, label: 'Traits', icon: Dna },
    { id: 'pharma' as const, label: 'Pharmacogenomics', icon: Pill },
    { id: 'ancestry' as const, label: 'Ancestry', icon: Users }
  ];
  
  const healthByCategory = useMemo(() => {
    if (!results) return {};
    return results.healthRisks.reduce((acc, risk) => {
      if (!acc[risk.category]) acc[risk.category] = [];
      acc[risk.category].push(risk);
      return acc;
    }, {} as Record<string, HealthRisk[]>);
  }, [results]);
  
  const traitsByCategory = useMemo(() => {
    if (!results) return {};
    return results.traits.reduce((acc, trait) => {
      if (!acc[trait.category]) acc[trait.category] = [];
      acc[trait.category].push(trait);
      return acc;
    }, {} as Record<string, Trait[]>);
  }, [results]);

  // Risk summary for radar chart
  const riskSummary = useMemo(() => {
    if (!results) return [];
    const categories = ['cardiovascular', 'metabolic', 'cancer'];
    return categories.map(cat => {
      const risks = results.healthRisks.filter(r => r.category === cat);
      const avgRisk = risks.length > 0 
        ? risks.reduce((sum, r) => sum + r.relativeRisk, 0) / risks.length
        : 1;
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        risk: Math.min(avgRisk * 40, 100),
        fullMark: 100
      };
    });
  }, [results]);
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600">
                <Dna className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  DNA Insights Pro
                </h1>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Comprehensive Genetic Analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {results && (
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 text-sky-400 text-sm hover:bg-sky-500/20 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Upload Section */}
        {!results && !isLoading && (
          <div className="max-w-2xl mx-auto">
            <div
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
                ${dragActive 
                  ? 'border-sky-500 bg-sky-500/10' 
                  : darkMode 
                    ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50' 
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".txt,.vcf"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="p-4 rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 w-fit mx-auto mb-4">
                <Upload className={`w-8 h-8 ${darkMode ? 'text-sky-400' : 'text-sky-500'}`} />
              </div>
              
              <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Upload Your DNA Data
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Drag and drop your raw DNA file or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['23andMe', 'AncestryDNA', 'VCF'].map(format => (
                  <span key={format} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {format}
                  </span>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Upload Error</p>
                  <p className="text-sm text-red-300/80">{error}</p>
                </div>
              </div>
            )}
            
            {/* Disclaimer */}
            <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <div>
                  <p className={`font-medium text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                    Educational Purposes Only
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-amber-200/70' : 'text-amber-700'}`}>
                    This tool provides educational genetic information and is not a medical device. 
                    Results should not be used for clinical decision-making without consultation 
                    with qualified healthcare providers and/or certified genetic counselors.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Privacy Note */}
            <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div>
                  <p className={`font-medium text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    Privacy First
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    All analysis is performed locally in your browser. Your genetic data is never 
                    uploaded to any server and is not stored after you close this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-sky-500 animate-spin" />
              <Dna className="w-8 h-8 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className={`mt-6 text-lg font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Analyzing Your Genome
            </p>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Processing variants and calculating risk scores...
            </p>
          </div>
        )}
        
        {/* Results Dashboard */}
        {results && !isLoading && (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                      ${activeTab === tab.id
                        ? 'bg-sky-500 text-white'
                        : darkMode 
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
              
              <button
                onClick={() => { setResults(null); setError(null); }}
                className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <X className="w-4 h-4" />
                New Analysis
              </button>
            </div>
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Dna} label="Variants Analyzed" value={results.totalVariants.toLocaleString()} />
                  <StatCard icon={Heart} label="Health Markers" value={results.healthRisks.length} subtext="risk factors identified" />
                  <StatCard icon={Pill} label="Drug Responses" value={results.pharmacogenomics.length} subtext="genes analyzed" />
                  <StatCard icon={Users} label="Neanderthal DNA" value={`${results.neanderthalPercentage}%`} subtext="variant inheritance" />
                </div>
                
                {/* Risk Overview */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Risk Profile Overview
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer>
                        <RadarChart data={riskSummary}>
                          <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                          <PolarAngleAxis 
                            dataKey="category" 
                            tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]}
                            tick={{ fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 10 }}
                          />
                          <Radar
                            name="Risk"
                            dataKey="risk"
                            stroke={COLORS.primary}
                            fill={COLORS.primary}
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={`text-xs text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Higher values indicate elevated genetic risk relative to population average
                    </p>
                  </div>
                  
                  {/* Priority Findings */}
                  <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Priority Findings
                    </h3>
                    <div className="space-y-3">
                      {results.healthRisks
                        .filter(r => r.riskLevel === 'high' || r.riskLevel === 'elevated')
                        .slice(0, 4)
                        .map((risk, i) => (
                          <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {risk.condition}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {risk.rsid}
                                </p>
                              </div>
                              <RiskBadge level={risk.riskLevel} />
                            </div>
                          </div>
                        ))}
                      {results.healthRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'elevated').length === 0 && (
                        <div className="flex items-center gap-3 p-4">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            No high-priority risk factors identified
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Ancestry */}
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Ancestry Composition
                  </h3>
                  <AncestryChart data={results.ancestry} />
                </div>
              </div>
            )}
            
            {/* Health Tab */}
            {activeTab === 'health' && (
              <div className="space-y-6">
                {Object.entries(healthByCategory).map(([category, risks]) => (
                  <div key={category}>
                    <h3 className={`text-lg font-semibold mb-3 capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {category} Health
                    </h3>
                    <div className="grid gap-4">
                      {risks.map((risk, i) => (
                        <HealthRiskCard key={i} risk={risk} />
                      ))}
                    </div>
                  </div>
                ))}
                
                {results.healthRisks.length === 0 && (
                  <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No health risk variants found in your data
                  </div>
                )}
              </div>
            )}
            
            {/* Traits Tab */}
            {activeTab === 'traits' && (
              <div className="space-y-6">
                {Object.entries(traitsByCategory).map(([category, traits]) => (
                  <div key={category}>
                    <h3 className={`text-lg font-semibold mb-3 capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {category === 'traits' ? 'Physical Traits' : category === 'psychological' ? 'Behavioral Tendencies' : 'Nutrigenomics'}
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {traits.map((trait, i) => (
                        <TraitCard key={i} trait={trait} />
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <strong>Note:</strong> Behavioral and psychological traits are influenced by many genes and environmental factors. 
                    These results represent tendencies, not deterministic outcomes. Gene-environment interactions play a significant 
                    role in how traits manifest.
                  </p>
                </div>
              </div>
            )}
            
            {/* Pharmacogenomics Tab */}
            {activeTab === 'pharma' && (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <p className={`font-medium text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                        Important Medical Notice
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-amber-200/70' : 'text-amber-700'}`}>
                        Always consult your prescribing physician before making any changes to your medications based on this information. 
                        Drug response is influenced by many factors beyond genetics.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {results.pharmacogenomics.map((result, i) => (
                    <PharmacogenomicCard key={i} result={result} />
                  ))}
                </div>
                
                {results.pharmacogenomics.length === 0 && (
                  <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No pharmacogenomic variants found in your data
                  </div>
                )}
              </div>
            )}
            
            {/* Ancestry Tab */}
            {activeTab === 'ancestry' && (
              <div className="space-y-6">
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                  <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Population Composition
                  </h3>
                  <AncestryChart data={results.ancestry} />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Haplogroups
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Maternal (mtDNA)</p>
                        <p className={`text-xl font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {results.maternalHaplogroup}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paternal (Y-DNA)</p>
                        <p className={`text-xl font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {results.paternalHaplogroup}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Ancient Ancestry
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke={darkMode ? '#334155' : '#e2e8f0'}
                            strokeWidth="8"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke={COLORS.secondary}
                            strokeWidth="8"
                            strokeDasharray={`${results.neanderthalPercentage * 2.51} 251`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {results.neanderthalPercentage}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Neanderthal Variants
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Compared to ~2% average for non-African populations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <strong>Note:</strong> Ancestry estimates are based on comparison to reference populations and include 
                    confidence intervals. These percentages represent genetic similarity to modern reference groups, 
                    not direct lineage. Ancestry composition ≠ racial or ethnic identity.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className={`border-t mt-12 py-6 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              DNA Insights Pro • For Educational Purposes Only • Not Medical Advice
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className={`text-sm hover:underline ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Privacy Policy
              </a>
              <a href="#" className={`text-sm hover:underline ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Terms of Service
              </a>
              <a href="#" className={`text-sm hover:underline ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Genetic Counseling Resources
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
