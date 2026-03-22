"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import "./chatbot.css";

export default function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
    } = useChat();

  return (
    <>
        {showHint && !open && (
            <div className="chatbot-hint" onClick={() => setOpen(true)}>
                Have a question?
            </div>
            )}

        {/* Floating Button */}
        <button  className={`chatbot-toggler ${open ? "active" : ""}`}  onClick={() => setOpen(!open)}> 💬 </button>

        {/* Chat Window */}
        <div className={`chatbot ${open ? "show" : ""}`}>
        <header>
          <h2>CCI Chatbot</h2>
          <span onClick={() => setOpen(false)}>✖</span>
        </header>

        <ul className="chatbox">
          {messages.length === 0 && (
            <li className="chat incoming">
              <span>C</span>
              <p>Hello Niner, how can I help you today?</p>
            </li>
          )}

          {messages.map((msg, i) => (
            <li
              key={i}
              className={`chat ${
                msg.role === "user" ? "outgoing" : "incoming"
              }`}
            >
              {msg.role !== "user" && <span>C</span>}
              <p>{msg.content}</p>
            </li>
          ))}

          {isLoading && (
            <li className="chat incoming">
              <span>🤖</span>
              <p>Thinking...</p>
            </li>
          )}
        </ul>

        {/* FORM = IMPORTANT */}
        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Enter a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <span onClick={handleSubmit}>➤</span>
        </form>
      </div>
    </>
  );
}