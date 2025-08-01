interface VideoConfig {
  title: string
  description: string
  thumbnail: string
  videoSrc: string
}

/**
 * Composable to get video configuration from environment variables
 * Environment variables should follow the pattern:
 * VITE_VIDEO_{INDEX}_TITLE
 * VITE_VIDEO_{INDEX}_DESCRIPTION
 * VITE_VIDEO_{INDEX}_THUMBNAIL
 * VITE_VIDEO_{INDEX}_URL
 */
export function useVideoConfig(): VideoConfig[] {
  const videos: VideoConfig[] = []

  // Check for videos starting from index 1
  let index = 1
  while (true) {
    const title = import.meta.env[`VITE_VIDEO_${index}_TITLE`]
    const description = import.meta.env[`VITE_VIDEO_${index}_DESCRIPTION`]
    const thumbnail = import.meta.env[`VITE_VIDEO_${index}_THUMBNAIL`]
    const videoSrc = import.meta.env[`VITE_VIDEO_${index}_URL`]

    // If title and videoSrc are not defined, break the loop
    if (!title || !videoSrc) {
      break
    }

    videos.push({
      title,
      description: description || '',
      thumbnail: thumbnail || '/thumbnails/fallback.jpg',
      videoSrc
    })

    index++
  }

  // Fallback to default configuration if no environment variables are set
  if (videos.length === 0) {
    videos.push(
      {
        title: '100 Jahre Geschichte',
        description: 'Entdecken Sie die bewegende Geschichte unserer Gemeinde',
        thumbnail: '/thumbnails/geschichte-thumbnail.jpg',
        videoSrc: '/videos/geschichte.mp4'
      },
      {
        title: 'Wie funktioniert der Upload?',
        description: 'Eine kurze Anleitung zum Hochladen Ihrer Objekte',
        thumbnail: '/thumbnails/anleitung-thumbnail.jpg',
        videoSrc: '/videos/anleitung.mp4'
      }
    )
  }

  return videos
}
