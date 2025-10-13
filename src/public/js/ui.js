export function toast(message, type = 'success', title = '') {
  const root = document.getElementById('toasts');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="title">${title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice')}</div>
                  <div class="msg">${message}</div>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(5px)';
    setTimeout(() => root.removeChild(el), 300);
  }, 3000);
}

export const fmt = {
  date(d){ try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; } },
  dt(d){ try { return new Date(d).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }); } catch { return d; } },
  money(n){ const x = Number(n); return Number.isFinite(x) ? x.toLocaleString('en-LK',{style:'currency',currency:'LKR'}) : n; },
};

