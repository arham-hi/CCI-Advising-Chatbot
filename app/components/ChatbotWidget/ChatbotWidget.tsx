"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import "./chatbot.css";
import Image from "next/image";
import logo from "../../assets/Charlotte_49ers_logo.png";
import { BasicFace, SystemResponse } from "@datawise-innovations/assistant-visuals";

export default function ChatbotWidget() {
  const [open, setOpen]           = useState(false);
  const [showHint, setShowHint]   = useState(true);
  const [avatarMode, setAvatarMode] = useState(false); // ← toggles avatar panel
  const [volume, setVolume]       = useState(0);
  const [speaking, setSpeaking]   = useState(false);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const chatboxRef   = useRef<HTMLUListElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef     = useRef<SpeechSynthesisUtterance | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  const handleOpen = () => { setOpen(true); setShowHint(false); };

  // Auto-scroll chatbox
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // When the last bot message changes and avatar mode is on — speak it
  useEffect(() => {
    if (!avatarMode) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || isLoading) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(lastMsg.content);
    utterance.rate  = 1.05;
    utterance.pitch = 1;

    // Drive the face volume while speaking
    utterance.onstart = () => {
      setSpeaking(true);
      // Pulse volume with a simple interval — SpeechSynthesis doesn't give
      // real audio amplitude, so we simulate a talking pulse
      let t = 0;
      const interval = setInterval(() => {
        // Sine wave between 0.2 and 0.7 to simulate mouth movement
        setVolume(0.45 + Math.sin(t) * 0.25);
        t += 0.35;
      }, 80);
      utterance.onend = () => {
        clearInterval(interval);
        setVolume(0);
        setSpeaking(false);
      };
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [messages, isLoading, avatarMode]);

  // Stop speech when avatar mode is turned off
  useEffect(() => {
    if (!avatarMode) {
      window.speechSynthesis.cancel();
      setVolume(0);
      setSpeaking(false);
    }
  }, [avatarMode]);

  // Auto-expand textarea
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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // Last bot message for the speech bubble
  const lastBotMessage = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <>
      {showHint && !open && (
        <div className="chatbot-hint" onClick={handleOpen}>
          Have a question?
        </div>
      )}

      <button
        className={`chatbot-toggler ${open ? "active" : ""}`}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label="Toggle chatbot"
      >
        <span className="logo-wrap">
          <Image src={logo} alt="CCI Chatbot" width={26} height={26} priority />
        </span>
      </button>

      <div className={`chatbot ${open ? "show" : ""}`} role="dialog" aria-label="CCI Advising Chatbot">

        {/* ── Header ── */}
        <header>
          <div className="header-avatar">
            <Image src={logo} alt="Bot" width={22} height={22} />
          </div>
          <div className="header-text">
            <h2>CCI Advising Bot</h2>
            <p>UNC Charlotte · College of Computing</p>
          </div>
          <div className="header-dot" aria-hidden="true" />

          {/* Avatar mode toggle button */}
          <button
            className={`avatar-toggle-btn ${avatarMode ? "active" : ""}`}
            onClick={() => setAvatarMode((v) => !v)}
            aria-label={avatarMode ? "Switch to text mode" : "Switch to avatar mode"}
            title={avatarMode ? "Text mode" : "Voice avatar mode"}
          >
            {avatarMode ? (
              // Chat bubble icon — switch back to text
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            ) : (
              // Waveform / voice icon — switch to avatar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 20.662V19a5 5 0 0 1 10 0v1.662"/>
              </svg>
            )}
          </button>

          <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close chatbot">✕</button>
        </header>

        {/* ── Avatar Panel (shown when avatarMode is on) ── */}
        {avatarMode && (
          <div className="avatar-panel">
            <div className="avatar-face-wrap">
              <canvas
                ref={faceCanvasRef}
                width={120}
                height={120}
                className="avatar-canvas"
              />
              <BasicFace
                canvasRef={faceCanvasRef}
                radius={52}
                color="#046A38"
                volume={volume}
              />
            </div>
            <div className="avatar-bubble-wrap">
              <SystemResponse
                text={speaking && lastBotMessage ? lastBotMessage.content : ""}
                volume={volume}
                scale={0.85}
              />
              {!speaking && (
                <p className="avatar-idle-text">
                  {isLoading ? "Thinking…" : "Ask me anything about CCI advising."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Chatbox (always visible) ── */}
        <ul className="chatbox" ref={chatboxRef}>
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

          {messages.map((msg, i) => (
            <li key={i} className={`chat ${msg.role === "user" ? "outgoing" : "incoming"}`}>
              {msg.role !== "user" && (
                <span className="avatar-wrap">
                  <Image src={logo} alt="Bot" width={18} height={18} />
                </span>
              )}
              <p>{msg.content}</p>
            </li>
          ))}

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

        {/* ── Input ── */}
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
          <button type="submit" className="send-btn" aria-label="Send message">➤</button>
        </form>

      </div>
    </>
  );
}