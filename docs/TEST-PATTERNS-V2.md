# PGx Analyzer Test Patterns (v2 Architecture)

**Analysis Date**: 2025-12-22
**Test Files Reviewed**: CYP2D6 (20 tests), UGT1A1 (36 tests)
**Purpose**: Document best practices for writing medical-grade pharmacogenomics analyzer tests

---

## Executive Summary

Comprehensive testing is **critical** for medical-grade software. Our testing framework achieves 95% coverage across all metrics and follows consistent patterns for reliability and maintainability.

**Key Metrics**:
- **Coverage Target**: 95% (lines, functions, branches, statements)
- **UGT1A1**: 36/36 tests passing ✓
- **CYP2D6**: 20/20 tests passing ✓
- **Test Execution**: <100ms per test file
- **Framework**: Vitest with custom matchers

---

## 1. Test File Structure

### ✅ Standard Template:

```typescript
import { describe, it, expect } from 'vitest';
import { createTestGenotype, createTestGenotypes, assertAnalyzerResult } from '../test-utils';
import { analyze[GENE] } from '@analysis/analyzers/[gene]-analyzer';

/**
 * [GENE] Analyzer Tests
 *
 * Clinical Context:
 * - [Brief description of gene function]
 * - [Key drugs affected]
 * - [Population frequencies if relevant]
 *
 * Key Challenges:
 * - [Any special testing considerations]
 * - [Edge cases specific to this gene]
 *
 * References:
 * - [CPIC Guideline PMID]
 * - [PharmVar or other databases]
 */

describe('[GENE] Analyzer', () => {

  // ==========================================================================
  // BASIC FUNCTIONALITY
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should return proper structure with required fields', () => {
      // Test basic structure
    });

    it('should handle empty genotype array', () => {
      // Test graceful degradation
    });

    it('should handle missing SNPs gracefully', () => {
      // Test resilience
    });
  });

  // ==========================================================================
  // DIPLOTYPE CALLING - *[X] Allele
  // ==========================================================================

  describe('Diplotype Calling - *[X] Allele', () => {
    it('should detect *1/*1 from rs[X] [REF][REF]', () => {});
    it('should detect *1/*[X] from rs[X] [REF][ALT]', () => {});
    it('should detect *[X]/*[X] from rs[X] [ALT][ALT]', () => {});
  });

  // Repeat for each major allele...

  // ==========================================================================
  // PHENOTYPE DETERMINATION
  // ==========================================================================

  describe('Phenotype Determination', () => {
    it('should classify activity score [X] as [Phenotype]', () => {});
    // Test all boundary conditions
  });

  // ==========================================================================
  // DRUG RECOMMENDATIONS - [Drug Name]
  // ==========================================================================

  describe('Drug Recommendations - [Drug Name]', () => {
    it('should recommend [action] for poor metabolizers', () => {});
    it('should recommend [action] for intermediate metabolizers', () => {});
    it('should recommend [action] for normal metabolizers', () => {});
  });

  // Repeat for each drug...

  // ==========================================================================
  // SAFETY ALERTS
  // ==========================================================================

  describe('Safety Alerts', () => {
    it('should generate multiple alerts for poor metabolizers', () => {});
    it('should generate moderate alerts for intermediate metabolizers', () => {});
    it('should generate no alerts for normal metabolizers', () => {});
  });

  // ==========================================================================
  // CONFIDENCE SCORING
  // ==========================================================================

  describe('Confidence Scoring', () => {
    it('should report high confidence when key SNPs present', () => {});
    it('should report low confidence for default *1/*1 with no data', () => {});
  });

  // ==========================================================================
  // CLINICAL VALIDATION (CPIC)
  // ==========================================================================

  describe('Clinical Validation', () => {
    it('should include CPIC guideline reference', () => {});
    it('should include FDA label information', () => {});
    it('should mark [drug] as FDA-labeled', () => {});
  });

  // ==========================================================================
  // LIMITATIONS
  // ==========================================================================

  describe('Limitations', () => {
    it('should warn about [specific limitation]', () => {});
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle unnormalized genotypes', () => {});
    it('should handle reversed genotypes', () => {});
    it('should handle null genotypes', () => {});
  });

  // ==========================================================================
  // CLINICAL SUMMARY
  // ==========================================================================

  describe('Clinical Summary', () => {
    it('should generate comprehensive summary for poor metabolizers', () => {});
    it('should generate appropriate summary for normal metabolizers', () => {});
  });
});
```

---

## 2. Test Section Categories

### 📋 Required Sections (In Order):

1. **Basic Functionality** (3-5 tests)
   - Structure validation
   - Empty input handling
   - Missing SNPs handling
   - Required field presence

2. **Diplotype Calling** (3 tests per allele)
   - Homozygous reference (*1/*1)
   - Heterozygous (*1/*X)
   - Homozygous variant (*X/*X)

3. **Phenotype Determination** (4-5 tests)
   - Boundary conditions for each phenotype
   - Activity score to phenotype mapping

4. **Drug Recommendations** (3 tests per drug)
   - Poor metabolizer guidance
   - Intermediate metabolizer guidance
   - Normal metabolizer guidance

5. **Safety Alerts** (2-3 tests)
   - Critical alerts for high-risk phenotypes
   - Standard scenarios

6. **Confidence Scoring** (2-3 tests)
   - High confidence scenarios
   - Low confidence scenarios
   - Provider-specific adjustments

7. **Clinical Validation** (2-3 tests)
   - CPIC guideline references
   - FDA label verification
   - Evidence citations

8. **Limitations** (1-2 tests)
   - Known limitations documented
   - Provider-specific caveats

9. **Edge Cases** (3-5 tests)
   - Unnormalized inputs
   - Reversed genotypes
   - Null handling
   - Invalid inputs

10. **Clinical Summary** (2-3 tests)
    - Comprehensive output for each phenotype
    - Formatting validation

### 🎯 Optional Sections (Gene-Specific):

- **Phase Ambiguity** (for complex genes like CYP2D6)
- **Compound Heterozygotes** (multi-variant scenarios)
- **Gene Deletions** (if detectable)
- **Gene Duplications** (if detectable)
- **Special Phenotypes** (e.g., Gilbert Syndrome for UGT1A1)

---

## 3. Test Naming Conventions

### ✅ Best Practices:

```typescript
// GOOD: Descriptive, specific, states expected outcome
it('should detect *1/*6 from rs4148323 GA', () => {});
it('should recommend 30% dose reduction for poor metabolizers', () => {});
it('should classify activity score 0.6 as Poor Metabolizer', () => {});

// GOOD: Clear what's being tested and why
it('should handle unnormalized genotypes', () => {});
it('should report high confidence when key SNPs present', () => {});

// BAD: Vague, doesn't state expected behavior
it('test genotype', () => {});
it('check drug recommendation', () => {});
it('verify result', () => {});
```

### 📝 Naming Pattern:

```
should [action/outcome] [for/when/from] [specific scenario]
```

**Examples**:
- `should detect *4/*4 from rs3892097 AA`
- `should recommend avoid codeine for poor metabolizers`
- `should report medium confidence when phase ambiguous`
- `should generate critical alerts for ultrarapid metabolizers`

---

## 4. Test Data Creation

### ✅ Using Test Utilities:

```typescript
// SINGLE GENOTYPE
const genotype = createTestGenotype('rs4148323', 'GA');
// Returns: { rsid: 'rs4148323', chromosome: 'chr1', position: 12345, genotype: 'GA', provider: 'generic' }

// MULTIPLE GENOTYPES (v2 pattern)
const genotypes = createTestGenotypes([
  { rsid: 'rs4148323', genotype: 'GA' },
  { rsid: 'rs887829', genotype: 'CC' },
]);
// Returns array of properly formatted genotype objects

// MULTIPLE GENOTYPES (v1 pattern - AVOID)
const genotypes = createTestGenotypes([
  ['rs4148323', 'GA'],  // ❌ This is wrong!
  ['rs887829', 'CC'],
]);
```

### 🎯 Test Data Principles:

1. **Use Helper Functions**: Always use `createTestGenotype()` and `createTestGenotypes()`
2. **Explicit Genotypes**: Spell out exact genotypes (e.g., 'GA', 'AA', 'GG')
3. **Comment References**: Add comments for what allele is being tested
4. **Include Negatives**: Test for absence of variants (e.g., 'GG' for no *4)

### ✅ Good Example:

```typescript
it('should analyze *1/*4 (intermediate) correctly', () => {
  const genotypes = createTestGenotypes([
    { rsid: 'rs3892097', genotype: 'GA' }, // Heterozygous for *4 (G ref, A alt)
    { rsid: 'rs5030655', genotype: 'GG' }, // Not *6 (reference)
    { rsid: 'rs28371725', genotype: 'CC' }, // Not *41 (reference)
    { rsid: 'rs1065852', genotype: 'GG' }, // Not *10 (reference)
  ]);

  const result = analyzeCYP2D6(genotypes);

  expect(result.diplotype.allele1).toBe('*1');
  expect(result.diplotype.allele2).toBe('*4');
  expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
  expect(result.diplotype.activityScore).toBe(1.0); // 1.0 + 0
});
```

### 📝 Why Include Negative Controls?

Including reference genotypes (e.g., 'GG' for non-variants) ensures:
- ✅ Analyzer doesn't false-positive on missing data
- ✅ Default *1 allele is correctly assigned
- ✅ No variant calling happens when there shouldn't be

---

## 5. Assertion Patterns

### ✅ Standard Assertions:

```typescript
// DIPLOTYPE STRUCTURE
expect(result.diplotype.allele1).toBe('*1');
expect(result.diplotype.allele2).toBe('*6');
expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
expect(result.diplotype.activityScore).toBe(1.3);

// DRUG RECOMMENDATIONS
const drug = result.drugs.find(d => d.drug.includes('Irinotecan'));
expect(drug).toBeDefined();
expect(drug?.riskLevel).toBe('critical');
expect(drug?.doseAdjustment).toContain('30%');
expect(drug?.fdaLabel).toBe(true);
expect(drug?.cpicLevel).toBe('A');

// SAFETY ALERTS
expect(result.safetyAlerts.length).toBeGreaterThan(0);
expect(result.safetyAlerts.some(alert => alert.includes('IRINOTECAN'))).toBe(true);

// CONFIDENCE
expect(result.confidence).toBe('high');

// GUIDELINES
expect(result.guidelines.cpic).toContain('CPIC');
expect(result.guidelines.cpic).toContain('PMID');
expect(result.guidelines.fda.length).toBeGreaterThan(0);

// CLINICAL SUMMARY
expect(result.clinicalSummary).toContain('*6/*6');
expect(result.clinicalSummary).toContain('Poor Metabolizer');
expect(result.clinicalSummary).toContain('Activity Score: 0.6');
```

### 🎯 Assertion Best Practices:

1. **Be Specific**: Use `.toBe()` for exact matches, not `.toContain()` when you know exact value
2. **Check Existence First**: Always `.toBeDefined()` before accessing optional fields
3. **Use Optional Chaining**: `drug?.riskLevel` instead of `drug.riskLevel`
4. **Test Meaningful Content**: Don't just check that strings exist, verify key terms
5. **Number Precision**: Use `.toBe()` for exact numbers, `.toBeCloseTo()` if floating point

---

## 6. Drug Recommendation Testing

### ✅ Complete Drug Test Pattern:

```typescript
describe('Drug Recommendations - Irinotecan', () => {
  it('should recommend 30% dose reduction for poor metabolizers', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
    ]);

    const result = analyzeUGT1A1(genotypes);

    // 1. Find the drug recommendation
    const irinotecan = result.drugs.find(d => d.drug.includes('Irinotecan'));

    // 2. Check it exists
    expect(irinotecan).toBeDefined();

    // 3. Verify risk level
    expect(irinotecan?.riskLevel).toBe('critical');

    // 4. Check specific dose adjustment
    expect(irinotecan?.doseAdjustment).toContain('30%');

    // 5. Verify regulatory status
    expect(irinotecan?.fdaLabel).toBe(true);
    expect(irinotecan?.cpicLevel).toBe('A');

    // 6. Check recommendation content
    expect(irinotecan?.recommendation).toContain('POOR METABOLIZER');
  });

  it('should recommend monitoring for intermediate metabolizers', () => {
    // Similar structure, different expectations
  });

  it('should recommend standard dosing for normal metabolizers', () => {
    // Similar structure, standard expectations
  });
});
```

### 📋 Drug Test Checklist:

For each drug, test **all three phenotypes**:
- [ ] Poor Metabolizer scenario
- [ ] Intermediate Metabolizer scenario
- [ ] Normal Metabolizer scenario

For each scenario, verify:
- [ ] Drug recommendation exists
- [ ] Risk level is correct
- [ ] Dose adjustment is appropriate
- [ ] FDA/CPIC labels are accurate
- [ ] Recommendation text contains key terms

---

## 7. Edge Case Testing

### ✅ Required Edge Cases:

```typescript
describe('Edge Cases', () => {
  it('should handle unnormalized genotypes', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'a g' }, // Spaces, lowercase
    ]);

    const result = analyzeUGT1A1(genotypes);

    // Should normalize and process correctly
    expect(result.diplotype.allele1).toBe('*1');
    expect(result.diplotype.allele2).toBe('*6');
    expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
  });

  it('should handle reversed genotypes', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'AG' } // Should be same as GA
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.diplotype.allele1).toBe('*1');
    expect(result.diplotype.allele2).toBe('*6');
  });

  it('should handle null genotypes', () => {
    const genotypes = [
      { rsid: 'rs4148323', genotype: null as any }
    ];

    const result = analyzeUGT1A1(genotypes);

    // Should default to *1/*1
    expect(result.diplotype.allele1).toBe('*1');
    expect(result.diplotype.allele2).toBe('*1');
  });

  it('should handle empty genotype array', () => {
    const result = analyzeUGT1A1([]);

    expect(result.diplotype.allele1).toBe('*1');
    expect(result.diplotype.allele2).toBe('*1');
    expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
    expect(result.confidence).toBe('low'); // Important!
  });

  it('should handle missing SNPs gracefully', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs1234567', genotype: 'AA' } // Irrelevant SNP
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.diplotype.allele1).toBe('*1');
    expect(result.diplotype.allele2).toBe('*1');
    expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
  });
});
```

### 🎯 Why Test Edge Cases?

- **Unnormalized genotypes**: Real-world data is messy (spaces, case variations)
- **Reversed genotypes**: 'AG' vs 'GA' should yield same result
- **Null handling**: Graceful degradation when data is missing
- **Empty arrays**: Should return sensible defaults
- **Irrelevant SNPs**: Shouldn't break analyzer

---

## 8. Phase Ambiguity Testing (Complex Genes)

### ✅ For genes with multiple heterozygous variants:

```typescript
describe('Phase Ambiguity', () => {
  it('should handle ambiguous diplotypes appropriately', () => {
    // When we can't determine which variants are on the same chromosome
    const genotypes = createTestGenotypes([
      { rsid: 'rs3892097', genotype: 'GA' },  // Heterozygous *4
      { rsid: 'rs28371725', genotype: 'CT' }, // Heterozygous *41
    ]);

    const result = analyzeCYP2D6(genotypes);

    // Should acknowledge ambiguity
    expect(result.diplotype.phaseAmbiguity).toBe(true);
    expect(result.diplotype.possibleDiplotypes).toBeInstanceOf(Array);
    expect(result.diplotype.possibleDiplotypes!.length).toBeGreaterThan(1);
    expect(result.diplotype.confidence).toBe('medium');
  });

  it('should provide conservative recommendation when ambiguous', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs3892097', genotype: 'GA' },  // Heterozygous *4
      { rsid: 'rs28371725', genotype: 'CT' }, // Heterozygous *41
    ]);

    const result = analyzeCYP2D6(genotypes);

    // Should flag phase ambiguity in limitations
    expect(result.limitations.some(l =>
      l.includes('phase') || l.includes('ambiguity')
    )).toBe(true);
  });
});
```

### 📝 Phase Ambiguity Checklist:

- [ ] `phaseAmbiguity` flag set to `true`
- [ ] `possibleDiplotypes` array populated
- [ ] Confidence reduced to `medium`
- [ ] Limitations mention phase ambiguity
- [ ] Conservative recommendations provided

---

## 9. Skipped Tests Pattern

### ✅ Use `describe.skip()` for tests requiring unavailable data:

```typescript
describe.skip('Gene Deletions (*5)', () => {
  // NOTE: SNP arrays (23andMe, AncestryDNA) CANNOT detect gene deletions or duplications
  // These tests are skipped as they require specialized CNV analysis
  // True CYP2D6 phenotyping with CNV detection requires targeted genotyping

  it('should detect *5 deletion (no function)', () => {
    // Test implementation for future CNV support
  });
});

describe.skip('Gene Duplications', () => {
  // NOTE: SNP arrays (23andMe, AncestryDNA) CANNOT detect gene duplications
  // Ultrarapid metabolizers (*1xN, *2xN) cannot be identified from consumer genetic data
  // These tests are skipped as they require specialized CNV analysis

  it('should detect gene duplication (*1x2)', () => {
    // Test implementation for future CNV support
  });
});
```

### 🎯 When to Use `.skip()`:

- **CNV Detection**: Gene deletions/duplications not in SNP arrays
- **Future Features**: Tests written but feature not implemented
- **Provider-Specific**: Tests that only apply to certain data sources
- **External Dependencies**: Tests requiring unavailable validation data

### ❌ Don't Skip:

- Tests that are failing (fix the test or the code!)
- Tests you're "too lazy to write"
- Tests for "edge cases that probably won't happen"

---

## 10. Confidence Scoring Tests

### ✅ Test All Confidence Levels:

```typescript
describe('Confidence Scoring', () => {
  it('should report high confidence when key SNPs present', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'GA' }
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.confidence).toBe('high');
  });

  it('should report medium confidence when phase ambiguous', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs3892097', genotype: 'GA' },  // Heterozygous *4
      { rsid: 'rs28371725', genotype: 'CT' }, // Heterozygous *41
    ]);

    const result = analyzeCYP2D6(genotypes);

    expect(result.confidence).toBe('medium');
    expect(result.diplotype.phaseAmbiguity).toBe(true);
  });

  it('should report low confidence for default *1/*1 with no data', () => {
    const genotypes: Array<{ rsid: string; genotype: string }> = [];

    const result = analyzeUGT1A1(genotypes);

    expect(result.confidence).toBe('low');
    expect(result.diplotype.allele1).toBe('*1');
    expect(result.diplotype.allele2).toBe('*1');
  });

  it('should reduce confidence for AncestryDNA provider', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'GG' }
    ]);

    const result = analyzeUGT1A1(genotypes, 'ancestrydna');

    // AncestryDNA has less pharmacogenomic coverage
    expect(result.confidence).toBe('medium');
  });
});
```

### 📊 Confidence Test Matrix:

| Scenario | Expected Confidence | Why |
|----------|-------------------|-----|
| Key SNPs present, no ambiguity | High | Complete data |
| Phase ambiguous | Medium | Uncertain diplotype |
| Missing key SNPs | Low | Incomplete data |
| Default *1/*1, no data | Low | No evidence |
| AncestryDNA provider | Medium | Limited coverage |
| Unknown diplotype | Low | Cannot determine |

---

## 11. Clinical Validation Tests

### ✅ CPIC Guideline Validation:

```typescript
describe('Clinical Validation', () => {
  it('should include CPIC guideline reference', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'GG' }
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.guidelines.cpic).toContain('CPIC');
    expect(result.guidelines.cpic).toContain('PMID');
    expect(result.guidelines.cpic).toContain('15883587'); // Specific PMID
  });

  it('should include FDA label information', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'GG' }
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.guidelines.fda.length).toBeGreaterThan(0);
    expect(result.guidelines.fda.some(label =>
      label.includes('Irinotecan')
    )).toBe(true);
  });

  it('should mark irinotecan as FDA-labeled', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
    ]);

    const result = analyzeUGT1A1(genotypes);

    const irinotecan = result.drugs.find(d => d.drug.includes('Irinotecan'));
    expect(irinotecan?.fdaLabel).toBe(true);
    expect(irinotecan?.cpicLevel).toBe('A');
  });
});
```

### 📋 Validation Checklist:

- [ ] CPIC guideline reference present
- [ ] Specific PMID cited
- [ ] FDA guidance listed
- [ ] Drug-specific FDA labels correct
- [ ] CPIC levels accurate (A/B/C)

---

## 12. Safety Alert Tests

### ✅ Test Alert Generation:

```typescript
describe('Safety Alerts', () => {
  it('should generate multiple alerts for poor metabolizers', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.safetyAlerts.length).toBeGreaterThan(0);

    // Check for specific alerts
    expect(result.safetyAlerts.some(alert =>
      alert.includes('IRINOTECAN')
    )).toBe(true);

    expect(result.safetyAlerts.some(alert =>
      alert.includes('CABOTEGRAVIR')
    )).toBe(true);

    expect(result.safetyAlerts.some(alert =>
      alert.includes('Gilbert')
    )).toBe(true);
  });

  it('should generate moderate alerts for intermediate metabolizers', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'GA' } // *1/*6
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.safetyAlerts.length).toBeGreaterThan(0);
    expect(result.safetyAlerts.some(alert =>
      alert.includes('IRINOTECAN')
    )).toBe(true);
  });

  it('should generate no alerts for normal metabolizers', () => {
    const genotypes = createTestGenotypes([
      { rsid: 'rs4148323', genotype: 'GG' } // *1/*1
    ]);

    const result = analyzeUGT1A1(genotypes);

    expect(result.safetyAlerts.length).toBe(0);
  });
});
```

### 🎯 Alert Testing Principles:

1. **Count Matters**: Check that alerts exist for high-risk phenotypes
2. **Content Matters**: Verify specific drugs/conditions are mentioned
3. **Normal = No Alerts**: Standard metabolizers should have empty array
4. **Severity Appropriate**: Critical drugs should generate alerts

---

## 13. Test Organization Best Practices

### ✅ Use Clear Section Markers:

```typescript
// ==========================================================================
// SECTION NAME
// ==========================================================================

describe('Section Name', () => {
  // Tests here
});
```

### ✅ Group Related Tests:

```typescript
// Group by allele
describe('Diplotype Calling - *4 Allele', () => {
  it('should detect *1/*1 from rs3892097 GG', () => {});
  it('should detect *1/*4 from rs3892097 GA', () => {});
  it('should detect *4/*4 from rs3892097 AA', () => {});
});

describe('Diplotype Calling - *10 Allele', () => {
  it('should detect *1/*1 from rs1065852 GG', () => {});
  it('should detect *1/*10 from rs1065852 GT', () => {});
  it('should detect *10/*10 from rs1065852 TT', () => {});
});
```

### ✅ Consistent Ordering:

1. Basic Functionality
2. Diplotype Calling (alphabetical by allele)
3. Phenotype Determination
4. Drug Recommendations (alphabetical by drug)
5. Safety Alerts
6. Confidence Scoring
7. Clinical Validation
8. Limitations
9. Edge Cases
10. Clinical Summary

---

## 14. Coverage Requirements

### 📊 Target Metrics (Medical-Grade):

```bash
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   95.00 |    95.00 |   95.00 |   95.00 |
 analyzers                  |   95.00 |    95.00 |   95.00 |   95.00 |
  cyp2d6-analyzer.ts        |   95.00 |    95.00 |   95.00 |   95.00 |
  ugt1a1-analyzer.ts        |   95.00 |    95.00 |   95.00 |   95.00 |
----------------------------|---------|----------|---------|---------|
```

### ✅ Coverage Commands:

```bash
# Run tests with coverage
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

### 🎯 What to Cover:

- ✅ **All public functions**: Every exported function
- ✅ **All branches**: Every if/else path
- ✅ **All phenotypes**: Every metabolizer type
- ✅ **All drug recommendations**: Every drug, every phenotype
- ✅ **Error paths**: Try/catch blocks, error handling
- ✅ **Edge cases**: Null, undefined, empty arrays

### ❌ OK to Skip Coverage For:

- Type definitions
- Interfaces
- Comments
- Unreachable code (proven impossible paths)

---

## 15. Common Test Pitfalls

### ❌ Pitfall 1: Using Array Syntax Instead of Object

```typescript
// WRONG ❌
const genotypes = createTestGenotypes([
  ['rs4148323', 'GA']  // Array syntax
]);

// RIGHT ✅
const genotypes = createTestGenotypes([
  { rsid: 'rs4148323', genotype: 'GA' }  // Object syntax
]);
```

### ❌ Pitfall 2: Not Testing All Phenotypes

```typescript
// WRONG ❌ - Only testing poor metabolizer
describe('Drug Recommendations - Irinotecan', () => {
  it('should recommend dose reduction for poor metabolizers', () => {});
});

// RIGHT ✅ - Testing all phenotypes
describe('Drug Recommendations - Irinotecan', () => {
  it('should recommend dose reduction for poor metabolizers', () => {});
  it('should recommend monitoring for intermediate metabolizers', () => {});
  it('should recommend standard dosing for normal metabolizers', () => {});
});
```

### ❌ Pitfall 3: Asserting on Undefined Properties

```typescript
// WRONG ❌
const drug = result.drugs.find(d => d.drug.includes('Irinotecan'));
expect(drug.riskLevel).toBe('critical');  // Fails if drug is undefined!

// RIGHT ✅
const drug = result.drugs.find(d => d.drug.includes('Irinotecan'));
expect(drug).toBeDefined();  // Check existence first
expect(drug?.riskLevel).toBe('critical');  // Use optional chaining
```

### ❌ Pitfall 4: Vague Test Names

```typescript
// WRONG ❌
it('test 1', () => {});
it('check diplotype', () => {});

// RIGHT ✅
it('should detect *1/*6 from rs4148323 GA', () => {});
it('should classify activity score 1.3 as Intermediate Metabolizer', () => {});
```

### ❌ Pitfall 5: Not Testing Boundary Conditions

```typescript
// WRONG ❌ - Missing boundary tests
it('should classify as Poor Metabolizer', () => {
  // Only tests score 0.0
});

// RIGHT ✅ - Tests boundaries
it('should classify activity score 0.0 as Poor Metabolizer', () => {});
it('should classify activity score 0.6 as Poor Metabolizer', () => {});
it('should classify activity score 1.0 as Intermediate Metabolizer', () => {});  // Boundary!
it('should classify activity score 1.5 as Intermediate Metabolizer', () => {});  // Boundary!
it('should classify activity score 2.0 as Normal Metabolizer', () => {});
```

---

## 16. Test Execution

### ✅ Running Tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- cyp2d6

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in CI mode (no watch)
npm test -- --run
```

### ✅ Watch Mode:

Tests automatically re-run when files change. Great for development!

```bash
npm test  # Starts in watch mode by default
```

### ✅ Debugging Tests:

```typescript
// Add .only to run single test
it.only('should detect *1/*6 from rs4148323 GA', () => {
  // This test runs exclusively
});

// Add .skip to temporarily disable test
it.skip('should handle gene duplications', () => {
  // This test is skipped
});
```

---

## 17. Checklist for New Test Files

### 📋 Before Writing Tests:

- [ ] Read CPIC guideline (note PMIDs)
- [ ] List all star alleles to test
- [ ] List all drugs to test
- [ ] Identify boundary conditions
- [ ] Note any gene-specific edge cases

### 📋 While Writing Tests:

- [ ] File header with clinical context
- [ ] Import test utilities correctly
- [ ] All 10 required sections present
- [ ] 3 tests per star allele (homozygous ref, het, homozygous alt)
- [ ] 3 tests per drug (PM, IM, NM)
- [ ] Boundary condition tests for phenotypes
- [ ] Edge case tests (null, reversed, unnormalized)
- [ ] Confidence tests (high, medium, low)
- [ ] CPIC validation tests

### 📋 After Writing Tests:

- [ ] All tests passing
- [ ] 95% coverage achieved
- [ ] No skipped tests (unless justified with comment)
- [ ] Test names are descriptive
- [ ] Assertions use specific values
- [ ] Comments explain complex scenarios

---

## 18. Example Test Count Goals

### 📊 Test Count by Gene Complexity:

| Gene Type | Example | Minimum Tests | Target Tests |
|-----------|---------|---------------|--------------|
| Simple | UGT1A1 | 25 | 30-40 |
| Moderate | CYP2C9 | 20 | 25-35 |
| Complex | CYP2D6 | 30 | 40-50 |

**Simple**: 2-3 key variants, straightforward phenotyping
**Moderate**: 4-5 variants, some ambiguity
**Complex**: 6+ variants, CNVs, phase ambiguity

---

## Summary & Key Takeaways

### 🎯 Essential Patterns:

1. **Use v2 test data format**: `createTestGenotypes([{ rsid, genotype }])`
2. **Test all phenotypes**: Poor, Intermediate, Normal (and UM if applicable)
3. **Test all drugs**: 3 tests per drug (one per phenotype)
4. **Test edge cases**: Null, reversed, unnormalized genotypes
5. **95% coverage required**: All metrics, no exceptions
6. **Descriptive test names**: "should [action] [for/when] [scenario]"
7. **Check existence first**: `.toBeDefined()` before accessing optional fields
8. **Document skipped tests**: Always explain why with comment
9. **Validate against CPIC**: Check PMIDs, activity scores, boundaries
10. **Run often**: Use watch mode during development

### 📚 Reference Implementations:

- **Gold Standard**: UGT1A1 (36/36 tests, clean structure)
- **Complex Example**: CYP2D6 (20/20 tests, handles phase ambiguity)

### ✅ For CYP2C19 Tests:

- Follow UGT1A1 structure (simpler gene)
- Test *2, *3, *17 alleles
- 3 tests per allele (homozygous ref, het, homozygous alt)
- Test diazepam, citalopram, escitalopram, omeprazole, clopidogrel
- Target 30-35 tests total
- Expect 95% coverage

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Next Review**: After CYP2C19 implementation
