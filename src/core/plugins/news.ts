import { PluginResult } from '../brain';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  urlToImage?: string;
}

interface NewsData {
  articles: NewsArticle[];
  totalResults: number;
}

export const newsPlugin = {
  async execute(parameters: { topic: string }): Promise<PluginResult> {
    try {
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          type: 'news',
          summary: 'News service is not configured. Please add VITE_NEWS_API_KEY to your environment.',
        };
      }

      const topic = parameters.topic || 'general';
      const newsData = await this.fetchNewsData(topic, apiKey);
      
      if (!newsData || newsData.articles.length === 0) {
        return {
          success: false,
          type: 'news',
          summary: `I couldn't find any news articles about ${topic}. Please try a different topic.`,
        };
      }

      const summary = this.generateNewsSummary(newsData, topic);
      
      return {
        success: true,
        type: 'news',
        data: newsData,
        summary,
      };
    } catch (error) {
      console.error('News plugin error:', error);
      return {
        success: false,
        type: 'news',
        summary: 'I couldn\'t fetch the news right now. Please try again later.',
      };
    }
  },

  async fetchNewsData(topic: string, apiKey: string): Promise<NewsData | null> {
    try {
      const query = topic === 'general' ? 'top headlines' : topic;
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
      );

      if (!response.ok) {
        // Try top headlines if everything fails
        if (topic === 'general') {
          const headlinesResponse = await fetch(
            `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${apiKey}`
          );
          
          if (headlinesResponse.ok) {
            return await headlinesResponse.json();
          }
        }
        throw new Error(`News API failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure articles have proper structure
      if (data.articles && Array.isArray(data.articles)) {
        data.articles = data.articles.map((article: any) => ({
          ...article,
          source: typeof article.source === 'object' ? article.source?.name || 'Unknown' : article.source || 'Unknown',
          title: article.title || 'No title',
          description: article.description || 'No description available',
          url: article.url || '#',
        }));
      }
      
      return data;
    } catch (error) {
      console.error('News fetch error:', error);
      return null;
    }
  },

  generateNewsSummary(data: NewsData, topic: string): string {
    const articleCount = data.articles.length;
    const topicText = topic === 'general' ? 'latest news' : `news about ${topic}`;
    
    if (articleCount === 0) {
      return `I couldn't find any ${topicText} at the moment.`;
    }

    const topArticles = data.articles.slice(0, 3);
    const headlines = topArticles.map(article => article.title).join(', ');
    
    return `Here are the top ${articleCount} ${topicText} articles: ${headlines}`;
  },
};
