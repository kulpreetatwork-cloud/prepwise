import { useRef, useCallback, useState } from 'react';
import api from '../services/api';

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const IS_MOBILE = typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1);

const MAX_RESTART_COUNT = 15;
const RESTART_DELAY = 200;

export function useSpeechRecognition() {
  /* ------------------------------------------------------------------ */
  /*  Shared state                                                       */
  /* ------------------------------------------------------------------ */
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const isActiveRef = useRef(false);
  const onInterimRef = useRef(null);
  const onErrorRef = useRef(null);

  const isSupported = IS_MOBILE
    ? !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    : !!SpeechRecognitionAPI;

  /* ------------------------------------------------------------------ */
  /*  Desktop refs (browser SpeechRecognition)                           */
  /* ------------------------------------------------------------------ */
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const sessionTextRef = useRef('');
  const committedTextRef = useRef('');
  const sessionIdRef = useRef(0);
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /*  Mobile refs (Deepgram WebSocket)                                   */
  /* ------------------------------------------------------------------ */
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const dgStreamRef = useRef(null);
  const dgFinalTextRef = useRef('');
  const dgInterimTextRef = useRef('');

  /* ------------------------------------------------------------------ */
  /*  Desktop: audio level monitor (unchanged)                           */
  /* ------------------------------------------------------------------ */
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

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
      // Audio level monitoring is optional -- orb just won't pulse
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Desktop: spawnRecognition (unchanged)                              */
  /* ------------------------------------------------------------------ */
  const spawnRecognition = useCallback(() => {
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    const mySession = sessionIdRef.current;

    recognition.onaudiostart = () => {
      restartCountRef.current = 0;
    };

    recognition.onresult = (event) => {
      if (mySession !== sessionIdRef.current) return;

      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      sessionTextRef.current = text;

      const display = (committedTextRef.current + ' ' + text).trim();
      if (onInterimRef.current && display) {
        onInterimRef.current(display);
      }
    };

    recognition.onerror = (event) => {
      const err = event.error;
      if (err === 'not-allowed') {
        if (onErrorRef.current) onErrorRef.current('Microphone permission denied. Please allow mic access in your browser settings.');
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
        if (onErrorRef.current) onErrorRef.current('Speech recognition service not available. Please use Chrome or Edge on your device.');
        isActiveRef.current = false;
        setIsListening(false);
        stopAudioLevel();
      } else if (err !== 'aborted' && err !== 'no-speech') {
        console.warn('[SpeechRecognition] Error:', err);
      }
    };

    recognition.onend = () => {
      recognition.onresult = null;

      if (!isActiveRef.current) return;

      committedTextRef.current = (committedTextRef.current + ' ' + sessionTextRef.current).trim();
      sessionTextRef.current = '';
      sessionIdRef.current += 1;

      restartCountRef.current += 1;

      if (restartCountRef.current > MAX_RESTART_COUNT) {
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
      }, RESTART_DELAY);
    };

    return recognition;
  }, [stopAudioLevel]);

  /* ------------------------------------------------------------------ */
  /*  Mobile: Deepgram helpers                                           */
  /* ------------------------------------------------------------------ */
  const cleanupMobile = useCallback(() => {
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
        }
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    if (dgStreamRef.current) {
      dgStreamRef.current.getTracks().forEach((t) => t.stop());
      dgStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  startListening                                                     */
  /* ------------------------------------------------------------------ */
  const startListening = useCallback(async (onInterim, onError) => {
    onInterimRef.current = onInterim || null;
    onErrorRef.current = onError || null;
    isActiveRef.current = true;

    if (IS_MOBILE) {
      dgFinalTextRef.current = '';
      dgInterimTextRef.current = '';

      let apiKey;
      try {
        const { data } = await api.get('/stt/token');
        apiKey = data.key;
      } catch {
        if (onErrorRef.current) onErrorRef.current('Failed to initialize speech service. Please try again.');
        isActiveRef.current = false;
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        if (onErrorRef.current) onErrorRef.current('Microphone permission denied. Please allow mic access in your browser settings.');
        isActiveRef.current = false;
        return;
      }
      dgStreamRef.current = stream;

      const dgUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&language=en&interim_results=true&punctuate=true&endpointing=300&smart_format=true';

      const ws = new WebSocket(dgUrl, ['token', apiKey]);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isActiveRef.current) { ws.close(); return; }

        let mimeType = 'audio/webm;codecs=opus';
        if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }

        const recorderOpts = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(stream, recorderOpts);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        recorder.start(250);
        setIsListening(true);
      };

      ws.onmessage = (event) => {
        if (!isActiveRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'Results' && msg.channel?.alternatives?.[0]) {
            const transcript = msg.channel.alternatives[0].transcript || '';
            if (transcript) {
              if (msg.is_final) {
                dgFinalTextRef.current = (dgFinalTextRef.current + ' ' + transcript).trim();
                dgInterimTextRef.current = '';
              } else {
                dgInterimTextRef.current = transcript;
              }

              const display = (dgFinalTextRef.current + ' ' + dgInterimTextRef.current).trim();
              if (onInterimRef.current && display) {
                onInterimRef.current(display);
              }
            }
          }
        } catch {}
      };

      ws.onerror = () => {
        if (onErrorRef.current) onErrorRef.current('Speech recognition connection error. Please check your network.');
        isActiveRef.current = false;
        setIsListening(false);
        cleanupMobile();
      };

      ws.onclose = () => {
        if (isActiveRef.current) {
          isActiveRef.current = false;
          setIsListening(false);
        }
      };

    } else {
      /* Desktop: existing browser SpeechRecognition (unchanged) */
      if (!SpeechRecognitionAPI) throw new Error('SpeechRecognition not supported');

      sessionTextRef.current = '';
      committedTextRef.current = '';
      sessionIdRef.current = 0;
      restartCountRef.current = 0;

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
    }
  }, [spawnRecognition, startAudioLevelMonitor, cleanupMobile]);

  /* ------------------------------------------------------------------ */
  /*  stopListening                                                      */
  /* ------------------------------------------------------------------ */
  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    onInterimRef.current = null;
    onErrorRef.current = null;

    if (IS_MOBILE) {
      return new Promise((resolve) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop(); } catch {}
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try { wsRef.current.send(JSON.stringify({ type: 'CloseStream' })); } catch {}
        }

        setTimeout(() => {
          const result = (dgFinalTextRef.current + ' ' + dgInterimTextRef.current).trim();
          dgFinalTextRef.current = '';
          dgInterimTextRef.current = '';
          cleanupMobile();
          setIsListening(false);
          resolve(result);
        }, 500);
      });

    } else {
      /* Desktop: existing browser SpeechRecognition (unchanged) */
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
          const result = (committedTextRef.current + ' ' + sessionTextRef.current).trim();
          sessionTextRef.current = '';
          committedTextRef.current = '';
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
    }
  }, [stopAudioLevel, cleanupMobile]);

  /* ------------------------------------------------------------------ */
  /*  abort                                                              */
  /* ------------------------------------------------------------------ */
  const abort = useCallback(() => {
    isActiveRef.current = false;
    onInterimRef.current = null;
    onErrorRef.current = null;

    if (IS_MOBILE) {
      cleanupMobile();
      setIsListening(false);
      dgFinalTextRef.current = '';
      dgInterimTextRef.current = '';

    } else {
      /* Desktop: existing browser SpeechRecognition (unchanged) */
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
      sessionTextRef.current = '';
      committedTextRef.current = '';
    }
  }, [stopAudioLevel, cleanupMobile]);

  return {
    isListening,
    audioLevel,
    isSupported,
    startListening,
    stopListening,
    abort,
  };
}
