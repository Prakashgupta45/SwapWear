import http from 'http';
import request from 'supertest';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { AUTH_COOKIE_NAME } from '../src/utils/cookie';
import { initSocketServer, closeIO } from '../src/socket';

const app = createApp();

describe('Phase 5: Real-Time Chat & Negotiation Suite', () => {
  const userA = {
    name: 'Alice Chat',
    email: 'alice.chat@swapwear.com',
    password: 'AlicePassword123!',
  };

  const userB = {
    name: 'Bob Chat',
    email: 'bob.chat@swapwear.com',
    password: 'BobPassword123!',
  };

  const userC = {
    name: 'Charlie Chat',
    email: 'charlie.chat@swapwear.com',
    password: 'CharliePassword123!',
  };

  let cookieA: string;
  let cookieB: string;
  let cookieC: string;

  let tokenA: string;
  let tokenB: string;

  let userAId: string;
  let userBId: string;
  let userCId: string;

  let listingAId: string;
  let listingBId: string;

  let acceptedSwapRequestId: string;
  let pendingSwapRequestId: string;

  let server: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    // 1. Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, userC.email] },
      },
    });

    // 2. Register Alice
    const regA = await request(app).post('/api/auth/register').send(userA);
    cookieA = (regA.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    tokenA = regA.body.data.token;
    userAId = regA.body.data.user.id;

    // 3. Register Bob
    const regB = await request(app).post('/api/auth/register').send(userB);
    cookieB = (regB.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    tokenB = regB.body.data.token;
    userBId = regB.body.data.user.id;

    // 4. Register Charlie
    const regC = await request(app).post('/api/auth/register').send(userC);
    cookieC = (regC.headers['set-cookie'] as string[]).find((c) =>
      c.includes(AUTH_COOKIE_NAME)
    )!;
    userCId = regC.body.data.user.id;

    // 5. Create Listings
    const listARes = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send({
        title: 'Alice Linen Shirt',
        category: 'TOPWEAR',
        brand: 'Uniqlo',
        color: 'White',
        size: 'M',
        condition: 'NEW',
        estimatedSwapValue: 30.0,
      });
    listingAId = listARes.body.data.listing.id;

    const listBRes = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Bob Wool Cardigan',
        category: 'TOPWEAR',
        brand: 'Zara',
        color: 'Grey',
        size: 'L',
        condition: 'LIKE_NEW',
        estimatedSwapValue: 40.0,
      });
    listingBId = listBRes.body.data.listing.id;

    // 6. Create Swap Request from Alice to Bob and Accept it
    const swapReq = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        offeredListingId: listingAId,
        requestedListingId: listingBId,
        message: 'Would love to swap for this cardigan!',
      });
    acceptedSwapRequestId = swapReq.body.data.swapRequest.id;

    // Bob accepts swap request
    await request(app)
      .patch(`/api/swap-requests/${acceptedSwapRequestId}/accept`)
      .set('Cookie', cookieB);

    // 7. Create another pending swap request for testing pending restrictions
    // Need new listings
    const listA2 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send({
        title: 'Alice Scarf',
        category: 'ACCESSORIES',
        size: 'OneSize',
        condition: 'NEW',
      });
    const listB2 = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieB)
      .send({
        title: 'Bob Hat',
        category: 'ACCESSORIES',
        size: 'OneSize',
        condition: 'NEW',
      });

    const pendingReq = await request(app)
      .post('/api/swap-requests')
      .set('Cookie', cookieA)
      .send({
        offeredListingId: listA2.body.data.listing.id,
        requestedListingId: listB2.body.data.listing.id,
      });
    pendingSwapRequestId = pendingReq.body.data.swapRequest.id;

    // 8. Start HTTP server with Socket.IO for integration testing
    server = http.createServer(app);
    initSocketServer(server);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as { port: number };
        serverPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await closeIO();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email, userC.email] },
      },
    });
  });

  describe('1. Conversation Access & Authorization', () => {
    it('1. Authorized user (Alice) can access conversation', async () => {
      const res = await request(app)
        .get(`/api/conversations/${acceptedSwapRequestId}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation).toBeDefined();
      expect(res.body.data.conversation.swapRequestId).toBe(acceptedSwapRequestId);
    });

    it('2. Authorized recipient (Bob) can access conversation', async () => {
      const res = await request(app)
        .get(`/api/conversations/${acceptedSwapRequestId}`)
        .set('Cookie', cookieB);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation).toBeDefined();
    });

    it('3. Unauthorized third-party user (Charlie) is denied with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/conversations/${acceptedSwapRequestId}`)
        .set('Cookie', cookieC);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('4. Unauthenticated request is rejected with 401 Unauthorized', async () => {
      const res = await request(app)
        .get(`/api/conversations/${acceptedSwapRequestId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('5. Pending swap request rejects chat access with 400 Bad Request', async () => {
      const res = await request(app)
        .get(`/api/conversations/${pendingSwapRequestId}`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/only available for accepted/i);
    });
  });

  describe('2. Message Creation & Integrity', () => {
    let createdMessageId: string;

    it('6. Message can be created by authorized participant', async () => {
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({
          content: 'Hi Bob, is the cardigan in mint condition?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message.content).toBe('Hi Bob, is the cardigan in mint condition?');
      expect(res.body.data.message.senderId).toBe(userAId);
      createdMessageId = res.body.data.message.id;
    });

    it('7. senderId comes strictly from authentication and cannot be spoofed by client', async () => {
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({
          content: 'Trying to impersonate Bob',
          senderId: userBId, // Malicious client attempt
        });

      expect(res.status).toBe(201);
      // senderId must still be Alice
      expect(res.body.data.message.senderId).toBe(userAId);
      expect(res.body.data.message.senderId).not.toBe(userBId);
    });

    it('8. Empty or whitespace-only message is rejected with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({
          content: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('9. Oversized message (>2000 chars) is rejected with 400 Bad Request', async () => {
      const hugeContent = 'a'.repeat(2001);
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({
          content: hugeContent,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('10. HTML in messages is sanitized/escaped', async () => {
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({
          content: '<script>alert("xss")</script><b>Bold Text</b>',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.message.content).not.toContain('<script>');
      expect(res.body.data.message.content).toContain('&lt;script&gt;');
    });

    it('11. Unauthorized third-party (Charlie) cannot send messages to conversation', async () => {
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieC)
        .send({
          content: 'I want in on this swap!',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Message History & Pagination', () => {
    beforeAll(async () => {
      // Seed additional messages
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
          .set('Cookie', cookieB)
          .send({ content: `Reply message #${i}` });
      }
    });

    it('12. Message history pagination returns limit and total metadata', async () => {
      const res = await request(app)
        .get(`/api/conversations/${acceptedSwapRequestId}/messages?page=1&limit=3`)
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages.length).toBe(3);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(3);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(7);
      expect(res.body.data.pagination.totalPages).toBeGreaterThanOrEqual(3);
    });
  });

  describe('4. Read Status & Unread Count', () => {
    let unreadMsgId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({ content: 'Unread message for Bob' });
      unreadMsgId = res.body.data.message.id;
    });

    it('13. Recipient (Bob) can mark message as read', async () => {
      const res = await request(app)
        .patch(`/api/messages/${unreadMsgId}/read`)
        .set('Cookie', cookieB);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message.readAt).not.toBeNull();
    });

    it('14. Charlie cannot mark messages from unrelated conversation', async () => {
      const res = await request(app)
        .patch(`/api/messages/${unreadMsgId}/read`)
        .set('Cookie', cookieC);

      expect(res.status).toBe(403);
    });

    it('15. Mark conversation as read marks all incoming unread messages', async () => {
      // Alice sends another message
      await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieA)
        .send({ content: 'Another new message for Bob' });

      const res = await request(app)
        .patch(`/api/conversations/${acceptedSwapRequestId}/read`)
        .set('Cookie', cookieB);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });

    it('16. Unread summary returns accurate unread counts', async () => {
      // Bob sends a message to Alice
      await request(app)
        .post(`/api/conversations/${acceptedSwapRequestId}/messages`)
        .set('Cookie', cookieB)
        .send({ content: 'Hey Alice, are you there?' });

      const res = await request(app)
        .get('/api/conversations/unread-summary')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUnread).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bySwapRequest[acceptedSwapRequestId]).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Real-Time Socket.IO Tests', () => {
    let clientAlice: ClientSocket;
    let clientBob: ClientSocket;
    let clientCharlie: ClientSocket;

    afterEach(() => {
      if (clientAlice?.connected) clientAlice.disconnect();
      if (clientBob?.connected) clientBob.disconnect();
      if (clientCharlie?.connected) clientCharlie.disconnect();
    });

    it('17. Unauthenticated socket connection is rejected', (done) => {
      const socket = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        autoConnect: true,
      });

      socket.on('connect_error', (err) => {
        expect(err.message).toMatch(/Authentication required/i);
        socket.disconnect();
        done();
      });
    });

    it('18. Authenticated socket connection succeeds with token', (done) => {
      clientAlice = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: tokenA },
      });

      clientAlice.on('connect', () => {
        expect(clientAlice.connected).toBe(true);
        done();
      });
    });

    it('19. Unauthorized user cannot join private swap room', (done) => {
      clientCharlie = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: cookieC.split(';')[0].replace(`${AUTH_COOKIE_NAME}=`, '') },
      });

      clientCharlie.on('connect', () => {
        clientCharlie.emit(
          'join:swap',
          { swapRequestId: acceptedSwapRequestId },
          (res: { success: boolean; message?: string }) => {
            expect(res.success).toBe(false);
            expect(res.message).toMatch(/Forbidden/i);
            done();
          }
        );
      });
    });

    it('20. Authorized users can join swap room and receive real-time message', (done) => {
      clientAlice = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: tokenA },
      });

      clientBob = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: tokenB },
      });

      let aliceJoined = false;
      let bobJoined = false;

      const checkBothJoined = () => {
        if (aliceJoined && bobJoined) {
          // Alice sends message to Bob
          clientAlice.emit('message:send', {
            swapRequestId: acceptedSwapRequestId,
            content: 'Hello Bob over WebSocket!',
          });
        }
      };

      clientAlice.on('connect', () => {
        clientAlice.emit('join:swap', { swapRequestId: acceptedSwapRequestId }, (res: any) => {
          expect(res.success).toBe(true);
          aliceJoined = true;
          checkBothJoined();
        });
      });

      clientBob.on('connect', () => {
        clientBob.emit('join:swap', { swapRequestId: acceptedSwapRequestId }, (res: any) => {
          expect(res.success).toBe(true);
          bobJoined = true;
          checkBothJoined();
        });

        // Bob listens for the message
        clientBob.on('message:received', (message: any) => {
          expect(message.content).toBe('Hello Bob over WebSocket!');
          expect(message.senderId).toBe(userAId);
          done();
        });
      });
    });

    it('21. Real-time typing indicators work between participants', (done) => {
      clientAlice = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: tokenA },
      });

      clientBob = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: tokenB },
      });

      clientAlice.on('connect', () => {
        clientAlice.emit('join:swap', { swapRequestId: acceptedSwapRequestId }, () => {
          // Bob joins and listens for typing
          clientBob.emit('join:swap', { swapRequestId: acceptedSwapRequestId }, () => {
            clientAlice.emit('typing:start', { swapRequestId: acceptedSwapRequestId });
          });
        });
      });

      clientBob.on('connect', () => {
        clientBob.on('typing:start', (data: any) => {
          expect(data.swapRequestId).toBe(acceptedSwapRequestId);
          expect(data.userId).toBe(userAId);
          done();
        });
      });
    });
  });
});
