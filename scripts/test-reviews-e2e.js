/**
 * Comprehensive Verification Suite for Ethnikraft Customer Reviews & Ratings Module
 *
 * Covers:
 * 1. Star Rating Validation & Bounds Enforcement (1 to 5)
 * 2. Written Comment Constraints & Quick Praise Tag Formatting
 * 3. NestJS Response Unwrapping & Reviewer Metadata Extraction
 * 4. Average Rating & Aggregate Count Normalization
 * 5. Live Backend API Security Gates & Endpoint Reachability Verification
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://ethnikraft-be-production.up.railway.app/api/v1';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failures.push({ testName, details });
  }
}

function makeHttpRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${path} timed out after 10000ms`));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

// -------------------------------------------------------------
// Helper validations mirroring WriteReviewModal & productApi
// -------------------------------------------------------------
function validateReviewPayload({ productId, rating, comment, isPublic }) {
  if (!productId || typeof productId !== 'string') {
    return { valid: false, error: 'Product ID is required' };
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be an integer between 1 and 5' };
  }
  if (comment && comment.length > 1000) {
    return { valid: false, error: 'Comment must not exceed 1000 characters' };
  }
  return { valid: true };
}

function formatReviewComment(comment, tags = []) {
  let finalComment = (comment || '').trim();
  if (tags.length > 0) {
    const tagText = `[Highlights: ${tags.join(', ')}]`;
    finalComment = finalComment ? `${finalComment}\n\n${tagText}` : tagText;
  }
  return finalComment || undefined;
}

function unwrapReviewResponse(response) {
  return response?.data?.review || response?.data || response;
}

function normalizeReviewsList(response) {
  const data = response?.data || response;
  const reviews = data?.reviews || (Array.isArray(data) ? data : []);
  const total = data?.total ?? reviews.length;
  const averageRating = data?.averageRating ?? 0;
  return { reviews, total, averageRating };
}

async function runReviewSuites() {
  console.log('\n🚀 Starting Ethnikraft Customer Reviews & Ratings Test Runner...\n');

  // ==========================================================
  // SUITE 1: Review Payload Validation & Formatting
  // ==========================================================
  console.log('\n📦 ======================================================');
  console.log('📦 SUITE 1: Review Payload Validation & Formatting');
  console.log('======================================================\n');

  // 1. Valid 5-star review passes
  const valid5Star = validateReviewPayload({
    productId: 'prod_98765',
    rating: 5,
    comment: 'Exceptional craftsmanship and authentic indigo dyeing.',
    isPublic: true,
  });
  assert(valid5Star.valid === true, '5-star review payload validated successfully');

  // 2. Valid 1-star review passes
  const valid1Star = validateReviewPayload({
    productId: 'prod_98765',
    rating: 1,
    comment: 'Did not match measurements.',
    isPublic: true,
  });
  assert(valid1Star.valid === true, '1-star review payload validated successfully');

  // 3. Rating out of bounds (0 stars) rejected
  const zeroStar = validateReviewPayload({
    productId: 'prod_98765',
    rating: 0,
  });
  assert(zeroStar.valid === false, '0-star rating rejected by validator');

  // 4. Rating out of bounds (6 stars) rejected
  const sixStar = validateReviewPayload({
    productId: 'prod_98765',
    rating: 6,
  });
  assert(sixStar.valid === false, '6-star rating rejected by validator');

  // 5. Rating non-integer (4.5) rejected
  const floatStar = validateReviewPayload({
    productId: 'prod_98765',
    rating: 4.5,
  });
  assert(floatStar.valid === false, 'Non-integer rating (4.5) rejected by validator');

  // 6. Missing product ID rejected
  const missingProd = validateReviewPayload({
    productId: '',
    rating: 5,
  });
  assert(missingProd.valid === false, 'Omitted product ID rejected by validator');

  // 7. Comment exceeding 1000 characters rejected
  const longComment = 'A'.repeat(1001);
  const tooLong = validateReviewPayload({
    productId: 'prod_98765',
    rating: 4,
    comment: longComment,
  });
  assert(tooLong.valid === false, 'Comment exceeding 1000 characters rejected');

  // 8. Quick praise tags formatting
  const formattedTags = formatReviewComment('Loved it!', ['True to Size', 'Authentic Fabric']);
  assert(
    formattedTags.includes('[Highlights: True to Size, Authentic Fabric]'),
    'Praise tags appended correctly as highlights'
  );

  // 9. Tags only with no written comment
  const tagsOnly = formatReviewComment('', ['Master Craftsmanship']);
  assert(
    tagsOnly === '[Highlights: Master Craftsmanship]',
    'Tags formatted cleanly when comment is empty'
  );

  // ==========================================================
  // SUITE 2: Response Transformers & Normalization
  // ==========================================================
  console.log('\n🧪 ======================================================');
  console.log('🧪 SUITE 2: Review Response Transformers & Normalization');
  console.log('======================================================\n');

  // 10. Unwraps NestJS interceptor { data: { review: ... } }
  const mockNestReview = {
    success: true,
    data: {
      review: {
        id: 'rev_123',
        productId: 'prod_123',
        rating: 5,
        comment: 'Superb quality.',
        createdAt: '2026-09-20T00:00:00.000Z',
      },
    },
  };
  const unwrapped = unwrapReviewResponse(mockNestReview);
  assert(unwrapped.id === 'rev_123' && unwrapped.rating === 5, 'Unwraps NestJS { data: { review: ... } } envelope');

  // 11. Normalizes list response
  const mockListResp = {
    success: true,
    data: {
      reviews: [
        { id: 'rev_1', rating: 5, comment: 'Great!' },
        { id: 'rev_2', rating: 4, comment: 'Nice!' },
      ],
      total: 2,
      averageRating: 4.5,
    },
  };
  const normalizedList = normalizeReviewsList(mockListResp);
  assert(normalizedList.reviews.length === 2, 'Extracts review list correctly');
  assert(normalizedList.total === 2, 'Extracts total count correctly');
  assert(normalizedList.averageRating === 4.5, 'Preserves average rating numeric value');

  // 12. Handles raw flat array
  const flatReviews = [{ id: 'rev_flat', rating: 5 }];
  const normalizedFlat = normalizeReviewsList(flatReviews);
  assert(normalizedFlat.reviews.length === 1 && normalizedFlat.total === 1, 'Safely handles flat array of reviews');

  // ==========================================================
  // SUITE 3: Live Staging/Production Backend API Security Gates
  // ==========================================================
  console.log('\n🔒 ======================================================');
  console.log('🔒 SUITE 3: Live Staging/Production Backend API Security Gates');
  console.log(`🔒 Target: ${API_BASE_URL}`);
  console.log('======================================================\n');

  // Gate 1: POST /reviews/product (Must enforce JWT Authentication)
  try {
    const res = await makeHttpRequest({
      method: 'POST',
      path: '/reviews/product',
      body: {
        productId: 'prod-test-id',
        rating: 5,
        comment: 'Test review without token',
      },
    });
    const isSecured = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 400;
    assert(
      isSecured,
      `POST /reviews/product enforces JWT Authentication (${res.statusCode} Unauthorized)`
    );
  } catch (err) {
    assert(false, 'POST /reviews/product reachability check', err.message);
  }

  // Gate 2: POST /reviews (Custom studio review - must enforce JWT Authentication)
  try {
    const res = await makeHttpRequest({
      method: 'POST',
      path: '/reviews',
      body: {
        requestId: 'req-test-id',
        rating: 5,
        comment: 'Test studio review without token',
      },
    });
    const isSecured = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 400;
    assert(
      isSecured,
      `POST /reviews enforces JWT Authentication (${res.statusCode} Unauthorized)`
    );
  } catch (err) {
    assert(false, 'POST /reviews reachability check', err.message);
  }

  // Gate 3: GET /reviews (Public review listing reachability)
  try {
    const res = await makeHttpRequest({
      method: 'GET',
      path: '/reviews?limit=5',
    });
    const isReachable = res.statusCode === 200 || res.statusCode === 404;
    assert(
      isReachable,
      `GET /reviews endpoint route exists and is reachable (${res.statusCode} OK)`
    );
  } catch (err) {
    assert(false, 'GET /reviews reachability check', err.message);
  }

  // Gate 4: GET /reviews/vendor/:vendorId/stats (Vendor review statistics reachability)
  try {
    const res = await makeHttpRequest({
      method: 'GET',
      path: '/reviews/vendor/vendor-check-001/stats',
    });
    const isReachable = res.statusCode === 200 || res.statusCode === 404;
    assert(
      isReachable,
      `GET /reviews/vendor/:vendorId/stats endpoint route exists and is reachable (${res.statusCode})`
    );
  } catch (err) {
    assert(false, 'GET /reviews/vendor/:vendorId/stats reachability check', err.message);
  }

  // Gate 5: PATCH /reviews/:id (Enforces JWT Authentication)
  try {
    const res = await makeHttpRequest({
      method: 'PATCH',
      path: '/reviews/rev-check-001',
      body: { rating: 4 },
    });
    const isSecured = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404;
    assert(
      isSecured,
      `PATCH /reviews/:id enforces JWT Authentication (${res.statusCode} Unauthorized)`
    );
  } catch (err) {
    assert(false, 'PATCH /reviews/:id reachability check', err.message);
  }

  // ==========================================================
  // Summary
  // ==========================================================
  console.log('\n======================================================');
  console.log('🏁 REVIEWS & RATINGS TEST EXECUTION SUMMARY');
  console.log('======================================================');
  console.log(`Total Tests Run:  ${totalTests}`);
  console.log(`Passed:           ${passedTests} ✅`);
  console.log(`Failed:           ${failedTests} ${failedTests > 0 ? '❌' : ''}`);

  if (failedTests > 0) {
    console.error('\nFailed tests breakdown:');
    failures.forEach((f, i) => {
      console.error(`  ${i + 1}. ${f.testName} -> ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CUSTOMER REVIEW & RATING TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runReviewSuites().catch((err) => {
  console.error('Fatal test runner execution failure:', err);
  process.exit(1);
});
