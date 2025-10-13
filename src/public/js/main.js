import API from './api.js';
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

Router.add('#/login', Login);
Router.add('#/dashboard', Dashboard);
Router.add('#/bookings', Bookings);
Router.add('#/services', Services);
Router.add('#/payments', Payments);
Router.add('#/reports', Reports);

Router.start();

