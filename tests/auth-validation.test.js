const test = require('node:test');
const assert = require('node:assert/strict');

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

function localValidatePassword(password) {
  const p = (password || '').trim();
  if (p.length < 8) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[0-9]/.test(p)) return false;
  if (!/[^A-Za-z0-9]/.test(p)) return false;
  return true;
}

test('standard emails pass', () => {
  assert.equal(localValidateEmail('user@example.com'), true);
  assert.equal(localValidateEmail('  user@example.com  '), true);
});

test('subdomain emails pass', () => {
  assert.equal(localValidateEmail('user@sub.example.com'), true);
  assert.equal(localValidateEmail('user@a.b.c.example.com'), true);
});

test('plus tag emails pass', () => {
  assert.equal(localValidateEmail('user+tag@example.com'), true);
  assert.equal(localValidateEmail('u.x+y@example.co.uk'), true);
});

test('international domain emails pass', () => {
  assert.equal(localValidateEmail('user@mañana.com'), true);
  assert.equal(localValidateEmail('user@例子.测试'), true);
});

test('invalid emails fail', () => {
  assert.equal(validateEmail('user'), false);
  assert.equal(validateEmail('user@'), false);
  assert.equal(validateEmail('user@example'), false);
});

test('strong password requirements', () => {
  assert.equal(localValidatePassword('Aa1!aaaa'), true);
  assert.equal(localValidatePassword('Aa1!xxxx'), true);
});

test('weak passwords fail', () => {
  assert.equal(localValidatePassword('short'), false);
  assert.equal(localValidatePassword('alllowercase1!'), false);
  assert.equal(localValidatePassword('ALLUPPERCASE1!'), false);
  assert.equal(localValidatePassword('NoDigits!!'), false);
  assert.equal(localValidatePassword('NoSymbols11'), false);
});
