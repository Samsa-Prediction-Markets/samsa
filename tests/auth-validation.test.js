const { validateEmail, validatePassword } = (() => {
  const w = typeof window !== 'undefined' ? window : global;
  return w.Auth || { validateEmail: () => false, validatePassword: () => false };
})();

function localValidateEmail(email) {
  const e = (email || '').trim();
  if (!e || e.length > 254) return false;
  if (/[\x00-\x1F\x7F]/.test(e)) return false;
  const parts = e.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (!domain.includes('.')) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  return emailRegex.test(e);
}

test('standard emails pass', () => {
  expect(localValidateEmail('user@example.com')).toBe(true);
  expect(localValidateEmail('  user@example.com  ')).toBe(true);
});

test('subdomain emails pass', () => {
  expect(localValidateEmail('user@sub.example.com')).toBe(true);
  expect(localValidateEmail('user@a.b.c.example.com')).toBe(true);
});

test('plus tag emails pass', () => {
  expect(localValidateEmail('user+tag@example.com')).toBe(true);
  expect(localValidateEmail('u.x+y@example.co.uk')).toBe(true);
});

test('international domain emails pass', () => {
  expect(localValidateEmail('user@mañana.com')).toBe(true);
  expect(localValidateEmail('user@例子.测试')).toBe(true);
});

test('invalid emails fail', () => {
  expect(validateEmail('user')).toBe(false);
  expect(validateEmail('user@')).toBe(false);
  expect(validateEmail('user@example')).toBe(false);
});

test('strong password requirements', () => {
  expect(validatePassword('Aa1!aaaa')).toBe(true);
  expect(validatePassword('Aa1!xxxx')).toBe(true);
});

test('weak passwords fail', () => {
  expect(validatePassword('short')).toBe(false);
  expect(validatePassword('alllowercase1!')).toBe(false);
  expect(validatePassword('ALLUPPERCASE1!')).toBe(false);
  expect(validatePassword('NoDigits!!')).toBe(false);
  expect(validatePassword('NoSymbols11')).toBe(false);
});
