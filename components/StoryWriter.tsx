"use client";
import { useEffect, useState } from "react";
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

const storiesPath = "public/stories";

function StoryWriter() {
  const [story, setStory] = useState<string>("");
  const [pages, setPages] = useState<number>();
  const [progress, setProgress] = useState("");
  const [runStarted, setRunStarted] = useState<boolean>(false);
  const [runFinished, setRunFinished] = useState<boolean | null>(null);
  const [currentTool, setCurrentTool] = useState("");
  const [events, setEvents] = useState<Frame[]>([]);
  const router = useRouter();

  const runScript = async () => {
    try {
      console.log("Starting runScript function");

      setRunStarted(true);
      setRunFinished(false);

      console.log("Making fetch request to /api/run-script");

      const response = await fetch("/api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story, pages, path: storiesPath }),
      });

      console.log("Fetch request completed", response);

      if (response.ok && response.body) {
        console.log("Streaming started");

        // Handle streams from the API
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        handleStream(reader, decoder);
      } else {
        console.error(
          "Failed to start streaming",
          response.status,
          response.statusText
        );
        setRunFinished(true);
        setRunStarted(false);
      }
    } catch (error) {
      console.error("Fetch request failed", error);
      setRunFinished(true);
      setRunStarted(false);
    }
  };

  async function handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) {
    let buffer: string = "";
    while (true) {
      const { value, done } = await reader.read();

      if (done) break; // breaks out of the infinite loop

      // Decode the Uint8Array into a string
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Split the buffer into individual lines
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      // Process each complete line
      lines.forEach((line) => {
        if (line.startsWith("event: ")) {
          const data = line.replace(/^event: /, "");
          try {
            const parsedData = JSON.parse(data);

            if (parsedData.type === "callProgress") {
              setProgress(
                parsedData.output[parsedData.output.length - 1].content
              );
              setCurrentTool(parsedData.tool?.description || "");
            } else if (parsedData.type === "callStart") {
              setCurrentTool(parsedData.tool?.description || "");
            } else if (parsedData.type === "runFinish") {
              setRunFinished(true);
              setRunStarted(false);
            } else {
              setEvents((prevEvents) => [...prevEvents, parsedData]);
            }
          } catch (error) {
            console.error("Failed to parse JSON", error, data);
          }
        }
      });
    }
  }

  useEffect(() => {
    if (runFinished) {
      toast.success("Story generated successfully!", {
        action: (
          <Button
            onClick={() => router.push("/stories")}
            className="bg-purple-500 ml-auto"
          >
            View Stories
          </Button>
        ),
      });
    }
  }, [runFinished, router]);

  return (
    <div className="flex flex-col container">
      <section className="flex-1 flex flex-col border border-purple-300 rounded-md p-10 space-y-2">
        <Textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="flex-1 text-black"
          placeholder="Write a story about a robot and a human who become friends..."
        />

        <Select onValueChange={(value) => setPages(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="How many pages should the story be?" />
          </SelectTrigger>

          <SelectContent className="w-full">
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={!story || !pages || runStarted}
          className="w-full"
          size="lg"
          onClick={runScript}
        >
          Generate Story
        </Button>
      </section>
      <section className="flex-1 pb-5 mt-5">
        <div className="flex flex-col-reverse w-full space-y-2 bg-gray-800 rounded-md text-gray-300 font-mono p-10 h-96 overflow-y-auto">
          <div>
            {runFinished === null && (
              <>
                <p className="animate-pulse mr-5">
                  Im waiting for you to Generate a story above ...
                </p>
                <br />
              </>
            )}

            <span className="mr-5">{">>"}</span>
            {progress}
          </div>
          {/*Current Tool */}
          {currentTool && (
            <div className="py-10">
              <span className="mr-5">{"--- [current Tool] ---"}</span>
            </div>
          )}
          {/*Render Events ... */}
          <div className="space-y-5">
            {events.map((event, index) => (
              <div key={index}>
                <span className="mr-5">{">>"}</span>
                {renderEventMessage(event)}
              </div>
            ))}
          </div>
          {runStarted && (
            <div>
              <span className="mr-5 animate-in">
                {"--- [AI Storyteller Has Started] ---"}
              </span>
              <br />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default StoryWriter;
