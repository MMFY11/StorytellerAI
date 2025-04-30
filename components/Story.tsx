"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Pause, Play, StopCircle, Languages, Star } from "lucide-react";
import type { Story as StoryType, Page } from "@/types/stories";

interface Comment {
  id: number;
  userName: string;
  text: string;
  date: string;
}

export default function Story({ story }: { story: StoryType }) {
  const { data: session } = useSession();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const [count, setCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [average, setAverage] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Fetch comments & ratings
  useEffect(() => {
    fetch(`/api/comments?storyId=${story.id}`)
      .then((res) => res.json())
      .then(setComments);
    fetch(`/api/ratings?storyId=${story.id}`)
      .then((res) => res.json())
      .then(({ average, count, userRating }) => {
        setAverage(average);
        setRatingCount(count);
        setUserRating(userRating);
      });
  }, [story.id]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id, text: newComment }),
    });
    setNewComment("");
    const res = await fetch(`/api/comments?storyId=${story.id}`);
    setComments(await res.json());
  };

  const submitRating = async (score: number) => {
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id, score }),
    });
    const res = await fetch(`/api/ratings?storyId=${story.id}`);
    const data = await res.json();
    setAverage(data.average);
    setRatingCount(data.count);
    setUserRating(data.userRating);
  };

  return (
    <div>
      {/* Carousel code unchanged */}
      <div className="px-20">
        <Carousel setApi={setApi} className="w-full lg:w-4/5 h-56 mx-auto">
          <CarouselContent className="px-5">
            {story.pages.map((page: Page, i: number) => (
              <CarouselItem key={i}>
                <Card className="p-5 md:p-10 border">
                  <h2 className="text-center text-gray-400">{story.title}</h2>
                  <CardContent className="p-5 xl:flex">
                    <Image
                      src={page.png}
                      alt={`Page ${i + 1}`}
                      width={500}
                      height={500}
                      className="w-80 h-80 rounded-3xl mx-auto p-5 xl:order-last"
                    />
                    <p className="font-semibold text-xl whitespace-pre-wrap">
                      {page.txt}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Ratings */}
      <div className="mt-8 p-4 border rounded">
        <h3 className="text-lg font-semibold">Rate this story</h3>
        <p>
          Average: {average !== null ? average.toFixed(1) : "N/A"} ({ratingCount}{" "}
          vote{ratingCount !== 1 ? "s" : ""})
        </p>
        {session?.user && (
          <div className="flex space-x-2 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                onClick={() => submitRating(n)}
                variant={userRating && userRating >= n ? "destructive" : "outline"}
              >
                <Star className="mr-1" />
                {n}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="mt-8 p-4 border rounded">
        <h3 className="text-lg font-semibold">Comments</h3>
        {session?.user && (
          <div className="mt-2 flex flex-col">
            <textarea
              className="border p-2 rounded mb-2"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment..."
            />
            <Button onClick={submitComment} className="self-end">
              Submit
            </Button>
          </div>
        )}
        <div className="mt-4 space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="border-b pb-2">
              <p className="text-sm text-gray-500">
                {c.userName} on {new Date(c.date).toLocaleString()}
              </p>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
