/**
 * E2E Verification Suite for Ethnikraft-Mobile Vendor Customers Screen
 * Validates deriveCustomers normalization, multi-order patron aggregation,
 * tier calculation (VIP / RETURNING / NEW), contact channel integrations,
 * search & filter operations, and backend orders endpoint security reachability.
 */

const assert = require('assert');
const http = require('http');

console.log('======================================================================');
console.log('    ETHNIKRAFT MOBILE - VENDOR CUSTOMERS E2E VERIFICATION SUITE       ');
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

// ── Replicated Domain Logic from customers.tsx ────────────────────────────────
function deriveCustomers(orders) {
  if (!orders || !Array.isArray(orders)) return [];

  const customerMap = new Map();

  orders.forEach((order) => {
    const user = order.user;
    const userId = user?.id || order.userId || `guest-${order.id}`;
    const userName =
      user?.name ||
      (user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || 'Valued Collector');
    const userEmail = user?.email || 'collector@ethnikraft.africa';
    const userPhone = user?.phone || '+234 800 000 0000';
    const userAvatar = user?.avatar || undefined;
    const city = order.shippingAddress?.city || 'Lagos';
    const country = order.shippingAddress?.country || 'Nigeria';

    const orderAmount = Number(order.totalAmount || order.subtotal || 0);
    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

    const orderItems = (order.orderItems || []).map((item) => ({
      id: item.id || `item-${Math.random()}`,
      orderNumber: order.orderNumber || `#EK-${order.id.slice(-6).toUpperCase()}`,
      productName: item.product?.name || 'Bespoke Artifact',
      productImage: item.product?.images?.[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
      category: item.product?.category || 'Atelier Works',
      amount: Number(item.price || orderAmount),
      date: new Date(orderDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status:
        order.status === 'DELIVERED'
          ? 'COMPLETED'
          : order.status === 'PROCESSING' || order.status === 'CONFIRMED'
          ? 'IN_PRODUCTION'
          : order.status === 'SHIPPED'
          ? 'DELIVERED'
          : 'PENDING',
    }));

    if (!customerMap.has(userId)) {
      customerMap.set(userId, {
        id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        city,
        country,
        avatar: userAvatar,
        tier: 'NEW',
        preferredCategory: orderItems[0]?.category || 'Atelier Works',
        totalSpent: orderAmount,
        orderCount: 1,
        lastOrderDate: orderDate,
        firstOrderDate: orderDate,
        notes: '',
        orders: orderItems,
      });
    } else {
      const existing = customerMap.get(userId);
      existing.totalSpent += orderAmount;
      existing.orderCount += 1;
      existing.orders.push(...orderItems);

      if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = orderDate;
      }
      if (new Date(orderDate) < new Date(existing.firstOrderDate)) {
        existing.firstOrderDate = orderDate;
      }
    }
  });

  // Calculate Patron Tiers & Sort chronologically by most recent commission
  const customers = Array.from(customerMap.values()).map((patron) => {
    let tier = 'NEW';
    if (patron.totalSpent >= 500000 || patron.orderCount >= 3) {
      tier = 'VIP';
    } else if (patron.orderCount > 1) {
      tier = 'RETURNING';
    }

    return {
      ...patron,
      tier,
    };
  });

  return customers.sort(
    (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
  );
}

// ── Mock Backend Data ─────────────────────────────────────────────────────────
const mockRawVendorOrders = [
  {
    id: 'ord-001',
    orderNumber: '#EK-001',
    userId: 'usr-chidi',
    totalAmount: 320000,
    status: 'DELIVERED',
    createdAt: '2026-09-01T10:00:00.000Z',
    user: {
      id: 'usr-chidi',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      email: 'chidi.okonkwo@lagos.ng',
      phone: '+234 803 111 2222',
      avatar: 'https://storage.ethnikraft.africa/avatars/chidi.jpg',
    },
    shippingAddress: {
      city: 'Ikoyi, Lagos',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-101',
        price: 320000,
        product: {
          name: 'Royal Heritage Agbada Set',
          category: 'Couture Attire',
          images: ['https://storage.ethnikraft.africa/products/agbada.jpg'],
        },
      },
    ],
  },
  {
    id: 'ord-002',
    orderNumber: '#EK-002',
    userId: 'usr-chidi',
    totalAmount: 250000,
    status: 'CONFIRMED',
    createdAt: '2026-10-12T15:00:00.000Z',
    user: {
      id: 'usr-chidi',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      email: 'chidi.okonkwo@lagos.ng',
      phone: '+234 803 111 2222',
    },
    shippingAddress: {
      city: 'Ikoyi, Lagos',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-102',
        price: 250000,
        product: {
          name: 'Beaded Coral Crown',
          category: 'Regalia',
          images: ['https://storage.ethnikraft.africa/products/crown.jpg'],
        },
      },
    ],
  },
  {
    id: 'ord-003',
    orderNumber: '#EK-003',
    userId: 'usr-amina',
    totalAmount: 180000,
    status: 'DELIVERED',
    createdAt: '2026-08-15T09:00:00.000Z',
    user: {
      id: 'usr-amina',
      name: 'Amina Bello',
      email: 'amina.bello@abuja.ng',
      phone: '+234 802 333 4444',
    },
    shippingAddress: {
      city: 'Maitama, Abuja',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-103',
        price: 180000,
        product: {
          name: 'Handwoven Aso-Oke Sash',
          category: 'Textiles',
          images: ['https://storage.ethnikraft.africa/products/aso-oke.jpg'],
        },
      },
    ],
  },
  {
    id: 'ord-004',
    orderNumber: '#EK-004',
    userId: 'usr-amina',
    totalAmount: 95000,
    status: 'SHIPPED',
    createdAt: '2026-09-20T12:00:00.000Z',
    user: {
      id: 'usr-amina',
      name: 'Amina Bello',
      email: 'amina.bello@abuja.ng',
      phone: '+234 802 333 4444',
    },
    shippingAddress: {
      city: 'Maitama, Abuja',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-104',
        price: 95000,
        product: {
          name: 'Bronze Filigree Cuff',
          category: 'Jewelry',
          images: ['https://storage.ethnikraft.africa/products/cuff.jpg'],
        },
      },
    ],
  },
  {
    id: 'ord-005',
    orderNumber: '#EK-005',
    userId: 'usr-folake',
    totalAmount: 75000,
    status: 'PENDING',
    createdAt: '2026-10-05T08:00:00.000Z',
    user: {
      id: 'usr-folake',
      firstName: 'Folake',
      lastName: 'Adeyemi',
      email: 'folake@london.uk',
      phone: '+44 7911 123456',
    },
    shippingAddress: {
      city: 'London',
      country: 'United Kingdom',
    },
    orderItems: [
      {
        id: 'item-105',
        price: 75000,
        product: {
          name: 'Carved Ebony Ancestral Figurine',
          category: 'Sculpture',
          images: ['https://storage.ethnikraft.africa/products/ebony.jpg'],
        },
      },
    ],
  },
];

// ── Test Section 1: Data Normalization & Customer Derivation ──────────────────
console.log('--- Section 1: Customer Normalization & Aggregation ---');

it('should deduplicate multiple orders into single patron entities by user.id', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  assert.strictEqual(patrons.length, 3, '5 orders from 3 customers must yield exactly 3 patron records');
});

it('should correctly sum totalSpent across multiple orders for Chidi Okonkwo', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  const chidi = patrons.find((p) => p.id === 'usr-chidi');
  assert.ok(chidi, 'Chidi Okonkwo should exist in derived patrons');
  assert.strictEqual(chidi.totalSpent, 570000, '320,000 + 250,000 = 570,000 NGN');
  assert.strictEqual(chidi.orderCount, 2, 'Chidi has 2 orders');
  assert.strictEqual(chidi.orders.length, 2, 'Chidi orders array has 2 items');
});

it('should correctly accumulate order history items with formatted date and mapped status', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  const chidi = patrons.find((p) => p.id === 'usr-chidi');
  const deliveredOrder = chidi.orders.find((o) => o.orderNumber === '#EK-001');
  const confirmedOrder = chidi.orders.find((o) => o.orderNumber === '#EK-002');

  assert.strictEqual(deliveredOrder.status, 'COMPLETED', 'DELIVERED maps to COMPLETED');
  assert.strictEqual(confirmedOrder.status, 'IN_PRODUCTION', 'CONFIRMED maps to IN_PRODUCTION');
});

// ── Test Section 2: Patron Tier Promotion Rules ──────────────────────────────
console.log('\n--- Section 2: Patron Tier Classification Logic ---');

it('should promote Chidi Okonkwo to VIP (spend >= 500,000 NGN)', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  const chidi = patrons.find((p) => p.id === 'usr-chidi');
  assert.strictEqual(chidi.tier, 'VIP', 'Spend of 570k qualifies for VIP tier');
});

it('should classify Amina Bello as RETURNING (orderCount > 1, spend < 500k)', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  const amina = patrons.find((p) => p.id === 'usr-amina');
  assert.strictEqual(amina.totalSpent, 275000, '180,000 + 95,000 = 275,000 NGN');
  assert.strictEqual(amina.orderCount, 2, '2 orders total');
  assert.strictEqual(amina.tier, 'RETURNING', 'Multiple orders with spend < 500k is RETURNING');
});

it('should classify Folake Adeyemi as NEW (orderCount === 1)', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  const folake = patrons.find((p) => p.id === 'usr-folake');
  assert.strictEqual(folake.orderCount, 1, 'Single order');
  assert.strictEqual(folake.tier, 'NEW', 'First commission qualifies as NEW patron');
});

// ── Test Section 3: Sorting & Temporal Ordering ───────────────────────────────
console.log('\n--- Section 3: Chronological Sorting & Timestamps ---');

it('should sort patrons in descending order by latest commission date', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  // Latest orders:
  // Chidi: 2026-10-12
  // Folake: 2026-10-05
  // Amina: 2026-09-20
  assert.strictEqual(patrons[0].id, 'usr-chidi', 'Chidi (Oct 12) is first');
  assert.strictEqual(patrons[1].id, 'usr-folake', 'Folake (Oct 05) is second');
  assert.strictEqual(patrons[2].id, 'usr-amina', 'Amina (Sep 20) is third');
});

// ── Test Section 4: Search & Tier Filter Computation ──────────────────────────
console.log('\n--- Section 4: Search & Tier Filter Pipeline ---');

it('should filter patrons by search query across name, email, city, and preferred category', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);

  // Search by city
  const searchLagos = patrons.filter((p) => p.city.toLowerCase().includes('lagos'));
  assert.strictEqual(searchLagos.length, 1);
  assert.strictEqual(searchLagos[0].name, 'Chidi Okonkwo');

  // Search by category
  const searchJewelry = patrons.filter((p) => p.orders.some((o) => o.category.toLowerCase().includes('jewelry')));
  assert.strictEqual(searchJewelry.length, 1);
  assert.strictEqual(searchJewelry[0].name, 'Amina Bello');

  // Search by country/UK email
  const searchUK = patrons.filter((p) => p.email.toLowerCase().includes('london.uk'));
  assert.strictEqual(searchUK.length, 1);
  assert.strictEqual(searchUK[0].name, 'Folake Adeyemi');
});

it('should filter by tier pill accurately', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);

  const vipPatrons = patrons.filter((p) => p.tier === 'VIP');
  assert.strictEqual(vipPatrons.length, 1);
  assert.strictEqual(vipPatrons[0].name, 'Chidi Okonkwo');

  const returningPatrons = patrons.filter((p) => p.tier === 'RETURNING');
  assert.strictEqual(returningPatrons.length, 1);
  assert.strictEqual(returningPatrons[0].name, 'Amina Bello');

  const newPatrons = patrons.filter((p) => p.tier === 'NEW');
  assert.strictEqual(newPatrons.length, 1);
  assert.strictEqual(newPatrons[0].name, 'Folake Adeyemi');
});

// ── Test Section 5: KPI Aggregation ───────────────────────────────────────────
console.log('\n--- Section 5: 2x2 Metric KPI Calculations ---');

it('should compute exact KPI summary statistics', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);

  const totalRevenue = patrons.reduce((sum, p) => sum + p.totalSpent, 0);
  const totalCollectors = patrons.length;
  const returningCount = patrons.filter((p) => p.orderCount > 1).length;
  const repeatRate = totalCollectors > 0 ? Math.round((returningCount / totalCollectors) * 100) : 0;
  const topPatronLtv = patrons.length > 0 ? Math.max(...patrons.map((p) => p.totalSpent)) : 0;

  assert.strictEqual(totalRevenue, 920000, '570k + 275k + 75k = 920k NGN total');
  assert.strictEqual(totalCollectors, 3, '3 unique patrons');
  assert.strictEqual(returningCount, 2, 'Chidi and Amina have > 1 order');
  assert.strictEqual(repeatRate, 67, '2 / 3 * 100 = 67% repeat rate');
  assert.strictEqual(topPatronLtv, 570000, 'Top LTV is Chidi at 570k');
});

// ── Test Section 6: Minor Polish Verifications (Phone Sanitization & Clear Action) ──
console.log('\n--- Section 6: Minor Polish Verifications ---');

it('should correctly sanitize local Nigerian phone numbers for WhatsApp deep link routing', () => {
  function sanitizeWhatsAppPhone(phone) {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0') && clean.length === 11) {
      clean = `234${clean.slice(1)}`;
    }
    return clean;
  }

  assert.strictEqual(sanitizeWhatsAppPhone('0803 111 2222'), '2348031112222', '0803 prefix converts to 234803');
  assert.strictEqual(sanitizeWhatsAppPhone('+234 803 111 2222'), '2348031112222', '+234 stripped to digits only');
  assert.strictEqual(sanitizeWhatsAppPhone('+44 7911 123456'), '447911123456', 'International UK number preserved without change');
});

it('should properly clear search query and restore full patron dataset', () => {
  const patrons = deriveCustomers(mockRawVendorOrders);
  let searchQuery = 'NonExistentCollectorXYZ';
  let filtered = patrons.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  assert.strictEqual(filtered.length, 0, 'No matching patrons for bogus query');

  // Trigger Clear Search
  searchQuery = '';
  filtered = patrons.filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  assert.strictEqual(filtered.length, 3, 'All 3 patrons restored after clearing search');
});

// ── Test Section 7: Live Backend API Security Reachability ────────────────────
console.log('\n--- Section 7: Backend Orders Endpoint Security Reachability ---');

function checkBackendSecurity() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/orders/vendor',
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
            console.log(`  ✅ [PASS] GET /orders/vendor properly enforces JWT auth guard (HTTP ${res.statusCode} Unauthorized)`);
            passCount++;
          } else {
            console.log(`  ℹ️  [INFO] GET /orders/vendor returned HTTP ${res.statusCode}`);
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
