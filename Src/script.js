const webcamVideo = document.getElementById("webcam");
const screenVideo = document.getElementById("screen");

document.getElementById("startWebcam").addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  webcamVideo.srcObject = stream;
});

document.getElementById("startScreen").addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  screenVideo.srcObject = stream;
});

// Chat functionality
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");

function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";

    // Add username like Twitch chat
    const usernameSpan = document.createElement("span");
    usernameSpan.className = "username";
    usernameSpan.textContent = "You: ";
    messageDiv.appendChild(usernameSpan);

    // Add the message text
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    messageDiv.appendChild(messageSpan);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
    chatInput.focus(); // Keep focus on input for easy typing
  }
}

sendButton.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});