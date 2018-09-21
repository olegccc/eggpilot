const bootstrap = require('./bootstrap');
const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, 'public');
const staticPath = path.resolve(rootPath, 'static');
const server = require('./server');
bootstrap(staticPath, publicPath, () => server, true);
