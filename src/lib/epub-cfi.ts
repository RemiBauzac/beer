import type { CfiLocation, CfiStep } from '@/model/types';

export function parseCfi(cfiStr: string): CfiLocation {
  const invalid: CfiLocation = { spineIndex: -1, spineId: '', steps: [], charOffset: 0 };

  if (typeof cfiStr !== 'string') return invalid;

  let str = cfiStr;
  if (str.startsWith('epubcfi(') && str.endsWith(')')) str = str.slice(8, -1);

  const bangIdx = str.indexOf('!');
  if (bangIdx === -1) return invalid;

  const chapterPart = str.slice(0, bangIdx);
  const rest = str.slice(bangIdx + 1);

  const colonIdx = rest.indexOf(':');
  const pathPart = colonIdx === -1 ? rest : rest.slice(0, colonIdx);
  const offsetPart = colonIdx === -1 ? '' : rest.slice(colonIdx + 1);

  const chapSegment = chapterPart.split('/')[2] ?? '';
  if (!chapSegment) return invalid;

  const spineIndex = parseInt(chapSegment) / 2 - 1 || 0;
  const chapIdMatch = chapSegment.match(/\[(.+)\]/);
  const spineId = chapIdMatch?.[1] ?? '';

  const pathSegments = pathPart.split('/').filter(Boolean);
  const steps: CfiStep[] = [];

  for (const seg of pathSegments) {
    const idMatch = seg.match(/\[(.+)\]/);
    const num = parseInt(seg);
    if (isNaN(num)) continue;
    if (num % 2 === 0) {
      steps.push({ index: num / 2 - 1, id: idMatch?.[1] });
    } else {
      steps.push({ index: (num - 1) / 2 });
    }
  }

  const assertionMatch = offsetPart.match(/\[(.+)\]/);
  const charOffset = parseInt(assertionMatch ? offsetPart.split('[')[0]! : offsetPart) || 0;

  return { spineIndex, spineId, steps, charOffset };
}

export function generateChapterCfi(spineNodeIndex: number, pos: number, id: string): string {
  const spineStep = (spineNodeIndex + 1) * 2;
  const posStep = (pos + 1) * 2;
  return `/${spineStep}/${posStep}${id ? `[${id}]` : ''}`;
}

export function generateCfiFromElement(el: Element, chapterCfi: string): string {
  const steps = pathToElement(el);
  const path = stepsToPath(steps);
  if (!path) return `epubcfi(${chapterCfi}!/4/)`;
  return `epubcfi(${chapterCfi}!/${path}/1:0)`;
}

export function compareCfi(a: string, b: string): -1 | 0 | 1 {
  const ca = parseCfi(a);
  const cb = parseCfi(b);

  if (ca.spineIndex !== cb.spineIndex) return ca.spineIndex > cb.spineIndex ? 1 : -1;

  const len = Math.max(ca.steps.length, cb.steps.length);
  for (let i = 0; i < len; i++) {
    const sa = ca.steps[i];
    const sb = cb.steps[i];
    if (!sa) return -1;
    if (!sb) return 1;
    if (sa.index !== sb.index) return sa.index > sb.index ? 1 : -1;
  }

  if (ca.charOffset !== cb.charOffset) return ca.charOffset > cb.charOffset ? 1 : -1;
  return 0;
}

export function generateRangeFromCfi(cfiStr: string, doc: Document): Range | null {
  const cfi = parseCfi(cfiStr);
  if (cfi.spineIndex === -1 || !cfi.steps.length) return null;

  const lastStep = cfi.steps[cfi.steps.length - 1]!;

  const query = cfiToQuerySelector(cfiStr);
  const parent = doc.querySelector(query);

  const startContainer: Node | null =
    parent && lastStep.id === undefined && cfi.charOffset >= 0
      ? (parent.childNodes[lastStep.index] ?? null)
      : parent;

  if (!startContainer) return null;

  const range = doc.createRange();
  if (cfi.charOffset >= 0 && startContainer.nodeType === Node.TEXT_NODE) {
    const len = (startContainer as Text).length;
    const offset = Math.min(cfi.charOffset, len);
    range.setStart(startContainer, offset);
    range.setEnd(startContainer, len);
  } else {
    range.selectNode(startContainer);
  }
  return range;
}

export function cfiToQuerySelector(cfiStr: string): string {
  const { steps } = parseCfi(cfiStr);
  const parts = ['html'];
  for (const step of steps) {
    if (step.id) {
      parts.push(`#${step.id}`);
    } else {
      parts.push(`*:nth-child(${step.index + 1})`);
    }
  }
  return parts.join('>');
}

function pathToElement(node: Element): CfiStep[] {
  const stack: CfiStep[] = [];
  let current: Element | null = node;
  while (current?.parentElement) {
    const siblings = Array.from(current.parentElement.children);
    stack.unshift({ index: siblings.indexOf(current), id: current.id || undefined });
    current = current.parentElement;
  }
  return stack;
}

function stepsToPath(steps: CfiStep[]): string {
  return steps.map((s) => `${(s.index + 1) * 2}${s.id ? `[${s.id}]` : ''}`).join('/');
}
