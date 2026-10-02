import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Clothing Listings & Marketplace API Suite', () => {
  const ownerUser = {
    name: 'Listing Owner',
    email: 'owner@swapwear.com',
    password: 'OwnerPassword123!',
  };

  const otherUser = {
    name: 'Other User',
    email: 'other@swapwear.com',
    password: 'OtherPassword123!',
  };

  let ownerCookie: string;
  let otherCookie: string;
  let createdListingId: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, otherUser.email] } },
    });

    // Register owner
    const regOwner = await request(app)
      .post('/api/auth/register')
      .send(ownerUser);
    ownerCookie = (regOwner.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;

    // Register other user
    const regOther = await request(app)
      .post('/api/auth/register')
      .send(otherUser);
    otherCookie = (regOther.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;

    await prisma.user.update({
      where: { email: ownerUser.email },
      data: { city: 'Seattle', state: 'Washington' },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, otherUser.email] } },
    });
    await prisma.$disconnect();
  });

  const validListingPayload = {
    title: 'Vintage Denim Jacket',
    description: 'Classic 90s oversized denim jacket in great condition.',
    category: 'OUTERWEAR',
    brand: 'Levi\'s',
    color: 'Indigo',
    size: 'L',
    condition: 'LIKE_NEW',
    estimatedSwapValue: 45.0,
    imageUrls: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0.jpg'],
  };

  it('1. Unauthenticated user cannot create listing (401)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .send(validListingPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. Authenticated user can create listing (201)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Cookie', ownerCookie)
      .send(validListingPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing).toBeDefined();
    expect(res.body.data.listing.title).toBe(validListingPayload.title);
    expect(res.body.data.listing.category).toBe('OUTERWEAR');
    expect(res.body.data.listing.color).toBe('Indigo');
    expect(res.body.data.listing.images.length).toBe(1);

    createdListingId = res.body.data.listing.id;
  });

  it('3. Invalid listing data is rejected (400)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Cookie', ownerCookie)
      .send({
        title: 'AB', // too short
        category: 'INVALID_CATEGORY',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. Image constraints are enforced (invalid URL rejected with 400)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Cookie', ownerCookie)
      .send({
        ...validListingPayload,
        imageUrls: ['not-a-valid-url'],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('5. GET /api/listings returns paginated listings', async () => {
    const res = await request(app).get('/api/listings');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('6. Phase 3 Search: GET /api/listings?search=Denim returns matching listings', async () => {
    const res = await request(app).get('/api/listings?search=Denim');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.data[0].title).toMatch(/Denim/i);
  });

  it('6a. Phase 3 Search matches category names', async () => {
    const res = await request(app).get('/api/listings?search=outerwear');

    expect(res.status).toBe(200);
    expect(res.body.data.data.some((item: any) => item.category === 'OUTERWEAR')).toBe(true);
  });

  it('7. Phase 3 Category Filter: GET /api/listings?category=OUTERWEAR returns category items', async () => {
    const res = await request(app).get('/api/listings?category=OUTERWEAR');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.every((item: any) => item.category === 'OUTERWEAR')).toBe(true);
  });

  it('8. Phase 3 Brand & Size Filter: GET /api/listings?brand=Levi&size=L', async () => {
    const res = await request(app).get('/api/listings?brand=Levi&size=L');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  it('8a. Phase 3 Condition and location filters match listing data', async () => {
    const [conditionRes, locationRes] = await Promise.all([
      request(app).get('/api/listings?condition=LIKE_NEW'),
      request(app).get('/api/listings?location=Seattle'),
    ]);

    expect(conditionRes.status).toBe(200);
    expect(conditionRes.body.data.data.some((item: any) => item.condition === 'LIKE_NEW')).toBe(true);
    expect(locationRes.status).toBe(200);
    expect(locationRes.body.data.data.some((item: any) => item.owner.city === 'Seattle')).toBe(true);
  });

  it('8b. Phase 3 Availability supports an explicit all-status query', async () => {
    const res = await request(app).get('/api/listings?status=ALL');

    expect(res.status).toBe(200);
    expect(res.body.data.data.some((item: any) => item.id === createdListingId)).toBe(true);
  });

  it('9. Phase 3 Value Filter: GET /api/listings?minValue=10&maxValue=100', async () => {
    const res = await request(app).get('/api/listings?minValue=10&maxValue=100');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.every((item: any) => item.estimatedSwapValue >= 10 && item.estimatedSwapValue <= 100)).toBe(true);
  });

  it('10. Phase 3 Sorting & Pagination: GET /api/listings?sort=price_asc&page=1&limit=5', async () => {
    const res = await request(app).get('/api/listings?sort=price_asc&page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.pageSize).toBe(5);
  });

  it('11. GET /api/listings/:id returns listing details with images and owner safe info', async () => {
    const res = await request(app).get(`/api/listings/${createdListingId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing.id).toBe(createdListingId);
    expect(res.body.data.listing.owner).toBeDefined();
    expect(res.body.data.listing.owner.name).toBe(ownerUser.name);
    expect(res.body.data.listing.owner.passwordHash).toBeUndefined();
  });

  it('12. Invalid listing ID returns 404 Not Found', async () => {
    const res = await request(app).get('/api/listings/invalid-uuid-999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('13. User CANNOT update another user\'s listing (403)', async () => {
    const res = await request(app)
      .patch(`/api/listings/${createdListingId}`)
      .set('Cookie', otherCookie) // wrong user
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('14. User CAN update own listing (200)', async () => {
    const res = await request(app)
      .patch(`/api/listings/${createdListingId}`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Updated Vintage Denim Jacket',
        condition: 'GOOD',
        color: 'Washed blue',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing.title).toBe('Updated Vintage Denim Jacket');
    expect(res.body.data.listing.condition).toBe('GOOD');
    expect(res.body.data.listing.color).toBe('Washed blue');
  });

  it('15. User CANNOT delete another user\'s listing (403)', async () => {
    const res = await request(app)
      .delete(`/api/listings/${createdListingId}`)
      .set('Cookie', otherCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('16. User CAN delete own listing (200)', async () => {
    const res = await request(app)
      .delete(`/api/listings/${createdListingId}`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deletion
    const checkRes = await request(app).get(`/api/listings/${createdListingId}`);
    expect(checkRes.status).toBe(404);
  });
});
