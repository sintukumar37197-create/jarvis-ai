// ============================================================================
// JARVIS CORE ENGINE: GLITCH-FREE, MATH CLEANER & ABORT MASTER (features.js)
// ============================================================================
(function () {
  window.JARVIS_CORE = window.JARVIS_CORE || {};
  const C = window.JARVIS_CORE;
  let activeAbort = null;
  let curGenId = 0;

  // 1. मास्टर सिस्टम प्रॉम्प्ट
  const JARVIS_SYSTEM_PROMPT = `
You are JARVIS, an authentic, emotionally intelligent AI companion communicating fluently in Hindi (Devanagari script).

[नियम 1: गणित व भौतिक विज्ञान सूत्रों का साफ़ लेखन]
- स्क्रीन पर कभी भी 'frac', 'dfrac', 'lambda', 'phi', 'times', 'approx' जैसे कच्चे कोड न लिखें।
- सूत्रों को हमेशा सीधे स्पष्ट प्रतीकों में लिखें:
  * भिन्न के लिए सामान्य कोष्ठक: E = (h × c) / λ
  * सीधे सिंबल का प्रयोग करें: λ (तरंगदैर्घ्य), φ (कार्यफलन), μ (माइक्रो), × (गुणा), ≈ (लगभग)।
  * घात को सीधे सुपरस्क्रिप्ट में लिखें: 10⁻³⁴ या 10⁸ (कच्चा 10^{-34} न लिखें)।
  * मात्रकों के आगे कभी कॉमा न लगाएं (उदा. 0.12 m लिखें, 0.12 ,m कभी नहीं)।

[नियम 2: एकेडमिक, सिलेबस व विमीय शुद्धता मोड]
- कक्षा सीमा (Strict Syllabus Separation):
  * कक्षा 10: केवल 10वीं का पाठ्यक्रम (प्रकाश परावर्तन/अपवर्तन, लेंस, साधारण विद्युत परिपथ, ओम का नियम)। 10वीं पर कभी 12वीं के विषय (कैपेसिटर, परावैद्युतांक, बायो-सावर्ट) न लाएं।
  * कक्षा 11 व 12: उच्च भौतिकी/गणित सूत्र, कूलम्ब नियम, धारिता और आधुनिक भौतिकी।
  * प्रतियोगी परीक्षा: SSC, रेलवे, पुलिस आदि के लिए पात्रता व सटीक पैटर्न।
- मात्रकों की 100% शुद्धता (SI Units Guard):
  * दूरी/लंबाई हमेशा मीटर (m) या सेमी (cm) में हो; दूरी में कभी 'm³' या 'm²' न लिखें (m³ आयतन है, दूरी नहीं)।
  * क्षेत्रफल m² और धारिता फैराड (F) में ही हो।
- आंतरिक गणना सत्यापन: संख्यात्मक प्रश्नों में गुणा-भाग की आंतरिक जाँच करें (उदा. 36 / 2.5 = 14.4 N होता है, 1.44 N नहीं)।

[नियम 3: परिचय व प्राइवेसी का कड़ा नियम]
- जब तक यूज़र खुद न पूछे ("तुम अपने बारे में बताओ", "तुम क्या हो"), तब तक अपनी क्षमताओं का भाषण न दें।
  * जब यूज़र परिचय पूछे, केवल तभी कहें: "मैं जार्विस हूँ, एक AI सहायक। आप मुझसे पढ़ाई से रिलेटेड कुछ भी पूछ सकते हैं, और किसी भी विषय से जुड़ा कोई भी सवाल या प्रश्न पूछ सकते हैं। जितना मुझे समझ में आएगा, उतना मैं आपको अच्छे से बताऊँगी।" (इसमें शंकर का नाम 0% भी नहीं आएगा)।
- केवल निर्माण का सीधा सवाल पूछने पर ("तुम्हें किसने बनाया?", "तुम्हारा डेवलपर कौन है?"): उत्तर दें: "मुझे शंकर ने OpenAI के द्वारा बनाया है।"
- निर्माण समय पूछने पर कार्य-घंटे समझें, घड़ी का समय नहीं। शंकर की निजी ज़िंदगी पर कोई मनगढ़ंत बात न बनाएं।

[नियम 4: स्वाभाविक मानवीय बातचीत]
- आम बातचीत में ChatGPT की तरह स्वतंत्र रहें। 'Hi', 'Hello' पर कस्टमर केयर की तरह भाषण न दें; एक सच्चे साथी की तरह स्वाभाविक, ताज़ा और संक्षिप्त उत्तर दें।
- व्याकरण: हमेशा शालीन, शुद्ध स्त्रीलिंग क्रियाओं का प्रयोग करें ("कर सकती हूँ", "बताऊँगी")। बातचीत में 'सर' या 'मैम' न कहें।
- किसी भी अनुचित, ग़ैर-क़ानूनी या हानिकारक सवाल पर सीधे विनम्रता से मना करें।
`;

  // 2. सुपर मैथ पार्सर
  function cleanMathText(raw) {
    if (!raw || typeof raw !== "string") return raw;
    const supMap = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻","+":"⁺" };
    const toSup = (str) => str.split("").map(c => supMap[c] || c).join("");

    let res = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    res = res.replace(/\^\{?(-?\d+)\}?/g, (_, p) => toSup(p));
    res = res.replace(/,\s*([msJNVFC]|eV|muC|kg|km)\b/g, " $1").replace(/,\s*;/g, ";");
    res = res.replace(/(?:\\?d?frac)\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1) / ($2)");
    res = res
      .replace(/\\?lambda\b/g, "λ")
      .replace(/\\?phi\b/g, "φ")
      .replace(/\\?mu\s*C\b|muC\b/g, "μC")
      .replace(/\\?mu\b/g, "μ")
      .replace(/\\?varepsilon_?0?/g, "ε₀")
      .replace(/\\?times\b/g, "×")
      .replace(/\\?cdot\b/g, "·")
      .replace(/\\?approx\b/g, "≈")
      .replace(/v_\{?max\}?/g, "v(अधिकतम)")
      .replace(/q_1/g, "q₁").replace(/q_2/g, "q₂").replace(/r\^2/g, "r²")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
    return res;
  }

  // 3. स्मूथ टाइपराइटर (Kill-Switch व ऑटो-स्क्रोल के साथ)
  function setupFluidTypewriter() {
    function fluidType(text, bubble, onDone) {
      if (!bubble) return;
      const myId = ++curGenId;
      C.activeGenId = myId;
      if (C.setGeneratingState) C.setGeneratingState(true);

      let cur = 0;
      const total = text.length;
      const step = Math.max(2, Math.ceil(total / 90));

      const msgEl = bubble.closest(".message, .ai, .bot, [class*='message']") || bubble;
      if (msgEl) msgEl.scrollIntoView({ behavior: "smooth", block: "start" });

      function frame() {
        if (C.stopRequested || C.activeGenId !== myId) {
          if (C.setGeneratingState) C.setGeneratingState(false);
          return;
        }

        if (cur < total) {
          cur = Math.min(cur + step, total);
          bubble.innerHTML = cleanMathText(text.slice(0, cur));
          if (C.smartScroll) C.smartScroll();
          requestAnimationFrame(frame);
        } else {
          bubble.innerHTML = cleanMathText(text);
          if (C.smartScroll) C.smartScroll();
          if (C.setGeneratingState) C.setGeneratingState(false);
          if (typeof onDone === "function") {
            try { onDone(); } catch (_) {}
          }
        }
      }
      requestAnimationFrame(frame);
    }

    window.typeWriterEffect = fluidType;
    try {
      let curFn = fluidType;
      Object.defineProperty(window, "typeWriterEffect", {
        get() { return curFn; },
        set(fn) { if (fn !== fluidType) curFn = fn; },
        configurable: true
      });
    } catch (_) {}
  }

  // 4. Groq Fetch व तत्काल Abort
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");

    if (url.includes("groq.com")) {
      if (activeAbort) activeAbort.abort();
      activeAbort = new AbortController();
      args[1] = args[1] || {};
      args[1].signal = activeAbort.signal;

      if (args[1]?.body) {
        try {
          const payload = JSON.parse(args[1].body);
          if (payload.messages && Array.isArray(payload.messages)) {
            let sysMsg = payload.messages.find(m => m.role === "system");
            if (sysMsg) sysMsg.content = JARVIS_SYSTEM_PROMPT;
            else payload.messages.unshift({ role: "system", content: JARVIS_SYSTEM_PROMPT });
            args[1].body = JSON.stringify(payload);
          }
        } catch (_) {}
      }
    }
    return origFetch.apply(this, args);
  };

  C.abortOngoingRequest = function () {
    curGenId++;
    C.activeGenId = curGenId;
    if (activeAbort) {
      activeAbort.abort();
      activeAbort = null;
    }
  };

  // 5. वॉयस सैनिटाइज़र
  if ("speechSynthesis" in window) {
    const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = function (utterance) {
      if (utterance && utterance.text) {
        if (C.stopRequested) return;
        utterance.text = utterance.text
          .replace(/[\u{0023}\u{002A}\u{0030}-\u{0039}]\u{FE0F}?\u{20E3}/gu, "")
          .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, "")
          .replace(/\\?d?frac|\\?varepsilon_?0?|\\?sqrt|\{|\}|_|\^/g, "")
          .replace(/[⏳⌛🌸🌺🌼🌻💐🌹🌷🤖👤✏️🔊🚫✅▶⏸✂️🤫📝❓*`#\\]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (!utterance.text) return;
      }
      return origSpeak(utterance);
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupFluidTypewriter);
  else setupFluidTypewriter();

  console.log("✓ features.js: संपूर्ण मास्टर इंजन सक्रिय!");
})();
