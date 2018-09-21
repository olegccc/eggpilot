const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const bootstrap = require('./bootstrap');

const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, 'public');
const staticPath = path.resolve(rootPath, 'static');

const serverModule = 'server.js';
const serverJsFile = path.resolve(publicPath, serverModule);

require('source-map-support').install({
  retrieveSourceMap: function(source) {
    if (source === serverModule) {
      return {
        url: serverModule,
        map: fs.readFileSync(path.resolve(publicPath, serverModule + '.map'), 'utf8')
      };
    }
    return null;
  }
});

function loadServer() {
  var server;
  const file = fs.readFileSync(serverJsFile, { encoding: 'utf8' });
  var Module = module.constructor;
  var m = new Module();
  m._compile(file, serverModule);
  return m.exports;
}

let server = null;

const watchOptions = require('../config/rollup.config');

watchOptions.watch = {
  include: ['app/**', 'server/**']
};

const watcher = rollup.watch(watchOptions);

watcher.on('event', event => {
  switch (event.code) {
    case 'BUNDLE_END':
      if (event.input === 'server/index.js') {
        try {
          console.log('Server compilation done.');
          const Server = loadServer();
          server = new Server();
        } catch (err) {
          console.log('error', err);
        }
      } else {
        console.log('Client compilation done.');
      }
      break;
  }
});

bootstrap(staticPath, publicPath, () => server, false);
