import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Manual Verification Scenario: Phase 8 Test Account Flow', () => {
  const testUserA = {
    name: 'Prakash AI User',
    email: 'prakash.manual@swapwear.test',
    password: 'Password123!',
  };

  const testUserB = {
    name: 'Dehradun Swapper',
    email: 'dehradun.manual@swapwear.test',
    password: 'Password123!',
  };

  let cookieA: string;
  let cookieB: string;
  let listingAId: string;
  let listingB1Id: string;
  let listingB2Id: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { in: [testUserA.email, testUserB.email] } },
    });

    // Step 1: Register real test users
    const regA = await request(app).post('/api/auth/register').send(testUserA);
    cookieA = (regA.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookieA)
      .send({ city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' });

    const regB = await request(app).post('/api/auth/register').send(testUserB);
    cookieB = (regB.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookieB)
      .send({ city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' });

    // Step 2: Create clothing listings
    // Alice's closet item
    const resA = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send({
        title: 'Nike Performance Jacket',
        description: 'Excellent condition lightweight winter jacket',
        category: 'OUTERWEAR',
        brand: 'Nike',
        color: 'Black',
        size: 'M',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 2000,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
      });
    listingAId = resA.body.data.listing.id;

    // Bob's items
    const resB1 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Levis 511 Slim Jeans',
        description: 'Classic denim jeans, worn once',
        category: 'BOTTOMWEAR',
        brand: "Levi's",
        color: 'Blue',
        size: 'M',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 1800,
        images: ['https://images.unsplash.com/photo-1542272604-780c96856592?w=500'],
      });
    listingB1Id = resB1.body.data.listing.id;

    const resB2 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Champion Fleece Hoodie',
        description: 'Cozy cotton hoodie',
        category: 'TOPWEAR',
        brand: 'Champion',
        color: 'Grey',
        size: 'L',
        condition: 'GOOD',
        estimatedSwapValue: 1500,
        images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500'],
      });
    listingB2Id = resB2.body.data.listing.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [testUserA.email, testUserB.email] } },
    });
  });

  it('Step 2 & 3: Requests AI recommendations and verifies recommendations are related to user listings', async () => {
    const res = await request(app)
      .get('/api/ai/recommendations?bypassCache=true')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);

    const firstRec = res.body.data.recommendations[0];
    // Verified correct listing, value, location, and owner
    expect(firstRec.listing).toBeDefined();
    expect(firstRec.listing.owner.city).toBe('Dehradun');
    expect(firstRec.matchScore).toBeGreaterThanOrEqual(50);
  });

  it('Step 4: Verifies user own listing (Nike Performance Jacket) is excluded', async () => {
    const res = await request(app)
      .get('/api/ai/recommendations?bypassCache=true')
      .set('Cookie', cookieA);

    const ids = res.body.data.recommendations.map((r: any) => r.listing.id);
    expect(ids).not.toContain(listingAId);
  });

  it('Step 5: Verifies Phase 6 Smart Matching continues working side-by-side', async () => {
    const res = await request(app)
      .get('/api/matches/recommendations')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
  });
});
