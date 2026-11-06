import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export type CameraError = 'denied' | 'unavailable';

const DECODE_INTERVAL_MS = 200;

// Mở camera khi hook được gắn, tắt hẳn khi gỡ. Rời tab là component bị gỡ.
export function useQrCamera(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const [error, setError] = useState<CameraError | null>(null);

  onCodeRef.current = onCode;

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    let lastDecodeAt = 0;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    const decodeFrame = (now: number) => {
      if (stopped) return;
      frame = requestAnimationFrame(decodeFrame);

      const video = videoRef.current;
      if (!video || !context || now - lastDecodeAt < DECODE_INTERVAL_MS) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0) return;

      lastDecodeAt = now;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
      if (qr?.data) onCodeRef.current(qr.data);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('unavailable');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        frame = requestAnimationFrame(decodeFrame);
      } catch (err) {
        if (stopped) return;
        setError(err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'unavailable');
      }
    };

    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, error };
}
