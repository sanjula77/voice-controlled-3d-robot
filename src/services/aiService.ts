// AI Service with Multi-Model Fallback for OpenRouter Integration
export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
  modelUsed?: string;
  responseTime?: number;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelConfig {
  name: string;
  model: string;
  timeout: number;
  maxTokens: number;
  temperature: number;
}

export interface ModelAttempt {
  model: string;
  success: boolean;
  error?: string;
  responseTime?: number;
}

// Model configuration with fallback chain
const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: 'DeepSeek V3.1',
    model: 'deepseek/deepseek-chat-v3.1:free',
    timeout: 15000,
    maxTokens: 150,
    temperature: 0.7
  },
  {
    name: 'Mistral Small',
    model: 'mistralai/mistral-small-3.2-24b-instruct:free',
    timeout: 15000,
    maxTokens: 150,
    temperature: 0.7
  },
  {
    name: 'Gemini 2.0 Flash',
    model: 'google/gemini-2.0-flash-exp:free',
    timeout: 15000,
    maxTokens: 150,
    temperature: 0.7
  },
  {
    name: 'Llama 3.3 70B',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    timeout: 15000,
    maxTokens: 150,
    temperature: 0.7
  },
  {
    name: 'Qwen 3 14B',
    model: 'qwen/qwen3-14b:free',
    timeout: 15000,
    maxTokens: 150,
    temperature: 0.7
  }
];

export class AIService {
  private apiKey: string | null = null;
  private isInitialized = false;
  private conversationHistory: ConversationMessage[] = [];
  private modelAttempts: ModelAttempt[] = [];

  constructor() {
    this.initializeApiKey();
  }

  private initializeApiKey() {
    // Check for environment variable first
    const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (envKey) {
      this.apiKey = envKey;
      this.isInitialized = true;
      return;
    }

    // Fallback to localStorage for development
    const storedKey = localStorage.getItem('openrouter_api_key');
    if (storedKey) {
      this.apiKey = storedKey;
      this.isInitialized = true;
    }
  }

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.isInitialized = true;
    localStorage.setItem('openrouter_api_key', apiKey);
  }

  public isReady(): boolean {
    return this.isInitialized && this.apiKey !== null;
  }

  public clearConversationHistory() {
    this.conversationHistory = [];
  }

  public getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  public getModelAttempts(): ModelAttempt[] {
    return [...this.modelAttempts];
  }

  public clearModelAttempts() {
    this.modelAttempts = [];
  }

  // Core askLexi function with multi-model fallback
  async askLexi(_prompt: string): Promise<AIResponse> {
    if (!this.isReady()) {
      return {
        content: "I'm having trouble thinking right now—could you repeat that? (API key not configured)",
        success: false,
        error: 'API key not configured'
      };
    }

    const startTime = Date.now();
    this.modelAttempts = [];

    // Prepare messages for API call
    const messages: ConversationMessage[] = [
      {
        role: 'system',
        content: "You are Lexi, a friendly 3D AI robot assistant who speaks politely, concisely, and with a touch of personality. Keep your responses conversational and not too long, as you're speaking to users through voice. Be helpful, engaging, and show your robotic personality in a charming way."
      },
      ...this.conversationHistory.slice(-10) // Keep last 10 messages for context
    ];

    // Try each model sequentially
    for (const modelConfig of MODEL_CONFIGS) {
      const attemptStartTime = Date.now();
      
      try {
        console.log(`🧠 Trying model: ${modelConfig.name} (${modelConfig.model})`);
        
        const response = await this.callModelWithTimeout(
          modelConfig,
          messages,
          attemptStartTime
        );

        if (response.success) {
          const totalTime = Date.now() - startTime;
          console.log(`✅ Success with ${modelConfig.name} in ${totalTime}ms`);
          
          // Log successful attempt
          this.modelAttempts.push({
            model: modelConfig.name,
            success: true,
            responseTime: Date.now() - attemptStartTime
          });

          return {
            content: response.content,
            success: true,
            modelUsed: modelConfig.name,
            responseTime: totalTime
          };
        } else {
          // Log failed attempt
          this.modelAttempts.push({
            model: modelConfig.name,
            success: false,
            error: response.error,
            responseTime: Date.now() - attemptStartTime
          });
          
          console.warn(`❌ ${modelConfig.name} failed:`, response.error);
        }
      } catch (error) {
        const attemptTime = Date.now() - attemptStartTime;
        
        // Log failed attempt
        this.modelAttempts.push({
          model: modelConfig.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: attemptTime
        });
        
        console.error(`❌ ${modelConfig.name} error:`, error);
      }
    }

    // All models failed
    const totalTime = Date.now() - startTime;
    console.error(`❌ All models failed after ${totalTime}ms`);
    
    return {
      content: "I'm having trouble thinking right now—could you repeat that?",
      success: false,
      error: 'All AI models failed',
      responseTime: totalTime
    };
  }

  // Call a specific model with timeout
  private async callModelWithTimeout(
    modelConfig: ModelConfig,
    messages: ConversationMessage[],
    _startTime: number
  ): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, modelConfig.timeout);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Talking Lexi',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: messages,
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: '',
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        };
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return {
          content: '',
          success: false,
          error: 'Unexpected API response format'
        };
      }

      const aiResponse = data.choices[0].message.content.trim();
      
      if (!aiResponse) {
        return {
          content: '',
          success: false,
          error: 'Empty response from AI'
        };
      }

      return {
        content: aiResponse,
        success: true
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          content: '',
          success: false,
          error: `Timeout after ${modelConfig.timeout}ms`
        };
      }
      
      throw error;
    }
  }

  // Main method to get AI response (backwards compatibility)
  async getAIResponse(userMessage: string): Promise<AIResponse> {
    // Add user message to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      // Use the new askLexi function
      const response = await this.askLexi(userMessage);

      if (response.success) {
        // Add AI response to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content
        });

        // Keep conversation history manageable (last 20 messages)
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      } else {
        // Remove the user message from history since it failed
        this.conversationHistory.pop();
      }

      return response;

    } catch (error) {
      console.error('AI Service error:', error);
      
      // Remove the user message from history since it failed
      this.conversationHistory.pop();
      
      return {
        content: "I'm having trouble thinking right now—could you repeat that?",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Fallback method for when AI service is not available
  generateFallbackResponse(userInput: string): string {
    const input = userInput.toLowerCase().trim();
    
    // Greeting responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! I'm Lexi, your AI assistant. It's great to meet you! How can I help you today?";
    }
    
    if (input.includes('how are you') || input.includes('how do you do')) {
      return "I'm doing wonderful, thank you for asking! I'm excited to chat with you. What would you like to talk about?";
    }
    
    if (input.includes('what is your name') || input.includes('who are you')) {
      return "I'm Lexi, your friendly AI assistant! I'm here to help you with anything you need. What can I do for you?";
    }
    
    if (input.includes('goodbye') || input.includes('bye') || input.includes('see you')) {
      return "Goodbye! It was wonderful talking with you. Feel free to come back anytime you want to chat!";
    }
    
    if (input.includes('thank you') || input.includes('thanks')) {
      return "You're very welcome! I'm always happy to help. Is there anything else you'd like to know?";
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return "I can chat with you about anything! I love having conversations, answering questions, and just being a friendly companion. What would you like to talk about?";
    }
    
    if (input.includes('weather')) {
      return "I'd love to help with weather information, but I don't have access to real-time weather data right now. You might want to check a weather app or website for current conditions!";
    }
    
    if (input.includes('time') || input.includes('what time')) {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      return `The current time is ${timeString}. Is there anything else you'd like to know?`;
    }
    
    if (input.includes('date') || input.includes('what date')) {
      const now = new Date();
      const dateString = now.toLocaleDateString();
      return `Today's date is ${dateString}. How can I help you with anything else?`;
    }
    
    // Default responses
    const defaultResponses = [
      "That's really interesting! Tell me more about that.",
      "I'd love to hear more about your thoughts on that topic.",
      "That sounds fascinating! Can you elaborate on that?",
      "I'm learning so much from our conversation! What else would you like to discuss?",
      "You have such interesting perspectives! What made you think about that?",
      "I find that really engaging! Is there more you'd like to share?",
      "That's a great point! I'd love to explore that topic further with you.",
      "You always have such thoughtful things to say! What's on your mind?",
      "I'm really enjoying our chat! What else would you like to talk about?",
      "That's wonderful! I love how you express your ideas. Tell me more!"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Get model statistics for debugging
  getModelStats(): { [key: string]: { attempts: number; successes: number; avgResponseTime: number } } {
    const stats: { [key: string]: { attempts: number; successes: number; avgResponseTime: number } } = {};
    
    this.modelAttempts.forEach(attempt => {
      if (!stats[attempt.model]) {
        stats[attempt.model] = { attempts: 0, successes: 0, avgResponseTime: 0 };
      }
      
      stats[attempt.model].attempts++;
      if (attempt.success) {
        stats[attempt.model].successes++;
      }
      
      if (attempt.responseTime) {
        const currentAvg = stats[attempt.model].avgResponseTime;
        const totalAttempts = stats[attempt.model].attempts;
        stats[attempt.model].avgResponseTime = 
          (currentAvg * (totalAttempts - 1) + attempt.responseTime) / totalAttempts;
      }
    });
    
    return stats;
  }
}

// Export singleton instance
export const aiService = new AIService();