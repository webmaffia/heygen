"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { useTextChat } from "./logic/useTextChat";
import { StreamingAvatarSessionState } from "./logic";
import { useStreamingAvatarContext } from "./logic/context";

type RecordingState = "idle" | "recording" | "sending" | "error";

export const Recorder: React.FC = () => {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { sendMessage } = useTextChat();
  const { sessionState } = useStreamingAvatarContext();

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const start = async () => {
    try {
      setError("");
      setTranscript("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = null as any;
      mediaRecorder.start();
      setState("recording");
    } catch (e: any) {
      setError(e?.message || "Failed to start recording");
      setState("error");
    }
  };

  const stop = async () => {
    try {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === "recording") {
        const blob: Blob = await new Promise((resolve) => {
          const handleStop = () => {
            const out = new Blob(chunksRef.current, { type: "audio/webm" });
            chunksRef.current = [];
            mr.removeEventListener("stop", handleStop);
            resolve(out);
          };
          mr.addEventListener("stop", handleStop);
          mr.stop();
        });
        await send(blob);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch (e: any) {
      setError(e?.message || "Failed to stop recording");
      setState("error");
    }
  };

  const send = async (blob: Blob) => {
    setState("sending");
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "content-type": blob.type || "audio/webm",
        },
        body: blob,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const json = await res.json();
      const alt = json?.results?.channels?.[0]?.alternatives?.[0];
      const text = (alt?.transcript || "").trim();
      setTranscript(text);
      if (text) {
        if (sessionState === StreamingAvatarSessionState.CONNECTED) {
          sendMessage(text);
        } else {
          console.warn("Avatar session is not connected; transcript not sent to HeyGen.");
        }
      }
      setState("idle");
    } catch (e: any) {
      setError(e?.message || "Transcription failed");
      setState("error");
    }
  };

  return (
    <div className="">
      <div className="flex gap-2">
        {state !== "recording" ? (
          <Button onClick={start}>Start Recording</Button>
        ) : (
          <Button onClick={stop}>Stop & Transcribe</Button>
        )}
        {state === "sending" && <span className="text-sm text-zinc-400">Uploading…</span>}
      </div>
      {transcript && (
        <div className="text-sm text-white">
          <span className="text-zinc-400">Transcript: </span>
          {transcript}
        </div>
      )}
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
};

export default Recorder;


