# E2E Tests for Order Flow

This directory contains end-to-end tests for the order flow using Playwright.

## Structure

```
e2e/
├── fixtures/          # Test data
│   └── test-data.ts   # Reusable test data
├── page-objects/      # Page Object Models
│   └── OrderFormPage.ts # Order form page object
├── order-flow.spec.ts         # Main order flow tests
├── order-flow-mobile.spec.ts  # Mobile-specific tests
├── order-flow-api.spec.ts     # API integration tests
├── order-form-simple.spec.ts  # Simple form tests
└── smoke.spec.ts              # Basic smoke tests
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test order-flow.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test by name
npx playwright test -g "should successfully submit cake order"
```

## Test Coverage

### Form Display and Navigation
- Form field visibility
- Conditional field display based on order type
- Responsive layout on mobile

### Form Validation
- Required field validation
- Email format validation
- Phone number validation
- Date validation (minimum 7 days ahead, Thu-Sat only)
- Order type selection validation
- Cake/dessert details validation

### Successful Submissions
- Cake order submission
- Dessert order submission
- Combined order submission
- File upload handling

### Error Handling
- Server error responses
- Network failures
- Loading states
- Timeout handling
- Rate limiting

### Mobile Testing
- Touch interactions
- Responsive layout
- Mobile date picker
- Mobile file upload

### API Integration
- FormData structure validation
- Response handling
- Retry logic
- Malformed responses

## Best Practices Implemented

1. **Page Object Model**: Encapsulates page interactions in reusable classes
2. **Test Isolation**: Each test runs independently
3. **Proper Selectors**: Uses semantic selectors (roles, text, test-ids)
4. **Parallel Execution**: Tests run in parallel across browsers
5. **Retry Logic**: Automatic retry on failures (configurable)
6. **Trace on Failure**: Captures traces for debugging failed tests
7. **Mobile Testing**: Dedicated mobile viewport tests
8. **API Mocking**: Tests don't depend on real backend

## Debugging Failed Tests

1. **View traces**: After test failure, traces are automatically captured
   ```bash
   npx playwright show-trace test-results/*/trace.zip
   ```

2. **Debug mode**: Step through tests interactively
   ```bash
   npm run test:e2e:debug
   ```

3. **UI Mode**: Visual test runner with time-travel debugging
   ```bash
   npm run test:e2e:ui
   ```

## Adding New Tests

1. Create test file in `e2e/` directory
2. Import page objects and test data
3. Follow the existing patterns:
   - Use `test.describe` for grouping
   - Use `test.beforeEach` for setup
   - Mock API responses when needed
   - Use page objects for interactions
   - Add meaningful assertions

Example:
```typescript
import { test, expect } from '@playwright/test';
import { OrderFormPage } from './page-objects/OrderFormPage';

test.describe('New Feature', () => {
  let orderFormPage: OrderFormPage;

  test.beforeEach(async ({ page }) => {
    orderFormPage = new OrderFormPage(page);
    await orderFormPage.goto();
  });

  test('should test new feature', async () => {
    // Test implementation
  });
});
```