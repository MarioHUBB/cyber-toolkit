/* ============================================================
   base_converter.js — Number Base Converter
   Supports base 2–16. Preserves all original logic exactly.
   ============================================================ */

function convertBase() {
  var number    = document.getElementById('numberInput').value.trim();
  var fromBase  = parseInt(document.getElementById('fromBase').value, 10);
  var toBase    = parseInt(document.getElementById('toBase').value, 10);
  var outEl     = document.getElementById('convOutput');

  if (!number) {
    outEl.innerHTML = '<span style="color:var(--warn)">Please enter a number.</span>';
    showToast('Enter a number first', 'warn');
    return;
  }

  try {
    var decimal = parseInt(number, fromBase);

    if (isNaN(decimal)) {
      outEl.innerHTML = '<span style="color:var(--danger)">⚠️  Invalid digits for base ' + fromBase + '</span>';
      showToast('Invalid digits for base ' + fromBase, 'error');
      return;
    }

    var result = decimal.toString(toBase).toUpperCase();

    outEl.innerHTML =
      '<span class="out-label">Base ' + fromBase + ' → Base ' + toBase + '</span>' +
      '<span class="out-value">' + result + '</span>';

    showToast('Converted ✓');

  } catch (e) {
    outEl.innerHTML = '<span style="color:var(--danger)">Error converting number.</span>';
    showToast('Conversion error', 'error');
  }
}

/* Allow pressing Enter in the input field */
document.addEventListener('DOMContentLoaded', function() {
  var inp = document.getElementById('numberInput');
  if (inp) inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') convertBase();
  });
});
