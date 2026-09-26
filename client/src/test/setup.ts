import '@testing-library/jest-dom'

// jsdom doesn't implement IntersectionObserver, which framer-motion's
// whileInView scroll-reveal animations rely on. Kept untyped against the DOM
// lib's interface since this file also compiles under tsconfig.node.json,
// which has no DOM lib.
class MockIntersectionObserver {
  root = null
  rootMargin = ''
  thresholds: number[] = []

  disconnect() {
    /* noop */
  }
  observe() {
    /* noop */
  }
  takeRecords() {
    return []
  }
  unobserve() {
    /* noop */
  }
}

;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  MockIntersectionObserver

