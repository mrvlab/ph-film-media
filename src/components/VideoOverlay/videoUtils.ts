export type VideoPlatform = 'youtube' | 'vimeo';

export type VideoInfo = {
  platform: VideoPlatform | null;
  id: string | null;
};

// Helper to extract video ID and platform from a full URL.
export const extractVideoInfo = (url: string): VideoInfo => {
  // YouTube
  const ytRegExp =
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|watch)\??(?:\S*?)(?:\?|&)v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };

  // Vimeo
  // Handles vimeo.com/12345678, vimeo.com/channels/staffpicks/12345678, player.vimeo.com/video/12345678
  const vimeoRegExp =
    /(?:vimeo\.com\/(?:.*\/)?|player\.vimeo\.com\/video\/)([0-9]{6,12})/;
  const vimeoMatch = url.match(vimeoRegExp);
  if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };

  return { platform: null, id: null };
};

// Build the autoplay embed URL for a detected platform/id pair.
export const buildEmbedUrl = (platform: VideoPlatform, id: string): string => {
  if (platform === 'youtube') {
    // enablejsapi=1 is what lets GA4's enhanced measurement report
    // video_start / video_progress / video_complete for the embed.
    return `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`;
  }
  return `https://player.vimeo.com/video/${id}?autoplay=1`;
};
