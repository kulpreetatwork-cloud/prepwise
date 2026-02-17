import { useRef, useCallback, useState } from 'react';

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const finalTranscriptRef = useRef('');
  const interimRef = useRef('');
  const isActiveRef = useRef(false);
  const onInterimRef = useRef(null);
  const onErrorRef = useRef(null);
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const isSupported = !!SpeechRecognitionAPI;

  const stopAudioLevel = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioLevelMonitor = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const monitor = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg / 128);
        animationRef.current = requestAnimationFrame(monitor);
      };
      monitor();
    } catch {
      // Audio level monitoring is optional — orb just won't pulse
    }
  }, []);

  const spawnRecognition = useCallback(() => {
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onaudiostart = () => {
      restartCountRef.current = 0;
    };

    recognition.onresult = (event) => {
      let sessionFinal = '';
      let sessionInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          sessionFinal += result[0].transcript;
        } else {
          sessionInterim += result[0].transcript;
        }
      }

      if (sessionFinal) {
        finalTranscriptRef.current = sessionFinal;
      }
      interimRef.current = sessionInterim;

      const liveText = ((finalTranscriptRef.current || '') + ' ' + sessionInterim).trim();
      if (onInterimRef.current && liveText) {
        onInterimRef.current(liveText);
      }
    };

    recognition.onerror = (event) => {
      const err = event.error;
      if (err === 'not-allowed') {
        if (onErrorRef.current) onErrorRef.current('Microphone permission denied. Please allow mic access.');
        isActiveRef.current = false;
        setIsListening(false);
        stopAudioLevel();
      } else if (err === 'network') {
        const isElectron = /electron/i.test(navigator.userAgent);
        const msg = isElectron
          ? 'Speech recognition requires a real Chrome/Edge browser. Please open http://localhost:5173 in Chrome.'
          : 'Speech recognition network error. Check your internet connection.';
        if (onErrorRef.current) onErrorRef.current(msg);
        isActiveRef.current = false;
        setIsListening(false);
        stopAudioLevel();
      } else if (err === 'service-not-allowed') {
        if (onErrorRef.current) onErrorRef.current('Speech recognition service not available. Please use Chrome or Edge.');
        isActiveRef.current = false;
        setIsListening(false);
        stopAudioLevel();
      } else if (err !== 'aborted' && err !== 'no-speech') {
        console.warn('[SpeechRecognition] Error:', err);
      }
    };

    recognition.onend = () => {
      if (!isActiveRef.current) return;

      restartCountRef.current += 1;

      if (restartCountRef.current > 15) {
        if (onErrorRef.current) onErrorRef.current('Speech recognition stopped unexpectedly. Please click the mic again.');
        isActiveRef.current = false;
        setIsListening(false);
        stopAudioLevel();
        return;
      }

      restartTimerRef.current = setTimeout(() => {
        if (!isActiveRef.current) return;
        try {
          const newRec = spawnRecognition();
          recognitionRef.current = newRec;
          newRec.start();
        } catch {
          if (onErrorRef.current) onErrorRef.current('Failed to restart speech recognition.');
          isActiveRef.current = false;
          setIsListening(false);
          stopAudioLevel();
        }
      }, 200);
    };

    return recognition;
  }, [stopAudioLevel]);

  const startListening = useCallback(async (onInterim, onError) => {
    if (!SpeechRecognitionAPI) throw new Error('SpeechRecognition not supported');

    finalTranscriptRef.current = '';
    interimRef.current = '';
    isActiveRef.current = true;
    restartCountRef.current = 0;
    onInterimRef.current = onInterim || null;
    onErrorRef.current = onError || null;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    const recognition = spawnRecognition();
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      isActiveRef.current = false;
      throw e;
    }

    await startAudioLevelMonitor();
  }, [spawnRecognition, startAudioLevelMonitor]);

  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    onInterimRef.current = null;
    onErrorRef.current = null;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const doResolve = () => {
        if (resolved) return;
        resolved = true;
        stopAudioLevel();
        setIsListening(false);
        const result = ((finalTranscriptRef.current || '') + ' ' + (interimRef.current || '')).trim();
        finalTranscriptRef.current = '';
        interimRef.current = '';
        resolve(result);
      };

      const recognition = recognitionRef.current;
      recognitionRef.current = null;

      if (!recognition) {
        doResolve();
        return;
      }

      recognition.onend = () => {
        setTimeout(doResolve, 200);
      };
      recognition.onerror = () => {};

      try {
        recognition.stop();
      } catch {
        doResolve();
      }

      setTimeout(doResolve, 2500);
    });
  }, [stopAudioLevel]);

  const abort = useCallback(() => {
    isActiveRef.current = false;
    onInterimRef.current = null;
    onErrorRef.current = null;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.onerror = () => {};
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    stopAudioLevel();
    setIsListening(false);
    finalTranscriptRef.current = '';
    interimRef.current = '';
  }, [stopAudioLevel]);

  return {
    isListening,
    audioLevel,
    isSupported,
    startListening,
    stopListening,
    abort,
  };
}
