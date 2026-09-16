import { Request, Response, NextFunction } from 'express';
import { validate } from '../src/middleware/validate.middleware';
import { authorizeRoles } from '../src/middleware/authorize.middleware';
import { registerSchema } from '../src/validations/auth.validation';
import { AuthenticatedRequest, SafeUser } from '../src/types';

describe('Middleware Tests', () => {
  describe('Validate Middleware', () => {
    it('should call next() if validation passes', async () => {
      const middleware = validate(registerSchema);
      const req = {
        body: {
          name: 'Jane Doe',
          email: 'valid.email@example.com',
          password: 'ValidPassword123!',
        },
      } as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when validation fails', async () => {
      const middleware = validate(registerSchema);
      const req = {
        body: {
          name: 'J', // too short
          email: 'not-an-email',
          password: 'weak',
        },
      } as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      await middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Authorize Roles Middleware', () => {
    it('should allow access if user has the required role', () => {
      const middleware = authorizeRoles('ADMIN');
      const req = {
        user: { role: 'ADMIN' } as SafeUser,
      } as AuthenticatedRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 Forbidden if user has a different role', () => {
      const middleware = authorizeRoles('ADMIN');
      const req = {
        user: { role: 'USER' } as SafeUser,
      } as AuthenticatedRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
