// Proper Speech Service - Implements the exact solution provided
export class ProperSpeechService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  // Initialize audio context on user gesture - EXACT FIX
  public async initializeAudioContext(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing audio context...');
    
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // EXACT FIX: Resume if suspended
    if (this.audioContext.state === "suspended") {
      console.log('Audio context suspended, resuming...');
      await this.audioContext.resume();
      console.log("AudioContext activated by user gesture");
    } else {
      console.log('Audio context already active, state:', this.audioContext.state);
    }

    this.isInitialized = true;
  }

  // Wait for voices to load - EXACT FIX
  private async waitForVoices(): Promise<void> {
    return new Promise((resolve) => {
      function ensureVoicesLoaded(callback: () => void) {
        const voices = speechSynthesis.getVoices();
        if (voices.length !== 0) {
          callback();
        } else {
          speechSynthesis.onvoiceschanged = () => callback();
        }
      }

      ensureVoicesLoaded(() => {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
        resolve();
      });
    });
  }

  // Main speak method with EXACT FIXES
  async speak(text: string): Promise<void> {
    console.log('ProperSpeechService.speak called with:', text);

    // Ensure audio context is initialized
    if (!this.isInitialized) {
      throw new Error('Audio context not initialized. Call initializeAudioContext() first.');
    }

    // EXACT FIX: Wait for voices to load
    await this.waitForVoices();

    // EXACT FIX: Cancel ongoing speech before starting new
    window.speechSynthesis.cancel();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Conservative settings
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.voice = null; // Use default voice

      utterance.onstart = () => {
        console.log('ProperSpeechService: Speech started');
      };

      utterance.onend = () => {
        console.log('ProperSpeechService: Speech ended successfully');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('ProperSpeechService: Speech error:', event.error);
        // EXACT FIX: Treat interruptions as success
        if (event.error === 'interrupted') {
          console.log('ProperSpeechService: Speech was interrupted, treating as success');
          resolve();
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      // Start speaking
      console.log('ProperSpeechService: Starting speech...');
      window.speechSynthesis.speak(utterance);
    });
  }

  // Check if audio context is ready
  public isAudioReady(): boolean {
    return this.isInitialized && this.audioContext?.state === 'running';
  }

  // Get audio context state
  public getAudioState(): string {
    return this.audioContext?.state || 'not-initialized';
  }
}

// Export singleton instance
export const properSpeechService = new ProperSpeechService();
