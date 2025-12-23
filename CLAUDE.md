# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DNA Insights Pro is a comprehensive DNA analysis platform combining pharmacogenomics (PGx) and nutrigenomics analysis for consumer genomic data (23andMe, AncestryDNA). Built with React, TypeScript, and Vite.

## Common Commands

### Development
```bash
npm install           # Install dependencies
npm run dev          # Start dev server (port 3000, auto-opens browser)
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Testing
```bash
npm test                # Run tests in watch mode
npm run test:ui         # Run tests with interactive UI
npm run test:coverage   # Generate coverage report (95% threshold required)
npm run test:watch      # Explicit watch mode
```

**Test Location**: All tests are in `tests/` directory, not alongside source files.

**Path Aliases**: Tests use `@/` for `./src`, `@analysis/` for `./src/analysis`, and `@tests/` for `./tests`.

**Coverage Standards**: Medical-grade 95% coverage required for all metrics (lines, functions, branches, statements). Coverage only measures `src/analysis/**/*.ts` files.

## Architecture

### Core Analysis Engines (`src/analysis/core/`)

**pgx-integration.ts** - Pharmacogenomics analysis engine
- Processes raw genotypes into star alleles, diplotypes, and phenotypes
- Generates drug recommendations with CPIC guideline references
- Main entry: `analyzePGx(genotypes)` returns `PGxResult[]`
- Supports CYP2C9, CYP2D6, VKORC1, SLCO1B1, F5 (Factor V Leiden)

**nutrigenomics-analysis.ts** - Nutrigenomics analysis engine
- Analyzes vitamin/mineral metabolism, macronutrient processing, food intolerances
- Categories: vitamins (D, B12, folate, A), minerals (iron, calcium), detox, omega fatty acids
- Main entry: `analyzeNutrigenomics(genotypes)` returns `NutrigenomicsResult`
- Includes MTHFR C677T/A1298C analysis for folate metabolism

**integrated-dna-analysis.ts** - Unified analysis orchestrator
- Combines PGx and nutrigenomics results into single output
- Handles 23andMe file format parsing
- Main entry: `analyzeGenomicData(genotypes)` or `analyzeDNAFile(file)`

### Gene-Specific Analyzers (`src/analysis/analyzers/`)

Each analyzer exports a single analysis function and follows the pattern:
- **cyp2c9-analyzer.ts**: `analyzeCYP2C9(genotypes)` - Warfarin metabolism
- **vkorc1-analyzer.ts**: `analyzeVKORC1(genotypes)` - Warfarin sensitivity
- **slco1b1-analyzer.ts**: `analyzeSLCO1B1(genotypes)` - Statin metabolism
- **f5-analyzer.ts**: `analyzeF5(genotypes)` - Factor V Leiden (thrombophilia)

Analyzers return structured results with:
- `gene`, `diplotype`, `phenotype`, `activityScore`
- `drugs[]` - array of drug recommendations with clinical guidance
- `guidelines` - CPIC/FDA guideline references

### Knowledge Base (`src/data/`)

- **kb-pgx-ultimate.json** (125KB) - Comprehensive pharmacogenomics knowledge base
- **kb-nutrigenomics-complete-125.json** (91KB) - Nutrigenomics variant database

These JSON files contain variant-to-phenotype mappings, drug recommendations, and clinical guidelines.

### UI Components (`src/components/`)

- **DNAAnalysisPanel.tsx** - Main dashboard component displaying all analysis results
- **PGxPanel.tsx** - Pharmacogenomics-specific UI panel

### Test Infrastructure (`tests/`)

**Test Utilities**:
- `setup.ts` - Custom matchers: `toBeValidGenotype()`, `toBeValidAlleleName()`, `toBeValidPhenotype()`, `toBeValidActivityScore()`
- `test-utils.ts` - Factories: `createTestGenotype()`, `createTestGenotypes()`, test data sets, assertion helpers

**Test Files**:
- `tests/analyzers/*.test.ts` - Individual gene analyzer tests
- `tests/pgx-integration.test.ts` - End-to-end integration tests
- `tests/pgx-integration-test.ts` - Legacy manual console test (not actively used)

**Testing Patterns**:
1. Use factories from `test-utils.ts` to create genotype data
2. Follow Arrange-Act-Assert pattern
3. Test categories: basic functionality, edge cases, drug recommendations, clinical validation
4. Always reference CPIC guidelines and PMIDs in clinical tests

## Key Implementation Details

### Genotype Format
Genotypes are objects with `rsid` and `genotype` properties:
```typescript
{ rsid: 'rs1799853', genotype: 'CT' }
```

### Star Allele Nomenclature
- `*1` = wildtype (normal function)
- `*2`, `*3`, etc. = variants with specific functional impacts
- Diplotypes combine two alleles: `*1/*2`, `*2/*3`
- Activity scores: 0 (no function) to 2+ (normal/increased)

### Phenotype Classifications
Standard CPIC phenotypes:
- Ultrarapid Metabolizer (UM)
- Rapid Metabolizer (RM)
- Normal Metabolizer (NM)
- Intermediate Metabolizer (IM)
- Poor Metabolizer (PM)

### Critical Genes
- **CYP2C9**: Warfarin, NSAIDs metabolism
- **VKORC1**: Warfarin sensitivity
- **CYP2D6**: Codeine, tramadol, antidepressants (complex gene duplication/deletion)
- **SLCO1B1**: Statin myopathy risk
- **F5**: Factor V Leiden thrombophilia
- **MTHFR**: Folate metabolism (C677T, A1298C variants)

### File Format Support
Primary format: 23andMe raw data (tab-delimited)
```
# rsid  chromosome  position  genotype
rs1799853  10  96702047  CT
```

## Development Notes

- **TypeScript**: Strict mode enabled, all source must pass `tsc` compilation
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Build Output**: `dist/` directory (included in .gitignore)
- **Dev Server**: Vite dev server with HMR on port 3000
- **Styling**: TailwindCSS (config in `tailwind.config.js`)
- **Charts**: Recharts library for data visualization

## Documentation

Reference documentation in `docs/`:
- `NUTRIGENOMICS-README.md` - Detailed nutrigenomics module documentation
- `ROADMAP_PRIORITY_BREAKDOWN.md` - Feature development roadmap
- `QUICKSTART.md` - Testing infrastructure integration guide
- `README-TESTING.md` - Comprehensive testing framework documentation
