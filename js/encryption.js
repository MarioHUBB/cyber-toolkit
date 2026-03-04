/* ============================================================
   encryption.js — Encryption / Decryption page UI
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const inputText  = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  const encryptBtn = document.getElementById('encryptBtn');
  const decryptBtn = document.getElementById('decryptBtn');
  const copyOutBtn = document.getElementById('copyOutBtn');
  const keyStatus  = document.getElementById('keyStatus');

  let cryptoKey = null;

  /* ── Import demo key on load ── */
  encryptBtn.disabled = true;
  decryptBtn.disabled = true;

  try {
    cryptoKey = await importDemoKey();
    if (keyStatus) {
      keyStatus.textContent = '🔑 Demo key loaded — AES-256-GCM ready';
      keyStatus.style.color = 'var(--accent3)';
    }
    encryptBtn.disabled = false;
    decryptBtn.disabled = false;
  } catch (e) {
    if (keyStatus) {
      keyStatus.textContent = '⚠️ Key import failed: ' + e.message;
      keyStatus.style.color = 'var(--danger)';
    }
    showToast('Failed to initialise crypto key: ' + e.message, 'error', 5000);
  }

  /* ── Encrypt ── */
  encryptBtn.addEventListener('click', async () => {
    const txt = inputText.value.trim();
    if (!txt) { showToast('Enter text to encrypt', 'warn'); return; }
    encryptBtn.disabled = true;
    encryptBtn.textContent = 'Encrypting…';
    try {
      outputText.value = await aesEncrypt(txt, cryptoKey);
      showToast('Encryption successful 🔒');
    } catch (e) {
      showToast('Encryption failed: ' + e.message, 'error');
    } finally {
      encryptBtn.disabled = false;
      encryptBtn.textContent = 'Encrypt';
    }
  });

  /* ── Decrypt ── */
  decryptBtn.addEventListener('click', async () => {
    const txt = inputText.value.trim();
    if (!txt) { showToast('Paste ciphertext to decrypt', 'warn'); return; }
    decryptBtn.disabled = true;
    decryptBtn.textContent = 'Decrypting…';
    try {
      outputText.value = await aesDecrypt(txt, cryptoKey);
      showToast('Decryption successful 🔓');
    } catch (e) {
      showToast('Decryption failed — ensure you pasted valid ciphertext', 'error');
    } finally {
      decryptBtn.disabled = false;
      decryptBtn.textContent = 'Decrypt';
    }
  });

  /* ── Copy output ── */
  copyOutBtn.addEventListener('click', async () => {
    const val = outputText.value;
    if (!val) { showToast('Nothing to copy', 'warn'); return; }
    try {
      await navigator.clipboard.writeText(val);
      showToast('Output copied to clipboard! 📋');
    } catch (e) {
      showToast('Copy failed: ' + e.message, 'error');
    }
  });
});
