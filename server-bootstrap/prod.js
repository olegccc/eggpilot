const path = require('path');
const mongodb = require('mongodb');
const bootstrap = require('./bootstrap');
const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, 'public');
const staticPath = path.resolve(rootPath, 'static');
const Server = require('../public/server');
const server = new Server(true);
server.initialize(mongodb).then(() => {
  bootstrap(staticPath, publicPath, () => server, true);
});

