# PGx Analyzer Design Patterns (v2 Architecture)

**Analysis Date**: 2025-12-22
**Analyzers Reviewed**: CYP2D6, UGT1A1, CYP2C9
**Purpose**: Document best practices for building medical-grade pharmacogenomics analyzers

---

## Executive Summary

After implementing 6 gene analyzers (CYP2D6, CYP2C9, VKORC1, SLCO1B1, F5, UGT1A1), clear architectural patterns have emerged. This document codifies these patterns to ensure consistency, maintainability, and medical-grade quality.

**Key Finding**: v2 analyzers (CYP2D6, UGT1A1) demonstrate significantly better architecture than v1, with:
- ✅ Standardized input format: `Array<{ rsid: string; genotype: string }>`
- ✅ Comprehensive confidence scoring
- ✅ Drug-specific recommendation functions
- ✅ Explicit limitation documentation
- ✅ Better test coverage (36/36 for UGT1A1, 20/20 for CYP2D6)

---

## 1. Header Documentation Pattern

### ✅ Best Practice Example (CYP2D6):

```typescript
/**
 * CYP2D6 Pharmacogenomics Analyzer v2
 *
 * [GENE DESCRIPTION]
 * CYP2D6 encodes cytochrome P450 2D6, responsible for ~25% of all prescription drug metabolism.
 * This is THE most polymorphic CYP gene with 150+ star alleles defined.
 *
 * CRITICAL CLINICAL CONTEXT:
 * - Poor metabolizers (PM): 5-10% Europeans, <1% East Asians, 1-2% Africans
 * - Intermediate metabolizers (IM): 10-15% Europeans, 50%+ East Asians
 * - Normal metabolizers (NM): 70-80% Europeans
 * - Ultrarapid metabolizers (UM): 1-2% Europeans, 30%+ in some populations
 *
 * KEY SUBSTRATES (PERSONAL RELEVANCE):
 * 🔥 AMPHETAMINES:
 *    - Dextroamphetamine (Adderall, Vyvanse)
 *    - CYP2D6 is a MINOR pathway (~30% metabolism)
 *    - BUT phenotype affects: [details]
 *
 * OTHER CRITICAL SUBSTRATES:
 * - Codeine → Morphine (prodrug activation) - FATAL in ultrarapids (FDA BLACK BOX)
 * - [list other drugs]
 *
 * CRITICAL VARIANTS:
 * - CYP2D6*4 (rs3892097): Most common no-function allele in Europeans (~20% carrier frequency)
 * - [list with rsid, functional impact, population frequencies]
 *
 * COMPLEXITY NOTES:
 * ⚠️ [Any special considerations]
 *
 * 🚨 LIMITATIONS OF SNP-ARRAY DATA:
 * - [Specific limitations for this gene]
 *
 * CLINICAL IMPACT:
 * - FDA BLACK BOX: [specific warnings]
 * - [Other critical clinical impacts]
 *
 * CPIC GUIDELINES:
 * - Level A evidence for: [drugs]
 * - Level B evidence for: [drugs]
 *
 * REFERENCES:
 * - CPIC Guideline: PMID [numbers]
 * - PharmVar Database: [URL]
 * - FDA guidance
 */
```

### 📋 Required Header Sections:
1. **Gene Description** - What enzyme/protein, % of drug metabolism
2. **Clinical Context** - Population frequencies for each phenotype
3. **Key Substrates** - Drugs affected, prioritize by user relevance
4. **Critical Variants** - RSIDs, functional impact, population data
5. **Complexity Notes** - Any special considerations (CNVs, phase ambiguity, etc.)
6. **Limitations** - What SNP arrays can't detect
7. **Clinical Impact** - FDA warnings, critical safety information
8. **Guidelines** - CPIC levels, FDA guidance
9. **References** - PMIDs, databases, guidelines

---

## 2. Type System Architecture

### ✅ Standard Type Hierarchy:

```typescript
// 1. BASIC TYPES
export type GeneticProvider = 'unknown' | '23andme' | 'ancestrydna';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RiskLevel = 'critical' | 'warning' | 'moderate' | 'standard';

// 2. ALLELE TYPES
export type [GENE]Allele = '*1' | '*2' | '*3' | ... | 'Unknown';

// 3. PHENOTYPE TYPES
export type [GENE]Phenotype =
  | 'Normal Metabolizer'
  | 'Intermediate Metabolizer'
  | 'Poor Metabolizer'
  | 'Ultrarapid Metabolizer'  // If applicable
  | 'Unknown';

// 4. DIPLOTYPE INTERFACE
export interface [GENE]Diplotype {
  allele1: [GENE]Allele;
  allele2: [GENE]Allele;
  phenotype: [GENE]Phenotype;
  activityScore: number;
  confidence?: ConfidenceLevel;  // Can be here or in main result
  phaseAmbiguity?: boolean;  // If applicable
  possibleDiplotypes?: string[];  // If phase ambiguous
}

// 5. DRUG RECOMMENDATION INTERFACE
export interface [GENE]DrugRecommendation {
  drug: string;
  category?: string;  // e.g., "Amphetamines", "SSRIs"
  recommendation: string;
  doseAdjustment?: string;
  riskLevel: RiskLevel;
  alternativeDrugs?: string[];
  monitoring?: string;
  fdaGuidance?: boolean;  // or fdaLabel
  cpicLevel?: 'A' | 'B' | 'C';
  references?: string[];  // PMIDs
}

// 6. MAIN ANALYSIS RESULT
export interface [GENE]AnalysisResult {
  gene: '[GENE]';  // Literal type
  diplotype: [GENE]Diplotype;
  drugs: [GENE]DrugRecommendation[];
  clinicalSummary: string;
  safetyAlerts: string[];
  confidence: ConfidenceLevel;
  limitations: string[];
  guidelines: {
    cpic: string;
    fda: string[];
  };

  // Optional gene-specific fields
  // e.g., gilbertSyndrome for UGT1A1
  //      warfarinDosing for CYP2C9
}
```

### 🎯 Key Principles:
- **Literal gene name in result**: `gene: 'CYP2D6'` not `gene: string`
- **Consistent naming**: Use `drugs` not `drugRecommendations` (shorter, cleaner)
- **Explicit optionality**: Use `?` for truly optional fields
- **Gene-specific extensions**: Add custom fields for special cases (Gilbert syndrome, warfarin dosing, etc.)

---

## 3. Function Architecture

### ✅ Standard Function Pipeline:

```typescript
// UTILITY FUNCTIONS
function normalizeGenotype(genotype: string | null): string | null { }
function getAlleleFunction(rsid: string, genotype: string): { allele: Allele; activity: number } { }

// CORE LOGIC
function determineDiplotype(genotypes: Array<{ rsid: string; genotype: string }>): Diplotype { }
function activityScoreToPhenotype(activityScore: number): Phenotype { }

// DRUG RECOMMENDATIONS
function generateDrugRecommendations(diplotype: Diplotype): DrugRecommendation[] { }
function generate[SpecificDrug]Recommendations(phenotype: string, activityScore: number): DrugRecommendation[] { }

// METADATA
function generateSafetyAlerts(diplotype: Diplotype): string[] { }
function determineConfidence(diplotype: Diplotype, provider: GeneticProvider, genotypes: any[]): ConfidenceLevel { }
function getLimitations(provider: GeneticProvider): string[] { }

// MAIN FUNCTION
export function analyze[GENE](
  genotypes: Array<{ rsid: string; genotype: string }>,
  provider: GeneticProvider = 'unknown'
): [GENE]AnalysisResult { }

// OUTPUT FORMATTING
function generateClinicalSummary(diplotype: Diplotype, [additionalContext]): string { }
```

### 📊 Function Flow Diagram:
```
genotypes[]
  → normalizeGenotype()
  → getAlleleFunction()
  → determineDiplotype()
  → activityScoreToPhenotype()
  → generateDrugRecommendations()
  → generateSafetyAlerts()
  → determineConfidence()
  → getLimitations()
  → generateClinicalSummary()
  → return AnalysisResult
```

---

## 4. Diplotype Determination Pattern

### ✅ Best Practice (from UGT1A1):

```typescript
function determineDiplotype(
  genotypes: Array<{ rsid: string; genotype: string }>
): UGT1A1Diplotype {

  // 1. EXTRACT RELEVANT SNPS
  const rs4148323 = genotypes.find(g => g.rsid === 'rs4148323')?.genotype || null;
  const rs887829 = genotypes.find(g => g.rsid === 'rs887829')?.genotype || null;

  // 2. INITIALIZE DEFAULT STATE
  let allele1: UGT1A1Allele = '*1';
  let allele2: UGT1A1Allele = '*1';
  let activity1 = 1.0;
  let activity2 = 1.0;

  // 3. CHECK VARIANTS SEQUENTIALLY
  if (rs4148323) {
    const norm = normalizeGenotype(rs4148323);
    if (norm === 'AG') {
      allele1 = '*1';
      allele2 = '*6';
      activity1 = 1.0;
      activity2 = 0.3;
    } else if (norm === 'AA') {
      allele1 = '*6';
      allele2 = '*6';
      activity1 = 0.3;
      activity2 = 0.3;
    }
  }

  // 4. CHECK ADDITIONAL VARIANTS (only if not already assigned)
  if (rs887829 && allele1 === '*1' && allele2 === '*1') {
    // ... similar logic
  }

  // 5. CALCULATE ACTIVITY SCORE
  const activityScore = activity1 + activity2;

  // 6. DETERMINE PHENOTYPE
  const phenotype = activityScoreToPhenotype(activityScore);

  return {
    allele1,
    allele2,
    phenotype,
    activityScore
  };
}
```

### 🎯 Key Principles:
- **Always normalize first**: Use `normalizeGenotype()` before comparison
- **Default to *1/*1**: Assume wildtype unless proven otherwise
- **Sequential checking**: Most common/important variants first
- **Avoid overwriting**: Use guards like `allele1 === '*1' && allele2 === '*1'`
- **Separate activity calculation**: Sum activities, then map to phenotype

---

## 5. Activity Score to Phenotype Mapping

### ✅ Standard Boundaries (CPIC-compliant):

```typescript
function activityScoreToPhenotype(activityScore: number): Phenotype {
  // CPIC standard boundaries:
  if (activityScore === 0.0) {
    return 'Poor Metabolizer';
  } else if (activityScore > 0.0 && activityScore <= 1.5) {
    return 'Intermediate Metabolizer';
  } else if (activityScore > 1.5 && activityScore <= 2.0) {
    return 'Normal Metabolizer';
  } else if (activityScore > 2.0) {
    return 'Ultrarapid Metabolizer';  // For genes with duplications
  }
  return 'Unknown';
}
```

### ⚠️ Gene-Specific Variations:
- **UGT1A1**: Poor < 1.0, Intermediate 1.0-1.5, Normal > 1.5 (no UM category)
- **CYP2D6**: Includes UM category (score > 2.0) due to gene duplications
- **CYP2C9**: No UM category (max score 2.0)

### 📝 Always Document:
- Comment boundaries with reference to CPIC guidelines
- Note any gene-specific variations
- Test boundary cases explicitly

---

## 6. Drug Recommendation Generation

### ✅ Best Practice: Drug-Specific Functions

```typescript
function generateDrugRecommendations(diplotype: Diplotype): DrugRecommendation[] {
  const recommendations: DrugRecommendation[] = [];
  const { phenotype, activityScore } = diplotype;

  // Call drug-specific generators
  recommendations.push(...generateAmph etamineRecommendations(phenotype, activityScore));
  recommendations.push(...generateCodeineRecommendations(phenotype, activityScore));
  recommendations.push(...generateSSRIRecommendations(phenotype, activityScore));

  return recommendations;
}

function generateAmphetamineRecommendations(
  phenotype: string,
  activityScore: number
): DrugRecommendation[] {

  if (phenotype === 'Poor Metabolizer') {
    return [{
      drug: 'Amphetamines (Adderall, Vyvanse)',
      category: 'ADHD Stimulants',
      recommendation: '⚠️ POOR METABOLIZER: May experience HIGHER drug levels',
      doseAdjustment: 'Consider LOWER starting dose (25-50% reduction)',
      riskLevel: 'warning',
      monitoring: 'Monitor closely for side effects (anxiety, cardiovascular)',
      fdaGuidance: false,
      cpicLevel: undefined,  // No CPIC guideline yet
      references: ['Clinical experience', 'Pharmacokinetic data']
    }];
  }

  // Handle other phenotypes...

  return [];
}
```

### 🎯 Why Drug-Specific Functions?
- ✅ **Cleaner code**: Each drug gets dedicated logic
- ✅ **Easier testing**: Test each drug independently
- ✅ **Better maintainability**: Update one drug without affecting others
- ✅ **More detailed**: Can add nuanced recommendations per phenotype

---

## 7. Safety Alerts Pattern

### ✅ Best Practice:

```typescript
function generateSafetyAlerts(diplotype: Diplotype): string[] {
  const alerts: string[] = [];
  const { phenotype, activityScore } = diplotype;

  // CRITICAL ALERTS (⛔)
  if (phenotype === 'Ultrarapid Metabolizer') {
    alerts.push('⛔ CODEINE: FATAL RISK - Ultrarapid conversion to morphine (FDA BLACK BOX)');
  }

  // WARNING ALERTS (⚠️)
  if (phenotype === 'Poor Metabolizer') {
    alerts.push('⚠️ ANTIDEPRESSANTS: May require dose reduction');
    alerts.push('⚠️ TAMOXIFEN: Reduced efficacy - consider alternative');
  }

  // INFO ALERTS (ℹ️)
  if (phenotype === 'Intermediate Metabolizer') {
    alerts.push('ℹ️ Multiple drug classes affected - review medication list');
  }

  return alerts;
}
```

### 🎯 Alert Hierarchy:
1. **⛔ CRITICAL**: Life-threatening, FDA BLACK BOX, contraindications
2. **⚠️ WARNING**: Dose adjustments needed, significant risks
3. **ℹ️ INFO**: Monitoring recommended, minor considerations

---

## 8. Confidence Scoring Pattern

### ✅ Best Practice:

```typescript
function determineConfidence(
  diplotype: Diplotype,
  provider: GeneticProvider,
  genotypes: Array<{ rsid: string; genotype: string }>
): ConfidenceLevel {

  // 1. CHECK FOR UNKNOWN DIPLOTYPE
  if (diplotype.allele1 === 'Unknown' || diplotype.allele2 === 'Unknown') {
    return 'low';
  }

  // 2. CHECK SNP COVERAGE
  const hasKeySNPs = genotypes.some(g =>
    ['rs4148323', 'rs887829'].includes(g.rsid)
  );

  if (!hasKeySNPs) {
    return 'low';
  }

  // 3. CHECK PHASE AMBIGUITY
  if (diplotype.phaseAmbiguity) {
    return 'medium';
  }

  // 4. PROVIDER-SPECIFIC ADJUSTMENTS
  if (provider === 'ancestrydna') {
    return 'medium';  // AncestryDNA has less pharmacogenomic coverage
  }

  // 5. DEFAULT HIGH CONFIDENCE
  return 'high';
}
```

### 📊 Confidence Criteria:
- **High**: Key SNPs present, no ambiguity, known diplotype
- **Medium**: Missing some SNPs, phase ambiguity, or lower-quality provider
- **Low**: Unknown diplotype, no key SNPs, or significant limitations

---

## 9. Limitations Documentation

### ✅ Best Practice:

```typescript
function getLimitations(provider: GeneticProvider): string[] {
  const limitations: string[] = [
    // GENE-SPECIFIC LIMITATIONS
    '⚠️ UGT1A1*28 (TA repeat) is NOT reliably detected on SNP arrays',
    'Most consumer tests only detect *6 and *27, not *28',
    'True Gilbert syndrome diagnosis requires *28/*28 genotyping',

    // PROVIDER-SPECIFIC
  ];

  if (provider === '23andme' || provider === 'ancestrydna') {
    limitations.push('Consumer genetic tests may miss rare/novel variants');
  }

  if (provider === 'ancestrydna') {
    limitations.push('AncestryDNA has limited pharmacogenomic SNP coverage');
  }

  return limitations;
}
```

### 📝 Always Document:
1. What SNP arrays **cannot** detect (CNVs, structural variants, repeats)
2. Which alleles are **not** covered by consumer tests
3. Provider-specific limitations
4. Clinical testing recommendations when needed

---

## 10. Clinical Summary Generation

### ✅ Best Practice:

```typescript
function generateClinicalSummary(
  diplotype: Diplotype,
  additionalContext?: any
): string {
  const { phenotype, activityScore, allele1, allele2 } = diplotype;

  let summary = `[GENE] ${allele1}/${allele2} - ${phenotype} `;
  summary += `(Activity Score: ${activityScore.toFixed(1)})\n\n`;

  // PHENOTYPE-SPECIFIC GUIDANCE
  if (phenotype === 'Poor Metabolizer') {
    summary += '🚨 CRITICAL: Poor enzyme function detected\n\n';
    summary += '**Key Drug Classes Affected:**\n';
    summary += '- [Drug 1]: [specific guidance]\n';
    summary += '- [Drug 2]: [specific guidance]\n';
  } else if (phenotype === 'Intermediate Metabolizer') {
    summary += '⚠️ WARNING: Reduced enzyme function\n\n';
    // ... etc
  } else {
    summary += '✓ Normal enzyme function\n\n';
    summary += 'Standard dosing for most medications.\n';
  }

  return summary;
}
```

### 🎯 Summary Structure:
1. **Header**: Gene, diplotype, phenotype, activity score
2. **Alert Level**: Emoji + severity statement
3. **Drug Guidance**: Specific drug classes with recommendations
4. **Additional Context**: Gene-specific information (Gilbert syndrome, etc.)

---

## 11. Input/Output Patterns

### ✅ v2 Standard Input:

```typescript
export function analyze[GENE](
  genotypes: Array<{ rsid: string; genotype: string }>,
  provider: GeneticProvider = 'unknown'
): [GENE]AnalysisResult
```

### ❌ v1 Anti-Pattern (Don't Use):

```typescript
// DON'T: Individual string parameters
export function analyzeVKORC1(
  rs9923231: string | null,
  provider: GeneticProvider,
  cyp2c9Context?: any
): VKORC1AnalysisResult
```

### 🎯 Why v2 is Better:
- ✅ **Extensible**: Easy to add new SNPs without changing signature
- ✅ **Consistent**: All analyzers use same input format
- ✅ **Testable**: Easy to create test data
- ✅ **Future-proof**: Can handle variable SNP coverage

---

## 12. Testing Patterns

### ✅ Test Structure (36 tests for UGT1A1):

```typescript
describe('[GENE] Analyzer', () => {

  // 1. BASIC FUNCTIONALITY (3-5 tests)
  describe('Basic Functionality', () => {
    it('should return proper structure with required fields', () => {});
    it('should handle empty genotype array', () => {});
    it('should handle missing SNPs gracefully', () => {});
  });

  // 2. DIPLOTYPE CALLING (per variant)
  describe('Diplotype Calling - *[X] Allele', () => {
    it('should detect *1/*1 from rs[X] [REF][REF]', () => {});
    it('should detect *1/*[X] from rs[X] [REF][ALT]', () => {});
    it('should detect *[X]/*[X] from rs[X] [ALT][ALT]', () => {});
  });

  // 3. PHENOTYPE DETERMINATION (boundary tests)
  describe('Phenotype Determination', () => {
    it('should classify activity score [X] as [Phenotype]', () => {});
  });

  // 4. DRUG RECOMMENDATIONS (per drug)
  describe('Drug Recommendations - [Drug Name]', () => {
    it('should recommend [action] for poor metabolizers', () => {});
    it('should recommend [action] for intermediate metabolizers', () => {});
    it('should recommend [action] for normal metabolizers', () => {});
  });

  // 5. SAFETY ALERTS
  describe('Safety Alerts', () => {
    it('should generate multiple alerts for poor metabolizers', () => {});
  });

  // 6. CONFIDENCE SCORING
  describe('Confidence Scoring', () => {
    it('should report high confidence when key SNPs present', () => {});
    it('should report low confidence for default *1/*1 with no data', () => {});
  });

  // 7. CLINICAL VALIDATION (CPIC)
  describe('Clinical Validation', () => {
    it('should include CPIC guideline reference', () => {});
    it('should include FDA label information', () => {});
  });

  // 8. EDGE CASES
  describe('Edge Cases', () => {
    it('should handle unnormalized genotypes', () => {});
    it('should handle reversed genotypes', () => {});
    it('should handle null genotypes', () => {});
  });

  // 9. CLINICAL SUMMARY
  describe('Clinical Summary', () => {
    it('should generate comprehensive summary for poor metabolizers', () => {});
  });
});
```

### 🎯 Test Coverage Goals:
- **95% required** for all metrics (lines, functions, branches, statements)
- Test **every phenotype**
- Test **every drug recommendation**
- Test **boundary conditions** for activity scores
- Test **edge cases** (null, reversed, unnormalized genotypes)

---

## 13. Research & Validation

### ✅ Best Practice Workflow:

1. **PubMed Search** (if available):
   ```typescript
   // Search for: "[Gene] pharmacogenomics CPIC guideline"
   // Look for: PMIDs, CPIC guidelines, FDA labels
   ```

2. **WebSearch Fallback**:
   ```typescript
   // Search: "[Gene] CPIC guideline [drug] 2024"
   // Prioritize: cpicpgx.org, PharmGKB, NCBI, PMC
   ```

3. **Required Resources**:
   - ✅ CPIC guidelines (cpicpgx.org)
   - ✅ PharmGKB annotations (pharmgkb.org)
   - ✅ FDA pharmacogenomic biomarkers table
   - ✅ PharmVar allele database (for star allele nomenclature)
   - ✅ Published PMIDs for each variant

4. **Validation Checklist**:
   - [ ] CPIC guideline level (A/B/C)
   - [ ] Activity scores match CPIC
   - [ ] Phenotype boundaries match CPIC
   - [ ] Drug recommendations match guidelines
   - [ ] PMIDs cited for all claims
   - [ ] Population frequencies verified

---

## 14. Common Pitfalls & Solutions

### ❌ Pitfall 1: Inconsistent Property Names
```typescript
// DON'T mix naming conventions
interface Result {
  drugRecommendations: Drug[];  // CYP2C9
  drugs: Drug[];  // CYP2D6
}

// DO: Use consistent naming
interface Result {
  drugs: Drug[];  // Always use 'drugs'
}
```

### ❌ Pitfall 2: Wrong Activity Score Boundaries
```typescript
// WRONG: Arbitrary boundaries
if (activityScore < 0.5) return 'Poor Metabolizer';

// RIGHT: CPIC-compliant boundaries
if (activityScore === 0.0) return 'Poor Metabolizer';
// Comment: "CPIC guideline PMID [X] specifies 0.0 for PM"
```

### ❌ Pitfall 3: Missing Genotype Normalization
```typescript
// WRONG: Direct comparison
if (genotype === 'CT') { }

// RIGHT: Normalize first
const norm = normalizeGenotype(genotype);
if (norm === 'CT') { }  // Handles 'TC', ' C T ', etc.
```

### ❌ Pitfall 4: v1 Input Pattern
```typescript
// DON'T: Individual parameters (v1 pattern)
function analyze(rs1: string, rs2: string, rs3: string) { }

// DO: Array input (v2 pattern)
function analyze(genotypes: Array<{ rsid: string; genotype: string }>) { }
```

---

## 15. Checklist for New Analyzers

Before starting a new analyzer, ensure you have:

### 📋 Research Phase:
- [ ] CPIC guideline identified (with PMID)
- [ ] Activity scores documented (with references)
- [ ] Key variants listed (with rsids, population frequencies)
- [ ] Drug list compiled (prioritized by user relevance)
- [ ] Phenotype boundaries confirmed (CPIC-compliant)
- [ ] FDA guidance reviewed (if applicable)
- [ ] Limitations documented (CNVs, structural variants, etc.)

### 📋 Implementation Phase:
- [ ] Header documentation complete (all 9 sections)
- [ ] Type system follows v2 pattern
- [ ] Function architecture matches pipeline
- [ ] Input format: `Array<{ rsid: string; genotype: string }>`
- [ ] Genotype normalization implemented
- [ ] Activity score boundaries match CPIC
- [ ] Drug-specific recommendation functions created
- [ ] Safety alerts generated
- [ ] Confidence scoring implemented
- [ ] Limitations explicitly listed
- [ ] Clinical summary generated

### 📋 Testing Phase:
- [ ] Basic functionality tests (3+)
- [ ] Diplotype calling tests (per variant)
- [ ] Phenotype determination tests (boundary cases)
- [ ] Drug recommendation tests (per drug, per phenotype)
- [ ] Safety alert tests
- [ ] Confidence scoring tests
- [ ] Clinical validation tests (CPIC/FDA)
- [ ] Edge case tests (null, reversed, unnormalized)
- [ ] Clinical summary tests
- [ ] **95% coverage achieved**

---

## 16. Summary & Next Steps

### 🎯 Key Takeaways:

1. **v2 Pattern is Mandatory**: Always use `Array<{ rsid: string; genotype: string }>` input
2. **Documentation is Critical**: Extensive header comments with clinical context
3. **Test Thoroughly**: 95% coverage, all phenotypes, all drugs
4. **Follow CPIC**: Activity scores and boundaries must match guidelines
5. **Drug-Specific Functions**: Break out complex recommendation logic
6. **Confidence Scoring**: Explicitly score confidence based on data quality
7. **Document Limitations**: Be transparent about SNP array limitations

### 📚 Reference Implementations:
- **Gold Standard**: CYP2D6 (complex gene, 20/20 tests)
- **Clean Example**: UGT1A1 (simpler gene, 36/36 tests)
- **Avoid**: v1 analyzers (inconsistent patterns)

### ✅ For CYP2C19 Next:
1. Search CPIC: "CYP2C19 SSRI antidepressant guideline"
2. Search PharmGKB: "CYP2C19 diazepam benzodiazepine"
3. Follow UGT1A1 as template (simpler than CYP2D6)
4. Key drugs: Citalopram, escitalopram, diazepam, omeprazole, clopidogrel
5. Key variants: *2 (rs4244285), *3 (rs4986893), *17 (rs12248560)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Next Review**: After CYP2C19 implementation
