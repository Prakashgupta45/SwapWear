import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';

const app = createApp();

describe('Profile APIs Suite', () => {
  const profileUser = {
    name: 'Profile Tester',
    email: 'profiletester@swapwear.com',
    password: 'SecurePassword123!',
  };

  let userCookie: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: profileUser.email },
    });

    const regRes = await request(app)
      .post('/api/auth/register')
      .send(profileUser);

    const cookies = regRes.headers['set-cookie'] as unknown as string[];
    userCookie = cookies.find((c: string) => c.includes(AUTH_COOKIE_NAME))!;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: profileUser.email },
    });
    await prisma.$disconnect();
  });

  it('1. GET /api/profile rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. GET /api/profile returns authenticated user profile without passwordHash', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.email).toBe(profileUser.email);
    expect(res.body.data.profile.name).toBe(profileUser.name);
    expect(res.body.data.profile.passwordHash).toBeUndefined();
  });

  it('3. PATCH /api/profile updates user bio, city, state, pincode successfully', async () => {
    const updatePayload = {
      name: 'Profile Tester Updated',
      bio: 'Avid sustainable fashion enthusiast and thrifter.',
      city: 'Seattle',
      state: 'WA',
      pincode: '98101',
    };

    const res = await request(app)
      .patch('/api/profile')
      .set('Cookie', userCookie)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.name).toBe(updatePayload.name);
    expect(res.body.data.profile.bio).toBe(updatePayload.bio);
    expect(res.body.data.profile.city).toBe(updatePayload.city);
    expect(res.body.data.profile.state).toBe(updatePayload.state);
    expect(res.body.data.profile.pincode).toBe(updatePayload.pincode);
    expect(res.body.data.profile.passwordHash).toBeUndefined();
  });

  it('4. PATCH /api/profile rejects invalid pincode with 400 Bad Request', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set('Cookie', userCookie)
      .send({ pincode: 'abc' }); // Invalid pincode

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'pincode' })])
    );
  });
});
