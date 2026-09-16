import { hashPassword, comparePassword } from '../src/utils/password';

describe('Password Utilities', () => {
  const plainPassword = 'SuperSecurePassword123!';

  it('should hash the password using bcrypt with salt rounds', async () => {
    const hash = await hashPassword(plainPassword);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(plainPassword);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  it('should successfully verify the correct password against hash', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await comparePassword(plainPassword, hash);
    expect(isValid).toBe(true);
  });

  it('should fail verification with wrong password', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await comparePassword('IncorrectPassword123!', hash);
    expect(isValid).toBe(false);
  });
});
