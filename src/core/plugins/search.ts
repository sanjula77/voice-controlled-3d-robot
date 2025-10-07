import { PluginResult } from '../brain';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SearchData {
  results: SearchResult[];
  totalResults: number;
  query: string;
}

export const searchPlugin = {
  async execute(parameters: { query: string }): Promise<PluginResult> {
    try {
      const apiKey = import.meta.env.VITE_SERPER_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          type: 'search',
          summary: 'Web search service is not configured. Please add VITE_SERPER_API_KEY to your environment.',
        };
      }

      const query = parameters.query || '';
      if (!query.trim()) {
        return {
          success: false,
          type: 'search',
          summary: 'Please specify what you\'d like me to search for.',
        };
      }

      const searchData = await this.fetchSearchData(query, apiKey);
      
      if (!searchData || searchData.results.length === 0) {
        return {
          success: false,
          type: 'search',
          summary: `I couldn't find any results for "${query}". Please try a different search term.`,
        };
      }

      const summary = this.generateSearchSummary(searchData);
      
      return {
        success: true,
        type: 'search',
        data: searchData,
        summary,
      };
    } catch (error) {
      console.error('Search plugin error:', error);
      return {
        success: false,
        type: 'search',
        summary: 'I couldn\'t perform the web search right now. Please try again later.',
      };
    }
  },

  async fetchSearchData(query: string, apiKey: string): Promise<SearchData | null> {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search API failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure results have proper structure
      const results = (data.organic || []).map((result: any) => ({
        ...result,
        title: result.title || 'No title',
        snippet: result.snippet || 'No description available',
        link: result.link || '#',
      }));
      
      return {
        results,
        totalResults: data.searchInformation?.totalResults || 0,
        query,
      };
    } catch (error) {
      console.error('Search fetch error:', error);
      return null;
    }
  },

  generateSearchSummary(data: SearchData): string {
    const resultCount = data.results.length;
    const query = data.query;
    
    if (resultCount === 0) {
      return `I couldn't find any results for "${query}".`;
    }

    const topResults = data.results.slice(0, 3);
    const summaries = topResults.map(result => result.title).join(', ');
    
    return `I found ${resultCount} results for "${query}". Here are the top results: ${summaries}`;
  },
};
