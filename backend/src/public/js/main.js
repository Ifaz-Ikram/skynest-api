import Router from './router.js';
import Login from './views/login.js';
import Dashboard from './views/dashboard.js';
import Bookings from './views/bookings.js';
import Services from './views/services.js';
import Payments from './views/payments.js';
import Reports from './views/reports.js';

document.getElementById('year').textContent = new Date().getFullYear();

const outlet = document.getElementById('app');
Router.mount(outlet);

Router.add('/app/login', Login);
Router.add('/app/dashboard', Dashboard);
Router.add('/app/bookings', Bookings);
Router.add('/app/services', Services);
Router.add('/app/payments', Payments);
Router.add('/app/reports', Reports);

Router.start();
