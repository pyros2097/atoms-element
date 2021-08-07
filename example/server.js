import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import renderPage from './pages/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.argv[2] || 3000;
const elements = ['app-counter.js', 'app-total.js'];
const srcMap = {
  '/index.js': `${__dirname}/../index.js`,
  '/lit-html.js': `${__dirname}/../lit-html.js`,
  '/store.js': `${__dirname}/store.js`,
};
elements.forEach((el) => {
  srcMap['/elements/' + el] = `${__dirname}/elements/${el}`;
});

http
  .createServer((req, res) => {
    if (req.url.includes('/api/posts')) {
      const parts = req.url.split('/');
      const id = parts[parts.length - 1];
      res.setHeader('Content-type', 'application/json');
      res.end(
        JSON.stringify({
          id,
          title: `post ${id}`,
          description: ` description ${id}`,
        }),
      );
      return;
    }
    if (req.url === '/') {
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      const html = renderPage({
        lang: 'en',
        props: {
          config: { lang: 'en', title: 'Counter App' },
        },
        headScript: '',
        bodyScript: `
          <script type="module">
          ${elements.map((el) => `import './elements/${el}';`).join('\n')}
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
