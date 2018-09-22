const path = require('path');
const bootstrap = require('./bootstrap');
const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, 'public');
const staticPath = path.resolve(rootPath, 'static');
const server = require('../public/server');
bootstrap(staticPath, publicPath, () => server, true);
