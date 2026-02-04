import { useState, useRef, useEffect } from 'react'
import api from '../utils/api'
import './Chatbot.css'

function Chatbot({ onNewUpload }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm Enigma, your RAG assistant. I can answer questions based on the PDF you uploaded. What would you like to know?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await api.post('/api/chat', {
        question: userMessage,
        sessionId: sessionId,
      })

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ])
    } catch (error) {
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      // Handle different error types
      if (!error.response) {
        // Network error
        errorMessage = error.message || 'Cannot connect to server. Please ensure the backend is running.'
      } else if (error.response?.data) {
        // Backend error response
        const errorData = error.response.data
        errorMessage = errorData.error || errorData.details || errorData.message || errorMessage
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleClearChat = async () => {
    try {
      await api.post('/api/clear-history', { sessionId })
      setMessages([
        {
          role: 'assistant',
          content:
            "Chat history cleared! I'm ready for new questions. What would you like to know?",
        },
      ])
    } catch (error) {
      console.error('Failed to clear history:', error)
      // Optionally show error to user, but don't block the UI
    }
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <h2>💬 Chat with Enigma</h2>
          <div className="header-actions">
            <button onClick={handleClearChat} className="clear-btn">
              Clear Chat
            </button>
            <button onClick={onNewUpload} className="upload-new-btn">
              Upload New PDF
            </button>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.role === 'assistant' && (
                <div className="message-avatar">🤖</div>
              )}
              <div className="message-text">{message.content}</div>
              {message.role === 'user' && (
                <div className="message-avatar">👤</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content">
              <div className="message-avatar">🤖</div>
              <div className="message-text">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="input-container" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about the PDF..."
          className="chat-input"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          className="send-button"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  )
}

export default Chatbot
