export function getThumbnailUrl(youtubeUrl) {
  // For a youtube video like: https://www.youtube.com/watch?v=-2RAq5o5pwc
  // The thumbnail url is https://i.ytimg.com/vi/-2RAq5o5pwc/hq720.jpg
  // The general format being https://i.ytimg.com/vi/VIDEO_ID/hq720.jpg

  const videoId = youtubeUrl.split('v=')[1]
  return `https://i.ytimg.com/vi/${videoId}/hq720.jpg`
}
