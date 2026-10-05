import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';
import { AiService } from '../src/services/ai.service';
import { AiRecommendationService } from '../src/services/aiRecommendation.service';
import {
  aiRecommendationResponseSchema,
  aiRecommendationItemSchema,
} from '../src/validations/aiRecommendation.validation';

const app = createApp();

describe('Phase 8: AI-Powered Personalized Swap Recommendations Suite', () => {
  const userAi = {
    name: 'AI Tester',
    email: 'ai.tester@swapwear.com',
    password: 'Password123!',
  };

  const userPeer = {
    name: 'AI Peer User',
    email: 'ai.peer@swapwear.com',
    password: 'Password123!',
  };

  let cookieAi: string;
  let cookiePeer: string;

  let userAiId: string;
  let userPeerId: string;

  let ownListingId: string;
  let peerListing1Id: string;
  let peerListing2Id: string;
  let peerReservedListingId: string;

  beforeAll(async () => {
    // 1. Clean up existing test data
    await prisma.user.deleteMany({
      where: {
        email: { in: [userAi.email, userPeer.email] },
      },
    });

    // 2. Register AI Tester in Dehradun, UK
    const regAi = await request(app).post('/api/auth/register').send(userAi);
    cookieAi = (regAi.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userAiId = regAi.body.data.user.id;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookieAi)
      .send({ city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' });

    // 3. Register Peer User in Dehradun, UK
    const regPeer = await request(app).post('/api/auth/register').send(userPeer);
    cookiePeer = (regPeer.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userPeerId = regPeer.body.data.user.id;

    await request(app)
      .patch('/api/profile')
      .set('Cookie', cookiePeer)
      .send({ city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' });

    // 4. Create user's own listing (Leather Jacket, M, ₹2000)
    const ownListingRes = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieAi)
      .send({
        title: 'Vintage Biker Leather Jacket',
        description: 'Quality vintage leather jacket in great condition',
        category: 'OUTERWEAR',
        brand: 'Zara',
        color: 'Black',
        size: 'M',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 2000,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
      });
    ownListingId = ownListingRes.body.data.listing.id;

    // 5. Create Peer Listing 1 (Denim Jacket, M, ₹1900 - high match)
    const peerListing1Res = await request(app)
      .post('/api/listings')
      .set('Cookie', cookiePeer)
      .send({
        title: 'Levis Trucker Denim Jacket',
        description: 'Classic denim jacket',
        category: 'OUTERWEAR',
        brand: "Levi's",
        color: 'Blue',
        size: 'M',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 1900,
        images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500'],
      });
    peerListing1Id = peerListing1Res.body.data.listing.id;

    // 6. Create Peer Listing 2 (Bomber Jacket, L, ₹2200)
    const peerListing2Res = await request(app)
      .post('/api/listings')
      .set('Cookie', cookiePeer)
      .send({
        title: 'Nike Sportswear Bomber',
        description: 'Warm insulated bomber jacket',
        category: 'OUTERWEAR',
        brand: 'Nike',
        color: 'Olive',
        size: 'L',
        condition: 'GOOD',
        estimatedSwapValue: 2200,
        images: ['https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500'],
      });
    peerListing2Id = peerListing2Res.body.data.listing.id;

    // 7. Create Peer Listing 3 and reserve it (to test exclusion of unavailable listings)
    const peerReservedRes = await request(app)
      .post('/api/listings')
      .set('Cookie', cookiePeer)
      .send({
        title: 'Reserved Silk Scarf',
        description: 'Already swapped or reserved',
        category: 'ACCESSORIES',
        brand: 'Hermes',
        color: 'Red',
        size: 'M',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 1500,
        images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500'],
      });
    peerReservedListingId = peerReservedRes.body.data.listing.id;

    await prisma.clothingListing.update({
      where: { id: peerReservedListingId },
      data: { status: 'RESERVED' },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { in: [userAi.email, userPeer.email] },
      },
    });
    AiRecommendationService.clearCache();
  });

  beforeEach(() => {
    AiRecommendationService.clearCache();
    jest.restoreAllMocks();
  });

  describe('1. Authentication & Query Validation', () => {
    it('1. Rejects unauthenticated recommendation request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/ai/recommendations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('2. Rejects invalid limit query with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/ai/recommendations?limit=99')
        .set('Cookie', cookieAi);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('3. Rejects invalid minScore query with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/ai/recommendations?minScore=150')
        .set('Cookie', cookieAi);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. AI Response Validation Schema Unit Checks', () => {
    it('4. Validates correct structured AI output format', () => {
      const validPayload = {
        recommendations: [
          {
            listingId: 'clist123',
            score: 92,
            reason: 'Similar jacket style, matching size and close value parity.',
          },
        ],
      };
      const result = aiRecommendationResponseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('5. Rejects AI score outside 0-100 range', () => {
      const invalidScore = {
        listingId: 'clist123',
        score: 120,
        reason: 'Too high score',
      };
      const result = aiRecommendationItemSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it('6. Rejects AI reason exceeding 150 characters', () => {
      const longReason = {
        listingId: 'clist123',
        score: 85,
        reason:
          'This reason is intentionally made way too long to test the 150 character boundary limit. It contains an excessive amount of text that should definitely be rejected by Zod validation.',
      };
      const result = aiRecommendationItemSchema.safeParse(longReason);
      expect(result.success).toBe(false);
    });
  });

  describe('3. Recommendation Candidate Filtering', () => {
    it('7. Excludes user own listings from recommendations', async () => {
      const res = await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedIds = res.body.data.recommendations.map(
        (r: any) => r.listing.id
      );
      expect(returnedIds).not.toContain(ownListingId);
    });

    it('8. Excludes unavailable/reserved listings from recommendations', async () => {
      const res = await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.recommendations.map(
        (r: any) => r.listing.id
      );
      expect(returnedIds).not.toContain(peerReservedListingId);
    });
  });

  describe('4. AI Enhancement & Hybrid Scoring', () => {
    it('9. When AI succeeds, applies hybrid scoring formula and includes AI reason', async () => {
      // Mock AI response for peerListing1Id
      jest.spyOn(AiService, 'getPersonalizedRanking').mockResolvedValueOnce({
        recommendations: [
          {
            listingId: peerListing1Id,
            score: 95,
            reason: 'Great value match with your Zara jacket and identical sizing.',
          },
        ],
      });

      const res = await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAiActive).toBe(true);

      const rec1 = res.body.data.recommendations.find(
        (r: any) => r.listing.id === peerListing1Id
      );
      expect(rec1).toBeDefined();
      expect(rec1.isAiRecommended).toBe(true);
      expect(rec1.aiReason).toContain('Great value match with your Zara jacket');

      // Verify hybrid scoring: (phase6Score * 0.70) + (95 * 0.30)
      const expectedScore = Math.round(rec1.phase6Score * 0.7 + 95 * 0.3);
      expect(rec1.matchScore).toBe(expectedScore);
      expect(rec1.reasons[0]).toBe('Great value match with your Zara jacket and identical sizing.');
    });

    it('10. Safely ignores invalid listing IDs returned by AI', async () => {
      // AI hallucinates a non-existent listing ID
      jest.spyOn(AiService, 'getPersonalizedRanking').mockResolvedValueOnce({
        recommendations: [
          {
            listingId: 'non-existent-fake-id-999',
            score: 99,
            reason: 'Fake item hallucinated by rogue AI model.',
          },
        ],
      });

      const res = await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedIds = res.body.data.recommendations.map(
        (r: any) => r.listing.id
      );
      expect(returnedIds).not.toContain('non-existent-fake-id-999');
    });

    it('11. Gracefully falls back to Phase 6 smart matches when AI fails or throws', async () => {
      // Mock AI throwing a network/provider error
      jest.spyOn(AiService, 'getPersonalizedRanking').mockRejectedValueOnce(
        new Error('AI Provider connection timeout (504 Gateway)')
      );

      const res = await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAiActive).toBe(false);

      // Recommendations should still be returned using Phase 6
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
      const rec = res.body.data.recommendations[0];
      expect(rec.isAiRecommended).toBe(false);
      expect(rec.matchScore).toBe(rec.phase6Score);
      expect(rec.matchScore).toBeGreaterThanOrEqual(50);
    });

    it('12. Respects limit parameter in response', async () => {
      const res = await request(app)
        .get('/api/ai/recommendations?limit=1&bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  describe('5. Security, Privacy & Regression', () => {
    it('13. Does not expose AI_API_KEY, passwords or secrets in API responses', async () => {
      const res = await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      const responseString = JSON.stringify(res.body);

      expect(responseString).not.toContain('passwordHash');
      expect(responseString).not.toContain('JWT_SECRET');
      expect(responseString).not.toContain('AI_API_KEY');
      expect(responseString).not.toContain('gemini-');
    });

    it('14. Confidential user information is not included in AI payload', async () => {
      let capturedPayload: any = null;

      jest.spyOn(AiService, 'getPersonalizedRanking').mockImplementationOnce(async (payload) => {
        capturedPayload = payload;
        return null;
      });

      await request(app)
        .get('/api/ai/recommendations?bypassCache=true')
        .set('Cookie', cookieAi);

      expect(capturedPayload).not.toBeNull();
      // Ensure no passwords, emails, or phone numbers in payload
      expect(capturedPayload.userProfile.email).toBeUndefined();
      expect(capturedPayload.userProfile.passwordHash).toBeUndefined();
      expect(capturedPayload.userProfile.phone).toBeUndefined();
      expect(capturedPayload.userProfile.pincode).toBeUndefined();
    });

    it('15. Preserves existing Phase 6 GET /api/matches/recommendations endpoint unchanged', async () => {
      const res = await request(app)
        .get('/api/matches/recommendations')
        .set('Cookie', cookieAi);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
    });
  });
});
