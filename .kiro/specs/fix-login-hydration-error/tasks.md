# Implementation Plan

- [x] 1. Create client-only wrapper component for hydration safety
  - Create `components/ui/ClientOnly.tsx` component that renders nothing on server
  - Implement proper fallback rendering during hydration
  - Add TypeScript interfaces for component props
  - _Requirements: 2.1, 2.2_

- [ ] 2. Implement hydration-safe theme provider
  - [x] 2.1 Create new ThemeProvider with proper hydration handling
    - Refactor `components/providers/ThemeProvider.tsx` to prevent server/client mismatches
    - Add `isHydrated` state management to control DOM manipulation timing
    - Implement safe localStorage access with error handling

    - _Requirements: 3.1, 3.2, 2.2_

  - [x] 2.2 Add loading states to prevent hydration mismatches
    - Implement loading state during theme initialization
    - Add fallback rendering while theme is being determined
    - Ensure consistent server and client rendering
    - _Requirements: 3.1, 2.1_

- [x] 3. Fix Next.js configuration for hydration stability
  - [x] 3.1 Temporarily disable React Strict Mode
    - Modify `apps/web/next.config.js` to disable `reactStrictMode`
    - Add comment explaining temporary nature of the change
    - _Requirements: 4.2, 1.1_

  - [x] 3.2 Update package dependencies for compatibility
    - Update Next.js to stable version (14.x LTS or latest stable 15.x)
    - Verify React version compatibility
    - Update package.json and run npm install
    - _Requirements: 4.1, 4.3_

- [x] 4. Refactor layout component for safe hydration
  - Modify `apps/web/app/[locale]/layout.tsx` to use ClientOnly wrapper for theme-dependent content

  - Remove unnecessary `suppressHydrationWarning` attributes
  - Ensure proper provider ordering to prevent conflicts
  - _Requirements: 2.1, 2.2, 1.2_

- [x] 5. Update providers wrapper for hydration safety
  - Modify `components/providers/Providers.tsx` to use ClientOnly wrapper for ThemeProvider
  - Ensure SessionProvider and LocaleProvider don't cause hydration issues
  - Add proper error boundaries for provider failures

  - _Requirements: 2.2, 2.3_

- [x] 6. Add error boundary for provider components
  - Create `components/providers/ProviderErrorBoundary.tsx` to catch and handle provider errors
  - Implement fallback UI for when providers fail
  - Add proper error logging for debugging
  - _Requirements: 2.3_

- [x] 7. Test and verify login page functionality
  - Create test to verify signin page loads without removeChild errors

  - Test theme switching doesn't cause DOM manipulation errors
  - Verify form submission works correctly after hydration fixes
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Re-enable React Strict Mode with proper safeguards

  - Re-enable `reactStrictMode` in `next.config.js` after fixes are verified
  - Test that hydration issues don't reoccur with Strict Mode enabled
  - Add comprehensive error handling for any remaining issues
  - _Requirements: 4.2_
