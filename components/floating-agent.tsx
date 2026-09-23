"use client";

import { Chat, type ChatMessage, type ChatParticipant } from "@promptbook/components";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

const participants: ChatParticipant[] = [
  {
    name: "USER",
    fullname: "You",
    isMe: true,
    color: "#30A8BD",
  },
  {
    name: "AGENT",
    fullname: "Promptbook Agent",
    color: "#30BDA8",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    from: "AGENT",
    date: new Date(),
    content: "Hi. I am the floating Promptbook agent.",
    isComplete: true,
  },
  {
    id: "2",
    from: "AGENT",
    date: new Date(),
    content: "Use this pattern for support, onboarding, or an app-specific assistant.",
    isComplete: true,
  },
];

export function FloatingAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const handleMessage = (content: string) => {
    setMessages((current) => [
      ...current,
      {
        id: `${current.length + 1}`,
        from: "USER",
        date: new Date(),
        content,
        isComplete: true,
      },
    ]);
  };

  return (
    <div className="floating-agent">
      {isOpen ? (
        <div className="floating-agent-panel">
          <button
            className="floating-agent-close"
            type="button"
            aria-label="Close agent"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>

          <Chat
            style={{ height: "420px" }}
            messages={messages}
            participants={participants}
            onMessage={handleMessage}
            placeholderMessageContent="Ask anything…"
            isFocusedOnLoad={false}
            isSaveButtonEnabled={false}
          />
        </div>
      ) : null}

      <button
        className="floating-agent-trigger"
        type="button"
        aria-label="Open Promptbook agent"
        onClick={() => setIsOpen((value) => !value)}
      >
        <MessageCircle size={22} />
        <span>Ask AI</span>
      </button>
    </div>
  );
}
