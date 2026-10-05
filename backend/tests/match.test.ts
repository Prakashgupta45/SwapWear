import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';
import { MatchService } from '../src/services/match.service';

const app = createApp();

describe('Phase 6: Location-Based & Value-Based Swap Matching Suite', () => {
  const userA = {
    name: 'Matcher Alice',
    email: 'alice.match@swapwear.com',
    password: 'Password123!',
  };

  const userB = {
    name: 'Matcher Bob',
    email: 'bob.match@swapwear.com',
    password: 'Password123!',
  };

  const userC = {
    name: 'Matcher Charlie',
    email: 'charlie.match@swapwear.com',
    password: 'Password123!',
  };

  let cookieA: string;
  let cookieB: string;
  let cookieC: string;

  let userAId: string;
  let userBId: string;
  let userCId: string;

  let listingAId: string;
  let listingB1Id: string;
  let listingB2Id: string;
  let listingC1Id: string;

  beforeAll(async () => {
    // 1. Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, userC.email] },
      },
    });

    // 2. Register Alice (in New York, NY)
    const regA = await request(app).post('/api/auth/register').send(userA);
    cookieA = (regA.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userAId = regA.body.data.user.id;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookieA)
      .send({ city: 'New York', state: 'NY', pincode: '10001' });

    // 3. Register Bob (in New York, NY — Same City)
    const regB = await request(app).post('/api/auth/register').send(userB);
    cookieB = (regB.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userBId = regB.body.data.user.id;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookieB)
      .send({ city: 'New York', state: 'NY', pincode: '10002' });

    // 4. Register Charlie (in Los Angeles, CA — Different City & State)
    const regC = await request(app).post('/api/auth/register').send(userC);
    cookieC = (regC.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userCId = regC.body.data.user.id;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookieC)
      .send({ city: 'Los Angeles', state: 'CA', pincode: '90001' });

    // 5. Create Listings
    // Alice's Target Item: Wool Trench Coat, $120, OUTERWEAR, Size M, NEW
    const resA = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send({
        title: 'Alice Wool Trench Coat',
        category: 'OUTERWEAR',
        brand: 'Aritzia',
        color: 'Camel',
        size: 'M',
        condition: 'NEW',
        estimatedSwapValue: 120.0,
      });
    listingAId = resA.body.data.listing.id;

    // Bob's Item 1: Perfect Match (Same City, Same Category, Same Size, $115, NEW)
    const resB1 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Bob Cashmere Peacoat',
        category: 'OUTERWEAR',
        brand: 'COS',
        color: 'Black',
        size: 'M',
        condition: 'NEW',
        estimatedSwapValue: 115.0,
      });
    listingB1Id = resB1.body.data.listing.id;

    // Bob's Item 2: Medium Match (Same City, TOPWEAR, Size L, $50, GOOD)
    const resB2 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Bob Casual Flannel Shirt',
        category: 'TOPWEAR',
        brand: 'Uniqlo',
        color: 'Red',
        size: 'L',
        condition: 'GOOD',
        estimatedSwapValue: 50.0,
      });
    listingB2Id = resB2.body.data.listing.id;

    // Charlie's Item 1: Far Location, High Value Difference ($300, FOOTWEAR, Size 42, FAIR)
    const resC1 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieC)
      .send({
        title: 'Charlie Leather Boots',
        category: 'FOOTWEAR',
        brand: 'Gucci',
        color: 'Brown',
        size: '42',
        condition: 'FAIR',
        estimatedSwapValue: 300.0,
      });
    listingC1Id = resC1.body.data.listing.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, userC.email] },
      },
    });
  });

  describe('1. Rule-Based Scoring Algorithm Unit Checks', () => {
    it('calculates 100% value score when estimated swap values are equal', () => {
      const match = MatchService.calculatePairMatch(
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M' },
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M' }
      );
      expect(match.breakdown.valueScore).toBe(100);
      expect(match.valueDifference).toBe(0);
      expect(match.valueDifferencePercentage).toBe(0);
    });

    it('penalizes large value differences proportionally', () => {
      const match = MatchService.calculatePairMatch(
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M' },
        { estimatedSwapValue: 20, category: 'TOPWEAR', condition: 'NEW', size: 'M' }
      );
      expect(match.breakdown.valueScore).toBe(20);
      expect(match.valueDifference).toBe(80);
    });

    it('awards location bonus for matching city (+10)', () => {
      const match = MatchService.calculatePairMatch(
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M', owner: { city: 'New York', state: 'NY' } },
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M', owner: { city: 'New York', state: 'NY' } }
      );
      expect(match.locationMatch).toBe('SAME_CITY');
      expect(match.breakdown.locationBonus).toBe(10);
    });

    it('awards location bonus for matching state (+5)', () => {
      const match = MatchService.calculatePairMatch(
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M', owner: { city: 'Buffalo', state: 'NY' } },
        { estimatedSwapValue: 100, category: 'TOPWEAR', condition: 'NEW', size: 'M', owner: { city: 'Albany', state: 'NY' } }
      );
      expect(match.locationMatch).toBe('SAME_STATE');
      expect(match.breakdown.locationBonus).toBe(5);
    });
  });

  describe('2. Listing Matches API: GET /api/listings/:id/matches', () => {
    it('returns ranked matches with breakdown and reasons', async () => {
      const res = await request(app).get(`/api/listings/${listingAId}/matches`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sourceListing.id).toBe(listingAId);
      expect(res.body.data.matches.length).toBeGreaterThanOrEqual(2);

      // Verify descending sort order
      for (let i = 0; i < res.body.data.matches.length - 1; i++) {
        expect(res.body.data.matches[i].matchScore).toBeGreaterThanOrEqual(
          res.body.data.matches[i + 1].matchScore
        );
      }

      // Bob's Cashmere Peacoat should be in the top tier of matches
      const bobMatch = res.body.data.matches.find((m: any) => m.listing.id === listingB1Id);
      expect(bobMatch).toBeDefined();
      expect(bobMatch.matchScore).toBeGreaterThanOrEqual(85);
      expect(bobMatch.matchLevel).toBe('EXCELLENT');
      expect(bobMatch.locationMatch).toBe('SAME_CITY');
      expect(bobMatch.reasons.length).toBeGreaterThan(0);
    });

    it('excludes own listings from match candidates', async () => {
      // Create another listing for Alice
      const resA2 = await request(app)
        .post('/api/listings')
        .set('Cookie', cookieA)
        .send({
          title: 'Alice Denim Jacket',
          category: 'OUTERWEAR',
          size: 'M',
          condition: 'NEW',
          estimatedSwapValue: 120.0,
        });

      const res = await request(app).get(`/api/listings/${listingAId}/matches`);
      const matchedIds = res.body.data.matches.map((m: any) => m.listing.id);

      // Alice's own second listing should NEVER appear in matches for her first listing
      expect(matchedIds).not.toContain(resA2.body.data.listing.id);

      // Clean up second listing so it does not affect subsequent tests
      await prisma.clothingListing.delete({ where: { id: resA2.body.data.listing.id } });
    });

    it('filters matches by cityOnly parameter', async () => {
      const res = await request(app).get(`/api/listings/${listingAId}/matches?cityOnly=true`);

      expect(res.status).toBe(200);
      const matches = res.body.data.matches;
      for (const m of matches) {
        expect(m.listing.owner.city.toLowerCase()).toBe('new york');
      }
    });

    it('returns 404 for non-existent listing ID', async () => {
      const res = await request(app).get('/api/listings/00000000-0000-0000-0000-000000000000/matches');
      expect(res.status).toBe(404);
    });
  });

  describe('3. Pairwise Comparison: POST /api/matches/compare', () => {
    it('compares two listings with full detailed metrics', async () => {
      const res = await request(app)
        .post('/api/matches/compare')
        .send({
          sourceListingId: listingAId,
          targetListingId: listingB1Id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sourceListing.id).toBe(listingAId);
      expect(res.body.data.targetListing.id).toBe(listingB1Id);
      expect(res.body.data.matchScore).toBeGreaterThanOrEqual(85);
      expect(res.body.data.breakdown).toBeDefined();
      expect(res.body.data.breakdown.valueScore).toBeGreaterThanOrEqual(90);
    });

    it('rejects comparing a listing with itself', async () => {
      const res = await request(app)
        .post('/api/matches/compare')
        .send({
          sourceListingId: listingAId,
          targetListingId: listingAId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot compare a listing with itself/i);
    });
  });

  describe('4. User Smart Recommendations: GET /api/matches/recommendations', () => {
    it('requires authentication (401 when unauthorized)', async () => {
      const res = await request(app).get('/api/matches/recommendations');
      expect(res.status).toBe(401);
    });

    it('returns tailored closet recommendations for authenticated user', async () => {
      const res = await request(app)
        .get('/api/matches/recommendations')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThanOrEqual(1);

      const firstRec = res.body.data.recommendations[0];
      expect(firstRec.matchedWithMyItem).toBeDefined();
      expect(firstRec.matchedWithMyItem.id).toBe(listingAId);
      expect(firstRec.matchScore).toBeGreaterThanOrEqual(50);
    });
  });
});
