// Speech Service for Deepgram TTS and Web Speech API
export interface SpeechConfig {
  model?: string;
  encoding?: string;
  container?: string;
}

export interface VoiceMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  audioUrl?: string;
}

export class SpeechService {
  private apiKey: string | null = null;
  private isInitialized = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    // Initialize with environment variable or prompt user
    this.initializeApiKey();
  }

  private initializeApiKey() {
    // In production, use environment variables
    // For development, we'll prompt the user to enter their API key
    const storedKey = localStorage.getItem('deepgram_api_key');
    if (storedKey) {
      this.apiKey = storedKey;
      this.isInitialized = true;
    }
  }

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.isInitialized = true;
    localStorage.setItem('deepgram_api_key', apiKey);
  }

  public isReady(): boolean {
    return this.isInitialized && this.apiKey !== null;
  }

  // Text-to-Speech using Deepgram TTS
  async speakWithDeepgram(
    text: string, 
    config: SpeechConfig = {}
  ): Promise<HTMLAudioElement> {
    if (!this.isReady()) {
      throw new Error('Deepgram API key not set. Please configure your API key.');
    }

    const defaultConfig = {
      model: 'aura-asteria-en', // Warm, friendly female voice
      encoding: 'mp3',
      container: 'mp3',
      ...config
    };

    try {
      const response = await fetch('https://api.deepgram.com/v1/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model: defaultConfig.model,
          encoding: defaultConfig.encoding,
          container: defaultConfig.container
        })
      });

      if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return audio;
    } catch (error) {
      console.error('Deepgram TTS error:', error);
      throw error;
    }
  }

  // Text-to-Speech using Web Speech API
  async speakWithWebAPI(text: string): Promise<void> {
    console.log('speakWithWebAPI called with:', text);
    
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    // Use the proper speech service
    const { properSpeechService } = await import('./properSpeechService');
    
    try {
      await properSpeechService.speak(text);
      console.log('Speech service completed successfully');
    } catch (error) {
      console.error('Speech service failed:', error);
      // Fallback to simple implementation
      return this.simpleSpeakFallback(text);
    }
  }

  // Simple fallback implementation
  private simpleSpeakFallback(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Using simple fallback speech...');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.5;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.voice = null; // Use default voice

      utterance.onend = () => {
        console.log('Simple fallback speech completed');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Simple fallback speech error:', event.error);
        if (event.error === 'interrupted') {
          console.log('Simple fallback was interrupted, resolving anyway');
          resolve();
        } else {
          reject(new Error(`Simple fallback failed: ${event.error}`));
        }
      };

      speechSynthesis.speak(utterance);
    });
  }

  // Stop current speech
  private stopCurrentSpeech() {
    if (this.currentUtterance) {
      console.log('Stopping current speech...');
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  // Public method to stop speech
  public stopSpeaking() {
    this.stopCurrentSpeech();
  }

  // Main speak method with fallback
  async speak(text: string, useDeepgram: boolean = true): Promise<HTMLAudioElement | void> {
    console.log('SpeechService.speak called with:', { text, useDeepgram, isReady: this.isReady() });
    try {
      if (useDeepgram && this.isReady()) {
        console.log('Using Deepgram TTS');
        return await this.speakWithDeepgram(text);
      } else {
        console.log('Using Web Speech API');
        return await this.speakWithWebAPI(text);
      }
    } catch (error) {
      console.warn('Primary TTS failed, falling back to Web Speech API:', error);
      if (useDeepgram) {
        console.log('Falling back to Web Speech API');
        return await this.speakWithWebAPI(text);
      } else {
        throw error;
      }
    }
  }

  // Generate AI-like responses
  generateResponse(userInput: string): string {
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
}

// Export singleton instance
export const speechService = new SpeechService();
