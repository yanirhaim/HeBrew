"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface AudioPlayerProps {
  audioUrl: string;
  onClose?: () => void;
}

export default function AudioPlayer({ audioUrl, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  const handleRewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full rounded-2xl bg-gray-900 p-4">
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="mb-4 h-1 w-full cursor-pointer rounded-full bg-gray-700"
        onClick={handleProgressClick}
      >
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${progressPercentage}%` }}
        >
          <div
            className="h-3 w-3 -translate-y-1 translate-x-[-50%] rounded-full bg-white"
            style={{ marginLeft: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Rewind Button */}
        <button
          onClick={handleRewind}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-gray-800 transition-colors"
          title="Retroceder"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-900 hover:bg-gray-200 transition-colors"
          title={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 5v14l11-7z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>

        {/* Time Display */}
        <div className="text-sm font-medium text-white">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
