const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

let messages = [];
let loading = false;

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "AI";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  div.append(avatar, bubble);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "message assistant";
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">
      <div class="typing"><span></span><span></span><span></span></div>
    </div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function hideTyping() {
  document.getElementById("typing-indicator")?.remove();
}

function showError(msg) {
  const div = document.createElement("div");
  div.className = "error";
  div.textContent = msg;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const text = input.value.trim();
  if (!text || loading) return;

  input.value = "";
  messages.push({ role: "user", content: text });
  addMessage("user", text);

  loading = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();

    hideTyping();

    if (!res.ok) {
      showError(data.error || "Something went wrong.");
      return;
    }

    const reply = data.message?.content ?? "";
    messages.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);
  } catch (err) {
    hideTyping();
    showError("Network error. Check the server and try again.");
  } finally {
    loading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

input.focus();
