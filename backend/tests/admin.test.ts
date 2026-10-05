import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Phase 7: Admin Panel, Moderation & Analytics Suite', () => {
  const adminCredentials = {
    name: 'Admin Moderator',
    email: 'admin.moderator@swapwear.com',
    password: 'AdminPassword123!',
  };

  const normalUserCredentials = {
    name: 'Standard User',
    email: 'standard.user@swapwear.com',
    password: 'UserPassword123!',
  };

  let adminCookie: string;
  let userCookie: string;
  let adminUserId: string;
  let normalUserId: string;
  let testListingId: string;
  let testSwapRequestId: string;

  beforeAll(async () => {
    // 1. Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminCredentials.email, normalUserCredentials.email] },
      },
    });

    // 2. Register normal user
    const regUser = await request(app).post('/api/auth/register').send(normalUserCredentials);
    normalUserId = regUser.body.data.user.id;
    userCookie = (regUser.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;

    // 3. Register admin user then promote to ADMIN in DB
    const regAdmin = await request(app).post('/api/auth/register').send(adminCredentials);
    adminUserId = regAdmin.body.data.user.id;
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });

    // Re-login as admin to obtain authenticated cookie with updated role
    const loginAdmin = await request(app).post('/api/auth/login').send({
      email: adminCredentials.email,
      password: adminCredentials.password,
    });
    adminCookie = (loginAdmin.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;

    // 4. Create listing for test
    const listingRes = await request(app)
      .post('/api/listings')
      .set('Cookie', userCookie)
      .send({
        title: 'Admin Test Vintage Jacket',
        description: 'Test jacket for moderation inspection.',
        category: 'OUTERWEAR',
        brand: 'VintageBrand',
        color: 'Brown',
        size: 'L',
        condition: 'GOOD',
        estimatedSwapValue: 85.0,
      });
    testListingId = listingRes.body.data.listing.id;

    // 5. Create second listing and a swap request for swap monitoring test
    const secondListingRes = await request(app)
      .post('/api/listings')
      .set('Cookie', adminCookie)
      .send({
        title: 'Admin Offered Coat',
        category: 'OUTERWEAR',
        size: 'L',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 90.0,
      });

    const swapRes = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', adminCookie)
      .send({
        offeredListingId: secondListingRes.body.data.listing.id,
        requestedListingId: testListingId,
        message: 'Swap inspection test request',
      });
    testSwapRequestId = swapRes.body.data?.swapRequest?.id || swapRes.body.data?.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminCredentials.email, normalUserCredentials.email] },
      },
    });
    await prisma.$disconnect();
  });

  describe('1. Authentication & Role-Based Authorization', () => {
    it('1. Unauthenticated admin endpoint returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it('2. Standard USER accessing admin endpoint returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', userCookie);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden: Insufficient permissions/i);
    });

    it('3. ADMIN user accessing admin check returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/admin/check')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ADMIN');
    });
  });

  describe('2. Platform Analytics: GET /api/admin/analytics', () => {
    it('4. Analytics returns real database counts and structured metrics', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { users, listings, swaps, messages, recentActivity } = res.body.data;
      expect(users.total).toBeGreaterThanOrEqual(2);
      expect(users.active).toBeGreaterThanOrEqual(1);

      expect(listings.total).toBeGreaterThanOrEqual(2);
      expect(listings.available).toBeGreaterThanOrEqual(1);

      expect(swaps.total).toBeGreaterThanOrEqual(1);
      expect(swaps.pending).toBeGreaterThanOrEqual(1);

      expect(typeof messages.total).toBe('number');
      expect(Array.isArray(recentActivity)).toBe(true);
      expect(recentActivity.length).toBeGreaterThanOrEqual(1);
    });

    it('5. Analytics does not expose sensitive data like passwordHash', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', adminCookie);

      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toContain('passwordHash');
      expect(responseString).not.toContain('password');
    });
  });

  describe('3. User Management: /api/admin/users', () => {
    it('6. Admin can list users with pagination and search', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10&search=standard')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('7. Non-admin cannot list users (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', userCookie);
      expect(res.status).toBe(403);
    });

    it('8. Password hashes are NEVER returned in user lists', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', adminCookie);

      for (const u of res.body.data.users) {
        expect(u.passwordHash).toBeUndefined();
        expect(u.password).toBeUndefined();
      }
    });

    it('9. Admin can safely inspect user details by ID', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${normalUserId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(normalUserId);
      expect(res.body.data.user.email).toBe(normalUserCredentials.email);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user._count).toBeDefined();
    });

    it('10. Admin role change prevents accidental self-demotion', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUserId}/role`)
        .set('Cookie', adminCookie)
        .send({ role: 'USER' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot demote your own administrator account/i);
    });
  });

  describe('4. Clothing Listing Management & Moderation', () => {
    it('11. Admin can list listings with status and category filters', async () => {
      const res = await request(app)
        .get('/api/admin/listings?category=OUTERWEAR&status=AVAILABLE')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('12. Admin can inspect individual listing details', async () => {
      const res = await request(app)
        .get(`/api/admin/listings/${testListingId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.listing.id).toBe(testListingId);
      expect(res.body.data.listing.owner).toBeDefined();
    });

    it('13. Non-admin cannot moderate listings (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/admin/listings/${testListingId}/moderate`)
        .set('Cookie', userCookie)
        .send({ action: 'REMOVE' });

      expect(res.status).toBe(403);
    });

    it('14. Moderated listing (REMOVE) becomes RESERVED and disappears from public marketplace', async () => {
      // 1. Moderate listing to REMOVE
      const modRes = await request(app)
        .patch(`/api/admin/listings/${testListingId}/moderate`)
        .set('Cookie', adminCookie)
        .send({ action: 'REMOVE' });

      expect(modRes.status).toBe(200);
      expect(modRes.body.data.status).toBe('RESERVED');

      // 2. Query public marketplace (available by default)
      const publicMarketRes = await request(app).get('/api/listings');
      const publicItems = publicMarketRes.body.data?.data || publicMarketRes.body.data || [];
      const foundPublic = publicItems.some((item: any) => item.id === testListingId);
      expect(foundPublic).toBe(false);

      // 3. Restore listing back to AVAILABLE
      const restoreRes = await request(app)
        .patch(`/api/admin/listings/${testListingId}/moderate`)
        .set('Cookie', adminCookie)
        .send({ action: 'RESTORE' });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.status).toBe('AVAILABLE');
    });
  });

  describe('5. Swap Monitoring: /api/admin/swaps', () => {
    it('15. Admin can view paginated swap requests', async () => {
      const res = await request(app)
        .get('/api/admin/swaps')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.swaps.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('16. Non-admin cannot access admin swap monitoring (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/swaps')
        .set('Cookie', userCookie);
      expect(res.status).toBe(403);
    });

    it('17. Admin can view swap request details by ID', async () => {
      const res = await request(app)
        .get(`/api/admin/swaps/${testSwapRequestId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.swap.id).toBe(testSwapRequestId);
      expect(res.body.data.swap.requester).toBeDefined();
      expect(res.body.data.swap.recipient).toBeDefined();
    });
  });

  describe('6. Conversation Monitoring: /api/admin/conversations', () => {
    it('18. Admin conversation metadata access is protected against non-admins', async () => {
      const res = await request(app)
        .get('/api/admin/conversations')
        .set('Cookie', userCookie);
      expect(res.status).toBe(403);
    });

    it('19. Admin can access conversation metadata without exposing full chat content in list view', async () => {
      const res = await request(app)
        .get('/api/admin/conversations')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversations).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();

      // Ensure message content is NOT dumped in list response
      const str = JSON.stringify(res.body.data.conversations);
      expect(str).not.toContain('"content"');
    });
  });
});
