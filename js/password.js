/* ============================================================
   password.js — Password strength checker & generator UI
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const pwInput      = document.getElementById('passwordInput');
  const showToggle   = document.getElementById('showPassword');
  const bar          = document.getElementById('strengthBar');
  const scoreLabel   = document.getElementById('scoreLabel');
  const entropyLabel = document.getElementById('entropyLabel');
  const adviceList   = document.getElementById('adviceList');
  const pwLength     = document.getElementById('pwLength');
  const generateBtn  = document.getElementById('generateBtn');
  const copyPwBtn    = document.getElementById('copyPwBtn');
  const useLower     = document.getElementById('useLower');
  const useUpper     = document.getElementById('useUpper');
  const useDigits    = document.getElementById('useDigits');
  const useSymbols   = document.getElementById('useSymbols');

  /* ── Strength update ── */
  function updateStrength() {
    const pw   = pwInput.value || '';
    const bits = Math.round(calcEntropyBits(pw));
    const s    = scoreFromEntropy(bits);

    bar.style.width      = s.pct + '%';
    bar.style.background = s.color;
    scoreLabel.textContent  = s.label;
    scoreLabel.style.color  = s.color;
    entropyLabel.textContent = `Entropy ≈ ${bits} bits`;

    const advice = getPasswordAdvice(pw);
    adviceList.innerHTML = advice.length
      ? advice.map(a => `<li>${a}</li>`).join('')
      : '<li style="color:var(--accent3);border-left-color:var(--accent3)">Looks good! 🔒</li>';
  }

  pwInput.addEventListener('input', updateStrength);

  /* ── Show/hide toggle ── */
  showToggle.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    showToggle.textContent = isText ? '👁️' : '🙈';
  });

  /* ── Generator ── */
  generateBtn.addEventListener('click', () => {
    let len = parseInt(pwLength.value, 10) || 16;
    len = Math.min(Math.max(len, 8), 32);
    const pwd = generatePassword(len, useLower.checked, useUpper.checked, useDigits.checked, useSymbols.checked);
    if (!pwd) { showToast('Select at least one character set', 'warn'); return; }
    pwInput.value = pwd;
    updateStrength();
    showToast('Password generated!', 'info');
  });

  /* ── Copy password ── */
  copyPwBtn.addEventListener('click', async () => {
    const val = pwInput.value;
    if (!val) { showToast('Nothing to copy', 'warn'); return; }
    try {
      await navigator.clipboard.writeText(val);
      showToast('Password copied to clipboard! 📋');
    } catch (e) {
      showToast('Copy failed: ' + e.message, 'error');
    }
  });

  // Initial render
  updateStrength();
});
