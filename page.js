import parse5 from 'parse5';
import { AtomsElement, render } from './element.js';

export const find = (node) => {
  for (const child of node.childNodes) {
    if (AtomsElement.getElement(child.tagName)) {
      const Clazz = AtomsElement.getElement(child.tagName);
      const instance = new Clazz(child.attrs);
      const res = instance.renderTemplate();
      const frag = parse5.parseFragment(res);
      child.childNodes.push(...frag.childNodes);
    }
    if (child.childNodes) {
      find(child);
    }
  }
};

export const ssr = (template) => {
  const text = render(template);
  const h = parse5.parseFragment(text);
  find(h);
  return parse5.serialize(h);
};

export const createPage = ({ route, datapaths, head, body, styles }) => {
  return ({ config, data, item, headScript, bodyScript }) => {
    const isProd = process.env.NODE_ENV === 'production';
    const props = { config, data, item };
    const headHtml = ssr(head(props));
    const bodyHtml = ssr(body(props));
    return `
      <!DOCTYPE html>
      <html lang="${config.lang}">
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5.0, shrink-to-fit=no">
          <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
          <link rel="icon" type="image/png" href="/assets/icon.png" />
          ${headHtml}
          <style>
            ${styles.render()}
          </style>
          ${headScript}
        </head>
        <body>
          ${bodyHtml}
          <script>
            window.__DEV__ = ${!isProd};
            window.config = ${JSON.stringify(config)};
            window.data = ${JSON.stringify(data)};
            window.item = ${JSON.stringify(item)};
          </script>
          ${bodyScript}
        </body>
      </html>
  `;
  };
};
