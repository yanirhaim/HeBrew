"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface VoiceInputProps {
  onResult: (text: string) => void;
  lang?: string; // Default 'he-IL'
  placeholder?: string;
}

export default function VoiceInput({ 
  onResult, 
  lang = "he-IL",
  placeholder = "Presiona el micrófono para hablar..." 
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      // Chrome/Safari
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setError("Error en reconocimiento de voz. Intenta de nuevo.");
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);

        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError("Tu navegador no soporta reconocimiento de voz.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onResult]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full">
        <textarea
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            onResult(e.target.value);
          }}
          placeholder={placeholder}
          dir="rtl"
          className="w-full min-h-[100px] p-4 pr-12 rounded-2xl border-2 border-feather-gray bg-white text-right text-lg focus:border-feather-blue focus:outline-none resize-none"
        />
        <button
          onClick={toggleListening}
          className={`absolute bottom-4 left-4 p-3 rounded-full transition-all ${
            isListening 
              ? "bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-200" 
              : "bg-feather-blue text-white shadow-md hover:bg-blue-600"
          }`}
          title={isListening ? "Detener grabación" : "Iniciar grabación"}
        >
          {isListening ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          )}
        </button>
      </div>
      
      {isListening && (
        <p className="text-sm text-feather-blue animate-pulse font-medium">
          Escuchando...
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
