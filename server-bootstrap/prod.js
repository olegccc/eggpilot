const path = require('path');
const bootstrap = require('./bootstrap');
const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, 'public');
const staticPath = path.resolve(rootPath, 'static');
const Server = require('../public/server');
bootstrap(staticPath, publicPath, () => new Server(), true);
