import API from './api.js';

const Router = (() => {
  const routes = new Map();
  let outlet = null;

  function mount(el) { outlet = el; }
  function add(path, view) { routes.set(path, view); }

  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const user = API.getUser();
    const authed = API.isAuthed();
    const items = [];
    const base = '/app';
    if (authed) {
      items.push([`${base}/dashboard`,'Dashboard']);
      items.push([`${base}/bookings`,'Bookings']);
      items.push([`${base}/services`,'Services']);
      items.push([`${base}/payments`,'Payments']);
      items.push([`${base}/reports`,'Reports']);
      items.push(['#logout', user ? (user.username || 'Logout') : 'Logout']);
    } else {
      items.push([`${base}/login`,'Login']);
    }
    nav.innerHTML = items.map(([href,label]) => `<a href="${href}" data-link>${label}</a>`).join('');
    for (const a of nav.querySelectorAll('a[data-link]')) {
      a.addEventListener('click', (e) => {
        if (a.getAttribute('href') === '#logout') {
          e.preventDefault(); API.logout(); location.hash = '#/login'; route(); return;
        }
      });
    }
    const cur = currentPath();
    for (const a of nav.querySelectorAll('a')) a.classList.toggle('active', a.getAttribute('href') === cur);
  }

  function currentPath(){
    const h = location.hash;
    if (h && h.startsWith('#/')) return h.replace('#','/app');
    if (location.pathname.startsWith('/app')) return location.pathname;
    return '/app/login';
  }

  async function route() {
    renderNav();
    const [path] = currentPath().split('?');
    const view = routes.get(path);
    if (!view) return (outlet.innerHTML = `<div class="card"><h3>Not found</h3></div>`);
    const guardLogin = ['/app/dashboard','/app/bookings','/app/services','/app/payments','/app/reports'];
    if (guardLogin.includes(path) && !API.isAuthed()) { history.replaceState(null,'','/app/login'); renderNav(); return; }
    outlet.innerHTML = await view.render();
    await view.afterRender?.();
    renderNav();
  }

  function start() {
    window.addEventListener('hashchange', route);
    window.addEventListener('popstate', route);
    route();
  }

  return { mount, add, start, route };
})();

export default Router;
