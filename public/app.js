
/* =====================================
   NOVA - MAIN JAVASCRIPT
   ===================================== */

const $ = (id) => document.getElementById(id);

const messageInput = $("messageInput");
const sendButton = $("sendButton");
const messagesContainer = $("messages");
const welcomeSection = $("welcomeSection");

const activityArea = $("activityArea");
const activityOrb = $("activityOrb");
const activityText = $("activityText");
const connectionText = $("connectionText");

const settingsBackdrop = $("settingsBackdrop");
const settingsButton = $("settingsButton");
const closeSettings = $("closeSettings");
const saveSettings = $("saveSettings");

const responseStyle = $("responseStyle");
const voiceToggle = $("voiceToggle");
const voiceSelect = $("voiceSelect");
const imagesView = $("imagesView");
const composerSection = $("composerSection");
const memoryNotes = $("memoryNotes");

const voiceButton = $("voiceButton");
const voiceStatus = $("voiceStatus");

let conversation = [];
let isThinking = false;
let recognition = null;

let settings = {
  style: "Friendly and intelligent",
  voiceEnabled: false,
  voice: "default",
  memory: ""
};

/* =====================================
   LOAD SETTINGS
   ===================================== */

function loadSettings() {
  try {
    const saved = localStorage.getItem("novaSettings");

    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn("Could not load Nova settings.");
  }

  if (responseStyle) {
    responseStyle.value = settings.style;
  }

  if (voiceToggle) {
    voiceToggle.checked = settings.voiceEnabled;
  }

  if (voiceSelect) {
    voiceSelect.value = settings.voice;
  }

  if (memoryNotes) {
    memoryNotes.value = settings.memory;
  }
}

function saveLocalSettings() {
  try {
    localStorage.setItem("novaSettings", JSON.stringify(settings));
  } catch (error) {
    console.warn("Could not save Nova settings.");
  }
}

loadSettings();

/* =====================================
   CHAT MESSAGE DISPLAY
   ===================================== */

function addMessage(role, content) {
  if (!messagesContainer) return;

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "Y" : "N";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const paragraph = document.createElement("p");
  paragraph.textContent = content;

  messageContent.appendChild(paragraph);
  message.appendChild(avatar);
  message.appendChild(messageContent);

  messagesContainer.appendChild(message);

  message.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });
}

/* =====================================
   NOVA ACTIVITY ANIMATION
   ===================================== */

function setActivity(state, text) {
  if (activityArea) {
    activityArea.classList.remove("hidden");
  }

  if (activityOrb) {
    activityOrb.classList.remove(
      "thinking",
      "listening",
      "speaking"
    );

    if (state) {
      activityOrb.classList.add(state);
    }
  }

  if (activityText) {
    activityText.textContent = text;
  }
}

function hideActivity() {
  if (activityArea) {
    activityArea.classList.add("hidden");
  }

  if (activityOrb) {
    activityOrb.classList.remove(
      "thinking",
      "listening",
      "speaking"
    );
  }
}

/* =====================================
   SEND MESSAGE TO NOVA
   ===================================== */

async function sendMessage(text) {
  text = String(text || "").trim();

  if (!text || isThinking) return;

  if (welcomeSection) {
    welcomeSection.hidden = true;
  }

  addMessage("user", text);

  conversation.push({
    role: "user",
    content: text
  });

  if (messageInput) {
    messageInput.value = "";
    messageInput.style.height = "auto";
  }

  isThinking = true;

  if (sendButton) {
    sendButton.disabled = true;
  }

  if (connectionText) {
    connectionText.textContent = "Nova is thinking";
  }

  setActivity("thinking", "Nova is thinking...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation.slice(-16),
        style: settings.style,
        memory: settings.memory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI service unavailable.");
    }

    const reply = String(data.reply || "I couldn't create a reply.");

    conversation.push({
      role: "assistant",
      content: reply
    });

    addMessage("assistant", reply);

    if (connectionText) {
      connectionText.textContent = "Nova is ready";
    }

    hideActivity();

    if (settings.voiceEnabled) {
      speakReply(reply);
    }

  } catch (error) {
    console.error("Nova error:", error);

    const errorMessage =
      "I'm having trouble connecting right now. Please try again in a moment.";

    addMessage("assistant", errorMessage);

    if (connectionText) {
      connectionText.textContent = "Connection unavailable";
    }

    hideActivity();

  } finally {
    isThinking = false;

    if (sendButton) {
      sendButton.disabled = false;
    }

    if (messageInput) {
      messageInput.focus();
    }
  }
}

/* =====================================
   SEND BUTTON AND KEYBOARD
   ===================================== */

if (sendButton) {
  sendButton.addEventListener("click", () => {
    sendMessage(messageInput?.value);
  });
}

if (messageInput) {
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(messageInput.value);
    }
  });

  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height =
      Math.min(messageInput.scrollHeight, 150) + "px";
  });
}

/* =====================================
   SUGGESTION BUTTONS
   ===================================== */

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.prompt || button.textContent.trim());
  });
});

/* =====================================
   SETTINGS WINDOW
   ===================================== */

function openSettings() {
  if (settingsBackdrop) {
    settingsBackdrop.classList.remove("hidden");
  }
}

function hideSettings() {
  if (settingsBackdrop) {
    settingsBackdrop.classList.add("hidden");
  }
}

if (settingsButton) {
  settingsButton.addEventListener("click", openSettings);
}

if (closeSettings) {
  closeSettings.addEventListener("click", hideSettings);
}

if (settingsBackdrop) {
  settingsBackdrop.addEventListener("click", (event) => {
    if (event.target === settingsBackdrop) {
      hideSettings();
    }
  });
}

if (saveSettings) {
  saveSettings.addEventListener("click", () => {
    settings.style = responseStyle?.value ||
      "Friendly and intelligent";

    settings.voiceEnabled = Boolean(voiceToggle?.checked);

    settings.voice = voiceSelect?.value || "default";

    settings.memory = memoryNotes?.value || "";

    saveLocalSettings();
    hideSettings();

    if (connectionText) {
      connectionText.textContent = "Settings saved";
    }
  });
}

/* =====================================
   VOICE OUTPUT
   ===================================== */

function getSelectedVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  if (!voices.length) return null;

  if (settings.voice === "default") {
    return voices.find((voice) => voice.default) || voices[0];
  }

  if (settings.voice === "female") {
    return voices.find((voice) =>
      /female|woman|zira|samantha|karen|susan/i.test(voice.name)
    ) || voices[0];
  }

  if (settings.voice === "male") {
    return voices.find((voice) =>
      /male|man|david|mark|daniel|alex/i.test(voice.name)
    ) || voices[0];
  }

  return voices[0];
}

function speakReply(text) {
  if (!("speechSynthesis" in window)) {
    if (voiceStatus) {
      voiceStatus.textContent =
        "Voice playback isn't supported by this browser.";
    }
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  const selectedVoice = getSelectedVoice();

  if (selectedVoice) {
    speech.voice = selectedVoice;
  }

  speech.rate = 1;
  speech.pitch = 1;

  speech.onstart = () => {
    setActivity("speaking", "Nova is speaking...");
  };

  speech.onend = () => {
    hideActivity();
  };

  speech.onerror = () => {
    hideActivity();
  };

  window.speechSynthesis.speak(speech);
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    getSelectedVoice();
  };
}

/* =====================================
   VOICE INPUT
   ===================================== */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = navigator.language || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setActivity("listening", "Nova is listening...");

    if (voiceStatus) {
      voiceStatus.textContent = "Listening...";
    }
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results[0][0].transcript;

    if (messageInput) {
      messageInput.value = transcript;
    }

    hideActivity();

    if (voiceStatus) {
      voiceStatus.textContent = "Voice captured.";
    }
  };

  recognition.onerror = () => {
    hideActivity();

    if (voiceStatus) {
      voiceStatus.textContent =
        "Voice input is unavailable. You can type instead.";
    }
  };

  recognition.onend = () => {
    if (voiceStatus) {
      voiceStatus.textContent = "";
    }

    if (activityOrb) {
      activityOrb.classList.remove("listening");
    }
  };

} else if (voiceStatus) {
  voiceStatus.textContent =
    "Voice input is not supported in this browser.";
}

if (voiceButton) {
  voiceButton.addEventListener("click", () => {
    if (!recognition) {
      if (voiceStatus) {
        voiceStatus.textContent =
          "Your browser does not support voice input.";
      }
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      if (voiceStatus) {
        voiceStatus.textContent =
          "Voice input is already active.";
      }
    }
  });
}

/* =====================================
   INITIAL STATE
   ===================================== */

hideActivity();

if (connectionText) {
  connectionText.textContent = "Nova is ready";
}

console.log("Nova interface initialized.");


// Responsive navigation for desktop sidebar and mobile bottom bar.
function showView(view) {
  const isChat = view === "chat";
  const isImages = view === "images";
  if (welcomeSection) welcomeSection.hidden = !isChat || messagesContainer?.children.length > 0;
  if (messagesContainer?.parentElement) messagesContainer.parentElement.hidden = !isChat;
  if (imagesView) imagesView.hidden = !isImages;
  const composerSection = $("composerSection");
  if (composerSection) composerSection.hidden = !isChat;
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  if (view === "settings") openSettings();
}
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
const newChatButton = $("newChatButton");
if (newChatButton) newChatButton.addEventListener("click", () => {
  conversation = [];
  if (messagesContainer) messagesContainer.replaceChildren();
  if (welcomeSection) welcomeSection.hidden = false;
  if (messagesContainer?.parentElement) messagesContainer.parentElement.hidden = false;
  if (imagesView) imagesView.hidden = true;
  const composerSection = $("composerSection");
  if (composerSection) composerSection.hidden = false;
  showView("chat");
  if (messageInput) messageInput.focus();
});


// Mobile drawer controls and menu navigation.
const drawerBackdrop = $("drawerBackdrop");
const menuButton = $("menuButton");
const closeDrawer = $("closeDrawer");
const drawerNewChat = $("drawerNewChat");
function openDrawer(){ if(drawerBackdrop) drawerBackdrop.classList.remove("hidden"); }
function hideDrawer(){ if(drawerBackdrop) drawerBackdrop.classList.add("hidden"); }
if(menuButton) menuButton.addEventListener("click", openDrawer);
if(closeDrawer) closeDrawer.addEventListener("click", hideDrawer);
if(drawerBackdrop) drawerBackdrop.addEventListener("click", (event)=>{ if(event.target===drawerBackdrop) hideDrawer(); });
if(drawerNewChat) drawerNewChat.addEventListener("click", ()=>{ hideDrawer(); if(newChatButton) newChatButton.click(); });
document.querySelectorAll(".mobile-drawer [data-view]").forEach((button)=>button.addEventListener("click", ()=>{
  const view=button.dataset.view;
  hideDrawer();
  showView(view);
}));

/* Persistent conversation history */
let activeConversationId = null;
function saveConversationHistory(){
  if(!conversation.length) return;
  try{
    const all=JSON.parse(localStorage.getItem("novaHistory")||"[]");
    const title=(conversation.find(m=>m.role==="user")?.content||"New chat").slice(0,42);
    const item={id:activeConversationId||(activeConversationId=String(Date.now())),title,messages:conversation.slice(),updated:Date.now()};
    const index=all.findIndex(x=>x.id===item.id);
    if(index>=0) all[index]=item; else all.unshift(item);
    localStorage.setItem("novaHistory",JSON.stringify(all.slice(0,40)));
    renderHistory();
  }catch(e){console.warn("History could not be saved",e);}
}
function renderHistory(){
  let all=[];try{all=JSON.parse(localStorage.getItem("novaHistory")||"[]");}catch(e){}
  ["historyList","desktopHistoryList"].forEach(id=>{
    const list=$(id);if(!list)return;list.replaceChildren();
    all.forEach(item=>{
      const b=document.createElement("button");b.className="recent-chat";b.type="button";b.textContent="◷ "+item.title;
      b.addEventListener("click",()=>loadHistoryItem(item.id));list.appendChild(b);
    });
    if(!all.length){const p=document.createElement("p");p.className="history-empty";p.textContent="Your conversations will appear here.";list.appendChild(p);}
  });
}
function loadHistoryItem(id){
  const all=JSON.parse(localStorage.getItem("novaHistory")||"[]"),item=all.find(x=>x.id===id);if(!item)return;
  activeConversationId=item.id;conversation=item.messages.slice();messagesContainer.replaceChildren();
  conversation.forEach(m=>addMessage(m.role,m.content));
  welcomeSection.hidden=true;showView("chat");hideDrawer();
}
const originalSendMessage=sendMessage;
sendMessage=async function(text){
  const before=conversation.length;
  await originalSendMessage(text);
  if(conversation.length>before) saveConversationHistory();
};
const originalNewChat=$("newChatButton");
if(originalNewChat) originalNewChat.addEventListener("click",()=>{activeConversationId=null;});
if(drawerNewChat) drawerNewChat.addEventListener("click",()=>{activeConversationId=null;});
renderHistory();

/* Browser-based Live Voice: speech recognition, Nova reply, spoken answer, repeat. */
const liveBackdrop=$("liveBackdrop"),liveStart=$("liveStart"),liveStatus=$("liveStatus"),liveOrb=$("liveOrb");
let liveActive=false,liveListening=false;
function setLiveStatus(t){if(liveStatus)liveStatus.textContent=t;}
function stopLive(){liveActive=false;liveListening=false;try{recognition&&recognition.stop();}catch(e){}if("speechSynthesis"in window)window.speechSynthesis.cancel();if(liveOrb)liveOrb.classList.remove("active");if(liveStart)liveStart.textContent="Start talking";setLiveStatus("Live Voice is off.");}
function beginLiveListening(){
  if(!liveActive||!recognition)return;
  try{recognition.continuous=false;recognition.interimResults=false;recognition.lang=navigator.language||"en-US";recognition.start();liveListening=true;setLiveStatus("Listening…");if(liveOrb)liveOrb.classList.add("active");}
  catch(e){setLiveStatus("Microphone is busy. Tap Start talking to try again.");}
}
if(liveStart)liveStart.addEventListener("click",()=>{
  if(!recognition){setLiveStatus("Live speech recognition is not supported in this browser. You can still type to Nova.");return;}
  if(liveActive){stopLive();return;}
  liveActive=true;liveStart.textContent="Stop conversation";beginLiveListening();
});
if(liveButton=$("liveVoiceButton"))liveButton.addEventListener("click",()=>{liveBackdrop.classList.remove("hidden");setLiveStatus("Tap Start talking and allow microphone access.");});
if($("closeLive"))$("closeLive").addEventListener("click",()=>{stopLive();liveBackdrop.classList.add("hidden");});
if(liveBackdrop)liveBackdrop.addEventListener("click",e=>{if(e.target===liveBackdrop){stopLive();liveBackdrop.classList.add("hidden");}});
if(recognition){
  const previousResult=recognition.onresult;
  recognition.onresult=async event=>{
    if(!liveActive){if(previousResult)previousResult(event);return;}
    const words=event.results[event.results.length-1][0].transcript;
    liveListening=false;setLiveStatus("Nova is thinking…");if(liveOrb)liveOrb.classList.remove("active");
    const voiceWasEnabled=settings.voiceEnabled;
    settings.voiceEnabled=false;
    await originalSendMessage(words);
    settings.voiceEnabled=voiceWasEnabled;
    saveConversationHistory();
    const answer=conversation.filter(m=>m.role==="assistant").at(-1)?.content;
    if(answer&&liveActive){
      setLiveStatus("Nova is speaking…");
      if("speechSynthesis"in window){
        window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(answer),v=getSelectedVoice();if(v)utterance.voice=v;
        utterance.onend=()=>{if(liveActive){setLiveStatus("Your turn. Listening…");beginLiveListening();}};
        utterance.onerror=()=>{if(liveActive)beginLiveListening();};
        window.speechSynthesis.speak(utterance);
      }else beginLiveListening();
    }else if(liveActive)beginLiveListening();
  };
  recognition.onerror=()=>{if(liveActive){liveListening=false;setLiveStatus("Microphone unavailable. Check browser permission, then tap Start talking.");}};
  recognition.onend=()=>{if(liveActive&&!liveListening&&!("speechSynthesis"in window||false))beginLiveListening();};
}
