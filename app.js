/* SkyNet - interazioni della pagina. Nessuna libreria esterna. */
(function () {
  "use strict";

  /* ---------- Tema chiaro/scuro ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("skynet-theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  function paintToggle(btn) {
    var dark = currentTheme() === "dark";
    btn.textContent = dark ? "☀️" : "🌙";
    btn.setAttribute("aria-label", dark ? "Passa al tema chiaro" : "Passa al tema scuro");
    btn.setAttribute("title", btn.getAttribute("aria-label"));
  }
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    paintToggle(toggle);
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("skynet-theme", next); } catch (e) {}
      paintToggle(toggle);
    });
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Comparsa graduale allo scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Chat animata ---------- */
  var body = document.getElementById("chat-body");
  if (!body) return;

  var lang = (document.documentElement.getAttribute("lang") || "it").slice(0, 2);

  var scripts = {
    it: [
      [
        { who: "me", t: "Segnami la riunione di martedì alle 15 e ricordamela il giorno prima e 2 ore prima." },
        { who: "bot", t: "Fatto. Evento in calendario martedì alle 15:00." },
        { who: "bot", t: "Promemoria pronti: lunedì alle 15:00 e martedì alle 13:00." }
      ],
      [
        { who: "me", t: "Che tempo fa a Bologna sabato?" },
        { who: "bot", t: "Sabato a Bologna: sereno, 14–22°C, niente pioggia. Vento debole." }
      ],
      [
        { who: "me", t: "Scrivi a Luca su WhatsApp che arrivo verso le 20." },
        { who: "bot", t: "Bozza pronta per Luca: «Ciao, arrivo verso le 20». La invio?" },
        { who: "me", t: "Sì, manda." },
        { who: "bot", t: "Inviato. ✅" }
      ],
      [
        { who: "me", t: "Riassumimi questo PDF in tre punti." },
        { who: "bot", t: "Ecco i tre punti chiave del documento, con i numeri di pagina a cui si riferiscono." }
      ]
    ],
    en: [
      [
        { who: "me", t: "Add Tuesday's meeting at 3pm and remind me the day before and 2 hours earlier." },
        { who: "bot", t: "Done. Calendar event on Tuesday at 15:00." },
        { who: "bot", t: "Reminders set: Monday 15:00 and Tuesday 13:00." }
      ],
      [
        { who: "me", t: "What's the weather in Bologna on Saturday?" },
        { who: "bot", t: "Saturday in Bologna: clear, 14–22°C, no rain. Light wind." }
      ],
      [
        { who: "me", t: "Tell Luca on WhatsApp I'll be there around 8pm." },
        { who: "bot", t: "Draft ready for Luca: “Hi, I'll be there around 8.” Send it?" },
        { who: "me", t: "Yes, send it." },
        { who: "bot", t: "Sent. ✅" }
      ],
      [
        { who: "me", t: "Summarise this PDF in three points." },
        { who: "bot", t: "Here are the three key points, with the page numbers they refer to." }
      ]
    ]
  };

  var convos = scripts[lang] || scripts.it;
  var ci = 0;

  function clear() { body.innerHTML = ""; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function addMsg(m) {
    var d = document.createElement("div");
    d.className = "msg " + (m.who === "me" ? "me" : "bot");
    d.textContent = m.t;
    body.appendChild(d);
  }
  function addTyping() {
    var d = document.createElement("div");
    d.className = "msg bot";
    d.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    body.appendChild(d);
    return d;
  }

  if (reduce) {
    // Nessuna animazione: mostra una conversazione completa e ferma.
    convos[0].forEach(addMsg);
    return;
  }

  async function run() {
    var convo = convos[ci];
    clear();
    for (var i = 0; i < convo.length; i++) {
      var m = convo[i];
      if (m.who === "bot") {
        var t = addTyping();
        await wait(650 + Math.min(m.t.length * 12, 900));
        body.removeChild(t);
      } else {
        await wait(500);
      }
      addMsg(m);
    }
    await wait(2600);
    ci = (ci + 1) % convos.length;
    run();
  }

  // Parte solo quando la chat è visibile, per non sprecare lavoro.
  if ("IntersectionObserver" in window) {
    var started = false;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !started) { started = true; run(); io2.disconnect(); }
      });
    }, { threshold: 0.3 });
    io2.observe(body);
  } else {
    run();
  }
})();