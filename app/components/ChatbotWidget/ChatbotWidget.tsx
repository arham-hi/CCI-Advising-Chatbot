"use client";
import { useState, useRef } from "react";
import { useChat } from "ai/react";
import "./chatbot.css";
import Image from "next/image";
import logo from "../../assets/Charlotte_49ers_logo.png";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  const handleOpen = () => {
    setOpen(true);
    setShowHint(false);
  };

  // FIX 3: auto-expand textarea height as user types
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    const el = e.target;
    el.style.height = "auto";              // reset first
    el.style.height = `${el.scrollHeight}px`; // grow to content
    // CSS max-height + overflow-y: auto kicks in beyond 120px
  };

  const handleSend = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    handleSubmit(e as React.FormEvent<HTMLFormElement>);
    // Reset textarea height after send
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
        {/* FIX 2: same white-circle avatar as the in-chat bot */}
        <span className="logo-wrap">
          <Image src={logo} alt="CCI Chatbot" width={28} height={28} />
        </span>
      </button>

      {/* Chat window */}
      <div className={`chatbot ${open ? "show" : ""}`}>
        <header>
          <h2>CCI Chatbot</h2>
          <span onClick={() => setOpen(false)}>✖</span>
        </header>

        <ul className="chatbox">
          {messages.length === 0 && (
            <li className="chat incoming">
              <span className="avatar-wrap">
                <Image src={logo} alt="Bot" width={24} height={24} />
              </span>
              <p>Hello Niner, how can I help you today?</p>
            </li>
          )}

          {messages.map((msg, i) => (
            <li
              key={i}
              className={`chat ${msg.role === "user" ? "outgoing" : "incoming"}`}
            >
              {msg.role !== "user" && (
                <span className="avatar-wrap">
                  <Image src={logo} alt="Bot" width={24} height={24} />
                </span>
              )}
              <p>{msg.content}</p>
            </li>
          ))}

          {isLoading && (
            <li className="chat incoming">
              <span className="avatar-wrap">
                <Image src={logo} alt="Bot" width={24} height={24} />
              </span>
              <p>Thinking…</p>
            </li>
          )}
        </ul>

        {/* Input form */}
        <form className="chat-input" onSubmit={handleSend}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            placeholder="Ask a question..."
            rows={1}
            required
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" className="send-btn" aria-label="Send">
            ➤
          </button>
        </form>
      </div>
    </>
  );
}