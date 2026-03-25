"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import "./chatbot.css";
import Image from "next/image";
import logo from "../../assets/Charlotte_49ers_logo.png";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatboxRef  = useRef<HTMLUListElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  const handleOpen = () => {
    setOpen(true);
    setShowHint(false);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-expand textarea as user types, up to max-height
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleSend = (
    e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e as React.FormEvent<HTMLFormElement>);
    // Reset textarea after send
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <>
      {/* Hint bubble */}
      {showHint && !open && (
        <div className="chatbot-hint" onClick={handleOpen}>
          Have a question?
        </div>
      )}

      {/* Floating toggle button */}
      <button
        className={`chatbot-toggler ${open ? "active" : ""}`}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label="Toggle chatbot"
      >
        <span className="logo-wrap">
          <Image src={logo} alt="CCI Chatbot" width={26} height={26} priority />
        </span>
      </button>

      {/* Chat window */}
      <div className={`chatbot ${open ? "show" : ""}`} role="dialog" aria-label="CCI Advising Chatbot">

        {/* Header */}
        <header>
          <div className="header-avatar">
            <Image src={logo} alt="Bot" width={22} height={22} />
          </div>
          <div className="header-text">
            <h2>CCI Advising Bot</h2>
            <p>UNC Charlotte · College of Computing & Informatics</p>
          </div>
          <div className="header-dot" aria-hidden="true" />
          <button
            className="close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close chatbot"
          >
            ✕
          </button>
        </header>

        {/* Messages */}
        <ul className="chatbox" ref={chatboxRef}>
          {/* Welcome message */}
          {messages.length === 0 && (
            <li className="chat incoming">
              <span className="avatar-wrap">
                <Image src={logo} alt="Bot" width={18} height={18} />
              </span>
              <p>
                Hey there, Niner! 👋{"\n"}
                I can help with CCI majors, courses, degree requirements, and advising questions.{"\n\n"}
                What can I help you with?
              </p>
            </li>
          )}

          {/* Message history */}
          {messages.map((msg, i) => (
            <li
              key={i}
              className={`chat ${msg.role === "user" ? "outgoing" : "incoming"}`}
            >
              {msg.role !== "user" && (
                <span className="avatar-wrap">
                  <Image src={logo} alt="Bot" width={18} height={18} />
                </span>
              )}
              <p>{msg.content}</p>
            </li>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <li className="chat incoming">
              <span className="avatar-wrap">
                <Image src={logo} alt="Bot" width={18} height={18} />
              </span>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </li>
          )}
        </ul>

        {/* Input */}
        <form className="chat-input" onSubmit={handleSend}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            placeholder="Ask about courses, majors, or requirements…"
            rows={1}
            required
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" className="send-btn" aria-label="Send message">
            ➤
          </button>
        </form>

      </div>
    </>
  );
}