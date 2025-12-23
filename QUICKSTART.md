# Quick Start: Integrating Testing Infrastructure

## Step-by-Step Integration Guide

### Step 1: Copy Files to Your Project

```bash
# From your WSL terminal, navigate to your project
cd /path/to/dna-insights-pro

# Copy the testing infrastructure
cp -r /path/to/dna-testing-infrastructure/* .

# Or if you downloaded as a zip
unzip dna-testing-infrastructure.zip
mv dna-testing-infrastructure/* .
```

### Step 2: Install Dependencies

```bash
npm install --save-dev vitest@^1.0.4 @vitest/coverage-v8@^1.0.4 @vitest/ui@^1.0.4
```

### Step 3: Update vitest.config.ts Paths

Edit `vitest.config.ts` to match your project structure:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@analysis': path.resolve(__dirname, './src/analysis'),  // Update this
    '@tests': path.resolve(__dirname, './tests'),
  },
}
```

### Step 4: Add Test Scripts to package.json

If not already present, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Step 5: Run Your First Test

```bash
# Run all tests
npm test

# Or run with UI for interactive experience
npm run test:ui
```

---

## Converting Your Existing Tests

### Example: Converting Manual Console Test

**Your existing test** (`tests/pgx-integration-test.ts`):
```typescript
// Manual console-based test
const testCYP2C9_Normal = {
  genotypes: [
    { rsid: 'rs1799853', genotype: 'CC' },
    { rsid: 'rs1057910', genotype: 'AA' },
  ],
};

const result = analyzeCYP2C9(testCYP2C9_Normal.genotypes);
console.log('Testing CYP2C9 *1/*1:');
console.log('Result:', result.diplotype);
console.log('Expected: *1/*1');
console.log('Match:', result.diplotype === '*1/*1' ? '✓' : '✗');
```

**Converted to automated test**:
```typescript
// tests/analyzers/cyp2c9.test.ts
import { describe, it, expect } from 'vitest';
import { createTestGenotype } from '../test-utils';
import { analyzeCYP2C9 } from '@/analysis/pgx/cyp2c9-analyzer';

describe('CYP2C9 Analyzer', () => {
  it('should analyze *1/*1 wildtype correctly', () => {
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
```

---

## Updating Your Analyzer Imports

### Step 1: Find Your Analyzer Files

Your analyzers are likely in:
- `src/analysis/pgx/cyp2c9-analyzer.ts`
- `src/analysis/pgx/vkorc1-analyzer.ts`
- etc.

### Step 2: Update Test Imports

In each test file, replace the mock analyzer with your actual import:

```typescript
// tests/analyzers/cyp2c9.test.ts

// REMOVE THIS (mock):
const analyzeCYP2C9 = (genotypes: any) => {
  return {
    gene: 'CYP2C9',
    diplotype: '*1/*1',
    phenotype: 'Normal Metabolizer',
    activityScore: 2.0,
  };
};

// ADD THIS (real import):
import { analyzeCYP2C9 } from '@/analysis/pgx/cyp2c9-analyzer';
// or
import { analyzeCYP2C9 } from '../../src/analysis/pgx/cyp2c9-analyzer';
```

### Step 3: Run Tests to Validate

```bash
npm test cyp2c9.test.ts
```

If tests fail, your analyzer might need adjustments. The tests will show you exactly what's wrong!

---

## Validating Your Existing Analyzers

### Quick Validation Test

Create a new file `tests/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { analyzeCYP2C9 } from '@/analysis/pgx/cyp2c9-analyzer';
import { analyzeVKORC1 } from '@/analysis/pgx/vkorc1-analyzer';
import { analyzeSLCO1B1 } from '@/analysis/pgx/slco1b1-analyzer';
import { analyzeF5 } from '@/analysis/pgx/f5-analyzer';

describe('Analyzer Validation', () => {
  it('should have analyzeCYP2C9 function', () => {
    expect(analyzeCYP2C9).toBeDefined();
    expect(typeof analyzeCYP2C9).toBe('function');
  });

  it('should have analyzeVKORC1 function', () => {
    expect(analyzeVKORC1).toBeDefined();
    expect(typeof analyzeVKORC1).toBe('function');
  });

  it('should have analyzeSLCO1B1 function', () => {
    expect(analyzeSLCO1B1).toBeDefined();
    expect(typeof analyzeSLCO1B1).toBe('function');
  });

  it('should have analyzeF5 function', () => {
    expect(analyzeF5).toBeDefined();
    expect(typeof analyzeF5).toBe('function');
  });
});
```

Run this to ensure all your analyzers are importable:
```bash
npm test validation.test.ts
```

---

## Common Integration Issues & Fixes

### Issue 1: Module Not Found

**Error:**
```
Cannot find module '@/analysis/pgx/cyp2c9-analyzer'
```

**Fix:**
Update the path alias in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),  // Make sure this matches your structure
  },
}
```

### Issue 2: Test Fails with "Unknown" Phenotype

**Error:**
```
Expected: "Normal Metabolizer"
Received: "Unknown"
```

**Meaning:** Your analyzer isn't finding the genotypes. Check:
1. Input format matches what your analyzer expects
2. rsID matches exactly
3. Genotype format is correct (e.g., 'CT' not 'TC')

**Debug:**
```typescript
it('debug test', () => {
  const genotypes = [createTestGenotype('rs1799853', 'CC')];
  const result = analyzeCYP2C9(genotypes);
  console.log('Result:', result);  // See what you're getting
});
```

### Issue 3: TypeScript Errors

**Error:**
```
Type 'string' is not assignable to type 'Genotype'
```

**Fix:**
Your analyzer might have stricter types. Update test-utils.ts:
```typescript
// Match your analyzer's expected type
export interface TestGenotype {
  rsid: string;
  genotype: string;
  // Add any other fields your analyzer expects
}
```

---

## Next Steps

1. **Validate Current Tests**: Run existing tests to ensure infrastructure works
2. **Update Imports**: Replace mocks with real analyzer imports
3. **Fix Failures**: Use test failures to identify analyzer issues
4. **Add Coverage**: Expand tests to cover edge cases
5. **Achieve 95%**: Aim for medical-grade coverage thresholds

---

## Getting Help

If you encounter issues:

1. **Check Test Output**: Vitest provides detailed error messages
2. **Run with --reporter=verbose**: Get more debugging info
3. **Use Test UI**: `npm run test:ui` for interactive debugging
4. **Check Coverage**: `npm run test:coverage` to see what's missing

---

## Success Indicators

You'll know integration is successful when:

✅ `npm test` runs without errors  
✅ Coverage is >90% for your analyzers  
✅ All edge cases are tested  
✅ Tests run in <5 seconds  
✅ CI/CD pipeline passes  

---

**Ready to start testing!** 🚀
