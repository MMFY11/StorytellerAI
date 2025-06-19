"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEditorProps {
  pageIndex: number;
  originalText: string;
  onClose: () => void;
  onSave: (newText: string) => void;
}

export default function ChatEditor({
  pageIndex,
  originalText,
  onClose,
  onSave,
}: ChatEditorProps) {
  const [instruction, setInstruction] = useState("");
  const [editedText, setEditedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendInstruction = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText, instruction }),
      });

      const data = await res.json();
      if (res.ok) {
        setEditedText(data.edited);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 w-full bg-white shadow border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Edit Page {pageIndex + 1}</h2>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-gray-500 hover:text-black" />
        </button>
      </div>

      <textarea
        className="w-full border p-2 rounded text-sm"
        rows={3}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Tell the bot what to change (e.g., 'Make it more fun')"
      />

      <Button onClick={sendInstruction} disabled={loading}>
        {loading ? "Editing…" : "Send"}
      </Button>

      {editedText && (
        <>
          <h3 className="text-sm font-semibold mt-2">Edited Result:</h3>
          <textarea
            className="w-full border p-2 rounded text-sm bg-gray-100"
            rows={3}
            value={editedText}
            readOnly
          />
          <Button onClick={() => onSave(editedText)} className="mt-2">
            ✅ Save This Edit
          </Button>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
