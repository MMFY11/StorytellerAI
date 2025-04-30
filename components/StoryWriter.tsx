// components/StoryWriter.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Frame } from "@gptscript-ai/gptscript";
import renderEventMessage from "@/lib/renderEventMessage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Loader2 } from "lucide-react";

export default function StoryWriter() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [story, setStory] = useState("");
  const [pages, setPages] = useState<number>();
  const [progress, setProgress] = useState("");
  const [runStarted, setRunStarted] = useState(false);
  const [runFinished, setRunFinished] = useState<boolean | null>(null);
  const [currentTool, setCurrentTool] = useState("");
  const [events, setEvents] = useState<Frame[]>([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  //
  // 1) handleStream must be declared before we call it
  //
  const handleStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) => {
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("event: ")) continue;
        const data = line.replace(/^event: /, "");
        try {
          const parsed = JSON.parse(data);
          switch (parsed.type) {
            case "callProgress":
              setProgress(parsed.output[parsed.output.length - 1].content);
              setCurrentTool(parsed.tool?.description || "");
              break;
            case "callStart":
              setCurrentTool(parsed.tool?.description || "");
              break;
            case "runFinish":
              setRunFinished(true);
              setRunStarted(false);
              break;
            default:
              setEvents((prev) => [...prev, parsed]);
          }
        } catch (e) {
          console.error("Failed to parse event JSON", e, data);
        }
      }
    }
  };

  //
  // 2) startRecording / stopRecording definitions
  //
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessingVoice(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const form = new FormData();
          form.append("audio", blob);

          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: form,
          });
          const { text } = await res.json();
          setStory((s) => s + " " + text);
        } catch (err) {
          console.error(err);
          toast.error("Voice transcription failed");
        } finally {
          setIsProcessingVoice(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Recording…");
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    toast.info("Processing voice…");
  };

  //
  // 3) runScript can now safely call handleStream, start/stopRecording exist, etc.
  //
  const runScript = async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      toast.error("Please sign in first");
      return;
    }
    setRunStarted(true);
    setRunFinished(false);

    try {
      const res = await fetch("/api/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story,
          pages,
          userId: session.user.id,
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        await handleStream(reader, decoder);
      } else {
        console.error("Streaming failed", res.status, res.statusText);
        setRunStarted(false);
        setRunFinished(true);
      }
    } catch (err) {
      console.error(err);
      setRunStarted(false);
      setRunFinished(true);
    }
  };

  //
  // 4) success toast
  //
  useEffect(() => {
    if (runFinished) {
      toast.success("Story generated!", {
        action: (
          <Button onClick={() => router.push("/stories")} className="ml-auto">
            View Stories
          </Button>
        ),
      });
    }
  }, [runFinished, router]);

  return (
    <div className="flex flex-col container">
      <section className="flex-1 flex flex-col border border-purple-300 rounded-md p-10 space-y-2 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
        {/* text + mic */}
        <div className="flex items-center gap-2">
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Write or speak…"
            className="flex-1 text-black"
          />
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessingVoice}
            variant={isRecording ? "destructive" : "outline"}
            className="p-3 rounded-full"
          >
            {isProcessingVoice ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRecording
            ? "Recording… click to stop"
            : isProcessingVoice
            ? "Transcribing…"
            : "Press mic to speak"}
        </p>

        {/* pages selector */}
        <Select onValueChange={(v) => setPages(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Pages?" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i} value={`${i + 1}`}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Go! */}
        <Button
          onClick={runScript}
          disabled={!story || !pages || runStarted}
          size="lg"
          className="w-full bg-pink-500 hover:bg-pink-600"
        >
          Generate Story
        </Button>
      </section>

      {/* event log */}
      <section className="flex-1 mt-5 pb-5">
        <div className="overflow-y-auto h-96 p-10 bg-white rounded-md shadow-lg font-mono text-pink-500 flex flex-col-reverse space-y-2">
          {runFinished === null && <p className="animate-pulse">Waiting…</p>}
          <div>
            <span className="mr-2">{">>"}</span>
            {progress}
          </div>
          {currentTool && (
            <div className="py-4">
              <span>--- [Using: {currentTool}] ---</span>
            </div>
          )}
          {events.map((evt, i) => (
            <div key={i}>
              <span className="mr-2">{"-->"}</span>
              {renderEventMessage(evt)}
            </div>
          ))}
          {runStarted && (
            <div>
              <span className="animate-pulse">
                --- [AI storyteller started] ---
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
