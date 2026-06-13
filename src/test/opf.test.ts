import { describe, it, expect } from 'vitest';
import { parseContainer, parseOpf } from '@/model/opf';

const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const epub2Opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Book</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Test Publisher</dc:publisher>
    <dc:identifier id="uid">urn:uuid:12345678-1234-1234-1234-123456789012</dc:identifier>
    <meta name="cover" content="cover-img"/>
  </metadata>
  <manifest>
    <item id="cover-img" href="images/cover.jpg" media-type="image/jpeg"/>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
    <itemref idref="ch2"/>
  </spine>
</package>`;

const epub3Opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>EPUB3 Book</dc:title>
    <dc:creator>Author Name</dc:creator>
    <dc:language>fr</dc:language>
    <dc:identifier id="uid">book-id-001</dc:identifier>
  </metadata>
  <manifest>
    <item id="cover-img" href="images/cover.png" media-type="image/png" properties="cover-image"/>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`;

describe('parseContainer', () => {
  it('returns OPF path from container.xml', async () => {
    expect(await parseContainer(containerXml)).toBe('OEBPS/content.opf');
  });

  it('throws for missing rootfile', async () => {
    await expect(parseContainer('<container/>')).rejects.toThrow();
  });
});

describe('parseOpf — epub2', () => {
  it('parses metadata', async () => {
    const { metadata } = await parseOpf(epub2Opf, 'OEBPS/content.opf');
    expect(metadata.title).toBe('Test Book');
    expect(metadata.author).toBe('Test Author');
    expect(metadata.language).toBe('en');
    expect(metadata.publisher).toBe('Test Publisher');
  });

  it('resolves manifest hrefs relative to OPF path', async () => {
    const { manifest } = await parseOpf(epub2Opf, 'OEBPS/content.opf');
    expect(manifest.find((i) => i.id === 'ch1')?.href).toBe('OEBPS/chapter1.xhtml');
  });

  it('orders spine correctly', async () => {
    const { spine } = await parseOpf(epub2Opf, 'OEBPS/content.opf');
    expect(spine[0]?.id).toBe('ch1');
    expect(spine[1]?.id).toBe('ch2');
  });

  it('detects cover via meta name=cover', async () => {
    const { metadata } = await parseOpf(epub2Opf, 'OEBPS/content.opf');
    expect(metadata.coverHref).toContain('cover.jpg');
  });

  it('generates CFI for each spine item', async () => {
    const { spine } = await parseOpf(epub2Opf, 'OEBPS/content.opf');
    expect(spine[0]?.cfi).toMatch(/^\//);
    expect(spine[1]?.cfi).toMatch(/^\//);
    expect(spine[0]?.cfi).not.toBe(spine[1]?.cfi);
  });
});

describe('parseOpf — epub3', () => {
  it('detects cover via properties=cover-image', async () => {
    const { metadata } = await parseOpf(epub3Opf, 'OEBPS/content.opf');
    expect(metadata.coverHref).toContain('cover.png');
  });

  it('parses language', async () => {
    const { metadata } = await parseOpf(epub3Opf, 'OEBPS/content.opf');
    expect(metadata.language).toBe('fr');
  });
});
