import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Clothing Listings API Suite', () => {
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

  it('6. GET /api/listings/:id returns listing details with images and owner safe info', async () => {
    const res = await request(app).get(`/api/listings/${createdListingId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing.id).toBe(createdListingId);
    expect(res.body.data.listing.owner).toBeDefined();
    expect(res.body.data.listing.owner.name).toBe(ownerUser.name);
    expect(res.body.data.listing.owner.passwordHash).toBeUndefined();
  });

  it('7. User CANNOT update another user\'s listing (403)', async () => {
    const res = await request(app)
      .patch(`/api/listings/${createdListingId}`)
      .set('Cookie', otherCookie) // wrong user
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('8. User CAN update own listing (200)', async () => {
    const res = await request(app)
      .patch(`/api/listings/${createdListingId}`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Updated Vintage Denim Jacket',
        condition: 'GOOD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing.title).toBe('Updated Vintage Denim Jacket');
    expect(res.body.data.listing.condition).toBe('GOOD');
  });

  it('9. User CANNOT delete another user\'s listing (403)', async () => {
    const res = await request(app)
      .delete(`/api/listings/${createdListingId}`)
      .set('Cookie', otherCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('10. User CAN delete own listing (200)', async () => {
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
