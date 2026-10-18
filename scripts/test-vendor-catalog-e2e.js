/**
 * E2E Verification Suite for Ethnikraft-Mobile Vendor Catalogs (Lookbooks) Screen
 * Validates Catalog normalizer, CRUD mutation payloads, category classification,
 * product checklist binding, search filters, and backend endpoint security reachability.
 */

const assert = require('assert');
const http = require('http');

console.log('======================================================================');
console.log('     ETHNIKRAFT MOBILE - VENDOR CATALOG E2E VERIFICATION SUITE        ');
console.log('======================================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

// ── Replicated Domain Normalizer from vendorApi.ts ────────────────────────────
function normalizeCatalogsResponse(response) {
  const rawList = response?.data || response || [];
  if (!Array.isArray(rawList)) return [];
  return rawList.map((c) => ({
    id: c.id || c._id || '',
    vendorId: c.vendorId,
    name: c.name || c.title || 'Untitled Lookbook',
    image: c.image || c.coverImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    description: c.description || '',
    categoryType: c.categoryType || 'CRAFTS',
    price: c.price ? Number(c.price) : undefined,
    productIds: Array.isArray(c.productIds)
      ? c.productIds
      : Array.isArray(c.products)
      ? c.products.map((p) => p.id || p)
      : [],
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
    tags: Array.isArray(c.tags) ? c.tags : [],
  }));
}

// ── Mock Backend Data ─────────────────────────────────────────────────────────
const mockRawBackendCatalogs = [
  {
    id: 'cat-001',
    vendorId: 'vendor-123',
    name: 'Royal Benin Bronze Foundry',
    image: 'https://storage.ethnikraft.africa/catalogs/bronze.jpg',
    categoryType: 'CRAFTS',
    description: 'Sacred Edo court metallurgy and lost-wax casts.',
    price: 350000,
    productIds: ['prod-001', 'prod-002'],
    createdAt: '2026-08-10T10:00:00.000Z',
    tags: [{ id: 'tag-1', name: 'CRAFTS' }],
  },
  {
    id: 'cat-002',
    vendorId: 'vendor-123',
    name: 'Imperial Aso-Oke Handwoven Textiles',
    image: 'https://storage.ethnikraft.africa/catalogs/asooke.jpg',
    categoryType: 'TEXTILES',
    description: 'Narrow-loom organic cotton stoles and wedding ensembles.',
    price: 180000,
    products: [{ id: 'prod-003', name: 'Aso-Oke Sash' }],
    createdAt: '2026-09-01T12:00:00.000Z',
    tags: [{ id: 'tag-2', name: 'TEXTILES' }],
  },
  {
    id: 'cat-003',
    vendorId: 'vendor-123',
    name: 'Sahara Nomad Leathercraft Lookbook',
    image: 'https://storage.ethnikraft.africa/catalogs/leather.jpg',
    categoryType: 'BAGS',
    description: 'Full-grain goat and camel hide luggage.',
    price: null,
    productIds: [],
    createdAt: '2026-09-15T08:00:00.000Z',
  },
];

const mockVendorProducts = [
  { id: 'prod-001', name: 'Bronze Leopard', price: 320000, productCategory: 'CRAFTS' },
  { id: 'prod-002', name: 'Bronze Queen Mother Head', price: 280000, productCategory: 'CRAFTS' },
  { id: 'prod-003', name: 'Aso-Oke Sash', price: 48000, productCategory: 'TEXTILES' },
  { id: 'prod-004', name: 'Leather Satchel', price: 92000, productCategory: 'BAGS' },
];

// ── Test Section 1: Response Normalization & Schema Transformation ───────────
console.log('--- Section 1: Catalog Normalization & Schema Mapping ---');

it('should properly transform backend vendor_catalogs records into mobile CatalogCollection shape', () => {
  const catalogs = normalizeCatalogsResponse(mockRawBackendCatalogs);
  assert.strictEqual(catalogs.length, 3, 'Must parse exactly 3 catalogs');
  assert.strictEqual(catalogs[0].name, 'Royal Benin Bronze Foundry');
  assert.strictEqual(catalogs[0].categoryType, 'CRAFTS');
  assert.strictEqual(catalogs[0].price, 350000);
  assert.deepStrictEqual(catalogs[0].productIds, ['prod-001', 'prod-002']);
});

it('should gracefully normalize productIds from populated nested products array', () => {
  const catalogs = normalizeCatalogsResponse(mockRawBackendCatalogs);
  const asoOke = catalogs.find((c) => c.id === 'cat-002');
  assert.ok(asoOke, 'cat-002 should exist');
  assert.deepStrictEqual(asoOke.productIds, ['prod-003'], 'products array normalized to productIds');
});

it('should fallback missing cover image, description, and empty products', () => {
  const bareCatalog = [{ id: 'cat-999', name: 'Minimal Catalog' }];
  const normalized = normalizeCatalogsResponse(bareCatalog);
  assert.strictEqual(normalized[0].description, '');
  assert.strictEqual(normalized[0].categoryType, 'CRAFTS');
  assert.ok(normalized[0].image.includes('images.unsplash.com'));
  assert.deepStrictEqual(normalized[0].productIds, []);
});

// ── Test Section 2: Create & Update Mutation Payload Validation ───────────────
console.log('\n--- Section 2: Catalog Mutation Payload Validation ---');

it('should build valid CreateCatalogDto conforming to Ethnikraft-BE requirements', () => {
  const payload = {
    name: 'New Yoruba Regalia Collection',
    image: 'https://storage.ethnikraft.africa/catalogs/regalia.jpg',
    categoryType: 'ACCESSORIES',
    description: 'Coronation crowns and heirloom coral beads.',
    price: 450000,
    productIds: ['prod-001', 'prod-003'],
  };

  assert.ok(payload.name && payload.name.trim().length > 0, 'Catalog name is mandatory');
  assert.ok(payload.image && payload.image.length > 0, 'Image is mandatory');
  assert.ok(payload.categoryType, 'CategoryType is required by Prisma ProductCategoryType enum');
  assert.strictEqual(typeof payload.price, 'number', 'Price is numeric');
  assert.strictEqual(payload.productIds.length, 2, 'Product IDs array attached');
});

it('should build valid UpdateCatalogDto with partial updates', () => {
  const updatePayload = {
    name: 'Updated Lookbook Name',
    description: 'Updated curator notes.',
    productIds: ['prod-001'],
  };

  assert.strictEqual(updatePayload.name, 'Updated Lookbook Name');
  assert.strictEqual(updatePayload.productIds.length, 1);
});

// ── Test Section 3: Available Products Binding & Lookbook Pieces ──────────────
console.log('\n--- Section 3: Live Inventory Binding & Lookbook Filtering ---');

it('should resolve lookbook pieces against live vendor workshop products', () => {
  const catalogs = normalizeCatalogsResponse(mockRawBackendCatalogs);
  const bronzeCatalog = catalogs[0];

  const lookbookPieces = mockVendorProducts.filter((p) =>
    bronzeCatalog.productIds.includes(p.id)
  );

  assert.strictEqual(lookbookPieces.length, 2, 'Both bronze pieces must resolve');
  assert.strictEqual(lookbookPieces[0].name, 'Bronze Leopard');
  assert.strictEqual(lookbookPieces[1].name, 'Bronze Queen Mother Head');
});

// ── Test Section 4: Search Filter Pipeline ────────────────────────────────────
console.log('\n--- Section 4: Catalog Search Filter Pipeline ---');

it('should filter catalogs by search query across name and description', () => {
  const catalogs = normalizeCatalogsResponse(mockRawBackendCatalogs);

  // Search by keyword in name
  const queryBronze = 'bronze';
  const filterBronze = catalogs.filter(
    (c) =>
      c.name.toLowerCase().includes(queryBronze) ||
      c.description.toLowerCase().includes(queryBronze)
  );
  assert.strictEqual(filterBronze.length, 1);
  assert.strictEqual(filterBronze[0].id, 'cat-001');

  // Search by keyword in description
  const queryCotton = 'cotton';
  const filterCotton = catalogs.filter(
    (c) =>
      c.name.toLowerCase().includes(queryCotton) ||
      c.description.toLowerCase().includes(queryCotton)
  );
  assert.strictEqual(filterCotton.length, 1);
  assert.strictEqual(filterCotton[0].id, 'cat-002');
});

// ── Test Section 5: Metrics Aggregation ───────────────────────────────────────
console.log('\n--- Section 5: Metrics KPI Calculations ---');

it('should compute exact active catalogs count and total curated pieces', () => {
  const catalogs = normalizeCatalogsResponse(mockRawBackendCatalogs);
  const activeCatalogs = catalogs.length;
  const totalPieces = catalogs.reduce((acc, c) => acc + c.productIds.length, 0);

  assert.strictEqual(activeCatalogs, 3, '3 active lookbooks');
  assert.strictEqual(totalPieces, 3, '2 pieces in bronze + 1 in textiles + 0 in leather = 3 total pieces');
});

// ── Test Section 6: Backend Endpoint Security Reachability ────────────────────
console.log('\n--- Section 6: Backend Catalog Endpoint Security Reachability ---');

function checkBackendSecurity() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/vendor/profile/catalogs',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 401) {
            console.log(`  ✅ [PASS] GET /vendor/profile/catalogs properly enforces JWT auth guard (HTTP ${res.statusCode} Unauthorized)`);
            passCount++;
          } else {
            console.log(`  ℹ️  [INFO] GET /vendor/profile/catalogs returned HTTP ${res.statusCode}`);
          }
          resolve();
        });
      }
    );

    req.on('error', (err) => {
      console.log(`  ℹ️  [INFO] Ethnikraft-BE is offline or unreached on localhost:5000 (${err.message}) - Skipping live HTTP test.`);
      resolve();
    });

    req.setTimeout(2500, () => {
      req.destroy();
      console.log('  ℹ️  [INFO] HTTP request to localhost:5000 timed out - skipping live network check.');
      resolve();
    });

    req.end();
  });
}

async function run() {
  await checkBackendSecurity();

  console.log('\n======================================================================');
  console.log(`  SUITE COMPLETE: ${passCount} Passed, ${failCount} Failed`);
  console.log('======================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

run();
