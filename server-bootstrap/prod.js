const path = require('path');
const bootstrap = require('./bootstrap');
const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, 'public');
const staticPath = path.resolve(rootPath, 'static');
const Server = require('../public/server');
const server = new Server();
bootstrap(staticPath, publicPath, () => server, true);
