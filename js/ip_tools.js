/* ============================================================
   ip_tools.js — IP Addressing & Subnet Calculator
   Preserves all original calculation logic exactly.
   Adds modern UI feedback via showToast() from ui.js.
   ============================================================ */

/* ── Helper: IP ↔ 32-bit number ── */
function ipToNumber(ip) {
  return ip.split('.').reduce(function(acc, octet) {
    return (acc << 8) + parseInt(octet, 10);
  }, 0) >>> 0;
}

function numberToIp(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8)  & 255,
     num         & 255
  ].join('.');
}

/* ── CIDR ↔ Mask conversion ── */
function cidrToMask(cidr) {
  return numberToIp((~((1 << (32 - cidr)) - 1)) >>> 0);
}

function maskToCidr(mask) {
  var maskNum = ipToNumber(mask);
  var cidr = 0;
  for (var i = 31; i >= 0; i--) {
    if ((maskNum >>> i) & 1) cidr++;
    else break;
  }
  return '/' + cidr;
}

/* ── Mask ↔ CIDR converter (UI) ── */
function convertMask() {
  var input  = document.getElementById('maskInput').value.trim();
  var outEl  = document.getElementById('maskOutput');
  var result = '';

  if (input.startsWith('/')) {
    var cidr = parseInt(input.replace('/', ''), 10);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      result = '⚠️  Invalid CIDR (must be /0 – /32)';
    } else {
      result = 'Subnet Mask: ' + cidrToMask(cidr);
    }
  } else if (input.includes('.')) {
    var parts = input.split('.');
    if (parts.length !== 4 || parts.some(function(p) {
      return isNaN(p) || p < 0 || p > 255;
    })) {
      result = '⚠️  Invalid subnet mask';
    } else {
      result = 'CIDR Notation: ' + maskToCidr(input);
    }
  } else {
    result = '⚠️  Enter /24 or 255.255.255.0';
  }

  outEl.textContent = result;
  showToast(result.startsWith('⚠️') ? 'Check your input' : 'Converted!',
            result.startsWith('⚠️') ? 'warn' : 'info');
}

/* ── Subnet calculator (UI) ── */
function calculateSubnet() {
  var ip         = document.getElementById('ipAddress').value.trim();
  var maskInput  = document.getElementById('subnetMask').value.trim();
  var outEl      = document.getElementById('subnetOutput');

  /* Validate IP */
  var ipOctets = ip.split('.').map(Number);
  if (ipOctets.length !== 4 || ipOctets.some(function(o) {
    return isNaN(o) || o < 0 || o > 255;
  })) {
    outEl.innerHTML = '<span style="color:var(--danger)">⚠️  Invalid IP address</span>';
    showToast('Invalid IP address', 'error');
    return;
  }

  /* Parse CIDR */
  var maskCidr;
  if (maskInput.startsWith('/')) {
    maskCidr = parseInt(maskInput.replace('/', ''), 10);
  } else {
    maskCidr = parseInt(maskToCidr(maskInput).replace('/', ''), 10);
  }

  if (isNaN(maskCidr) || maskCidr < 0 || maskCidr > 32) {
    outEl.innerHTML = '<span style="color:var(--danger)">⚠️  Invalid subnet mask</span>';
    showToast('Invalid subnet mask', 'error');
    return;
  }

  var ipNum        = ipToNumber(ip);
  var maskNum      = (~0 << (32 - maskCidr)) >>> 0;
  var networkNum   = (ipNum & maskNum) >>> 0;
  var broadcastNum = (networkNum | (~maskNum >>> 0)) >>> 0;
  var firstUsable  = maskCidr < 31 ? networkNum + 1   : networkNum;
  var lastUsable   = maskCidr < 31 ? broadcastNum - 1 : broadcastNum;
  var totalHosts   = Math.pow(2, 32 - maskCidr);
  var usableHosts  = maskCidr < 31 ? totalHosts - 2   : totalHosts;

  /* Build result table */
  var rows = [
    ['Network Address',  numberToIp(networkNum)],
    ['Broadcast Address',numberToIp(broadcastNum)],
    ['Usable Range',     numberToIp(firstUsable) + ' – ' + numberToIp(lastUsable)],
    ['CIDR Notation',    '/' + maskCidr],
    ['Subnet Mask',      cidrToMask(maskCidr)],
    ['Total Hosts',      totalHosts.toLocaleString()],
    ['Usable Hosts',     usableHosts.toLocaleString()]
  ];

  var html = '<table class="result-table">';
  rows.forEach(function(r) {
    html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>';
  });
  html += '</table>';

  outEl.innerHTML = html;
  showToast('Subnet calculated ✓');
}

/* ── DOM-ready: bind Enter key to buttons ── */
document.addEventListener('DOMContentLoaded', function() {
  var maskInput = document.getElementById('maskInput');
  var ipInput   = document.getElementById('ipAddress');
  var subInput  = document.getElementById('subnetMask');

  if (maskInput) maskInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') convertMask();
  });
  if (subInput) subInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') calculateSubnet();
  });
  if (ipInput) ipInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') calculateSubnet();
  });
});
