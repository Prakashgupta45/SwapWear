import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Phase 4: Swap Request System API Suite', () => {
  const userA = {
    name: 'Swapper Alice',
    email: 'alice.swap@swapwear.com',
    password: 'AlicePassword123!',
  };

  const userB = {
    name: 'Swapper Bob',
    email: 'bob.swap@swapwear.com',
    password: 'BobPassword123!',
  };

  const userC = {
    name: 'Third Party Charlie',
    email: 'charlie.swap@swapwear.com',
    password: 'CharliePassword123!',
  };

  let cookieA: string;
  let cookieB: string;
  let cookieC: string;

  let userAId: string;
  let userBId: string;
  let userCId: string;

  let listingA1Id: string;
  let listingA2Id: string;
  let listingB1Id: string;
  let listingB2Id: string;
  let listingC1Id: string;

  let activeSwapRequestId: string;

  beforeAll(async () => {
    // Clean up test users if existing
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, userC.email] },
      },
    });

    // 1. Register Alice (userA)
    const regA = await request(app).post('/api/auth/register').send(userA);
    cookieA = (regA.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userAId = regA.body.data.user.id;

    // 2. Register Bob (userB)
    const regB = await request(app).post('/api/auth/register').send(userB);
    cookieB = (regB.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userBId = regB.body.data.user.id;

    // 3. Register Charlie (userC)
    const regC = await request(app).post('/api/auth/register').send(userC);
    cookieC = (regC.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userCId = regC.body.data.user.id;

    // Create listings for Alice
    const resA1 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send({
        title: 'Alice Vintage Silk Blouse',
        category: 'TOPWEAR',
        brand: 'Zara',
        color: 'Ivory',
        size: 'M',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 35.0,
      });
    listingA1Id = resA1.body.data.listing.id;

    const resA2 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send({
        title: 'Alice Leather Boots',
        category: 'FOOTWEAR',
        brand: 'Dr. Martens',
        color: 'Black',
        size: '39',
        condition: 'GOOD',
        estimatedSwapValue: 75.0,
      });
    listingA2Id = resA2.body.data.listing.id;

    // Create listings for Bob
    const resB1 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Bob Wool Winter Coat',
        category: 'OUTERWEAR',
        brand: 'COS',
        color: 'Navy',
        size: 'L',
        condition: 'NEW',
        estimatedSwapValue: 110.0,
      });
    listingB1Id = resB1.body.data.listing.id;

    const resB2 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Bob Denim Jeans',
        category: 'BOTTOMWEAR',
        brand: 'Levi\'s',
        color: 'Blue',
        size: '32',
        condition: 'GOOD',
        estimatedSwapValue: 40.0,
      });
    listingB2Id = resB2.body.data.listing.id;

    // Create listing for Charlie
    const resC1 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieC)
      .send({
        title: 'Charlie Floral Summer Dress',
        category: 'DRESS',
        brand: 'Mango',
        color: 'Yellow',
        size: 'S',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 45.0,
      });
    listingC1Id = resC1.body.data.listing.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, userC.email] },
      },
    });
    await prisma.$disconnect();
  });

  // ── 1. Create Swap Request ──────────────────────────────────────────────────

  it('1. Authenticated user can create swap request', async () => {
    // Alice requests Bob's Wool Winter Coat (listingB1Id) offering her Silk Blouse (listingA1Id)
    const res = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        requestedListingId: listingB1Id,
        offeredListingId: listingA1Id,
        message: 'Hello Bob, would you be interested in trading your coat for my vintage silk blouse?',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.swapRequest).toBeDefined();
    expect(res.body.data.swapRequest.status).toBe('PENDING');
    expect(res.body.data.swapRequest.requesterId).toBe(userAId);
    expect(res.body.data.swapRequest.recipientId).toBe(userBId);
    expect(res.body.data.swapRequest.offeredListing.id).toBe(listingA1Id);
    expect(res.body.data.swapRequest.requestedListing.id).toBe(listingB1Id);
    expect(res.body.data.swapRequest.message).toMatch(/interested in trading/i);

    activeSwapRequestId = res.body.data.swapRequest.id;
  });

  it('2. Unauthenticated user cannot create request (401)', async () => {
    const res = await request(app)
      .post('/api/swap-requests')
      .send({
        requestedListingId: listingB1Id,
        offeredListingId: listingA1Id,
        message: 'No auth test',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. User cannot request their own listing (400)', async () => {
    // Alice cannot request her own listing A2 using listing A1
    const res = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        requestedListingId: listingA2Id,
        offeredListingId: listingA1Id,
        message: 'Attempting self-swap',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot request a swap for your own listing/i);
  });

  it('4. User cannot offer another user\'s listing (403)', async () => {
    // Alice cannot offer Charlie's dress (listingC1Id)
    const res = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        requestedListingId: listingB2Id,
        offeredListingId: listingC1Id,
        message: 'Offering an item I do not own',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only offer your own clothing listing/i);
  });

  it('5. User cannot request an unavailable listing (400)', async () => {
    // Mark listingB2 as RESERVED
    await prisma.clothingListing.update({
      where: { id: listingB2Id },
      data: { status: 'RESERVED' },
    });

    const res = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        requestedListingId: listingB2Id,
        offeredListingId: listingA2Id,
        message: 'Requesting reserved listing',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not available/i);

    // Revert status to AVAILABLE
    await prisma.clothingListing.update({
      where: { id: listingB2Id },
      data: { status: 'AVAILABLE' },
    });
  });

  it('6. Duplicate pending request is rejected (409)', async () => {
    // Alice already has an active pending request for (listingB1Id, listingA1Id)
    const res = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        requestedListingId: listingB1Id,
        offeredListingId: listingA1Id,
        message: 'Duplicate request attempt',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/pending swap request.*already exists/i);
  });

  // ── 2. Read Sent & Received Requests ────────────────────────────────────────

  it('Returns sent requests for authenticated user with safe fields', async () => {
    const res = await request(app)
      .get('/api/swap-requests/sent')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.swapRequests)).toBe(true);
    expect(res.body.data.swapRequests.length).toBeGreaterThanOrEqual(1);

    const first = res.body.data.swapRequests[0];
    expect(first.requester.id).toBe(userAId);
    expect(first.recipient.id).toBe(userBId);
    expect(first.offeredListing).toBeDefined();
    expect(first.requestedListing).toBeDefined();
    expect(first.requester.passwordHash).toBeUndefined();
  });

  it('Returns received requests for recipient user with safe fields', async () => {
    const res = await request(app)
      .get('/api/swap-requests/received')
      .set('Cookie', cookieB);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.swapRequests)).toBe(true);
    expect(res.body.data.swapRequests.length).toBeGreaterThanOrEqual(1);

    const received = res.body.data.swapRequests.find(
      (r: any) => r.id === activeSwapRequestId
    );
    expect(received).toBeDefined();
    expect(received.recipient.id).toBe(userBId);
    expect(received.requester.id).toBe(userAId);
  });

  it('Participant can view swap request detail by ID; third-party cannot (403)', async () => {
    // Participant (Alice) can view
    const resAlice = await request(app)
      .get(`/api/swap-requests/${activeSwapRequestId}`)
      .set('Cookie', cookieA);
    expect(resAlice.status).toBe(200);
    expect(resAlice.body.data.swapRequest.id).toBe(activeSwapRequestId);

    // Third-party (Charlie) cannot view
    const resCharlie = await request(app)
      .get(`/api/swap-requests/${activeSwapRequestId}`)
      .set('Cookie', cookieC);
    expect(resCharlie.status).toBe(403);
    expect(resCharlie.body.success).toBe(false);
  });

  // ── 3. Accept & Reject Authorization ────────────────────────────────────────

  it('8. Non-recipient cannot accept request (403)', async () => {
    // Alice (requester) cannot accept her own sent request
    const resA = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/accept`)
      .set('Cookie', cookieA);
    expect(resA.status).toBe(403);

    // Charlie (unrelated) cannot accept request
    const resC = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/accept`)
      .set('Cookie', cookieC);
    expect(resC.status).toBe(403);
  });

  it('10. Non-recipient cannot reject request (403)', async () => {
    // Alice (requester) cannot reject request
    const resA = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/reject`)
      .set('Cookie', cookieA);
    expect(resA.status).toBe(403);

    // Charlie (unrelated) cannot reject request
    const resC = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/reject`)
      .set('Cookie', cookieC);
    expect(resC.status).toBe(403);
  });

  it('12. Non-requester cannot cancel request (403)', async () => {
    // Bob (recipient) cannot cancel request
    const resB = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/cancel`)
      .set('Cookie', cookieB);
    expect(resB.status).toBe(403);

    // Charlie (unrelated) cannot cancel request
    const resC = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/cancel`)
      .set('Cookie', cookieC);
    expect(resC.status).toBe(403);
  });

  // ── 4. Reject Request Flow ──────────────────────────────────────────────────

  it('9. Recipient can reject request', async () => {
    // Create a temporary request from Charlie to Bob
    const tempReq = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieC)
      .send({
        requestedListingId: listingB2Id,
        offeredListingId: listingC1Id,
        message: 'Can I swap my dress for your jeans?',
      });
    expect(tempReq.status).toBe(201);
    const tempId = tempReq.body.data.swapRequest.id;

    // Bob rejects it
    const rejectRes = await request(app)
      .patch(`/api/swap-requests/${tempId}/reject`)
      .set('Cookie', cookieB);

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.success).toBe(true);
    expect(rejectRes.body.data.swapRequest.status).toBe('REJECTED');
  });

  // ── 5. Cancel Request Flow ──────────────────────────────────────────────────

  it('11. Requester can cancel request', async () => {
    // Create a temporary request from Charlie to Alice
    const tempReq = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieC)
      .send({
        requestedListingId: listingA2Id,
        offeredListingId: listingC1Id,
        message: 'Would love to swap for the boots!',
      });
    expect(tempReq.status).toBe(201);
    const tempId = tempReq.body.data.swapRequest.id;

    // Charlie cancels it
    const cancelRes = await request(app)
      .patch(`/api/swap-requests/${tempId}/cancel`)
      .set('Cookie', cookieC);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.swapRequest.status).toBe('CANCELLED');
  });

  // ── 6. Accept Request & Listing Reservation Flow ────────────────────────────

  it('7 & 13. Recipient can accept request and accepted request reserves the relevant listings', async () => {
    // Bob accepts Alice's active swap request for (listingB1Id, listingA1Id)
    const acceptRes = await request(app)
      .patch(`/api/swap-requests/${activeSwapRequestId}/accept`)
      .set('Cookie', cookieB);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.swapRequest.status).toBe('ACCEPTED');

    // Verify both listings are now RESERVED
    const [offered, requested] = await Promise.all([
      prisma.clothingListing.findUnique({ where: { id: listingA1Id } }),
      prisma.clothingListing.findUnique({ where: { id: listingB1Id } }),
    ]);

    expect(offered?.status).toBe('RESERVED');
    expect(requested?.status).toBe('RESERVED');
  });

  // ── 7. Regression Verification: Phases 1–3 ───────────────────────────────────

  it('14. Existing authentication still works', async () => {
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookieA);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(userA.email);
  });

  it('15. Existing listing functionality still works', async () => {
    const myListingsRes = await request(app)
      .get('/api/listings/my')
      .set('Cookie', cookieA);

    expect(myListingsRes.status).toBe(200);
    expect(myListingsRes.body.success).toBe(true);
    expect(Array.isArray(myListingsRes.body.data.listings)).toBe(true);
  });

  it('16. Existing marketplace functionality still works', async () => {
    const marketplaceRes = await request(app)
      .get('/api/listings?sort=newest&page=1&limit=10');

    expect(marketplaceRes.status).toBe(200);
    expect(marketplaceRes.body.success).toBe(true);
    expect(marketplaceRes.body.data.data).toBeDefined();
    expect(marketplaceRes.body.data.total).toBeGreaterThanOrEqual(1);
  });
});
