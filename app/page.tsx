"use client"

import Image from "next/image"
import { useChat } from "ai/react"
import type { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
// import PromptSuggestionRow from "./components/PromptSuggestionRow"
import ChatbotWidget from "./components/ChatbotWidget/ChatbotWidget";

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat()
    const noMessages = !messages || messages.length === 0

    const handlePrompt = (promptText) => {
        const msg: Message = {
            id: crypto.randomUUID(), 
            content: promptText,
            role: "user"
        }
        append(msg)
    }

    return (
        <div>      
            <ChatbotWidget/>
        </div>
    )
}

export default Home