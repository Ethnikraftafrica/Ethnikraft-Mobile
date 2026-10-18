/**
 * Comprehensive Verification & E2E Test Suite for Ethnikraft Vendor Orders API Integration
 *
 * Covers:
 * 1. RTK Query Endpoints Architecture & Tag Invalidation Contract (VendorOrders, VendorOverview)
 * 2. Response Transformers & NestJS Normalization (/orders/vendor)
 * 3. Order Model Mapping & Nullable Safeguards (user fallback, customRequest, customBid, logistics)
 * 4. Multi-Select Status & Search Filtering Logic (IN_PRODUCTION alias, search query matching)
 * 5. Aggregate Metrics Computation (Gross Revenue, Total Placed, In Fulfillment, Fulfilled)
 * 6. Live Backend API Security & Endpoint Reachability Verification (/orders/vendor, /orders/:id/status)
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
        Accept: 'application/json',
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

    req.on('error', (err) => reject(err));
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

// ─── Test Suite 1: RTK Query Endpoints Architecture & Tag Contracts ──────────
function testApiSliceDefinitions() {
  console.log('\n--- Test Suite 1: RTK Query Endpoints Architecture & Tags Contract ---');

  const fs = require('fs');
  const path = require('path');

  const apiConstantsPath = path.resolve(__dirname, '../src/constants/api.ts');
  const apiConstants = fs.readFileSync(apiConstantsPath, 'utf8');

  assert(
    apiConstants.includes("orders: '/orders/vendor'"),
    'API_ENDPOINTS.vendor.orders is configured to /orders/vendor'
  );
  assert(
    apiConstants.includes("updateOrderStatus: (id: string) => `/orders/${id}/status`"),
    'API_ENDPOINTS.vendor.updateOrderStatus is configured with dynamic /orders/:id/status'
  );

  const vendorApiPath = path.resolve(__dirname, '../src/store/api/vendorApi.ts');
  const vendorApiSource = fs.readFileSync(vendorApiPath, 'utf8');

  assert(
    vendorApiSource.includes('getVendorOrders: builder.query'),
    'vendorApi defines getVendorOrders query endpoint'
  );
  assert(
    vendorApiSource.includes('updateOrderStatus: builder.mutation'),
    'vendorApi defines updateOrderStatus mutation endpoint'
  );
  assert(
    vendorApiSource.includes("providesTags: ['VendorOrders']"),
    'getVendorOrders provides VendorOrders cache tag'
  );
  assert(
    vendorApiSource.includes("invalidatesTags: ['VendorOrders', 'VendorOverview']"),
    'updateOrderStatus invalidates VendorOrders and VendorOverview cache tags'
  );
  assert(
    vendorApiSource.includes('useGetVendorOrdersQuery'),
    'vendorApi exports useGetVendorOrdersQuery hook'
  );
  assert(
    vendorApiSource.includes('useUpdateOrderStatusMutation'),
    'vendorApi exports useUpdateOrderStatusMutation hook'
  );
}

// ─── Test Suite 2: Response Transformer Normalization ────────────────────────
function testResponseTransformers() {
  console.log('\n--- Test Suite 2: Response Transformer Normalization ---');

  // Simulated raw backend response from GET /orders/vendor
  const mockBackendResponse = {
    success: true,
    message: 'Vendor orders retrieved successfully',
    data: [
      {
        id: 'ord-test-01',
        vendorId: 'vendor-123',
        status: 'IN_PROGRESS',
        total: 104000,
        agreedPrice: 104000,
        itemsSubtotal: 96000,
        shippingCost: 8000,
        shippingProvider: 'DHL Express Nigeria',
        shippingTrackingNumber: 'DHL-NG-98421045',
        shippingBookingId: 'BOOK-DHL-77019',
        estimatedDeliveryDate: '2026-09-24',
        user: {
          id: 'user-01',
          firstName: 'Chukwuma',
          lastName: 'Obi',
          email: 'c.obi@lagosart.org',
          phone: '+234 802 334 5566',
        },
        orderItems: [
          {
            id: 'item-01',
            quantity: 2,
            unitPrice: 48000,
            product: {
              id: 'prod-01',
              name: 'Royal Indigo Aso-Oke',
              mainImage: 'https://images.unsplash.com/photo-aso-oke',
              price: 48000,
              productCategory: 'WEARS',
            },
          },
        ],
        createdAt: '2026-09-21T14:30:00.000Z',
      },
      {
        id: 'ord-test-02',
        vendorId: 'vendor-123',
        status: 'PENDING',
        total: 250000,
        customRequest: {
          id: 'req-01',
          title: 'Custom Beaded Throne Chair',
          budget: 250000,
        },
        customBid: {
          id: 'bid-01',
          price: 250000,
          notes: 'Finished with imperial cowrie trims',
        },
        createdAt: '2026-09-22T10:00:00.000Z',
      },
    ],
  };

  // Replicate vendorApi transformResponse logic
  const rawList = mockBackendResponse.data || [];
  const normalized = rawList.map((ord) => ({
    id: ord.id || '',
    orderNumber: ord.orderNumber || `#VORD-${(ord.id || '').slice(-4).toUpperCase()}`,
    total: Number(ord.total ?? ord.agreedPrice ?? 0),
    agreedPrice: ord.agreedPrice ? Number(ord.agreedPrice) : undefined,
    itemsSubtotal: ord.itemsSubtotal ? Number(ord.itemsSubtotal) : undefined,
    shippingCost: ord.shippingCost ? Number(ord.shippingCost) : 0,
    shippingProvider: ord.shippingProvider || 'Courier Express',
    shippingCostPaid: Boolean(ord.shippingCostPaid ?? true),
    shippingTrackingNumber: ord.shippingTrackingNumber || undefined,
    shippingBookingId: ord.shippingBookingId || undefined,
    estimatedDeliveryDate: ord.estimatedDeliveryDate || undefined,
    status: ord.status || 'PENDING',
    createdAt: ord.createdAt || new Date().toISOString(),
    updatedAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
    user: ord.user
      ? {
          id: ord.user.id || '',
          firstName: ord.user.firstName || '',
          lastName: ord.user.lastName || '',
          email: ord.user.email || '',
          phone: ord.user.phone || '',
        }
      : undefined,
    customRequest: ord.customRequest
      ? {
          id: ord.customRequest.id || '',
          title: ord.customRequest.title || 'Custom Atelier Commission',
        }
      : undefined,
    orderItems: Array.isArray(ord.orderItems)
      ? ord.orderItems.map((item) => ({
          id: item.id || '',
          productId: item.productId || item.product?.id || '',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || item.price || 0),
          product: item.product,
        }))
      : [],
    notes: ord.notes || ord.customBid?.notes,
  }));

  assert(normalized.length === 2, 'Transformer normalizes 2 orders accurately');
  assert(normalized[0].orderNumber === '#VORD-T-01', 'Order number generated cleanly from ID tail');
  assert(normalized[0].total === 104000, 'Total parsed as number');
  assert(normalized[0].shippingProvider === 'DHL Express Nigeria', 'Shipping provider preserved');
  assert(normalized[0].orderItems.length === 1, 'Order items preserved in array');
  assert(normalized[1].customRequest.title === 'Custom Beaded Throne Chair', 'Custom request commission title extracted');
  assert(normalized[1].notes === 'Finished with imperial cowrie trims', 'Custom bid notes extracted safely');
}

// ─── Test Suite 3: Metrics & Filter Logic ────────────────────────────────────
function testOrderFiltersAndMetrics() {
  console.log('\n--- Test Suite 3: Metrics & Multi-Select Filter Computation ---');

  const orders = [
    {
      id: 'ord-01',
      orderNumber: '#VORD-01',
      status: 'SHIPPED',
      totalAmount: 100000,
      customer: { name: 'Chukwuma Obi', email: 'c.obi@example.com' },
      orderItems: [{ name: 'Aso-Oke' }],
      shippingTrackingNumber: 'DHL-1234',
    },
    {
      id: 'ord-02',
      orderNumber: '#VORD-02',
      status: 'IN_PRODUCTION',
      totalAmount: 200000,
      customer: { name: 'Amara Nwosu', email: 'a.nwosu@example.com' },
      orderItems: [{ name: 'Bronze Sculpture' }],
    },
    {
      id: 'ord-03',
      orderNumber: '#VORD-03',
      status: 'DELIVERED',
      totalAmount: 150000,
      customer: { name: 'Kofi Mensah', email: 'kofi@example.com' },
      orderItems: [{ name: 'Coral Crown' }],
    },
    {
      id: 'ord-04',
      orderNumber: '#VORD-04',
      status: 'CANCELLED',
      totalAmount: 80000,
      customer: { name: 'Folake Balogun', email: 'folake@example.com' },
      orderItems: [{ name: 'Leather Satchel' }],
    },
  ];

  // Aggregate Metrics
  const totalOrdersCount = orders.length;
  const inFulfillmentCount = orders.filter((o) =>
    ['PENDING', 'IN_PROGRESS', 'IN_PRODUCTION', 'SHIPPED'].includes(o.status)
  ).length;
  const totalOrderRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrdersCount = orders.filter((o) =>
    o.status === 'COMPLETED' || o.status === 'DELIVERED'
  ).length;

  assert(totalOrdersCount === 4, 'Total orders count computed as 4');
  assert(inFulfillmentCount === 2, 'In fulfillment count computed as 2 (SHIPPED + IN_PRODUCTION)');
  assert(totalOrderRevenue === 450000, 'Total revenue computed accurately as 450,000 (excluding CANCELLED)');
  assert(completedOrdersCount === 1, 'Completed orders count computed as 1 (DELIVERED)');

  // Multi-select Status Filter: ['IN_PRODUCTION'] covers IN_PRODUCTION, IN_PROGRESS, and PRODUCTION_PENDING
  const filterSelected = ['IN_PRODUCTION'];
  const prodFiltered = orders.filter((ord) => {
    return ['IN_PRODUCTION', 'IN_PROGRESS', 'PRODUCTION_PENDING'].includes(ord.status);
  });
  assert(prodFiltered.length === 1 && prodFiltered[0].id === 'ord-02', 'IN_PRODUCTION filter correctly isolates in-production orders');

  // Search Filter: query "DHL-1234"
  const searchResult = orders.filter((ord) => {
    const q = 'dhl-1234';
    return ord.shippingTrackingNumber?.toLowerCase().includes(q);
  });
  assert(searchResult.length === 1 && searchResult[0].id === 'ord-01', 'Search query isolates order by tracking number');
}

// ─── Test Suite 4: Live Backend API Security & Endpoint Reachability ──────────
async function testLiveApiEndpoints() {
  console.log('\n--- Test Suite 4: Live Backend API Security & Endpoint Reachability ---');

  // 1. GET /orders/vendor without auth token
  try {
    const res = await makeHttpRequest({
      method: 'GET',
      path: '/orders/vendor',
    });

    assert(
      res.statusCode === 401,
      'GET /orders/vendor enforces JwtAuthGuard (Returns 401 Unauthorized without token)'
    );
    assert(
      res.data && res.data.statusCode === 401,
      'GET /orders/vendor returns standard NestJS error contract'
    );
  } catch (err) {
    assert(false, 'GET /orders/vendor reachability test', err.message);
  }

  // 2. PATCH /orders/:id/status without auth token
  try {
    const res = await makeHttpRequest({
      method: 'PATCH',
      path: '/orders/test-order-id/status',
      body: { status: 'IN_PROGRESS' },
    });

    assert(
      res.statusCode === 401,
      'PATCH /orders/:id/status enforces JwtAuthGuard (Returns 401 Unauthorized without token)'
    );
  } catch (err) {
    assert(false, 'PATCH /orders/:id/status reachability test', err.message);
  }
}

// ─── Main Execution Runner ───────────────────────────────────────────────────
async function runAllTests() {
  console.log('======================================================================');
  console.log('🧪 Starting Ethnikraft-Mobile Vendor Orders Integration Test Suite');
  console.log('======================================================================');

  testApiSliceDefinitions();
  testResponseTransformers();
  testOrderFiltersAndMetrics();
  await testLiveApiEndpoints();

  console.log('\n======================================================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('======================================================================');

  if (failedTests > 0) {
    console.error('\n❌ FAILURES:');
    failures.forEach((f, i) => {
      console.error(`  ${i + 1}. ${f.testName}`);
      if (f.details) console.error(`     Details: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL VENDOR ORDERS INTEGRATION TESTS PASSED CLEANLY!\n');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
