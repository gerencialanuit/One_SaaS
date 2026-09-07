import sharp from 'sharp'

/**
 * react-pdf's <Image> solo reconoce JPEG, PNG y SVG (detecta el formato por
 * los bytes del archivo, no por la extension) — las fotos de producto en
 * Storage estan casi todas en .webp, que react-pdf rechaza con
 * "Not valid image extension". Se descargan aqui y se reconvierten a PNG
 * antes de pasarlas al documento, para que cualquier formato de imagen
 * (webp, jpg, png) funcione igual.
 */
export async function toPdfImageSrc(url: string | null): Promise<string | null> {
  if (!url) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const inputBuffer = Buffer.from(await response.arrayBuffer())
    const pngBuffer = await sharp(inputBuffer).png().toBuffer()
    return `data:image/png;base64,${pngBuffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function toPdfImageSrcMap(urls: (string | null)[]): Promise<Map<string, string>> {
  const uniqueUrls = [...new Set(urls.filter((url): url is string => !!url))]
  const entries = await Promise.all(
    uniqueUrls.map(async (url) => [url, await toPdfImageSrc(url)] as const)
  )
  const map = new Map<string, string>()
  for (const [url, dataUri] of entries) {
    if (dataUri) map.set(url, dataUri)
  }
  return map
}
