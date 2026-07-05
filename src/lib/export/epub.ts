import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Block, TextRun } from '@/lib/richtext'
import { slugify, escapeXml } from './utils'
import type { ExportChapter } from './types'

function runsToHtml(runs: TextRun[]): string {
  return runs
    .map((r) => {
      let t = escapeXml(r.text).replace(/\n/g, '<br/>')
      if (r.bold) t = `<strong>${t}</strong>`
      if (r.italic) t = `<em>${t}</em>`
      return t
    })
    .join('')
}

function blocksToXhtml(blocks: Block[]): string {
  const parts: string[] = []
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null

  const flush = () => {
    if (list) {
      parts.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`)
      list = null
    }
  }

  for (const b of blocks) {
    if (b.kind === 'li' || b.kind === 'oli') {
      const tag = b.kind === 'li' ? 'ul' : 'ol'
      if (!list || list.tag !== tag) {
        flush()
        list = { tag, items: [] }
      }
      list.items.push(runsToHtml(b.runs))
      continue
    }
    flush()
    const html = runsToHtml(b.runs)
    switch (b.kind) {
      case 'h1':
        parts.push(`<h1>${html}</h1>`)
        break
      case 'h2':
        parts.push(`<h2>${html}</h2>`)
        break
      case 'h3':
        parts.push(`<h3>${html}</h3>`)
        break
      case 'blockquote':
        parts.push(`<blockquote><p>${html}</p></blockquote>`)
        break
      case 'hr':
        parts.push('<hr/>')
        break
      default:
        parts.push(`<p>${html}</p>`)
    }
  }
  flush()
  return parts.join('\n')
}

export async function exportEpub(projectName: string, author: string, chapters: ExportChapter[]): Promise<void> {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  zip.folder('META-INF')!.file(
    'container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )

  const oebps = zip.folder('OEBPS')!
  oebps.file(
    'styles.css',
    `body{font-family:serif;line-height:1.6;margin:1.5em;}
h1{font-size:1.6em;margin-bottom:0.2em;}
h2{font-size:1.3em;}
h3{font-size:1.1em;}
blockquote{border-left:3px solid #999;margin-left:0;padding-left:1em;font-style:italic;}
.subtitle{font-style:italic;text-align:center;margin-bottom:2em;color:#555;}`,
  )

  const uid = `urn:uuid:worldwelder-${Date.now()}`
  const manifestItems: string[] = []
  const spineItems: string[] = []
  const navPoints: string[] = []

  chapters.forEach((ch, idx) => {
    const n = idx + 1
    const id = `chap${n}`
    const fileName = `text/chapter-${n}.xhtml`
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles.css"/>
</head>
<body>
<h1>${escapeXml(ch.title)}</h1>
${ch.subtitle ? `<p class="subtitle">${escapeXml(ch.subtitle)}</p>` : ''}
${blocksToXhtml(ch.blocks)}
</body>
</html>`
    oebps.file(fileName, xhtml)
    manifestItems.push(`<item id="${id}" href="${fileName}" media-type="application/xhtml+xml"/>`)
    spineItems.push(`<itemref idref="${id}"/>`)
    navPoints.push(
      `<navPoint id="navpoint-${n}" playOrder="${n}"><navLabel><text>${escapeXml(
        ch.title,
      )}</text></navLabel><content src="${fileName}"/></navPoint>`,
    )
  })

  oebps.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(projectName)}</dc:title>
    <dc:creator>${escapeXml(author || 'Unknown')}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">${uid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`,
  )

  oebps.file(
    'toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uid}"/>
  </head>
  <docTitle><text>${escapeXml(projectName)}</text></docTitle>
  <navMap>
    ${navPoints.join('\n    ')}
  </navMap>
</ncx>`,
  )

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })
  saveAs(blob, `${slugify(projectName)}.epub`)
}
