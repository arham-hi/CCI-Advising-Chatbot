"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import "./chatbot.css";
import Image from "next/image";
import logo from "../../assets/Charlotte_49ers_logo.png";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  const handleOpen = () => {
    setOpen(true);
    setShowHint(false);
  };

  return (
    <>
      {/* Hint bubble */}
      {showHint && !open && (
        <div className="chatbot-hint" onClick={handleOpen}>
          Have a question?
        </div>
      )}

      {/* Floating toggle button — white circle wraps the logo */}
      <button
        className={`chatbot-toggler ${open ? "active" : ""}`}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label="Toggle chatbot"
      >
        <span className="logo-wrap">
          <Image src={logo} alt="CCI Chatbot" width={30} height={30} />
        </span>
      </button>

      {/* Chat window */}
      <div className={`chatbot ${open ? "show" : ""}`}>
        <header>
          <h2>CCI Chatbot</h2>
          <span onClick={() => setOpen(false)}>✖</span>
        </header>

        <ul className="chatbox">
          {/* Default greeting */}
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
        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question..."
            rows={1}
            required
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
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