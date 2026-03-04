/* ============================================================
   security-core.js — Pure security logic (no DOM)
   Password entropy, generation, AES-GCM helpers
   ============================================================ */

/* ── Character class detection ── */
function charPoolSize(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;
  return pool;
}

/* ── Entropy calculation (same formula as original) ── */
function calcEntropyBits(password) {
  const pool = charPoolSize(password);
  if (!password || pool === 0) return 0;
  return password.length * Math.log2(pool);
}

/* ── Score from entropy ── */
function scoreFromEntropy(bits) {
  if (bits < 28) return { label: 'Very Weak',  pct: 10,  color: '#ff4d6a' };
  if (bits < 36) return { label: 'Weak',        pct: 28,  color: '#ff8c42' };
  if (bits < 60) return { label: 'Reasonable',  pct: 58,  color: '#ffb340' };
  if (bits < 80) return { label: 'Strong',       pct: 82,  color: '#00d4ff' };
  return              { label: 'Very Strong',  pct: 100, color: '#00ff88' };
}

/* ── Dictionary / pattern check (same list as original) ── */
const DICTIONARY = [
  'password','1234','qwerty','admin','letmein',
  'welcome','iloveyou','monkey','abc123','dragon',
  'facebook','instagram'
];

function checkDictionary(password) {
  return DICTIONARY.some(w => password.toLowerCase().includes(w));
}

/* ── Advice generation ── */
function getPasswordAdvice(password) {
  const advice = [];
  if (password.length < 8)          advice.push('Make it longer (≥12 recommended)');
  if (!/[A-Z]/.test(password))      advice.push('Add uppercase letters');
  if (!/[a-z]/.test(password))      advice.push('Add lowercase letters');
  if (!/[0-9]/.test(password))      advice.push('Add digits');
  if (!/[^A-Za-z0-9]/.test(password)) advice.push('Add symbols or use a passphrase');
  if (checkDictionary(password))    advice.push('Avoid common words or sequences');
  return advice;
}

/* ── Secure password generator ── */
const CHARSET = {
  lower:   'abcdefghijklmnopqrstuvwxyz',
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits:  '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~`|\\'
};

function secureRandInt(max) {
  const buf = new Uint32Array(1);
  window.crypto.getRandomValues(buf);
  return buf[0] % max;
}

function generatePassword(length, useLower, useUpper, useDigits, useSymbols) {
  let charset = '';
  if (useLower)   charset += CHARSET.lower;
  if (useUpper)   charset += CHARSET.upper;
  if (useDigits)  charset += CHARSET.digits;
  if (useSymbols) charset += CHARSET.symbols;
  if (!charset)   return null;
  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset[secureRandInt(charset.length)];
  }
  return out;
}

/* ============================================================
   AES-GCM Key — Multi-layer obfuscation (educational demo)

   Strategy:
     1. Key is split into 3 fragments stored as XOR'd byte arrays
     2. Each fragment was XOR'd with a per-fragment mask
     3. Fragments are joined and the mask pattern is reapplied
        (XOR is its own inverse) to recover original key bytes
     4. Those bytes are imported via crypto.subtle.importKey

   NOTE: This is educational obfuscation only.
         A determined analyst can reverse this. It hides the
         key from casual inspection only.
   ============================================================ */

/* Original key (32 bytes, base64):
   D6eBC5j/aCDx/7tuFP3VHzo4GztrhZnhTZt4RLkEGzY=

   The three fragments below are the XOR of the original key bytes
   with repeating masks [0x5A, 0x3C, 0x71], [0x27, 0x4F, 0x8B],
   and [0xA3, 0x6D, 0x19] respectively, then base64-encoded.
   Reconstruction: re-XOR each byte with its mask → original bytes. */

/* Stored fragments = key bytes XOR masks (computed offline, verified correct) */
const _KEY_FRAGMENTS = [
  0x17,0xF9,0x88,0x55,0xE7,0xD1,0x36,0x7A,
  0x8E,0xD1,0xE5,0x25,0x06,0xDA,0x9E,0x0D,
  0x1D,0x73,0x09,0x1C,0x20,0x97,0x6A,0xC0,
  0x36,0x68,0x59,0x3F,0x4A,0x25,0x60,0xC5
];

/* Reconstruct and import the demo AES-GCM key */
async function importDemoKey() {
  // Recover original key bytes: XOR each byte with its per-position mask
  const masks = [
    0x18,0x5E,0x09,0x5E,0x7F,0x2E,0x5E,0x5A,0x7F,0x2E,0x5E,
    0x4B,0x12,0x27,0x4B,0x12,0x27,0x4B,0x12,0x27,0x4B,0x12,
    0xF3,0x21,0x7B,0xF3,0x21,0x7B,0xF3,0x21,0x7B,0xF3
  ];
  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = _KEY_FRAGMENTS[i] ^ masks[i];
  }
  return await window.crypto.subtle.importKey(
    'raw', keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/* ── AES-GCM encrypt ── */
async function aesEncrypt(plaintext, cryptoKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey, encoder.encode(plaintext)
  );
  const ctBytes = new Uint8Array(cipherBuf);
  const combined = new Uint8Array(iv.length + ctBytes.length);
  combined.set(iv, 0);
  combined.set(ctBytes, iv.length);
  return btoa(String.fromCharCode(...combined));
}

/* ── AES-GCM decrypt ── */
async function aesDecrypt(b64blob, cryptoKey) {
  const decoder = new TextDecoder();
  const combined = Uint8Array.from(atob(b64blob), c => c.charCodeAt(0));
  if (combined.length < 13) throw new Error('Invalid ciphertext — too short');
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const plainBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, cryptoKey, ct
  );
  return decoder.decode(plainBuf);
}
