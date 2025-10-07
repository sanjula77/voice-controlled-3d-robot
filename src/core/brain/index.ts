import { intentParser } from './intentParser';
import { weatherPlugin } from '../plugins/weather';
import { newsPlugin } from '../plugins/news';
import { searchPlugin } from '../plugins/search';
import { youtubePlugin } from '../plugins/youtube';

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  type: 'weather' | 'news' | 'search' | 'youtube' | 'general';
  summary: string;
}

export interface BrainResponse {
  pluginUsed: string | null;
  result: PluginResult;
  shouldSpeak: boolean;
  shouldShowCard: boolean;
}

export class LexiBrain {
  private plugins = {
    weather: weatherPlugin,
    news: newsPlugin,
    search: searchPlugin,
    youtube: youtubePlugin,
  };

  async processUserInput(userInput: string): Promise<BrainResponse> {
    try {
      // Parse intent from user input
      const intent = await intentParser.parseIntent(userInput);
      
      if (!intent) {
        return {
          pluginUsed: null,
          result: {
            success: false,
            type: 'general',
            summary: 'I didn\'t understand that. Could you try rephrasing?',
          },
          shouldSpeak: true,
          shouldShowCard: false,
        };
      }

      // Route to appropriate plugin
      const plugin = this.plugins[intent.plugin as keyof typeof this.plugins];
      if (!plugin) {
        return {
          pluginUsed: null,
          result: {
            success: false,
            type: 'general',
            summary: 'I don\'t have that capability yet.',
          },
          shouldSpeak: true,
          shouldShowCard: false,
        };
      }

      // Execute plugin
      const result = await plugin.execute(intent.parameters);
      
      return {
        pluginUsed: intent.plugin,
        result,
        shouldSpeak: true,
        shouldShowCard: result.success,
      };
    } catch (error) {
      console.error('Brain processing error:', error);
      return {
        pluginUsed: null,
        result: {
          success: false,
          type: 'general',
          summary: 'I encountered an error processing your request. Please try again.',
        },
        shouldSpeak: true,
        shouldShowCard: false,
      };
    }
  }
}

export const lexiBrain = new LexiBrain();
