import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';
import {
  ConditionVerificationService,
  evaluateConditionMismatch,
  CONDITION_RANKS,
} from '../src/services/conditionVerification.service';
import {
  rawAiConditionResponseSchema,
  preCheckConditionSchema,
} from '../src/validations/conditionVerification.validation';
import { Condition, Role } from '@prisma/client';

const app = createApp();

describe('Phase 9: AI-Assisted Clothing Condition Verification Suite', () => {
  const userA = {
    name: 'Condition Tester A',
    email: 'cond.tester.a@swapwear.com',
    password: 'Password123!',
  };

  const userB = {
    name: 'Condition Tester B',
    email: 'cond.tester.b@swapwear.com',
    password: 'Password123!',
  };

  const adminUser = {
    name: 'Condition Admin',
    email: 'cond.admin@swapwear.com',
    password: 'AdminPassword123!',
  };

  let cookieUserA: string;
  let cookieUserB: string;
  let cookieAdmin: string;

  let userAId: string;
  let userBId: string;
  let adminId: string;

  let listingAId: string;
  let listingNoImagesId: string;

  beforeAll(async () => {
    // 1. Clean up existing test data
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, adminUser.email] },
      },
    });

    // 2. Register User A
    const regA = await request(app).post('/api/auth/register').send(userA);
    cookieUserA = (regA.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userAId = regA.body.data.user.id;

    // 3. Register User B
    const regB = await request(app).post('/api/auth/register').send(userB);
    cookieUserB = (regB.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userBId = regB.body.data.user.id;

    // 4. Register and elevate Admin User
    const regAdmin = await request(app).post('/api/auth/register').send(adminUser);
    cookieAdmin = (regAdmin.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    adminId = regAdmin.body.data.user.id;
    await prisma.user.update({
      where: { id: adminId },
      data: { role: Role.ADMIN },
    });

    // 5. Create Listing for User A with valid image
    const listingA = await prisma.clothingListing.create({
      data: {
        ownerId: userAId,
        title: "Tester A's Vintage Jacket",
        category: 'OUTERWEAR',
        condition: Condition.LIKE_NEW,
        size: 'L',
        brand: 'Schott',
        estimatedSwapValue: 120,
        images: {
          create: [{ imageUrl: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504.jpg' }],
        },
      },
    });
    listingAId = listingA.id;

    // 6. Create Listing for User A without images
    const listingNoImages = await prisma.clothingListing.create({
      data: {
        ownerId: userAId,
        title: "Tester A's Imageless Item",
        category: 'TOPWEAR',
        condition: Condition.GOOD,
        size: 'M',
        brand: 'Uniqlo',
      },
    });
    listingNoImagesId = listingNoImages.id;
  });

  afterAll(async () => {
    await prisma.clothingListing.deleteMany({
      where: { ownerId: { in: [userAId, userBId, adminId] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [userA.email, userB.email, adminUser.email] } },
    });
    await prisma.$disconnect();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── 1. Security & Authentication ───────────────────────────────────────────

  it('1. should return 401 when unauthenticated user requests verification', async () => {
    const res = await request(app)
      .post(`/api/listings/${listingAId}/condition-verification`)
      .send();

    expect(res.status).toBe(401);
  });

  it("2. should return 403 when User B attempts to verify User A's listing", async () => {
    const res = await request(app)
      .post(`/api/listings/${listingAId}/condition-verification`)
      .set('Cookie', cookieUserB)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('3. should return 404 when verifying a non-existent listing', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post(`/api/listings/${fakeUuid}/condition-verification`)
      .set('Cookie', cookieUserA)
      .send();

    expect(res.status).toBe(404);
  });

  it('4. should return 400 when verifying a listing that has no images', async () => {
    const res = await request(app)
      .post(`/api/listings/${listingNoImagesId}/condition-verification`)
      .set('Cookie', cookieUserA)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/image/i);
  });

  // ── 2. Evaluation Logic & Condition Mismatch Rules ─────────────────────────

  it('5. should correctly evaluate Same condition as CONSISTENT (difference = 0)', () => {
    const result = evaluateConditionMismatch(Condition.GOOD, Condition.GOOD);
    expect(result.status).toBe('CONSISTENT');
    expect(result.mismatch).toBe(false);
    expect(result.differenceLevels).toBe(0);
  });

  it('6. should correctly evaluate 1-level difference as REVIEW_RECOMMENDED', () => {
    // Declared LIKE_NEW (3) vs AI GOOD (2) -> diff = 1
    const result1 = evaluateConditionMismatch(Condition.LIKE_NEW, Condition.GOOD);
    expect(result1.status).toBe('REVIEW_RECOMMENDED');
    expect(result1.mismatch).toBe(true);
    expect(result1.differenceLevels).toBe(1);

    // Declared GOOD (2) vs AI FAIR (1) -> diff = 1
    const result2 = evaluateConditionMismatch(Condition.GOOD, Condition.FAIR);
    expect(result2.status).toBe('REVIEW_RECOMMENDED');
    expect(result2.mismatch).toBe(true);
    expect(result2.differenceLevels).toBe(1);
  });

  it('7. should correctly evaluate 2+ level difference as MISMATCH_WARNING', () => {
    // Declared NEW (4) vs AI GOOD (2) -> diff = 2
    const result1 = evaluateConditionMismatch(Condition.NEW, Condition.GOOD);
    expect(result1.status).toBe('MISMATCH_WARNING');
    expect(result1.mismatch).toBe(true);
    expect(result1.differenceLevels).toBe(2);

    // Declared NEW (4) vs AI FAIR (1) -> diff = 3
    const result2 = evaluateConditionMismatch(Condition.NEW, Condition.FAIR);
    expect(result2.status).toBe('MISMATCH_WARNING');
    expect(result2.mismatch).toBe(true);
    expect(result2.differenceLevels).toBe(3);
  });

  it('8. should adhere strictly to project CONDITION_RANKS ordering', () => {
    expect(CONDITION_RANKS.NEW).toBe(4);
    expect(CONDITION_RANKS.LIKE_NEW).toBe(3);
    expect(CONDITION_RANKS.GOOD).toBe(2);
    expect(CONDITION_RANKS.FAIR).toBe(1);
  });

  // ── 3. Zod Schema Validation ───────────────────────────────────────────────

  it('9. should validate strict raw AI condition response schema', () => {
    const valid = rawAiConditionResponseSchema.safeParse({
      estimatedCondition: 'GOOD',
      confidence: 88,
      visibleIssues: ['Minor fabric wear on sleeve'],
      imageQuality: 'GOOD',
      recommendation: 'Condition appears consistent with GOOD.',
    });
    expect(valid.success).toBe(true);
  });

  it('10. should reject invalid condition enum from raw AI response', () => {
    const invalid = rawAiConditionResponseSchema.safeParse({
      estimatedCondition: 'BRAND_NEW_SUPER', // Invalid
      confidence: 88,
      visibleIssues: [],
      imageQuality: 'GOOD',
      recommendation: 'Looks fine',
    });
    expect(invalid.success).toBe(false);
  });

  it('11. should reject confidence outside 0-100 bounds', () => {
    const invalidHigh = rawAiConditionResponseSchema.safeParse({
      estimatedCondition: 'GOOD',
      confidence: 150, // Invalid
      visibleIssues: [],
      imageQuality: 'GOOD',
      recommendation: 'Looks fine',
    });
    expect(invalidHigh.success).toBe(false);

    const invalidLow = rawAiConditionResponseSchema.safeParse({
      estimatedCondition: 'GOOD',
      confidence: -5, // Invalid
      visibleIssues: [],
      imageQuality: 'GOOD',
      recommendation: 'Looks fine',
    });
    expect(invalidLow.success).toBe(false);
  });

  // ── 4. End-to-End Verification Endpoint & AI Failure Fallback ──────────────

  it('12. should handle AI provider failure safely without inventing fake results', async () => {
    // Mock analyzeImagesWithAi to return null (AI unavailable / error)
    jest
      .spyOn(ConditionVerificationService as any, 'analyzeImagesWithAi')
      .mockResolvedValueOnce(null);

    const res = await request(app)
      .post(`/api/listings/${listingAId}/condition-verification?force=true`)
      .set('Cookie', cookieUserA)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationAvailable).toBe(false);
    expect(res.body.data.verificationStatus).toBe('FAILED');
    expect(res.body.data.estimatedCondition).toBeNull();
    expect(res.body.data.confidence).toBeNull();
    expect(res.body.data.recommendation).toMatch(/temporarily unavailable/i);
  });

  it('13. should allow User A to verify own listing with mock vision result and persist to DB', async () => {
    // Mock analyzeImagesWithAi with realistic structured output
    jest
      .spyOn(ConditionVerificationService as any, 'analyzeImagesWithAi')
      .mockResolvedValueOnce({
        estimatedCondition: 'GOOD',
        confidence: 86,
        visibleIssues: ['Slight surface fading near seams'],
        imageQuality: 'GOOD',
        recommendation: 'Garment shows light wear consistent with GOOD.',
      });

    const res = await request(app)
      .post(`/api/listings/${listingAId}/condition-verification?force=true`)
      .set('Cookie', cookieUserA)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationAvailable).toBe(true);
    expect(res.body.data.declaredCondition).toBe(Condition.LIKE_NEW);
    expect(res.body.data.estimatedCondition).toBe(Condition.GOOD);
    expect(res.body.data.confidence).toBe(86);
    expect(res.body.data.verificationStatus).toBe('REVIEW_RECOMMENDED');
    expect(res.body.data.mismatch).toBe(true);
    expect(res.body.data.visibleIssues).toContain('Slight surface fading near seams');

    // Verify DB was persisted
    const updatedDb = await prisma.clothingListing.findUnique({
      where: { id: listingAId },
    });
    expect(updatedDb?.aiCondition).toBe('GOOD');
    expect(updatedDb?.aiConfidence).toBe(86);
    expect(updatedDb?.aiVerificationStatus).toBe('REVIEW_RECOMMENDED');
    expect(updatedDb?.aiVisibleIssues).toEqual(['Slight surface fading near seams']);
  });

  it('14. should allow Admin to verify any listing', async () => {
    jest
      .spyOn(ConditionVerificationService as any, 'analyzeImagesWithAi')
      .mockResolvedValueOnce({
        estimatedCondition: 'LIKE_NEW',
        confidence: 94,
        visibleIssues: ['No noticeable flaws observed'],
        imageQuality: 'GOOD',
        recommendation: 'Item appears in like-new condition.',
      });

    const res = await request(app)
      .post(`/api/listings/${listingAId}/condition-verification?force=true`)
      .set('Cookie', cookieAdmin)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estimatedCondition).toBe('LIKE_NEW');
    expect(res.body.data.verificationStatus).toBe('CONSISTENT');
    expect(res.body.data.mismatch).toBe(false);
  });

  it('15. should retrieve cached condition verification from GET endpoint without re-analyzing', async () => {
    const res = await request(app)
      .get(`/api/listings/${listingAId}/condition-verification`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationAvailable).toBe(true);
    expect(res.body.data.estimatedCondition).toBe('LIKE_NEW');
    expect(res.body.data.confidence).toBe(94);
  });

  it('16. should support pre-check condition endpoint before listing is created', async () => {
    jest
      .spyOn(ConditionVerificationService as any, 'analyzeImagesWithAi')
      .mockResolvedValueOnce({
        estimatedCondition: 'GOOD',
        confidence: 85,
        visibleIssues: ['Normal fabric softness'],
        imageQuality: 'GOOD',
        recommendation: 'Condition consistent with GOOD.',
      });

    const res = await request(app)
      .post('/api/condition-verification/pre-check')
      .set('Cookie', cookieUserA)
      .send({
        imageUrl: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504.jpg',
        declaredCondition: 'GOOD',
        category: 'OUTERWEAR',
        title: 'Leather Jacket Precheck',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationAvailable).toBe(true);
    expect(res.body.data.verificationStatus).toBe('CONSISTENT');
    expect(res.body.data.mismatch).toBe(false);
  });
});
