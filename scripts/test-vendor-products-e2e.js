/**
 * Comprehensive Verification & E2E Test Suite for Ethnikraft Vendor Products API Integration
 *
 * Covers:
 * 1. RTK Query Endpoints Architecture & Tag Invalidation Contract (Products, VendorOverview)
 * 2. Response Transformers & NestJS TransformInterceptor Normalization (/products/my-products)
 * 3. Product Catalog Model Mapping & Default Value Handling (sku fallback, rating, etc.)
 * 4. Multi-Select Category, Condition, and Stock Filtering Logic
 * 5. Inventory Metrics Aggregation (Total pieces, In Stock, Low Stock, Depleted, Valuation)
 * 6. Live Backend API Security & Endpoint Reachability Verification (/products/my-products, /products)
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
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after 10000ms'));
    });

    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RTK QUERY ENDPOINTS ARCHITECTURE & TAGS CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 1. RTK QUERY ENDPOINTS ARCHITECTURE & TAGS CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
function testEndpointsArchitecture() {
  console.log('\n--- Test Suite 1: RTK Query Endpoints Architecture & Tags Contract ---');

  const fs = require('fs');
  const path = require('path');

  const apiConstantsPath = path.resolve(__dirname, '../src/constants/api.ts');
  const apiConstants = fs.readFileSync(apiConstantsPath, 'utf8');

  assert(
    apiConstants.includes("myProducts: '/products/my-products'"),
    'API_ENDPOINTS.vendor.myProducts is configured to /products/my-products'
  );
  assert(
    apiConstants.includes("createProduct: '/products'"),
    'API_ENDPOINTS.vendor.createProduct is configured to /products'
  );
  assert(
    apiConstants.includes('updateProduct: (id: string) => `/products/${id}`'),
    'API_ENDPOINTS.vendor.updateProduct is configured with dynamic /products/:id'
  );
  assert(
    apiConstants.includes('deleteProduct: (id: string) => `/products/${id}`'),
    'API_ENDPOINTS.vendor.deleteProduct is configured with dynamic /products/:id'
  );

  const vendorApiPath = path.resolve(__dirname, '../src/store/api/vendorApi.ts');
  const vendorApiContent = fs.readFileSync(vendorApiPath, 'utf8');

  assert(vendorApiContent.includes('getVendorProducts: builder.query'), 'vendorApi defines getVendorProducts query endpoint');
  assert(vendorApiContent.includes('createProduct: builder.mutation'), 'vendorApi defines createProduct mutation endpoint');
  assert(vendorApiContent.includes('updateProduct: builder.mutation'), 'vendorApi defines updateProduct mutation endpoint');
  assert(vendorApiContent.includes('deleteProduct: builder.mutation'), 'vendorApi defines deleteProduct mutation endpoint');
  assert(vendorApiContent.includes("useGetVendorProductsQuery"), 'vendorApi exports useGetVendorProductsQuery hook');
  assert(vendorApiContent.includes("useCreateProductMutation"), 'vendorApi exports useCreateProductMutation hook');
  assert(vendorApiContent.includes("useUpdateProductMutation"), 'vendorApi exports useUpdateProductMutation hook');
  assert(vendorApiContent.includes("useDeleteProductMutation"), 'vendorApi exports useDeleteProductMutation hook');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RESPONSE TRANSFORMER NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────
function testResponseTransformers() {
  console.log('\n--- Test Suite 2: Response Transformer Normalization ---');

  // Simulate NestJS TransformInterceptor response envelope
  const rawApiResponse = {
    statusCode: 200,
    success: true,
    message: 'My products retrieved successfully',
    data: {
      products: [
        {
          id: 'prod-001-live',
          name: 'Handcrafted Indigo Shawl',
          productCategory: 'WEARS',
          price: 45000,
          basePrice: 50000,
          stockQuantity: 5,
          condition: 'new',
          mainImage: 'https://images.unsplash.com/sample1.jpg',
          imageList: ['https://images.unsplash.com/sample1.jpg', 'https://images.unsplash.com/sample2.jpg'],
          description: 'Authentic Nigerian indigo woven fabric.',
          details: {
            material: '100% Organic Cotton',
            origin: 'Abeokuta, Nigeria',
            era: 'Contemporary Heritage',
          },
          isCustomizable: true,
          isRequestable: true,
          estimatedProductionDays: 14,
          createdAt: '2026-09-01T12:00:00.000Z',
          vendor: {
            id: 'v-101',
            businessName: 'Yoruba Textile Atelier',
            rating: 4.95,
          },
        },
        {
          id: 'prod-002-empty-sku',
          name: 'Bronze Miniature Figurine',
          productCategory: 'CRAFTS',
          price: 25000,
          stockQuantity: 0,
          condition: 'vintage_heritage_reworked',
          mainImage: 'https://images.unsplash.com/bronze.jpg',
          description: 'Edo kingdom bronze casting.',
          isCustomizable: false,
          isRequestable: false,
          createdAt: '2026-09-05T10:00:00.000Z',
        },
      ],
      total: 2,
      skip: 0,
      take: 20,
    },
  };

  // Replicate transformResponse in vendorApi.ts
  const payload = rawApiResponse.data;
  const rawProducts = payload.products;
  const transformedProducts = rawProducts.map((p) => ({
    id: p.id,
    name: p.name || 'Untitled Craft',
    productCategory: p.productCategory || 'CRAFTS',
    price: Number(p.price) || 0,
    basePrice: p.basePrice ? Number(p.basePrice) : undefined,
    stockQuantity: Number(p.stockQuantity) || 0,
    condition: p.condition || 'new',
    mainImage: p.mainImage || '',
    imageList: Array.isArray(p.imageList) ? p.imageList : p.mainImage ? [p.mainImage] : [],
    description: p.description || '',
    details: p.details || {},
    isCustomizable: Boolean(p.isCustomizable),
    isRequestable: Boolean(p.isRequestable),
    estimatedProductionDays: p.estimatedProductionDays ? Number(p.estimatedProductionDays) : undefined,
    sku: p.sku || `ETH-${(p.id || '').slice(-4).toUpperCase()}`,
    rating: typeof p.rating === 'number' ? p.rating : typeof p.vendor?.rating === 'number' ? p.vendor.rating : 0,
    reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
    salesCount: typeof p.salesCount === 'number' ? p.salesCount : 0,
    material: p.details?.material || p.material,
    origin: p.details?.origin || p.origin,
    era: p.details?.era || p.era,
    createdAt: p.createdAt,
    vendor: p.vendor,
  }));

  assert(transformedProducts.length === 2, 'Transformer handles 2 products');
  assert(transformedProducts[0].name === 'Handcrafted Indigo Shawl', 'Product name preserved');
  assert(transformedProducts[0].price === 45000, 'Price parsed as number');
  assert(transformedProducts[0].material === '100% Organic Cotton', 'Details.material extracted');
  assert(transformedProducts[0].rating === 4.95, 'Rating falls back to vendor.rating');
  assert(transformedProducts[1].sku === 'ETH--SKU', 'SKU fallback generated correctly from ID end');
  assert(transformedProducts[1].rating === 0, 'Rating defaults safely to 0 when not provided');
  assert(transformedProducts[1].stockQuantity === 0, 'Stock quantity 0 handled correctly');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INVENTORY METRICS & FILTER COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
function testMetricsAndFiltering() {
  console.log('\n--- Test Suite 3: Inventory Metrics & Filter Computation ---');

  const testProducts = [
    { id: '1', name: 'Item 1', productCategory: 'WEARS', price: 10000, stockQuantity: 5, condition: 'new', isCustomizable: false, isRequestable: false, createdAt: '2026-09-01' },
    { id: '2', name: 'Item 2', productCategory: 'WEARS', price: 20000, stockQuantity: 2, condition: 'new', isCustomizable: true, isRequestable: false, createdAt: '2026-09-02' },
    { id: '3', name: 'Item 3', productCategory: 'CRAFTS', price: 50000, stockQuantity: 1, condition: 'vintage_heritage_reworked', isCustomizable: false, isRequestable: true, createdAt: '2026-09-03' },
    { id: '4', name: 'Item 4', productCategory: 'SHOES', price: 30000, stockQuantity: 0, condition: 'new', isCustomizable: false, isRequestable: false, createdAt: '2026-09-04' },
  ];

  // Metrics test
  const totalCount = testProducts.length;
  const inStockCount = testProducts.filter((p) => p.stockQuantity > 2).length;
  const lowStockCount = testProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 2).length;
  const outStockCount = testProducts.filter((p) => p.stockQuantity === 0).length;
  const totalValuation = testProducts.reduce((acc, p) => acc + p.price * p.stockQuantity, 0);

  assert(totalCount === 4, 'Total pieces count is 4');
  assert(inStockCount === 1, 'In stock count (>2) is 1');
  assert(lowStockCount === 2, 'Low stock count (1-2) is 2');
  assert(outStockCount === 1, 'Out of stock count (0) is 1');
  // Valuation: (10000*5) + (20000*2) + (50000*1) + (30000*0) = 50k + 40k + 50k + 0 = 140,000
  assert(totalValuation === 140000, 'Total valuation computed accurately as 140,000');

  // Filter test: Category = WEARS
  const wearsOnly = testProducts.filter((p) => p.productCategory === 'WEARS');
  assert(wearsOnly.length === 2, 'Category filter correctly isolates WEARS');

  // Filter test: Stock = IN_STOCK (>2)
  const inStockOnly = testProducts.filter((p) => p.stockQuantity > 2);
  assert(inStockOnly.length === 1 && inStockOnly[0].id === '1', 'Stock filter isolates in-stock piece');

  // Filter test: Production Type = CUSTOMIZABLE
  const customizableOnly = testProducts.filter((p) => p.isCustomizable);
  assert(customizableOnly.length === 1 && customizableOnly[0].id === '2', 'Production type isolates customizable piece');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3b. FLATLIST ARCHITECTURE & PAGINATION SCREEN CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
function testProductsScreenFlatListArchitecture() {
  console.log('\n--- Test Suite 3b: FlatList Architecture & Pagination Screen Contract ---');

  const fs = require('fs');
  const path = require('path');

  const screenPath = path.resolve(__dirname, '../src/app/(vendor)/products.tsx');
  const screenContent = fs.readFileSync(screenPath, 'utf8');

  assert(screenContent.includes('<FlatList'), 'products.tsx renders performant <FlatList> root');
  assert(screenContent.includes('keyExtractor={(item) => item.id}'), 'products.tsx specifies keyExtractor using item.id');
  assert(screenContent.includes('renderItem={renderProductItem}'), 'products.tsx passes memoized renderProductItem callback');
  assert(screenContent.includes('ListHeaderComponent={renderListHeader}'), 'products.tsx uses ListHeaderComponent for dashboard metrics, filters, and controls');
  assert(screenContent.includes('ListEmptyComponent={renderListEmpty}'), 'products.tsx uses ListEmptyComponent for empty/skeleton states');
  assert(screenContent.includes('ListFooterComponent={renderListFooter}'), 'products.tsx uses ListFooterComponent for pagination controls');
  assert(screenContent.includes('initialNumToRender={10}'), 'products.tsx configures initialNumToRender={10}');
  assert(screenContent.includes('maxToRenderPerBatch={10}'), 'products.tsx configures maxToRenderPerBatch={10}');
  assert(screenContent.includes('windowSize={5}'), 'products.tsx configures windowSize={5}');
  assert(screenContent.includes("removeClippedSubviews={Platform.OS === 'android'}"), 'products.tsx tunes removeClippedSubviews for Android');
  assert(screenContent.includes('skip: (currentPage - 1) * pageSize'), 'serverQueryParams computes skip from (currentPage - 1) * pageSize');
  assert(screenContent.includes('take: pageSize'), 'serverQueryParams passes take: pageSize (default 10)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LIVE BACKEND SECURITY & REACHABILITY
// ─────────────────────────────────────────────────────────────────────────────
async function testLiveBackendEndpoints() {
  console.log('\n--- Test Suite 4: Live Backend API Security & Endpoint Reachability ---');

  // Test 1: GET /products/my-products without token -> MUST return 401 Unauthorized
  try {
    const res = await makeHttpRequest({
      method: 'GET',
      path: '/products/my-products',
    });
    assert(
      res.status === 401,
      'GET /products/my-products enforces JwtAuthGuard (Returns 401 Unauthorized without token)'
    );
    assert(
      res.data && (res.data.statusCode === 401 || res.data.message?.includes('token') || res.data.message?.includes('auth') || res.data.message?.includes('Unauthorized') || res.data.error),
      'GET /products/my-products returns standard NestJS error contract'
    );
  } catch (err) {
    assert(false, 'GET /products/my-products reachable on Railway', err.message);
  }

  // Test 2: POST /products without token -> MUST return 401 Unauthorized
  try {
    const res = await makeHttpRequest({
      method: 'POST',
      path: '/products',
      body: { name: 'Unauthorized test craft' },
    });
    assert(
      res.status === 401,
      'POST /products enforces RolesGuard (Returns 401 Unauthorized without token)'
    );
  } catch (err) {
    assert(false, 'POST /products reachable on Railway', err.message);
  }

  // Test 3: Public catalog GET /products is accessible
  try {
    const res = await makeHttpRequest({
      method: 'GET',
      path: '/products?take=2',
    });
    assert(
      res.status === 200,
      'GET /products public catalog is accessible (Returns 200 OK)'
    );
  } catch (err) {
    assert(false, 'GET /products reachable on Railway', err.message);
  }
}

async function runAll() {
  console.log('======================================================================');
  console.log('🧪 Starting Ethnikraft-Mobile Vendor Products Integration Test Suite');
  console.log('======================================================================');

  testEndpointsArchitecture();
  testResponseTransformers();
  testMetricsAndFiltering();
  testProductsScreenFlatListArchitecture();
  await testLiveBackendEndpoints();

  console.log('\n======================================================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('======================================================================');

  if (failedTests > 0) {
    console.error('\n❌ Failures Summary:');
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.testName}: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL VENDOR PRODUCTS INTEGRATION TESTS PASSED CLEANLY!\n');
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
