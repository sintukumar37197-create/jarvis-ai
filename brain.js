// ====================================================
// JARVIS BRAIN: लाइव समय, तारीख व मौसम (Zero Blocking)
// ====================================================

window.JarvisBrain = {
  getLiveTime() {
    const now = new Date();
    const time = now.toLocaleTimeString("hi-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = now.toLocaleDateString("hi-IN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `समय: ${time}, तारीख: ${date}`;
  },

  async getLiveWeather(isTomorrow = false) {
    try {
      const res = await fetch("https://wttr.in/?format=j1");
      if (!res.ok) return null;
      const data = await res.json();
      const city = data.nearest_area?.[0]?.areaName?.[0]?.value || "";
      if (isTomorrow && data.weather && data.weather.length > 1) {
        const tom = data.weather[1];
        const desc = tom.hourly?.[4]?.weatherDesc?.[0]?.value || "साफ़";
        return `कल ${city ? '(' + city + ')' : ''} का मौसम: तापमान ${tom.mintempC}°C से ${tom.maxtempC}°C, स्थिति: ${desc}`;
      } else {
        const cur = data.current_condition?.[0];
        const desc = cur?.weatherDesc?.[0]?.value || "साफ़";
        return `वर्तमान ${city ? '(' + city + ')' : ''} मौसम: तापमान ${cur.temp_C}°C, स्थिति: ${desc}`;
      }
    } catch (e) {
      return null;
    }
  },

  // सवाल को बीच में रोके बिना केवल लाइव सिस्टम तथ्य जोड़ना
  async processQuery(q) {
    let context = `\n[सिस्टम लाइव तथ्य: ${this.getLiveTime()}]`;

    if (/मौसम|weather|तापमान|rain/i.test(q)) {
      const isTomorrow = /कल|kal|tomorrow/i.test(q);
      const wData = await this.getLiveWeather(isTomorrow);
      if (wData) context += `\n- मौसम तथ्य: "${wData}".`;
    } else if (/समय|time|तारीख|date|दिन/i.test(q)) {
      context += `\n- समय/तारीख: "${this.getLiveTime()}". सीधे यही सटीक जानकारी बताएं।`;
    }

    window.JARVIS_CUSTOM_RULES = context;
  }
};

// हुक इंटीग्रेशन (सवालों को बिना ब्लॉक किए सुरक्षित रूप से आगे भेजना)
function initBrainHook() {
  if (typeof window.ask === "function" && !window.ask._isBrainHooked) {
    const origAsk = window.ask;
    window.ask = async function(query) {
      if (query && window.JarvisBrain) {
        try {
          await window.JarvisBrain.processQuery(query);
        } catch(e) {}
      }
      return origAsk(query);
    };
    window.ask._isBrainHooked = true;
  } else {
    setTimeout(initBrainHook, 100);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBrainHook);
} else {
  initBrainHook();
}
