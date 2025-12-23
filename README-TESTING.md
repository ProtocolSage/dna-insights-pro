# DNA Analysis Testing Infrastructure

**Medical-Grade Testing Framework for Pharmacogenomics Analysis**

This testing infrastructure provides a comprehensive, production-ready test suite for DNA analysis applications. Built with Vitest, it includes specialized utilities for genetic data testing, custom matchers for pharmacogenomics, and extensive test coverage patterns.

---

## 📦 Package Contents

```
dna-testing-infrastructure/
├── package.json                           # Dependencies & scripts
├── vitest.config.ts                       # Vitest configuration
├── tests/
│   ├── setup.ts                          # Global test setup & custom matchers
│   ├── test-utils.ts                     # Test utilities & factories
│   ├── analyzers/
│   │   ├── cyp2c9.test.ts               # CYP2C9 comprehensive tests
│   │   ├── vkorc1.test.ts               # VKORC1 tests
│   │   └── cyp2d6.test.ts               # CYP2D6 complex allele tests
│   └── pgx-integration.test.ts          # End-to-end integration tests
└── README.md                              # This file
```

---

## 🚀 Quick Start

### 1. Installation

Copy this entire directory into your project root, then install dependencies:

```bash
cd your-project-root
cp -r /path/to/dna-testing-infrastructure .
npm install
```

**Required Dependencies:**
- `vitest@^1.0.4` - Test runner
- `@vitest/coverage-v8@^1.0.4` - Coverage provider
- `@vitest/ui@^1.0.4` - Visual test UI (optional but recommended)
- `typescript@^5.3.0` - TypeScript support
- `@types/node@^20.10.0` - Node type definitions

### 2. Configuration

Update `vitest.config.ts` paths to match your project structure:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@analysis': path.resolve(__dirname, './src/analysis'),
    '@tests': path.resolve(__dirname, './tests'),
  },
}
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Watch mode for development
npm run test:watch

# CI/CD mode with JUnit reporter
npm run test:ci
```

---

## 📊 Coverage Requirements

Medical-grade standards enforce **95% coverage** across all metrics:

- **Lines**: 95%
- **Functions**: 95%
- **Branches**: 95%
- **Statements**: 95%

These thresholds are configured in `vitest.config.ts` and will fail CI builds if not met.

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in multiple formats:
- **Terminal**: Immediate summary
- **HTML**: `coverage/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI tools)
- **JSON**: `coverage/coverage-final.json` (for programmatic analysis)

---

## 🧪 Test Utilities

### Custom Matchers

The framework includes genetic data-specific matchers:

```typescript
import { expect } from 'vitest';

// Validate genotype format
expect('rs1799853:CT').toBeValidGenotype();

// Validate allele names
expect('*2').toBeValidAlleleName();
expect('*3A').toBeValidAlleleName();

// Validate CPIC phenotypes
expect('Normal Metabolizer').toBeValidPhenotype();

// Validate activity scores
expect(1.5).toBeValidActivityScore(); // Range: 0-3
expect(2.5).toBeValidActivityScore(0, 5); // Custom range
```

### Test Data Factories

Create genetic data quickly with factories:

```typescript
import {
  createTestGenotype,
  createTestGenotypes,
  createTestDiplotype,
  CYP2C9_TEST_GENOTYPES,
  VKORC1_TEST_GENOTYPES,
} from './tests/test-utils';

// Single genotype
const genotype = createTestGenotype('rs1799853', 'CT');

// Multiple genotypes
const genotypes = createTestGenotypes([
  { rsid: 'rs1799853', genotype: 'CT' },
  { rsid: 'rs1057910', genotype: 'AA' },
]);

// Pre-defined test sets
const wildtype = CYP2C9_TEST_GENOTYPES.wildtype;
const heterozygous = CYP2C9_TEST_GENOTYPES.heterozygous_star2;
```

### Assertion Helpers

Validate analyzer outputs:

```typescript
import {
  assertAnalyzerResult,
  assertSafetyRecommendation,
  assertDrugRecommendation,
} from './tests/test-utils';

// Ensure all required fields are present
assertAnalyzerResult(result, [
  'gene',
  'diplotype',
  'phenotype',
  'activityScore',
]);

// Validate safety recommendations
assertSafetyRecommendation(result.recommendation);

// Validate drug recommendations with clinical guidance
assertDrugRecommendation(result.drugs[0]);
```

### Performance Testing

```typescript
import { measureExecutionTime, assertPerformance } from './tests/test-utils';

// Measure execution time
const { result, timeMs } = await measureExecutionTime(() => analyzeGene(data));
console.log(`Analysis took ${timeMs}ms`);

// Assert performance constraints
const result = await assertPerformance(
  () => analyzeGene(data),
  100 // Must complete in under 100ms
);
```

---

## 📝 Writing Tests

### Test Structure Pattern

Follow this structure for analyzer tests:

```typescript
import { describe, it, expect } from 'vitest';
import { createTestGenotype, assertAnalyzerResult } from '../test-utils';
import { analyzeCYP2C9 } from '@/analysis/pgx/cyp2c9-analyzer';

describe('CYP2C9 Analyzer', () => {
  describe('Basic Functionality', () => {
    it('should analyze wildtype correctly', () => {
      const genotypes = [
        createTestGenotype('rs1799853', 'CC'),
        createTestGenotype('rs1057910', 'AA'),
      ];

      const result = analyzeCYP2C9(genotypes);

      expect(result.diplotype).toBe('*1/*1');
      expect(result.phenotype).toBe('Normal Metabolizer');
      expect(result.activityScore).toBe(2.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data', () => {
      const result = analyzeCYP2C9([]);
      expect(result.phenotype).toBe('Unknown');
    });
  });

  describe('Drug Recommendations', () => {
    it('should provide warfarin guidance', () => {
      const result = analyzeCYP2C9(genotypes);
      const warfarin = result.drugs.find(d => d.drug === 'warfarin');
      expect(warfarin).toBeDefined();
    });
  });

  describe('Clinical Validation', () => {
    it('should reference CPIC guidelines', () => {
      const result = analyzeCYP2C9(genotypes);
      expect(result.guidelines).toContain('CPIC');
    });
  });
});
```

### Test Categories

Every analyzer should include tests for:

1. **Basic Functionality**: Common genotypes and expected phenotypes
2. **Edge Cases**: Missing data, invalid genotypes, null values
3. **Provider Formats**: 23andMe, AncestryDNA, generic formats
4. **Drug Recommendations**: All affected drugs with proper guidance
5. **Clinical Validation**: CPIC/FDA guideline references, PMIDs
6. **Performance**: Execution time, memory efficiency
7. **Regression Tests**: Previously fixed bugs
8. **Data Integrity**: Required fields, valid ranges, type safety

---

## 🎯 Best Practices

### 1. Test Naming

Use descriptive test names that explain the scenario:

```typescript
// ✅ Good
it('should analyze *2/*3 compound heterozygote correctly', () => {});
it('should provide dose reduction for poor metabolizers', () => {});

// ❌ Bad
it('should work', () => {});
it('test 1', () => {});
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should analyze heterozygous variant', () => {
  // Arrange: Set up test data
  const genotypes = createTestGenotypes([
    { rsid: 'rs1799853', genotype: 'CT' },
  ]);

  // Act: Execute the function
  const result = analyzeCYP2C9(genotypes);

  // Assert: Verify the outcome
  expect(result.diplotype).toBe('*1/*2');
  expect(result.activityScore).toBe(1.5);
});
```

### 3. Test Independence

Each test should be independent and isolated:

```typescript
// ✅ Good: Each test creates its own data
it('should analyze wildtype', () => {
  const genotypes = createTestGenotypes([...]);
  const result = analyze(genotypes);
  expect(result.phenotype).toBe('Normal');
});

it('should analyze variant', () => {
  const genotypes = createTestGenotypes([...]);
  const result = analyze(genotypes);
  expect(result.phenotype).toBe('Intermediate');
});

// ❌ Bad: Tests share state
let sharedGenotypes;
beforeEach(() => {
  sharedGenotypes = createTestGenotypes([...]);
});
```

### 4. Clinical Safety

For medical applications, always test safety-critical scenarios:

```typescript
describe('Safety-Critical Scenarios', () => {
  it('should warn about codeine in poor metabolizers', () => {
    const genotypes = createPoorMetabolizer();
    const result = analyzeCYP2D6(genotypes);
    
    const codeine = result.drugs.find(d => d.drug === 'codeine');
    expect(codeine.level).toBe('warning');
    expect(codeine.message).toContain('avoid');
  });

  it('should recommend warfarin dose reduction', () => {
    const genotypes = createHighSensitivity();
    const result = analyzeWarfarin(genotypes);
    
    expect(result.recommendation.level).toBe('warning');
    expect(result.recommendation.doseReduction).toBeGreaterThan(0);
  });
});
```

### 5. Performance Monitoring

Test performance to ensure scalability:

```typescript
describe('Performance', () => {
  it('should analyze 1000 variants in under 1 second', () => {
    const largeDataset = Array(1000)
      .fill(null)
      .map((_, i) => createTestGenotype(`rs${i}`, 'AA'));

    const start = performance.now();
    analyzeGenome(largeDataset);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
```

---

## 🔧 Integration Examples

### Integrating Existing Tests

Port your existing manual tests to the framework:

**Before** (manual console logging):
```typescript
// Old: tests/pgx-integration-test.ts
const testData = {
  genotypes: [...]
};
const result = analyzePGx(testData.genotypes);
console.log('Result:', result);
console.log('Expected:', '*1/*2');
```

**After** (automated testing):
```typescript
// New: tests/analyzers/cyp2c9.test.ts
import { describe, it, expect } from 'vitest';

describe('CYP2C9 Analyzer', () => {
  it('should analyze *1/*2 correctly', () => {
    const genotypes = [
      createTestGenotype('rs1799853', 'CT'),
      createTestGenotype('rs1057910', 'AA'),
    ];

    const result = analyzeCYP2C9(genotypes);

    expect(result.diplotype).toBe('*1/*2');
    expect(result.activityScore).toBe(1.5);
  });
});
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

#### GitLab CI

```yaml
test:
  image: node:20
  script:
    - npm install
    - npm run test:ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

---

## 📚 Example Test Cases

### Testing Complex Star Alleles (CYP2D6)

```typescript
import { describe, it, expect } from 'vitest';
import { createTestGenotype } from '../test-utils';
import { analyzeCYP2D6 } from '@/analysis/pgx/cyp2d6-analyzer';

describe('CYP2D6 Complex Alleles', () => {
  it('should detect *4 nonfunctional allele', () => {
    const genotypes = [
      createTestGenotype('rs3892097', 'TT'), // Homozygous *4
    ];

    const result = analyzeCYP2D6(genotypes);

    expect(result.diplotype).toBe('*4/*4');
    expect(result.phenotype).toBe('Poor Metabolizer');
    expect(result.activityScore).toBe(0.0);
  });

  it('should detect gene duplication (*1x2)', () => {
    const genotypes = [
      createTestGenotype('rs3892097', 'CC'),
      { type: 'cnv', gene: 'CYP2D6', copyNumber: 3 },
    ];

    const result = analyzeCYP2D6(genotypes);

    expect(result.diplotype).toContain('x2');
    expect(result.phenotype).toBe('Ultrarapid Metabolizer');
  });

  it('should handle phase ambiguity conservatively', () => {
    const genotypes = [
      createTestGenotype('rs3892097', 'CT'),
      createTestGenotype('rs28371725', 'CT'),
    ];

    const result = analyzeCYP2D6(genotypes);

    expect(result.ambiguity).toBe(true);
    expect(result.possibleDiplotypes).toHaveLength(2);
    // Should provide conservative recommendation
    expect(result.recommendation.note).toContain('ambiguous');
  });
});
```

### Testing Provider-Specific Formats

```typescript
describe('Provider Format Handling', () => {
  it('should handle 23andMe genotype format', () => {
    const genotypes = [
      { rsid: 'rs1799853', genotype: 'CT', provider: '23andme' },
      { rsid: 'rs1057910', genotype: 'AA', provider: '23andme' },
    ];

    const result = analyzeCYP2C9(genotypes);
    expect(result.diplotype).toBe('*1/*2');
  });

  it('should handle AncestryDNA allele format', () => {
    const genotypes = [
      {
        rsid: 'rs1799853',
        allele1: 'C',
        allele2: 'T',
        provider: 'ancestry',
      },
      {
        rsid: 'rs1057910',
        allele1: 'A',
        allele2: 'A',
        provider: 'ancestry',
      },
    ];

    const result = analyzeCYP2C9(genotypes);
    expect(result.diplotype).toBe('*1/*2');
  });
});
```

---

## 🐛 Debugging Tests

### Running Specific Tests

```bash
# Run tests in a specific file
npm test cyp2c9.test.ts

# Run tests matching a pattern
npm test -- --grep "warfarin"

# Run a specific test suite
npm test -- --grep "CYP2C9 Analyzer"
```

### Debug Mode

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run with UI for interactive debugging
npm run test:ui
```

### VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm test --"
}
```

---

## 📈 Roadmap & Future Enhancements

### Phase 1: Core Infrastructure ✅
- [x] Vitest configuration
- [x] Custom genetic data matchers
- [x] Test utilities and factories
- [x] Coverage reporting

### Phase 2: Comprehensive Test Library (Current)
- [x] CYP2C9 gold standard tests
- [x] VKORC1 tests
- [x] CYP2D6 complex allele tests
- [x] Integration tests
- [ ] CYP2C19 tests (TODO)
- [ ] TPMT tests (TODO)
- [ ] DPYD tests (TODO)
- [ ] HLA tests (TODO)
- [ ] OPRM1 tests (TODO)

### Phase 3: Advanced Features
- [ ] Snapshot testing for report generation
- [ ] Visual regression tests for UI components
- [ ] Performance benchmarking suite
- [ ] Mutation testing for critical paths
- [ ] Contract testing for API endpoints

---

## 🤝 Contributing

When adding new tests:

1. Follow the established patterns in existing test files
2. Include all 8 test categories (see "Test Categories" section)
3. Add PMIDs for clinical references
4. Maintain 95%+ coverage
5. Document any new test utilities
6. Update this README if adding new patterns

---

## 📖 References

- **CPIC Guidelines**: https://cpicpgx.org/
- **PharmGKB**: https://www.pharmgkb.org/
- **PharmVar**: https://www.pharmvar.org/
- **Vitest Docs**: https://vitest.dev/
- **Coverage Best Practices**: https://istanbul.js.org/

---

## 📄 License

This testing infrastructure is part of the dna-insights-pro project.

---

## 🆘 Support

For questions or issues:
1. Check existing test examples in `tests/analyzers/`
2. Review test utilities documentation in `tests/test-utils.ts`
3. Refer to Vitest documentation for framework-specific questions

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Medical Grade**: Compliant with clinical software testing standards
