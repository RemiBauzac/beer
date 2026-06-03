export default function domToJson(element) {
  if (!element) return null;
  const obj = {};

  for (const attr of element.attributes) {
    obj[`_${attr.name}`] = attr.value;
  }

  const children = Array.from(element.children);
  const grouped = {};
  for (const child of children) {
    const tag = child.tagName.replace(/^[^:]+:/, '');
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(domToJson(child));
  }

  for (const [tag, nodes] of Object.entries(grouped)) {
    obj[tag] = nodes.length === 1 ? nodes[0] : nodes;
  }

  if (children.length === 0) {
    const text = element.textContent.trim();
    if (text) obj.__text = text;
  }

  return obj;
}
