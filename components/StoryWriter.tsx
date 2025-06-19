"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import secondLogo from "@/images/secondlogo.png";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

export default function StoryWriter() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [pages, setPages] = useState(0);
  const [pagesOpen, setPagesOpen] = useState(false);
   const [styleOpen, setStyleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storyId, setStoryId] = useState<number | null>(null);
  const [draftPages, setDraftPages] = useState<string[]>([]);
  const [translatedPages, setTranslatedPages] = useState<string[]>([]);
  const [style, setStyle] = useState<string>("");

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("language", "en");
        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          const json = await res.json();
          if (res.ok && json.text) {
            setPrompt(json.text);
          } else {
            toast.error(json.error || "Failed to transcribe audio.");
          }
        } catch {
          toast.error("Failed to transcribe audio.");
        } finally {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Could not access microphone.");
      setIsRecording(false);
    }
  };

  const handleGenerate = async () => {
  if (!prompt.trim() || pages <= 0) return;
  setLoading(true);

  try {
    const res = await fetch("/api/run-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, pages, style }),
    });
    const json = await res.json() as {
      success?: boolean;
      storyId?: number;
      pages?: string[];
      error?: string;
    };

    // if the API returned an error field, show it
    if (json.error || !res.ok) {
      toast.error(json.error || "failed to generate story. ");
      return;
    }

    // success
    const id = json.storyId!;
    setStoryId(id);
    setDraftPages(Array.isArray(json.pages) ? json.pages! : []);
    setTranslatedPages(new Array(json.pages?.length || 0).fill(""));

    toast.success("🎉 Your story is finished!", {
      action: {
        label: "View",
        onClick: () => router.push(`/stories/${id}`),
      },
    });
  } catch (err) {
    toast.error("Inappropriate for children please choose another topic.");
  } finally {
    setLoading(false);
  }
};



  const translatePage = async (i: number, to: string) => {
    setTranslatedPages((p) => {
      const c = [...p];
      c[i] = "…";
      return c;
    });
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draftPages[i], to }),
    });
    const { translated } = await res.json();
    setTranslatedPages((p) => {
      const c = [...p];
      c[i] = translated;
      return c;
    });
  };

  const speakText = async (text: string) => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const blob = await res.blob();
    new Audio(URL.createObjectURL(blob)).play();
  };

  const canGenerate =
    prompt.trim().length > 0 && pages > 0 && style !== "" && !loading;

  return (
    <Fragment>
      {(pagesOpen || styleOpen) && (
        <div className="fixed inset-0 bg-black/40 z-40" />
      )}
      <div className="grid grid-cols-2 h-full relative z-10">
        <div className="hidden lg:flex relative overflow-hidden flex-col items-center justify-center p-8 text-white space-y-4">
          <video
            autoPlay
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/white.mp4" type="video/mp4" />
          </video>
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <Image src={secondLogo} alt="Kidotopia" width={300} height={300} />
            <div className="text-center">
              <h1 className="text-3xl font-bold">Welcome to Kidotopia</h1>
              <p className="mt-2 text-lg">
                Speak or type your story prompt, pick the length, and watch the
                magic!
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Create a New Story
            </h2>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Your story prompt…"
                className="flex-grow border px-3 py-2 rounded"
              />
              {isRecording ? (
                <MicOff
                  className="w-6 h-6 text-red-600 cursor-pointer animate-pulse"
                  onClick={handleMicClick}
                />
              ) : (
                <Mic
                  className="w-6 h-6 text-gray-600 cursor-pointer"
                  onClick={handleMicClick}
                />
              )}
            </div>
            <Select
              open={pagesOpen}
              onOpenChange={setPagesOpen}
              onValueChange={(v) => setPages(Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pages" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm shadow-lg rounded-md z-50">
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} page{n > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              open={styleOpen}
              onOpenChange={setStyleOpen}
              onValueChange={(v) => setStyle(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose style…" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm shadow-lg rounded-md z-50">
                {[
                  "Simple cartoon",
                  "Watercolor wash",
                  "Minimalist line art",
                  "Retro vintage",
                  "Fantasy whimsical",
                  "Digital painting",
                  "Realistic",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? "Generating…" : "Generate Story"}
            </Button>
            <div className="h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className={`h-full ${
                  !loading && storyId ? "bg-green-600" : "bg-indigo-600"
                }`}
                style={{
                  width: loading ? "50%" : storyId ? "100%" : "0%",
                }}
              />
            </div>
            {draftPages.map((txt, i) => (
              <div key={i} className="p-4 border rounded space-y-2">
                <p>{txt}</p>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => translatePage(i, e.target.value)}
                    className="border px-2 py-1 rounded"
                  >
                    <option value="">Translate…</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                  <button
                    onClick={() => speakText(txt)}
                    className="p-1 bg-indigo-600 rounded text-white"
                  >
                    🔊
                  </button>
                </div>
                {translatedPages[i] && (
                  <p className="italic text-gray-600">
                    {translatedPages[i]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
