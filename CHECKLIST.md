# Testing Infrastructure Integration Checklist

Use this checklist to track your progress as you integrate and expand the testing infrastructure.

## Phase 1: Setup & Installation ⚙️

- [ ] Copy testing infrastructure files to project root
- [ ] Install dependencies (`npm install`)
- [ ] Update `vitest.config.ts` paths to match project structure
- [ ] Add test scripts to `package.json`
- [ ] Run `npm test` to verify basic setup
- [ ] Run `npm run test:ui` to verify UI works

## Phase 2: Analyzer Integration 🔬

### CYP2C9 (Complete per audit)
- [ ] Import actual `analyzeCYP2C9` function in test file
- [ ] Run CYP2C9 tests (`npm test cyp2c9.test.ts`)
- [ ] Fix any test failures
- [ ] Achieve >95% coverage for CYP2C9 analyzer
- [ ] Add any missing edge case tests

### VKORC1 (Complete per audit)
- [ ] Import actual `analyzeVKORC1` function
- [ ] Run VKORC1 tests
- [ ] Fix any test failures
- [ ] Achieve >95% coverage
- [ ] Add any missing tests

### SLCO1B1 (Complete per audit)
- [ ] Import actual `analyzeSLCO1B1` function
- [ ] Create comprehensive test file (use VKORC1 as template)
- [ ] Run tests and fix failures
- [ ] Achieve >95% coverage
- [ ] Add *15 allele support tests

### F5 (Complete per audit)
- [ ] Import actual `analyzeF5` function
- [ ] Create comprehensive test file
- [ ] Run tests and fix failures
- [ ] Achieve >95% coverage
- [ ] Add thrombosis risk tests

## Phase 3: Refactor Critical Genes 🏗️

### CYP2C19 (Partial per audit - needs extraction)
- [ ] Extract CYP2C19 logic from `pgx-integration.ts`
- [ ] Create standalone `cyp2c19-analyzer.ts`
- [ ] Create comprehensive test file (use CYP2C9 as template)
- [ ] Port existing logic with tests
- [ ] Verify all tests pass
- [ ] Achieve >95% coverage
- [ ] Update integration to use new analyzer

### CYP2D6 (Partial per audit - needs extraction)
- [ ] Extract CYP2D6 logic from `pgx-integration.ts`
- [ ] Create standalone `cyp2d6-analyzer.ts`
- [ ] Create comprehensive test file (template provided)
- [ ] Port complex star allele logic
- [ ] Add CNV (duplication/deletion) tests
- [ ] Add phase ambiguity tests
- [ ] Verify all tests pass
- [ ] Achieve >95% coverage
- [ ] Update integration to use new analyzer

## Phase 4: Complete Tier 2 Genes 🎯

### OPRM1 (Missing per audit)
- [ ] Research CPIC guidelines for OPRM1
- [ ] Create `oprm1-analyzer.ts`
- [ ] Create knowledge base (`oprm1-kb.json`)
- [ ] Create test file with edge cases
- [ ] Implement analyzer
- [ ] Achieve >95% coverage
- [ ] Add drug recommendations (opioids)
- [ ] Integrate with main pipeline

## Phase 5: Complete Tier 3 Genes (HLA) 🧬

### HLA-B*57:01 (Missing per audit)
- [ ] Research HLA-B*57:01 allele detection
- [ ] Create `hla-b-analyzer.ts`
- [ ] Create knowledge base
- [ ] Create test file
- [ ] Implement analyzer
- [ ] Add abacavir hypersensitivity warning
- [ ] Achieve >95% coverage
- [ ] Integrate with main pipeline

### HLA-A*31:01 (Missing per audit)
- [ ] Research HLA-A*31:01 allele detection
- [ ] Create `hla-a-analyzer.ts`
- [ ] Create knowledge base
- [ ] Create test file
- [ ] Implement analyzer
- [ ] Add carbamazepine hypersensitivity warning
- [ ] Achieve >95% coverage
- [ ] Integrate with main pipeline

## Phase 6: Integration Testing 🔗

### PGx Integration Pipeline
- [ ] Update `pgx-integration.test.ts` with real imports
- [ ] Test combined CYP2C9 + VKORC1 warfarin recommendations
- [ ] Test drug conflict detection
- [ ] Test summary generation
- [ ] Test data normalization (23andMe, AncestryDNA)
- [ ] Test error handling
- [ ] Test performance with large datasets (1000+ variants)
- [ ] Achieve >95% coverage for integration module

## Phase 7: CI/CD Integration 🚀

- [ ] Add GitHub Actions workflow (or GitLab CI)
- [ ] Configure coverage reporting
- [ ] Set up automated test runs on PRs
- [ ] Configure coverage badges
- [ ] Set up quality gates (95% coverage minimum)
- [ ] Add pre-commit hooks for running tests

## Phase 8: Documentation & Maintenance 📚

- [ ] Document all custom test utilities
- [ ] Add JSDoc comments to complex test helpers
- [ ] Update README with new analyzers
- [ ] Create developer guide for adding new gene tests
- [ ] Document common test patterns
- [ ] Set up test data maintenance strategy
- [ ] Create regression test suite for known bugs

## Phase 9: Advanced Features 🚀

### Snapshot Testing
- [ ] Add snapshot tests for report generation
- [ ] Add snapshot tests for JSON output
- [ ] Version snapshots appropriately

### Performance Benchmarking
- [ ] Create performance benchmark suite
- [ ] Track analyzer execution times
- [ ] Set performance budgets
- [ ] Monitor for performance regressions

### Mutation Testing
- [ ] Install mutation testing tool (Stryker)
- [ ] Run mutation tests on critical analyzers
- [ ] Improve tests based on mutation survivors
- [ ] Achieve >90% mutation score for critical code

## Phase 10: Medical Grade Validation ✅

### Clinical Validation
- [ ] All analyzers reference CPIC/FDA guidelines
- [ ] All variants have PMID citations
- [ ] All recommendations include clinical disclaimers
- [ ] Evidence quality is documented

### Code Quality
- [ ] 100% TypeScript strict mode
- [ ] No `any` types in production code
- [ ] All edge cases tested
- [ ] All error paths tested
- [ ] No console.logs in production code

### Coverage Metrics
- [ ] Overall coverage >95%
- [ ] All analyzers individually >95%
- [ ] All critical paths 100% covered
- [ ] Branch coverage >95%
- [ ] Function coverage >95%

### Safety Validation
- [ ] All drug recommendations tested
- [ ] All safety warnings tested
- [ ] All contraindications tested
- [ ] All dose adjustments validated
- [ ] Fail-safe defaults verified

## Progress Summary

**Overall Progress**: ___ / ___ tasks complete

**Phase Status**:
- [ ] Phase 1: Setup (6 tasks)
- [ ] Phase 2: Analyzer Integration (20 tasks)
- [ ] Phase 3: Refactor Critical Genes (14 tasks)
- [ ] Phase 4: Tier 2 Genes (8 tasks)
- [ ] Phase 5: Tier 3 Genes (14 tasks)
- [ ] Phase 6: Integration Testing (8 tasks)
- [ ] Phase 7: CI/CD (6 tasks)
- [ ] Phase 8: Documentation (7 tasks)
- [ ] Phase 9: Advanced Features (10 tasks)
- [ ] Phase 10: Medical Grade (17 tasks)

**Total Tasks**: 110

---

## Milestones

### Milestone 1: Basic Infrastructure ✅
Complete Phases 1-2 (setup + existing analyzer tests)
**Target Date**: ___________

### Milestone 2: Critical Gene Refactor
Complete Phase 3 (CYP2C19, CYP2D6 extraction)
**Target Date**: ___________

### Milestone 3: Complete Gene Panel
Complete Phases 4-5 (OPRM1, HLA genes)
**Target Date**: ___________

### Milestone 4: Integration & CI
Complete Phases 6-7 (integration tests + CI/CD)
**Target Date**: ___________

### Milestone 5: Medical Grade Beta
Complete Phases 8-10 (docs + validation)
**Target Date**: ___________

---

## Notes & Blockers

Use this section to track any issues or blockers:

---

**Last Updated**: ___________
**Next Review**: ___________
