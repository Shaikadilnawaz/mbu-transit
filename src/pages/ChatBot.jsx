import React, { useState, useEffect, useRef } from "react";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your assistant 🤖. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    // Simple bot response logic
    let botResponse = "Sorry, I didn't understand that 😅";
    const text = input.toLowerCase();
    if (text.includes("hi") || text.includes("hello")) botResponse = "Hello! 👋 How can I help you today?";
    else if (text.includes("auto") || text.includes("ride")) botResponse = "You can book an auto ride from the Auto Ride page 🚖.";
    else if (text.includes("bike")) botResponse = "Want to book a bike ride? Go to the Bike Ride page 🏍️.";
    else if (text.includes("fare")) botResponse = "Fare is calculated automatically based on distance and seats booked 💵.";
    else if (text.includes("help")) botResponse = "I'm here to guide you! Ask me about rides, fares, or schedules 🗺️.";

    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: botResponse }]);
    }, 500);

    setInput("");
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, fontFamily: "Poppins, sans-serif" }}>
      <div
        style={{
          width: open ? 320 : 60,
          height: open ? 420 : 60,
          background: "#4361ee",
          borderRadius: 16,
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          color: "#fff",
          transition: "all 0.3s",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {open ? (
          <>
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(90deg, #3a50c0, #4361ee)",
                padding: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                color: "#fff",
                textAlign: "center",
                fontSize: "1.05rem",
              }}
              onClick={() => setOpen(false)}
            >
              ChatBot 💬
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "10px",
                overflowY: "auto",
                background: "#f1f3f6",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 20,
                      maxWidth: "70%",
                      background: msg.from === "user" ? "#7c94f1" : "#fff",
                      color: msg.from === "user" ? "#fff" : "#333",
                      fontSize: 14,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      wordWrap: "break-word",
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                display: "flex",
                padding: "8px",
                gap: "6px",
                background: "#e0e4f3",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: 14,
                  zIndex: 10000,
                }}
                placeholder="Type a message..."
              />
              <button
                onClick={handleSend}
                style={{
                  background: "#4361ee",
                  border: "none",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 24,
            }}
            onClick={() => setOpen(true)}
          >
            💬
          </div>
        )}
      </div>
    </div>
  );
}
