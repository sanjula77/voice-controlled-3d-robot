interface Intent {
  plugin: string;
  parameters: Record<string, any>;
  confidence: number;
}

export class IntentParser {
  private intentPatterns = {
    weather: [
      /weather in (.+)/i,
      /what's the weather in (.+)/i,
      /how's the weather in (.+)/i,
      /temperature in (.+)/i,
      /forecast for (.+)/i,
      /weather (.+)/i,
    ],
    news: [
      /latest news/i,
      /top headlines/i,
      /news about (.+)/i,
      /what's happening/i,
      /current events/i,
      /news/i,
    ],
    search: [
      /search for (.+)/i,
      /find (.+)/i,
      /look up (.+)/i,
      /google (.+)/i,
      /web search (.+)/i,
      /search (.+)/i,
    ],
    youtube: [
      /play (.+) on youtube/i,
      /youtube (.+)/i,
      /show me (.+) video/i,
      /find (.+) video/i,
      /watch (.+)/i,
    ],
  };

  async parseIntent(userInput: string): Promise<Intent | null> {
    const input = userInput.toLowerCase().trim();
    
    // Check each plugin pattern
    for (const [plugin, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          const parameters = this.extractParameters(plugin, match);
          return {
            plugin,
            parameters,
            confidence: 0.9,
          };
        }
      }
    }

    // Fallback to AI-based intent detection if available
    if (this.hasOpenRouterAPI()) {
      return await this.aiIntentDetection(input);
    }

    return null;
  }

  private extractParameters(plugin: string, match: RegExpMatchArray): Record<string, any> {
    switch (plugin) {
      case 'weather':
        return { location: match[1] || 'current location' };
      case 'news':
        return { topic: match[1] || 'general' };
      case 'search':
        return { query: match[1] || '' };
      case 'youtube':
        return { query: match[1] || '' };
      default:
        return {};
    }
  }

  private hasOpenRouterAPI(): boolean {
    return !!import.meta.env.VITE_OPENROUTER_API_KEY;
  }

  // Clean JSON response to handle markdown formatting
  private cleanJsonResponse(content: string): string {
    // Remove markdown code block markers
    let cleaned = content
      .replace(/^```json\s*/i, '')  // Remove opening ```json
      .replace(/```\s*$/i, '')      // Remove closing ```
      .replace(/^```\s*/i, '')      // Remove opening ``` (without json)
      .trim();

    // Try to find JSON object within the content
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    return cleaned;
  }

  private async aiIntentDetection(input: string): Promise<Intent | null> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `Analyze this user input and determine the intent. Return ONLY a JSON object with this structure:
{
  "plugin": "weather|news|search|youtube|null",
  "parameters": {"key": "value"},
  "confidence": 0.0-1.0
}

Available plugins:
- weather: for weather queries
- news: for news and headlines
- search: for web searches
- youtube: for video searches
- null: for general conversation

Examples:
"weather in New York" → {"plugin": "weather", "parameters": {"location": "New York"}, "confidence": 0.9}
"latest news" → {"plugin": "news", "parameters": {"topic": "general"}, "confidence": 0.9}
"search for AI conferences" → {"plugin": "search", "parameters": {"query": "AI conferences"}, "confidence": 0.9}
"play funny cat videos" → {"plugin": "youtube", "parameters": {"query": "funny cat videos"}, "confidence": 0.8}
"hello how are you" → {"plugin": null, "parameters": {}, "confidence": 0.9}`
            },
            {
              role: 'user',
              content: input
            }
          ],
          max_tokens: 150,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI intent detection failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return null;
      }

      // Clean the content to handle markdown-wrapped JSON
      const cleanedContent = this.cleanJsonResponse(content);
      console.log('🔧 Original content:', content);
      console.log('🔧 Cleaned content:', cleanedContent);
      const intent = JSON.parse(cleanedContent);
      console.log('🔧 Parsed intent:', intent);
      return intent.confidence > 0.7 ? intent : null;
    } catch (error) {
      console.error('AI intent detection error:', error);
      return null;
    }
  }
}

export const intentParser = new IntentParser();
