import API from '../api.js';

const LoginView = {
  async render() {
    return /* html */`
      <div class="grid cols-2">
        <section class="card">
          <h2>Sign in</h2>
          <p class="muted">Use your Skynest admin credentials.</p>
          <form id="loginForm" class="grid">
            <div>
              <label>Username</label>
              <input name="username" autocomplete="username" required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" name="password" autocomplete="current-password" required />
            </div>
            <button class="primary" type="submit">Sign in</button>
            <div id="loginError" class="alert error" style="display:none"></div>
          </form>
        </section>
        <section class="card">
          <h3>About</h3>
          <p class="muted">This panel manages bookings, services, payments and reports.</p>
          <ul>
            <li>Create bookings and update status</li>
            <li>Record services used against a booking</li>
            <li>Accept payments and adjustments</li>
            <li>View operational and revenue reports</li>
          </ul>
        </section>
      </div>
    `;
  },
  async afterRender() {
    const form = document.getElementById('loginForm');
    const errEl = document.getElementById('loginError');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.style.display = 'none';
      const fd = new FormData(form);
      try {
        await API.login(fd.get('username'), fd.get('password'));
        history.pushState(null,'','/app/dashboard');
        window.dispatchEvent(new Event('popstate'));
      } catch (err) {
        errEl.textContent = err.message || 'Login failed';
        errEl.style.display = '';
      }
    });
  }
};

export default LoginView;
