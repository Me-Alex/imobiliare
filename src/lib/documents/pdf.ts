import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

export function wrapPdfLine(value: string, font: Pick<PDFFont, 'widthOfTextAtSize'>, size: number, maxWidth: number): string[] {
  if (!value.trim()) return ['']
  const lines: string[] = []
  let line = ''
  for (const word of value.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue }
    if (line) lines.push(line)
    line = ''
    for (const character of word) {
      if (line && font.widthOfTextAtSize(line + character, size) > maxWidth) { lines.push(line); line = '' }
      line += character
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawHeader(page: PDFPage, font: PDFFont, bold: PDFFont): number {
  const { height, width } = page.getSize()
  page.drawText('HQS IMOBILIARE', { x: 48, y: height - 48, size: 10, font: bold, color: rgb(0.12, 0.42, 0.36) })
  page.drawText('Document electronic', { x: width - 150, y: height - 48, size: 9, font, color: rgb(0.45, 0.45, 0.45) })
  page.drawLine({ start: { x: 48, y: height - 58 }, end: { x: width - 48, y: height - 58 }, thickness: 1, color: rgb(0.86, 0.88, 0.87) })
  return height - 84
}

async function loadFont(name: string) {
  const response = await fetch(`/fonts/documents/${name}.ttf`)
  if (!response.ok) throw new Error('Fontul documentului nu a putut fi încărcat. Reîncearcă generarea.')
  return response.arrayBuffer()
}

/** Preserves supported Unicode text; unsupported glyphs stop creation rather than changing identity data. */
export async function createDocumentPdf(title: string, body: string, fileName: string): Promise<File> {
  const [fontkit, regularBytes, boldBytes] = await Promise.all([import('@pdf-lib/fontkit'), loadFont('NotoSans-Regular'), loadFont('NotoSans-Bold')])
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit.default)
  pdf.setTitle(title)
  pdf.setAuthor('HQS Imobiliare')
  pdf.setCreationDate(new Date())
  const font = await pdf.embedFont(regularBytes, { subset: true })
  const bold = await pdf.embedFont(boldBytes, { subset: true })
  const characters = new Set(font.getCharacterSet())
  const text = body.replace(/\r\n?/g, '\n').replace(/\t/g, '    ')
  if ([...text].some(character => character !== '\n' && !characters.has(character.codePointAt(0)!))) {
    throw new Error('Textul conține caractere pe care fontul PDF nu le poate reda. Documentul nu a fost salvat; verifică textul cu administratorul.')
  }
  let page = pdf.addPage([595.28, 841.89])
  let y = drawHeader(page, font, bold)
  for (const paragraph of text.split('\n')) {
    const isHeading = paragraph.length > 0 && paragraph === paragraph.toUpperCase() && paragraph.length < 80
    const selectedFont = isHeading ? bold : font
    const size = isHeading ? 11.5 : 10.5
    for (const line of wrapPdfLine(paragraph, selectedFont, size, page.getWidth() - 96)) {
      if (y < 64) { page = pdf.addPage([595.28, 841.89]); y = drawHeader(page, font, bold) }
      page.drawText(line, { x: 48, y, size, font: selectedFont, color: rgb(0.12, 0.14, 0.13) })
      y -= 16
    }
    y -= 5
  }
  for (const [index, currentPage] of pdf.getPages().entries()) {
    currentPage.drawText(`Pagina ${index + 1} din ${pdf.getPageCount()}`, { x: currentPage.getWidth() - 120, y: 28, size: 8, font, color: rgb(0.5, 0.5, 0.5) })
  }
  const bytes = await pdf.save()
  return new File([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], fileName, { type: 'application/pdf', lastModified: Date.now() })
}
