"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Star as StarIcon, Trash2 as TrashIcon } from "lucide-react";
import ChatEditor from "@/components/ChatEditor";
import { toast } from "sonner";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Story as StoryType } from "@/types/stories";

interface Comment {
  id: number;
  userId: number;
  userName: string;
  text: string;
  date: string;
}

export default function Story({ story }: { story: StoryType }) {
  const { data: session } = useSession();
  const isReader = session?.user?.role === "reader";
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  // pages + manual‐edit buffer
  const [pagesState, setPagesState] = useState(story.pages);
  const [editTexts, setEditTexts] = useState(story.pages.map((p) => p.txt));

  // which page is in manual‐edit mode?
  const [manualEditIndex, setManualEditIndex] = useState<number | null>(null);
  // which page is in ChatEditor mode?
  const [chatEditIndex, setChatEditIndex] = useState<number | null>(null);

  // reader‐only
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [average, setAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  // translation
  const [translatedPages, setTranslatedPages] = useState<string[]>(
    () => story.pages.map(() => "")
  );

  // TTS / progress
  const [ttsLoadingIndex, setTtsLoadingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>();
  const [playingPage, setPlayingPage] = useState<number | null>(null);

  // fetch comments + ratings
  useEffect(() => {
    if (!isReader) return;

    fetch(`/api/comments?storyId=${story.id}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(console.error);

    fetch(`/api/ratings?storyId=${story.id}`)
      .then((r) => r.json())
      .then(({ average, count, userRating }) => {
        setAverage(typeof average === "string" ? +average : average);
        setRatingCount(count);
        setUserRating(userRating);
      })
      .catch(console.error);
  }, [story.id, isReader]);

  // ───── Reader: comments & ratings ─────
  const submitComment = async () => {
    if (!newComment.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id, text: newComment }),
    });
    setNewComment("");
    const r = await fetch(`/api/comments?storyId=${story.id}`);
    setComments(await r.json());
  };

  const deleteComment = async (id: number) => {
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: id }),
    });
    setComments((c) => c.filter((x) => x.id !== id));
  };

  const submitRating = async (score: number) => {
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id, score }),
    });
    const r = await fetch(`/api/ratings?storyId=${story.id}`);
    const d = await r.json();
    setAverage(typeof d.average === "string" ? +d.average : d.average);
    setRatingCount(d.count);
    setUserRating(d.userRating);
  };

  // ───── Translate ─────
  const translatePage = async (index: number, to: string) => {
    setTranslatedPages((p) => {
      const c = [...p];
      c[index] = "…";
      return c;
    });
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: story.pages[index].txt, to }),
    });
    const { translated } = await res.json();
    setTranslatedPages((p) => {
      const c = [...p];
      c[index] = translated;
      return c;
    });
  };

  // ───── TTS ─────
  const playAudio = async (index: number) => {
    setTtsLoadingIndex(index);
    setPlayingPage(index);
    const textToSpeak = translatedPages[index] || story.pages[index].txt;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textToSpeak }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current?.duration) {
          setProgress(
            (audioRef.current.currentTime / audioRef.current.duration) * 100
          );
        }
      });
      audioRef.current.addEventListener("ended", () => {
        setTtsLoadingIndex(null);
        setProgress(0);
        setPlayingPage(null);
      });
    } else {
      audioRef.current.src = url;
    }
    await audioRef.current.play();
    setTtsLoadingIndex(null);
  };
  const pauseAudio = () => audioRef.current?.pause();
  const resumeAudio = () => audioRef.current?.play();
  const stopAudio = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setProgress(0);
    setPlayingPage(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* ─── delete story (creators only) ─── */}
      {!isReader && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this story?")) {
                fetch("/api/delete-story", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ storyId: story.id }),
                })
                  .then(() => (window.location.href = "/stories"))
                  .catch(() => toast.error("Failed to delete story."));
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🗑 Delete Story
          </button>
        </div>
      )}

      {/* ─── Pages carousel ─── */}
      <Carousel className="w-full mx-auto" setApi={() => {}}>
        <CarouselContent>
          {pagesState.map((pg, i) => {
            const displayText = translatedPages[i] || pg.txt;
            const words = displayText.split(/\s+/);
            const highlightIndex = Math.floor((progress / 100) * words.length);

            return (
              <CarouselItem key={i}>
                <Card>
                  <CardContent className="p-4 flex flex-col md:flex-row items-center">
                    {/* illustration */}
                    <Image
                      src={pg.png}
                      alt={`Page ${i + 1}`}
                      width={300}
                      height={300}
                      className="rounded-lg"
                    />

                    {/* text or highlighted play‐along */}
                    <div className="mt-4 md:mt-0 md:ml-6">
                      {playingPage === i ? (
                        <p className="whitespace-pre-wrap">
                          {words.map((w, idx) => (
                            <span
                              key={idx}
                              className={
                                idx === highlightIndex ? "bg-pink-300" : ""
                              }
                            >
                              {w}{" "}
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap">{displayText}</p>
                      )}
                    </div>

                  </CardContent>

                  {/* ─── old Translate & TTS controls (unchanged) ─── */}
                  <div className="px-4 py-3 bg-gray-50 flex flex-wrap items-center gap-2">
                    <select
                      defaultValue=""
                      onChange={(e) => translatePage(i, e.currentTarget.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="" disabled>
                        Translate…
                      </option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                      <option value="zh">中文</option>
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>

                    {ttsLoadingIndex === i ? (
                      <span className="text-sm text-gray-500">Loading…</span>
                    ) : (
                      <>
                        <button
                          onClick={() => playAudio(i)}
                          className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          ▶ Play
                        </button>
                        <button
                          onClick={pauseAudio}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded"
                        >
                          ❚❚ Pause
                        </button>
                        <button
                          onClick={resumeAudio}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded"
                        >
                          ► Resume
                        </button>
                        <button
                          onClick={stopAudio}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded"
                        >
                          ■ Stop
                        </button>
                      </>
                    )}
                  </div>

                  {/* ─── two edit buttons (creators only) ─── */}
                  {!isReader && (
                    <div className="flex gap-2 m-4">
                      <button
                        onClick={() => {
                            // seed the textarea with whatever is currently displayed
                            setEditTexts((arr) => {
                              const copy = [...arr];
                               // use the translated text if present, otherwise the original
                               copy[i] = translatedPages[i] || pagesState[i].txt;
                               return copy;
                             });

                          setManualEditIndex(i);
                          setChatEditIndex(null);
                        }}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        🖉 Edit Text
                      </button>
                      <button
                        onClick={() => {
                          setChatEditIndex(i);
                          setManualEditIndex(null);
                        }}
                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        🤖 Edit Text with Chatbot
                      </button>
                    </div>
                  )}

                  {/* ─── manual‐edit panel ─── */}
                  {manualEditIndex === i && (
                    <div className="p-4 bg-gray-50 space-y-2">
                      <textarea
                        value={editTexts[i]}
                        onChange={(e) =>
                          setEditTexts((arr) => {
                            const copy = [...arr];
                            copy[i] = e.target.value;
                            return copy;
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setManualEditIndex(null)}
                          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Save manual edits?")) return;
                            const newText = editTexts[i];
                            await fetch("/api/edit-page", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                storyId: story.id,
                                pageNumber: i + 1,
                                newText,
                              }),
                            });
                            setPagesState((arr) => {
                              const copy = [...arr];
                              copy[i] = { ...copy[i], txt: newText };
                              return copy;
                            });
                            toast.success("Page text updated!");
                            setManualEditIndex(null);
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── ChatEditor modal ─── */}
                  {chatEditIndex === i && (
                    <ChatEditor
                      pageIndex={i}
                      originalText={story.pages[i].txt}
                      onClose={() => setChatEditIndex(null)}
                      onSave={async (newText) => {
                        await fetch("/api/edit-page", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            storyId: story.id,
                            pageNumber: i + 1,
                            newText,
                          }),
                        });
                        setPagesState((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], txt: newText };
                          return copy;
                        });
                        toast.success("AI edit saved!");
                        setChatEditIndex(null);
                      }}
                    />
                  )}

                  {/* ─── progress bar ─── */}
                  <div className="h-1 bg-gray-200 mt-4">
                    <div
                      className="h-full bg-pink-500 transition-[width]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* ─── Ratings & Comments (readers only) ─── */}
      {isReader && (
        <div className="space-y-8">
          {/* ratings */}
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Rate this story</h3>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon
                  key={n}
                  onClick={() => submitRating(n)}
                  className={`w-6 h-6 cursor-pointer mr-1 hover:text-yellow-500 ${
                    userRating !== null && userRating >= n
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center space-x-1">
              <span className="text-xl font-semibold">
                {average.toFixed(1)}
              </span>
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-600">
                ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
              </span>
            </div>
          </div>

          {/* comments */}
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            <textarea
              className="w-full border p-2 rounded mb-2"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment…"
            />
            <Button onClick={submitComment} className="mb-4">
              Submit Comment
            </Button>
            <div className="space-y-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="border-b pb-2 flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm text-gray-500">
                      {c.userName} on {new Date(c.date).toLocaleString()}
                    </p>
                    <p>{c.text}</p>
                  </div>
                  {currentUserId === c.userId && (
                    <TrashIcon
                      onClick={() => deleteComment(c.id)}
                      className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
