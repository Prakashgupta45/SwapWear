import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Authentication & Authorization Suite', () => {
  const testUser = {
    name: 'Integration Tester',
    email: 'tester@swapwear.com',
    password: 'SecurePassword123!',
  };

  const adminUser = {
    name: 'Admin Tester',
    email: 'admintester@swapwear.com',
    password: 'AdminPassword123!',
  };

  let userAuthCookie: string;
  let adminAuthCookie: string;

  beforeAll(async () => {
    // Clean up test data if exists
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, adminUser.email, 'duplicate@swapwear.com'],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, adminUser.email, 'duplicate@swapwear.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  // 1. Successful registration
  it('1. Successful registration: creates user and sets HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.role).toBe('USER');
    // Ensure passwordHash is NEVER exposed
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify Set-Cookie header has HttpOnly
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes(AUTH_COOKIE_NAME) && c.includes('HttpOnly'))).toBe(true);

    userAuthCookie = cookies.find((c: string) => c.includes(AUTH_COOKIE_NAME))!;
  });

  // 2. Duplicate email
  it('2. Duplicate email: rejects registration with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  // 3. Invalid email
  it('3. Invalid email: rejects registration with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'ValidPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })])
    );
  });

  // 4. Weak password
  it('4. Weak password: rejects registration with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Password User',
        email: 'weakpassword@swapwear.com',
        password: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'password' })])
    );
  });

  // 5. Successful login
  it('5. Successful login: authenticates user and sets HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes(AUTH_COOKIE_NAME) && c.includes('HttpOnly'))).toBe(true);
  });

  // 6. Wrong password
  it('6. Wrong password: rejects login with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // 7. Wrong email
  it('7. Wrong email: rejects login with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@swapwear.com',
        password: testUser.password,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // 8. Logout
  it('8. Logout: clears the authentication cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', userAuthCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes(`${AUTH_COOKIE_NAME}=;`))).toBe(true);
  });

  // 9. Authenticated /me
  it('9. Authenticated /me: returns safe user profile data and excludes passwordHash', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', userAuthCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  // 10. Unauthenticated /me
  it('10. Unauthenticated /me: rejects with 401 Unauthorized when no cookie is sent', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 11. Role-based authorization
  describe('11. Role-based authorization handling', () => {
    beforeAll(async () => {
      // Register an admin user and promote to ADMIN
      await request(app)
        .post('/api/auth/register')
        .send(adminUser);

      // Update role to ADMIN directly in database
      await prisma.user.update({
        where: { email: adminUser.email },
        data: { role: 'ADMIN' },
      });

      // Login to obtain admin cookie with updated role token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      adminAuthCookie = cookies.find((c: string) => c.includes(AUTH_COOKIE_NAME))!;
    });

    it('denies standard USER from accessing ADMIN-only route (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/check')
        .set('Cookie', userAuthCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('permits ADMIN user to access ADMIN-only route (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admin/check')
        .set('Cookie', adminAuthCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/admin access granted/i);
    });
  });

  // 12. Password hashing check in database
  it('12. Database verification: password is stored hashed and never plain text', async () => {
    const userInDb = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(userInDb).toBeDefined();
    expect(userInDb!.passwordHash).not.toBe(testUser.password);
    expect(userInDb!.passwordHash.startsWith('$2a$') || userInDb!.passwordHash.startsWith('$2b$')).toBe(true);
  });
});
