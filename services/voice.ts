import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

class VoiceService {
  private recording: Audio.Recording | null = null;

  async startRecording(): Promise<void> {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      throw err;
    }
  }

  async stopRecordingAndTranscribe(): Promise<string> {
    try {
      if (!this.recording) {
        throw new Error('No recording active');
      }

      console.log('Stopping recording..');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      console.log('Recording stopped and stored at', uri);

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      // Simulate sending to backend /api/voice/transcribe endpoint
      // In a real app we'd construct a FormData with the audio file
      console.log('Sending to backend /api/voice/transcribe endpoint...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return mock transcript
      return "اے سی بالکل ٹھنڈک نہیں کر رہا، کوئی مستری بھیج دیں";

    } catch (err) {
      console.error('Transcription failed, using fallback', err);
      // Fallback
      return "اے سی بالکل ٹھنڈک نہیں کر رہا، کوئی مستری بھیج دیں";
    }
  }

  async speak(text: string): Promise<void> {
    try {
      Speech.speak(text, {
        language: 'ur-PK',
        pitch: 1,
        rate: 0.9,
      });
    } catch (error) {
      console.error('Speech synthesis failed', error);
    }
  }
}

export const voiceService = new VoiceService();
