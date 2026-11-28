import type { ScanTone } from './gateScan';

const TONE_SOUND: Record<ScanTone, { frequency: number; seconds: number }> = {
  success: { frequency: 880, seconds: 0.15 },
  warning: { frequency: 440, seconds: 0.25 },
  danger: { frequency: 220, seconds: 0.4 },
};

const TONE_VIBRATION: Record<ScanTone, number | number[]> = {
  success: 80,
  warning: [80, 60, 80],
  danger: [150, 80, 150],
};

// Âm thanh và rung chỉ là phụ. Lỗi ở đây không được chặn thẻ kết quả.
export function playScanFeedback(tone: ScanTone): void {
  try {
    navigator.vibrate?.(TONE_VIBRATION[tone]);

    const { frequency, seconds } = TONE_SOUND[tone];
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.frequency.value = frequency;
    gain.gain.value = 0.15;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.onended = () => void audio.close();
    oscillator.start();
    oscillator.stop(audio.currentTime + seconds);
  } catch {
    // Trình duyệt không hỗ trợ thì bỏ qua.
  }
}
