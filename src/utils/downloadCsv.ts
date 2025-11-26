/**
 * Utilitário para download de arquivos CSV
 */

/**
 * Faz download de um arquivo CSV a partir de um Blob
 */
export function downloadCsv(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Gera nome de arquivo CSV com data
 */
export function generateCsvFilename(prefix: string): string {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0] // YYYY-MM-DD
  return `${prefix}-${dateStr}.csv`
}

