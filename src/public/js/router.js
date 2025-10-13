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
    if (authed) {
      items.push(['#/dashboard','Dashboard']);
      items.push(['#/bookings','Bookings']);
      items.push(['#/services','Services']);
      items.push(['#/payments','Payments']);
      items.push(['#/reports','Reports']);
      items.push(['#logout', user ? (user.username || 'Logout') : 'Logout']);
    } else {
      items.push(['#/login','Login']);
    }
    nav.innerHTML = items.map(([href,label]) => `<a href="${href}" data-link>${label}</a>`).join('');
    for (const a of nav.querySelectorAll('a[data-link]')) {
      a.addEventListener('click', (e) => {
        if (a.getAttribute('href') === '#logout') {
          e.preventDefault(); API.logout(); location.hash = '#/login'; route(); return;
        }
      });
    }
    const hash = location.hash || '#/login';
    for (const a of nav.querySelectorAll('a')) a.classList.toggle('active', a.getAttribute('href') === hash);
  }

  async function route() {
    renderNav();
    const hash = location.hash || '#/login';
    const [path] = hash.split('?');
    const view = routes.get(path);
    if (!view) return (outlet.innerHTML = `<div class="card"><h3>Not found</h3></div>`);
    const guardLogin = ['#/dashboard','#/bookings','#/services','#/payments','#/reports'];
    if (guardLogin.includes(path) && !API.isAuthed()) { location.hash = '#/login'; renderNav(); return; }
    outlet.innerHTML = await view.render();
    await view.afterRender?.();
    renderNav();
  }

  function start() {
    window.addEventListener('hashchange', route);
    route();
  }

  return { mount, add, start, route };
})();

export default Router;

