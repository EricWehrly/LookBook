# LookBook Unit Testing Implementation Plan

## Current State Analysis
- **Framework**: React 18 with TypeScript, Jest, React Testing Library
- **Issue**: Tests fail due to `crypto` not available in Jest environment  
- **Architecture**: Component-based with models, services, localStorage persistence
- **Key Areas**: Look management, photo integration, barcode scanning, product tracking

## Testing Strategy Overview

### 1. Test Environment Setup & Fixes
- [x] **Priority 1: Fix crypto polyfill** - Add crypto-js or global crypto mock for Jest
- [x] **Configure Jest environment** - Set up proper test environment variables
- [x] **Add test utilities** - Create helper functions for common test patterns
- [ ] **Mock external dependencies** - Google Photos API, Quagga2 barcode scanner
- [x] **LocalStorage mocking** - Set up proper localStorage testing utilities

### 2. Test Categories & Coverage Levels

#### **Unit Tests (Isolated Component Logic)**
- [ ] **Models & Interfaces Testing**
  - `LookModel` validation and type safety
  - `ProductModel` enum and interface validation
  - `PersistedModel` interface compliance

#### **Service Layer Testing**
- [ ] **GoogleAuthService** - Authentication state management
- [ ] **GooglePhotosService** - API interaction mocking
- [ ] **Persistence Layer** - localStorage CRUD operations
- [ ] **Product Lookup Service** - barcode to product mapping

#### **Component Testing (Behavior & Integration)**
- [x] **Core Components**
  - [x] `App.tsx` - routing and initial state
  - [x] `Look` component - CRUD operations, state management
  - [ ] `AlbumPicker` - Google Photos integration
  - [ ] `ProductScanner` - barcode scanning integration

#### **Utility & Helper Testing**
- [x] **Persisted base class** - inheritance behavior
- [ ] **OnScreenConsole** - debug utility functionality
- [x] **Look occurrence management** - date-based filtering

### 3. Test Implementation Priority

#### **Phase 1: Foundation & Critical Path (Week 1)**
1. [x] **Fix test environment** - crypto polyfill, mocks setup
2. [x] **Replace default App.test.tsx** - Remove React placeholder, add real tests
3. [x] **Look component tests** - Core functionality (create, save, load)
4. [x] **LocalStorage service tests** - Persistence layer validation
5. [x] **Basic routing tests** - App component route handling

#### **Phase 2: Service Integration (Week 2)**
6. [ ] **Google Photos service mocking** - API integration tests
7. [ ] **Product scanner integration** - Quagga2 mocking and testing
8. [ ] **Authentication flow tests** - GoogleAuthService testing
9. [ ] **Date/time filtering tests** - Look occurrence logic

#### **Phase 3: Edge Cases & Error Handling (Week 3)**
10. [ ] **Error boundary testing** - Component failure scenarios
11. [ ] **LocalStorage failure scenarios** - Quota exceeded, corrupt data
12. [ ] **Network failure simulation** - Google API unavailable
13. [ ] **Performance testing** - Large datasets, memory usage

### 4. Test Utilities & Helpers

#### **Create Custom Test Utilities**
```typescript
// src/__tests__/test-utils.tsx
// - React Testing Library wrapper with providers
// - Mock localStorage utilities  
// - Mock Google APIs
// - Mock crypto functions
// - Component rendering helpers
```

#### **Mock Strategy**
- [x] **Global mocks** - `__mocks__` folder for external libraries
- [ ] **Service mocks** - Injectable mock services for testing
- [x] **LocalStorage mock** - Consistent storage testing environment
- [ ] **Router mock** - react-router-dom testing utilities

### 5. Configuration Updates

#### **Jest Configuration** (`package.json` or `jest.config.js`)
```json
{
  "setupFilesAfterEnv": ["<rootDir>/src/setupTests.ts"],
  "testEnvironment": "jsdom",
  "moduleNameMapping": {
    "\\.(css|less|scss)$": "identity-obj-proxy"
  },
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/index.tsx",
    "!src/reportWebVitals.ts"
  ]
}
```

#### **Test Scripts Update**
```json
{
  "scripts": {
    "test": "react-scripts test --watchAll=false",
    "test:watch": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "react-scripts test --coverage --ci --watchAll=false"
  }
}
```

### 6. Specific Test File Structure

```
src/
├── __tests__/
│   ├── test-utils.tsx           # Custom render utilities
│   ├── mocks/
│   │   ├── crypto.ts           # Crypto polyfill
│   │   ├── localStorage.ts     # LocalStorage mock
│   │   ├── googlePhotos.ts     # Google Photos API mock
│   │   └── quagga.ts           # Barcode scanner mock
│   └── setup.ts                # Global test setup
├── components/
│   ├── looks/
│   │   ├── __tests__/
│   │   │   ├── look.test.tsx
│   │   │   ├── looks.test.tsx
│   │   │   └── lookOccurrence.test.tsx
│   │   └── ...
│   ├── photos/
│   │   ├── __tests__/
│   │   │   ├── albumpicker.test.tsx
│   │   │   ├── googleAuthService.test.ts
│   │   │   └── googlePhotoService.test.ts
│   │   └── ...
│   ├── products/
│   │   ├── __tests__/
│   │   │   ├── productScanner.test.tsx
│   │   │   └── products.test.tsx
│   │   └── ...
│   └── util/
│       ├── __tests__/
│       │   ├── persisted.test.tsx
│       │   └── onScreenConsole.test.tsx
│       └── ...
└── App.test.tsx                # Updated integration tests
```

### 7. Key Test Scenarios

#### **Look Component Tests**
- [ ] Create new look with auto-generated ID
- [ ] Load existing look from localStorage  
- [ ] Save look changes to localStorage
- [ ] Handle invalid look ID gracefully
- [ ] Date-based name generation
- [ ] State management for editing

#### **Google Photos Integration Tests**  
- [ ] Authentication state changes
- [ ] Album loading and selection
- [ ] Photo picker functionality
- [ ] API error handling
- [ ] Network timeout scenarios

#### **Product Scanner Tests**
- [ ] Barcode detection simulation
- [ ] Camera permission handling
- [ ] Product lookup by barcode
- [ ] Scanner state management
- [ ] Error recovery scenarios

#### **Persistence Layer Tests**
- [ ] CRUD operations via Persisted base class
- [ ] LocalStorage quota management
- [ ] Data serialization/deserialization
- [ ] Collection management
- [ ] Cross-component data sharing

### 8. Test Quality Standards

#### **Coverage Targets**
- **Minimum acceptable**: 70% line coverage
- **Target goal**: 85% line coverage  
- **Critical paths**: 95+ % coverage (Look CRUD, persistence)

#### **Test Categories**
- **Unit tests**: 60% of total tests - isolated logic
- **Integration tests**: 30% of total tests - component interaction  
- **E2E-style tests**: 10% of total tests - full user flows

#### **Quality Checklist**
- [ ] Each test has clear, descriptive name
- [ ] Tests are isolated and don't depend on execution order
- [ ] Mocks are properly cleaned up after each test
- [ ] Async operations are properly awaited
- [ ] Error scenarios are tested alongside happy paths

### 9. Implementation Phases Breakdown

#### **Phase 1 Deliverables (Days 1-3)**
- Working test runner (no watch mode confusion)
- Crypto polyfill implementation
- Updated App.test.tsx with meaningful tests
- Look component basic CRUD tests
- LocalStorage mock utilities

#### **Phase 2 Deliverables (Days 4-7)**  
- Google Photos service mocking and tests
- Product scanner integration tests  
- Authentication flow coverage
- Component integration test patterns

#### **Phase 3 Deliverables (Days 8-10)**
- Edge case coverage
- Error handling validation
- Performance and memory tests
- CI/CD integration prep
- Documentation and maintenance guide

### 10. Success Criteria

#### **Technical Success**
- [x] `yarn test` runs cleanly without interactive prompts
- [x] All existing functionality covered by tests
- [x] CI-ready test configuration
- [x] No false positive/negative test results
- [x] Tests run in under 30 seconds locally

#### **Development Experience Success**  
- [ ] Tests help catch regressions during development
- [ ] Clear error messages when tests fail
- [ ] Easy to add new tests following established patterns
- [ ] Mock utilities are reusable across components
- [ ] Test coverage reports are actionable

### 11. Maintenance Strategy

#### **Ongoing Test Maintenance**
- [ ] Update tests when component APIs change
- [ ] Add tests for new features as they're developed  
- [ ] Refactor tests when components are refactored
- [ ] Monitor and improve test performance
- [ ] Keep external API mocks up to date

#### **Test Review Process**
- [ ] New components must include tests
- [ ] PR reviews include test coverage discussion
- [ ] Broken tests block deployments
- [ ] Regular test suite health checks

---

## Next Steps

1. **Start with Phase 1**: Fix the immediate crypto issue and get basic tests working
2. **Incrementally build**: Add one component test suite at a time  
3. **Validate coverage**: Ensure each phase meets coverage targets before moving forward
4. **Iterate and improve**: Use this plan as a living document, update based on discoveries

This plan provides a comprehensive roadmap for implementing robust unit testing while addressing the current technical challenges and ensuring future maintainability.
