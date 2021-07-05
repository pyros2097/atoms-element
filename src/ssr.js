import parse5 from 'parse5';
import { getElement, render } from '../src/index.js';

export const find = async (node) => {
  for (const child of node.childNodes) {
    if (getElement(child.tagName)) {
      const element = getElement(child.tagName);
      const elementInstance = new element.Clazz(child.attrs);
      const res = elementInstance.render();
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
