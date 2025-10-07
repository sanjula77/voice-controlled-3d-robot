import { PluginResult } from '../brain';

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
}

interface YouTubeData {
  videos: YouTubeVideo[];
  totalResults: number;
  query: string;
}

export const youtubePlugin = {
  async execute(parameters: { query: string }): Promise<PluginResult> {
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          type: 'youtube',
          summary: 'YouTube service is not configured. Please add VITE_YOUTUBE_API_KEY to your environment.',
        };
      }

      const query = parameters.query || '';
      if (!query.trim()) {
        return {
          success: false,
          type: 'youtube',
          summary: 'Please specify what you\'d like me to search for on YouTube.',
        };
      }

      const youtubeData = await this.fetchYouTubeData(query, apiKey);
      
      if (!youtubeData || youtubeData.videos.length === 0) {
        return {
          success: false,
          type: 'youtube',
          summary: `I couldn't find any YouTube videos for "${query}". Please try a different search term.`,
        };
      }

      const summary = this.generateYouTubeSummary(youtubeData);
      
      return {
        success: true,
        type: 'youtube',
        data: youtubeData,
        summary,
      };
    } catch (error) {
      console.error('YouTube plugin error:', error);
      return {
        success: false,
        type: 'youtube',
        summary: 'I couldn\'t search YouTube right now. Please try again later.',
      };
    }
  },

  async fetchYouTubeData(query: string, apiKey: string): Promise<YouTubeData | null> {
    try {
      // Search for videos
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error(`YouTube Search API failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return null;
      }

      // Get video details for duration and view count
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${apiKey}`
      );

      let videoDetails: any[] = [];
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        videoDetails = detailsData.items || [];
      }

      const videos: YouTubeVideo[] = searchData.items.map((item: any, index: number) => {
        const details = videoDetails[index] || {};
        return {
          videoId: item.id.videoId || '',
          title: item.snippet?.title || 'No title',
          description: item.snippet?.description || 'No description available',
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          channelTitle: item.snippet?.channelTitle || 'Unknown channel',
          publishedAt: item.snippet?.publishedAt || '',
          duration: this.formatDuration(details.contentDetails?.duration),
          viewCount: this.formatViewCount(details.statistics?.viewCount),
        };
      });

      return {
        videos,
        totalResults: searchData.pageInfo?.totalResults || 0,
        query,
      };
    } catch (error) {
      console.error('YouTube fetch error:', error);
      return null;
    }
  },

  formatDuration(duration: string): string {
    if (!duration) return 'Unknown';
    
    // Parse ISO 8601 duration (PT4M13S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  },

  formatViewCount(viewCount: string): string {
    if (!viewCount) return 'Unknown views';
    
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    } else {
      return `${count} views`;
    }
  },

  generateYouTubeSummary(data: YouTubeData): string {
    const videoCount = data.videos.length;
    const query = data.query;
    
    if (videoCount === 0) {
      return `I couldn't find any YouTube videos for "${query}".`;
    }

    const topVideo = data.videos[0];
    return `I found ${videoCount} YouTube videos for "${query}". Here's the top result: "${topVideo.title}" by ${topVideo.channelTitle}`;
  },
};
