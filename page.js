import parse5 from 'parse5';
import AtomsElement, { render } from './element.js';

export default class Page {
  constructor({ config, data, item, headScript, bodyScript }) {
    this.config = config;
    this.data = data;
    this.item = item;
    this.headScript = headScript;
    this.bodyScript = bodyScript;
  }

  find(node) {
    for (const child of node.childNodes) {
      if (AtomsElement.getElement(child.tagName)) {
        const Clazz = AtomsElement.getElement(child.tagName);
        const instance = new Clazz(child.attrs);
        const res = render(instance.render());
        const frag = parse5.parseFragment(res);
        child.childNodes.push(...frag.childNodes);
      }
      if (child.childNodes) {
        this.find(child);
      }
    }
  }

  ssr(template) {
    const text = render(template);
    const h = parse5.parseFragment(text);
    this.find(h);
    return parse5.serialize(h);
  }

  render() {
    const isProd = process.env.NODE_ENV === 'production';
    const props = { config: this.config, data: this.data, item: this.item };
    const headHtml = this.ssr(this.head(props));
    const stylesCss = this.styles(props).cssText;
    const bodyHtml = this.ssr(this.body(props));
    return `
      <!DOCTYPE html>
      <html lang="${this.config.lang}">
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5.0, shrink-to-fit=no">
          <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
          <link rel="icon" type="image/png" href="/assets/icon.png" />
          ${headHtml}
          <style>
            ${stylesCss}
          </style>
          ${this.headScript}
        </head>
        <body>
          ${bodyHtml}
          <script>
            window.__DEV__ = ${!isProd};
            window.config = ${JSON.stringify(this.config)};
            window.data = ${JSON.stringify(this.data)};
            window.item = ${JSON.stringify(this.item)};
          </script>
          ${this.bodyScript}
        </body>
      </html>
  `;
  }
}
