// ============================================================================
// JARVIS UI ENGINE: ORB LIGHT, WATCHDOG & COMPLETE UI MASTER (ui.js)
// ============================================================================
(function () {
  window.JARVIS_CORE = window.JARVIS_CORE || {};
  const C = window.JARVIS_CORE;
  C.isGenerating = false;
  C.stopRequested = false;
  C.userScrolledUp = false;

  let vState = { list: [], idx: 0, speaking: false, paused: false };
  let origBtnHTML = "", origBtnBg = "", curSid = "sess_" + Date.now();

  function injectStyles() {
    if (document.getElementById("j-styles")) return;
    const s = document.createElement("style");
    s.id = "j-styles";
    s.innerHTML = `
      html, body { overflow-x: hidden; }
      .jarvis-top-bar { position: fixed; top: 0; left: 0; right: 0; height: 50px; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; z-index: 900; border-bottom: 1px solid #e2e8f0; }
      .j-nav-btn { width: 36px; height: 36px; border-radius: 8px; background: #f8fafc; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 17px; cursor: pointer; touch-action: manipulation; }
      .j-pill { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; background: #f1f5f9; font-size: 12px; font-weight: 600; color: #475569; }
      .j-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }
      .j-dot.busy { background: #3b82f6; animation: jP 1s infinite; }
      .j-dot.talk { background: #a855f7; animation: jP 0.8s infinite; }
      @keyframes jP { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.2)} }
      .jarvis-enlarged-orb { width: 76px !important; height: 76px !important; min-width: 76px !important; margin: 26px auto 2px auto !important; border-radius: 50% !important; cursor: pointer !important; box-shadow: 0 0 18px rgba(168,85,247,.5), 0 0 35px rgba(236,72,153,.35) !important; touch-action: manipulation; transition: transform .15s ease, box-shadow .2s ease; animation: orbBreathe 3.5s ease-in-out infinite !important; }
      .jarvis-enlarged-orb:active { transform: scale(0.88) !important; }
      .jarvis-enlarged-orb.speaking-pulse { animation: orbSpeakLight 1.1s ease-in-out infinite !important; box-shadow: 0 0 32px rgba(168,85,247,0.95), 0 0 65px rgba(236,72,153,0.75) !important; }
      @keyframes orbBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
      @keyframes orbSpeakLight { 0%,100%{transform:scale(1.02); filter: drop-shadow(0 0 10px #a855f7); } 50%{transform:scale(1.08); filter: drop-shadow(0 0 22px #ec4899); } }
      .jarvis-presence-label { display: block !important; font-size: 13px !important; font-weight: 500 !important; color: #64748b !important; text-align: center !important; margin: 2px 0 2px 0 !important; }
      .j-orb-status-pill { display: block; width: fit-content; margin: 0 auto 8px auto; padding: 3px 12px; border-radius: 14px; background: #f1f5f9; font-size: 11px; font-weight: 600; color: #475569; text-align: center; border: 1px solid #e2e8f0; transition: all .2s ease; }
      .j-orb-status-pill.speaking { background: #faf5ff; border-color: #d8b4fe; color: #7e22ce; }
      .j-orb-status-pill.busy { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
      #j-side { position: fixed; top: 0; left: -280px; width: 270px; height: 100%; background: #fff; z-index: 1000; box-shadow: 2px 0 14px rgba(0,0,0,.2); transition: left .25s ease; display: flex; flex-direction: column; }
      #j-side.open { left: 0; }
      #j-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.4); z-index: 999; display: none; }
      #j-mask.open { display: block; }
      .j-side-hdr { padding: 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
      .j-hist-list { flex: 1; overflow-y: auto; padding: 10px; }
      .j-item { padding: 10px; margin-bottom: 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
      .j-item.active { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; font-weight: 500; }
      .j-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
      .j-clear-all { padding: 11px; text-align: center; border-top: 1px solid #f1f5f9; color: #ef4444; font-size: 13px; font-weight: 600; cursor: pointer; background: #fff5f5; }
    `;
    document.head.appendChild(s);
  }

  function getChatBox() {
    return document.getElementById("chatBox") || document.querySelector(".chat-container, .chat-box, #chat, .messages");
  }

  function setupTopAndInput() {
    if (!document.getElementById("j-top")) {
      const b = document.createElement("div");
      b.id = "j-top";
      b.className = "jarvis-top-bar";
      b.innerHTML = `<div class="j-nav-btn" id="j-m-btn">☰</div><div class="j-pill"><span class="j-dot" id="j-dot"></span>JARVIS Dual-Core</div><div class="j-nav-btn" id="j-new-btn" title="नई चैट">✏️</div>`;
      document.body.prepend(b);
      document.getElementById("j-m-btn").onclick = () => toggleSide(true);
      document.getElementById("j-new-btn").onclick = () => startNewChat(true);
    }
    const setPh = () => {
      const inp = document.getElementById("userInput") || document.querySelector("input[type=text], textarea");
      if (inp && inp.placeholder !== "Ask JARVIS...") inp.placeholder = "Ask JARVIS...";
    };
    setPh();
    setInterval(setPh, 1500);
  }

  function startNewChat(notify) {
    curSid = "sess_" + Date.now();
    const box = getChatBox();
    if (box) box.innerHTML = "";
    C.conversationHistory = [];
    if (window.chatHistory) window.chatHistory = [];
    if (window.messages && Array.isArray(window.messages)) window.messages = [];
    C.stopAll();
    toggleSide(false);
  }

  function updateDynBadge(state) {
    const pill = document.getElementById("j-orb-status");
    if (!pill) return;
    if (state === "speaking") {
      pill.className = "j-orb-status-pill speaking";
      pill.innerHTML = "⏸️ आवाज़ रोकने के लिए टैप करें";
    } else if (state === "busy") {
      pill.className = "j-orb-status-pill busy";
      pill.innerHTML = "✍️ जार्विस लिख रही है...";
    } else {
      pill.className = "j-orb-status-pill";
      pill.innerHTML = "🔊 सुनने के लिए गोले पर टैप करें";
    }
  }

  function setVisualTalk(talk) {
    const orb = document.querySelector(".jarvis-enlarged-orb");
    const dot = document.getElementById("j-dot");
    if (orb) {
      if (talk) orb.classList.add("speaking-pulse");
      else orb.classList.remove("speaking-pulse");
    }
    if (dot) dot.className = talk ? "j-dot talk" : (C.isGenerating ? "j-dot busy" : "j-dot");
    updateDynBadge(talk ? "speaking" : (C.isGenerating ? "busy" : "idle"));
  }

  function splitSentences(t) {
    return t ? (t.match(/[^।?!.\n]+[।?!.\n]*/g) || [t]).map(s => s.trim()).filter(Boolean) : [];
  }

  function playSentence() {
    if (!("speechSynthesis" in window)) return;
    if (vState.idx >= vState.list.length || !vState.speaking) {
      vState.speaking = false; vState.paused = false; setVisualTalk(false); return;
    }
    const u = new SpeechSynthesisUtterance(vState.list[vState.idx]);
    u.lang = "hi-IN"; u.rate = 1.0;
    u.onstart = () => setVisualTalk(true);
    u.onend = () => { if (vState.speaking) { vState.idx++; playSentence(); } };
    u.onerror = (e) => { if (e.error !== "canceled" && e.error !== "interrupted") { vState.idx++; playSentence(); } };
    window.speechSynthesis.speak(u);
  }

  function startVoice(arr, i) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    vState = { list: arr, idx: i, speaking: true, paused: false };
    playSentence();
  }

  function setupOrbToggle() {
    document.addEventListener("pointerdown", (e) => {
      const orb = e.target.closest(".jarvis-enlarged-orb, .orb, #orb");
      const inHdr = e.clientY < 200 && e.clientY > 40 && (e.clientX > window.innerWidth * 0.25 && e.clientX < window.innerWidth * 0.75);

      if (orb || (inHdr && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON")) {
        if (vState.speaking) {
          vState.speaking = false; vState.paused = true;
          window.speechSynthesis.cancel(); setVisualTalk(false);
        } else if (vState.paused && vState.list.length) {
          vState.speaking = true; vState.paused = false; playSentence();
        } else {
          const box = getChatBox();
          if (box) {
            const msgs = box.querySelectorAll(".ai, .bot, .ai-message, [class*='ai']");
            const last = msgs[msgs.length - 1];
            if (last) {
              const raw = last.innerText.replace(/कॉपी|सुनो|दोबारा|✓ कॉपी हुआ!/g, "").trim();
              startVoice(splitSentences(raw), 0);
            }
          }
        }
      }
    }, true);

    document.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && b.textContent.includes("सुनो")) {
        const msg = b.closest(".ai, .bot, [class*='message']") || b.parentElement.parentElement;
        if (msg) {
          const raw = msg.innerText.replace(/कॉपी|सुनो|दोबारा|✓ कॉपी हुआ!/g, "").trim();
          startVoice(splitSentences(raw), 0);
        }
      }
    }, true);
  }

  C.speakText = (txt) => startVoice(splitSentences(txt), 0);

  function toggleSide(open) {
    const s = document.getElementById("j-side"), m = document.getElementById("j-mask");
    if (s && m) {
      s.classList.toggle("open", open);
      m.classList.toggle("open", open);
      if (open) renderHistory();
    }
  }

  function setupHistory() {
    if (document.getElementById("j-side")) return;
    const m = document.createElement("div"); m.id = "j-mask";
    const s = document.createElement("div"); s.id = "j-side";
    s.innerHTML = `<div class="j-side-hdr"><b>चैट हिस्ट्री</b><button id="j-side-new" style="background:#3b82f6;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;">+ नई चैट</button></div><div class="j-hist-list" id="j-h-list"></div><div class="j-clear-all" id="j-clear-all">🗑️️ सभी चैट साफ़ करें</div>`;
    document.body.appendChild(m);
    document.body.appendChild(s);
    m.onclick = () => toggleSide(false);
    document.getElementById("j-side-new").onclick = () => startNewChat(true);
    document.getElementById("j-clear-all").onclick = () => {
      if (confirm("क्या आप पूरी चैट हिस्ट्री मिटाना चाहते हैं?")) {
        localStorage.removeItem("jarvis_chat_sessions");
        renderHistory();
        startNewChat(false);
      }
    };
    let startX = 0;
    s.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    s.addEventListener("touchmove", (e) => { if (e.touches[0].clientX - startX < -50) toggleSide(false); }, { passive: true });
  }

  function getSessions() {
    try { return JSON.parse(localStorage.getItem("jarvis_chat_sessions") || "[]"); } catch (_) { return []; }
  }

  function saveSessions(arr) {
    localStorage.setItem("jarvis_chat_sessions", JSON.stringify(arr));
  }

  function appendMessageToSession(uTxt, aTxt) {
    if (!uTxt && !aTxt) return;
    let list = getSessions();
    let session = list.find(x => x.id === curSid);
    if (!session) {
      session = { id: curSid, title: (uTxt || "नई बातचीत").slice(0, 24) + ((uTxt || "").length > 24 ? "..." : ""), messages: [] };
      list.unshift(session);
    }
    if (uTxt) session.messages.push({ role: "user", text: uTxt });
    if (aTxt) session.messages.push({ role: "ai", text: aTxt });
    if (list.length > 30) list.pop();
    saveSessions(list);
  }

  function renderHistory() {
    const l = document.getElementById("j-h-list");
    if (!l) return;
    const list = getSessions();
    if (!list.length) {
      l.innerHTML = '<div style="color:#94a3b8;font-size:13px;text-align:center;padding:20px;">कोई पुरानी चैट नहीं मिली</div>';
      return;
    }
    l.innerHTML = list.map(x => `<div class="j-item ${x.id === curSid ? "active" : ""}" data-id="${x.id}"><span>💬 ${x.title}</span><b data-del="${x.id}" style="color:#94a3b8;padding:2px 6px;font-size:14px;" title="हटाएं">✕</b></div>`).join("");
    l.onclick = (e) => {
      const delId = e.target.dataset.del;
      const item = e.target.closest(".j-item");
      if (delId) {
        saveSessions(getSessions().filter(x => x.id !== delId));
        if (curSid === delId) startNewChat(false);
        renderHistory();
      } else if (item) {
        loadSession(item.dataset.id);
      }
    };
  }

  function loadSession(sid) {
    const session = getSessions().find(x => x.id === sid);
    if (!session) return;
    curSid = session.id;
    const box = getChatBox();
    if (box) {
      box.innerHTML = "";
      session.messages.forEach(m => {
        const d = document.createElement("div");
        d.className = m.role === "user" ? "message user-message" : "message ai-message";
        d.style.cssText = m.role === "user" ? "background:#2563eb;color:#fff;padding:10px 14px;border-radius:14px 14px 2px 14px;margin:8px 0 8px auto;max-width:82%;font-size:14px;word-break:break-word;" : "background:#f1f5f9;color:#1e293b;padding:10px 14px;border-radius:14px 14px 14px 2px;margin:8px auto 8px 0;max-width:85%;font-size:14px;word-break:break-word;border:1px solid #e2e8f0;";
        d.innerHTML = `<p style="margin:0;">${m.text}</p>`;
        box.appendChild(d);
      });
      box.scrollTop = 0;
    }
    toggleSide(false);
  }

  function setupLogo() {
    document.querySelectorAll("div").forEach(el => {
      if (el.closest("#chatBox, .chat-container, #j-side, #j-top")) return;
      const cs = window.getComputedStyle(el);
      const isRound = cs.borderRadius.includes("50%") || cs.borderRadius.includes("9999px");
      if (isRound && (cs.backgroundImage.includes("gradient") || cs.backgroundColor.includes("rgb") || el.id === "orb")) {
        const r = el.getBoundingClientRect();
        if (r.top < 220 && r.width > 30 && r.width < 140) {
          el.classList.add("jarvis-enlarged-orb");
        }
      }
    });

    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeValue && n.nodeValue.includes("उपस्थित हूँ") && n.parentElement && !n.parentElement.closest("#j-side")) {
        const p = n.parentElement;
        p.classList.add("jarvis-presence-label");
        if (!document.getElementById("j-orb-status")) {
          const status = document.createElement("div");
          status.id = "j-orb-status";
          status.className = "j-orb-status-pill";
          status.innerHTML = "🔊 सुनने के लिए गोले पर टैप करें";
          p.parentNode.insertBefore(status, p.nextSibling);
        }
      }
    }
  }

  C.stopAll = function () {
    C.stopRequested = true;
    if (C.abortOngoingRequest) C.abortOngoingRequest();
    vState.speaking = false; vState.paused = false; setVisualTalk(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (C.setGeneratingState) C.setGeneratingState(false);
  };

  function setupControls() {
    const box = getChatBox();
    const send = document.getElementById("sendBtn") || document.querySelector("button[type=submit], .send-btn");
    const inp = document.getElementById("userInput") || document.querySelector("input[type=text], textarea");

    // ✏️ एडिट पर तत्काल स्टॉप व अधूरा मैसेज हटाना
    document.addEventListener("click", (e) => {
      const editBtn = e.target.closest("button, .edit-btn");
      if (editBtn && (editBtn.textContent.includes("एडिट") || editBtn.classList.contains("edit-btn"))) {
        C.stopAll();
        if (box) {
          const msgs = box.querySelectorAll(".ai, .bot, .ai-message, [class*='ai']");
          const last = msgs[msgs.length - 1];
          if (last) last.remove();
        }
      }
    }, true);

    if (box) {
      box.onscroll = () => { C.userScrolledUp = (box.scrollHeight - box.scrollTop - box.clientHeight) > 70; };
      box.addEventListener("touchstart", (e) => { if (e.target !== inp && document.activeElement === inp) inp.blur(); }, { passive: true });
    }

    C.smartScroll = () => { if (!C.userScrolledUp && box) box.scrollTop = box.scrollHeight; };

    C.setGeneratingState = (gen) => {
      C.isGenerating = gen;
      const dot = document.getElementById("j-dot");
      if (dot) dot.className = gen ? "j-dot busy" : "j-dot";
      updateDynBadge(vState.speaking ? "speaking" : (gen ? "busy" : "idle"));
      if (!send) return;
      if (gen) {
        C.stopRequested = false;
        if (!origBtnHTML) { origBtnHTML = send.innerHTML; origBtnBg = send.style.backgroundColor || ""; }
        send.innerHTML = '<span style="display:inline-block;width:12px;height:12px;background:#fff;border-radius:2px;"></span>';
        send.style.backgroundColor = "#e53e3e";
      } else {
        C.stopRequested = false;
        if (origBtnHTML) { send.innerHTML = origBtnHTML; send.style.backgroundColor = origBtnBg; }
      }
    };

    if (send) {
      send.addEventListener("click", (e) => { if (C.isGenerating) { e.preventDefault(); e.stopPropagation(); C.stopAll(); } }, true);
    }

    // टाइपिंग के समय मोबाइल कीबोर्ड स्टेबल रखना
    const keepInView = () => setTimeout(() => {
      window.scrollTo(0, 0);
      if (!C.userScrolledUp && box) box.scrollTop = box.scrollHeight;
    }, 80);

    if (inp) {
      inp.onfocus = keepInView;
      inp.onclick = keepInView;
    }
    if (window.visualViewport) window.visualViewport.addEventListener("resize", keepInView);

    document.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && b.textContent.includes("कॉपी")) {
        const old = b.innerHTML;
        b.innerHTML = "✓ कॉपी हुआ!";
        b.style.color = "#10b981";
        setTimeout(() => { b.innerHTML = old; b.style.color = ""; }, 1200);
      }
    }, true);

    let lastQ = "";
    if (send && inp) {
      send.addEventListener("click", () => { if (inp.value.trim()) lastQ = inp.value.trim(); }, true);
    }
    if (box) {
      new MutationObserver(() => {
        const ai = box.querySelectorAll(".ai, .bot, [class*='ai']");
        const last = ai[ai.length - 1];
        if (last && !last.innerText.includes("...")) {
          const txt = last.innerText.replace(/कॉपी|सुनो|दोबारा|✓ कॉपी हुआ!/g, "").trim();
          if (txt && lastQ) {
            appendMessageToSession(lastQ, txt);
            lastQ = "";
          }
        }
      }).observe(box, { childList: true, subtree: true });
    }
  }

  // स्पीच वॉचडॉग (आवाज़ बंद होते ही डायनामिक बैज तुरंत रीसेट)
  function setupSpeechWatchdog() {
    setInterval(() => {
      if (vState.speaking && "speechSynthesis" in window) {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          vState.speaking = false;
          vState.paused = false;
          setVisualTalk(false);
        }
      }
    }, 500);
  }

  function init() {
    injectStyles();
    setupTopAndInput();
    setupHistory();
    setupLogo();
    setupOrbToggle();
    setupControls();
    setupSpeechWatchdog();
  }

  setInterval(setupLogo, 1500);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  console.log("✓ ui.js: संपूर्ण मास्टर UI सक्रिय!");
})();
