import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import renderIndex from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.argv[2] || 3000;
const srcMap = {
  '/element.js': `${__dirname}/../element.js`,
  '/lit-html.js': `${__dirname}/../lit-html.js`,
  '/styles.js': `${__dirname}/styles.js`,
  '/app-counter.js': `${__dirname}/app-counter.js`,
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
    const filename = srcMap[req.url];
    if (filename) {
      const data = fs.readFileSync(filename);
      res.setHeader('Content-type', 'application/javascript');
      res.end(data);
    }
  })
  .listen(parseInt(port));

console.log(`Server listening on http://localhost:${port}`);
