import { expect, test } from '@jest/globals';
import { html, css } from './element.js';
import Page from './page.js';

test('Page', () => {
  class MainPage extends Page {
    route() {
      const langPart = this.config.lang === 'en' ? '' : `/${this.config.lang}`;
      return `${langPart}`;
    }

    styles() {
      return css`
        div {
          color: red;
        }
      `;
    }

    head() {
      const { title } = this.config;
      return html`
        <title>${title}</title>
        <meta name="title" content=${title} />
        <meta name="description" content=${title} />
      `;
    }

    body() {
      const { title } = this.config;
      return html`
        <div>
          <app-header></app-header>
          <main class="flex flex-1 flex-col mt-20 items-center">
            <h1 class="text-5xl">${title}</h1>
          </main>
        </div>
      `;
    }
  }
  const scripts = '<script type="module"><script>';
  const mainPage = new MainPage({ config: { lang: 'en', title: '123' }, headScript: scripts, bodyScript: scripts });
  const res = mainPage.render();
  expect(res).toEqual(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5.0, shrink-to-fit=no">
          <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
          <link rel="icon" type="image/png" href="/assets/icon.png" />
          
        <title>123</title>
        <meta name="title" content="123">
        <meta name="description" content="123">
      
          <style>
            
        div {
          color: red;
        }
      
          </style>
          <script type="module"><script>
        </head>
        <body>
          
        <div>
          <app-header></app-header>
          <main class="flex flex-1 flex-col mt-20 items-center">
            <h1 class="text-5xl">123</h1>
          </main>
        </div>
      
          <script>
            window.__DEV__ = true;
            window.config = {"lang":"en","title":"123"};
            window.data = undefined;
            window.item = undefined;
          </script>
          <script type="module"><script>
        </body>
      </html>
  `);
});
