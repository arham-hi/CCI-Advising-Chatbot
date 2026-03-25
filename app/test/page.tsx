"use client"

import ChatbotWidget from "../components/ChatbotWidget/ChatbotWidget"

export default function TestPage() {
  return (
    <>
      {/* Your chatbot */}
      <ChatbotWidget />

      {/* Embed the real site */}
      <iframe
        src="/test/advising.html"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
        }}
      />
    </>
  )
}