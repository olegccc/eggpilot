const express = require('express');
const path = require('path');
const mime = require('mime-types');
const WebSocket = require('ws');
const http = require('http');

module.exports = function(assetsPath, publicPath, getServer, release) {

  const server = http.createServer();
  const app = express();

  const wss = new WebSocket.Server({
      server
  });

  wss.on('connection', ws => {
      const s = getServer();
      if (s) {
        if (!s.onSocketConnection) {
          console.log('s', typeof s, s);
        }
        s.onSocketConnection(ws).catch(err => {
          s.onSocketError(err);
        });
      }
  });

  wss.on('error', err => {
      const s = getServer();
      if (s) {
        s.onSocketError(err);
      }
  });

  server.on('request', app);

  app.get('/', (req, res) => {
    res.header("Content-Type", "text/html");
    res.sendFile(path.resolve(assetsPath, 'index.html'));
  });
  ['style.css', 'roboto.woff', 'roboto.woff2', 'orbitron.woff', 'orbitron.woff2'].forEach(f => {
      const type = mime.lookup(f);
      app.get('/' + f, (req, res) => {
          res.header("Content-Type", type);
          res.sendFile(path.resolve(assetsPath, f));
      });
  });
  (release ? ['app.js'] : ['app.js', 'app.js.map']).forEach(f => {
    const type = mime.lookup(f);
    app.get('/' + f, (req, res) => {
      res.header("Content-Type", type);
      res.sendFile(path.resolve(publicPath, f));
    });
  });

  app.all('/api/*', function(req, res, next) {
    const s = getServer();
    if (s) {
      s.use(req, res, next);
    }
  });

  let port = process.env.PORT || (process.argv.length > 2 && Number(process.argv[2])) || 8080;
  server.listen(port, () => {
    console.log(`Listening on port ${port}!`);
  });
};
