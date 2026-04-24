import imageCompression from 'browser-image-compression'

export const COMPRESS_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
}

export const MAX_INPUT_BYTES = 15 * 1024 * 1024
export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export type CompressionError =
  | 'unsupported_format'
  | 'too_large'
  | 'heic_failed'
  | 'compression_failed'

export type CompressionResult =
  | { ok: true; file: File }
  | { ok: false; error: CompressionError }

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any')
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  const blob = Array.isArray(result) ? result[0] : result
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([blob], newName, { type: 'image/jpeg' })
}

export async function compressImage(file: File): Promise<CompressionResult> {
  const hasImageMime = file.type.startsWith('image/')
  if (!hasImageMime && !isHeic(file)) {
    return { ok: false, error: 'unsupported_format' }
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, error: 'too_large' }
  }

  let working = file
  if (isHeic(file)) {
    try {
      working = await convertHeicToJpeg(file)
    } catch {
      return { ok: false, error: 'heic_failed' }
    }
  }

  try {
    const compressed = await imageCompression(working, COMPRESS_OPTIONS)
    const renamed = new File(
      [compressed],
      working.name.replace(/\.[^.]+$/, '.webp'),
      { type: 'image/webp' },
    )
    return { ok: true, file: renamed }
  } catch {
    return { ok: false, error: 'compression_failed' }
  }
}

export const ERROR_MESSAGES: Record<CompressionError, { title: string; description: string }> = {
  unsupported_format: {
    title: 'Formato não suportado',
    description: 'Use JPG, PNG, WebP ou HEIC. Outros formatos (como GIF ou BMP) não são aceitos.',
  },
  too_large: {
    title: 'Arquivo muito grande',
    description: 'Máximo de 15MB por foto. Reduza o tamanho no seu celular ou use uma foto menor.',
  },
  heic_failed: {
    title: 'Não foi possível converter HEIC',
    description: 'No iPhone: Ajustes › Câmera › Formatos › "Mais compatível". Ou envie a foto como JPG pelo WhatsApp (que converte automaticamente).',
  },
  compression_failed: {
    title: 'Falha ao processar a imagem',
    description: 'O arquivo pode estar corrompido. Tente abrir a foto no seu celular e salvá-la novamente, ou use outra foto.',
  },
}
