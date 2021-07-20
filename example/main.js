import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import renderIndex from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.argv[2] || 3000;
const map = {
  '/element.js': `${__dirname}/../element.js`,
  '/lit-html.js': `${__dirname}/../lit-html.js`,
  '/modern-normalize.css': `${__dirname}/modern-normalize.css`,
  '/app-counter.js': `${__dirname}/app-counter.js`,
  '.js': 'text/javascript',
  '.css': 'text/css',
};

http
  .createServer(function (req, res) {
    if (req.url === '/') {
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      const html = renderIndex({
        config: { lang: 'en', title: 'Counter App' },
        headScript: '',
        bodyScript: `
          <script type="module">
           import './app-counter.js';
          </script>
        `,
      });
      res.end(html);
      return;
    }
    const filename = map[req.url];
    const data = fs.readFileSync(filename);
    const ext = path.parse(filename).ext;
    res.setHeader('Content-type', map[ext] || 'text/plain');
    res.end(data);
  })
  .listen(parseInt(port));

console.log(`Server listening on port ${port}`);
