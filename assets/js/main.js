(function () {
  "use strict";

  var EMAIL = "info@mattsautorepairservices.co.uk";

  /* ---------- Mobile nav ---------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });
  }

  /* ---------- Open / closed (UK time, Mon–Fri 8:00–17:30) ---------- */
  function ukNow() {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    return { day: days[get("weekday")], mins: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
  }
  var now = ukNow();
  var weekday = now.day >= 1 && now.day <= 5;
  var isOpen = weekday && now.mins >= 480 && now.mins < 1050;
  var label;
  if (isOpen) label = "Workshop open · closes 5:30pm";
  else if (weekday && now.mins < 480) label = "Closed · opens 8:00am today";
  else if (now.day >= 1 && now.day <= 4) label = "Closed · opens 8:00am tomorrow";
  else label = "Closed · opens Monday 8:00am";
  document.querySelectorAll("[data-open-status]").forEach(function (el) {
    el.classList.toggle("is-open", isOpen);
    var t = el.querySelector("span");
    if (t) t.textContent = label;
  });
  document.querySelectorAll(".hours tr[data-days]").forEach(function (tr) {
    if (tr.dataset.days.split(",").indexOf(String(now.day)) > -1) tr.classList.add("today");
  });

  /* ---------- Service bay tabs ---------- */
  var tabs = document.querySelectorAll(".bay-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    });
    tab.addEventListener("keydown", function (e) {
      var list = Array.prototype.slice.call(tabs);
      var i = list.indexOf(tab);
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = list[(i + 1) % list.length];
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = list[(i - 1 + list.length) % list.length];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });

  /* ---------- Number plate → contact form ---------- */
  document.querySelectorAll("[data-plate-form]").forEach(function (form) {
    var input = form.querySelector("input");
    input.addEventListener("input", function () {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 8);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var reg = input.value.trim();
      window.location.href = "contact.html" + (reg ? "?reg=" + encodeURIComponent(reg) : "") + "#enquiry";
    });
  });

  var regField = document.getElementById("f-reg");
  if (regField) {
    var params = new URLSearchParams(window.location.search);
    if (params.get("reg")) regField.value = params.get("reg").toUpperCase().slice(0, 8);
    regField.addEventListener("input", function () {
      regField.value = regField.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 8);
    });
  }

  /* ---------- Contact forms → email ---------- */
  document.querySelectorAll("[data-mail-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var lines = [];
      data.forEach(function (v, k) {
        if (typeof v === "string" && v.trim()) lines.push(k + ": " + v.trim());
      });
      var subject = "Website enquiry" + (data.get("Vehicle Reg") ? " — " + data.get("Vehicle Reg") : "");
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      var msg = form.querySelector(".form__msg");
      if (msg) msg.classList.add("show");
    });
  });

  /* ---------- Odometer counters ---------- */
  function renderOdo(el, value) {
    var str = String(value).padStart(el.dataset.pad ? parseInt(el.dataset.pad, 10) : 0, "0");
    el.innerHTML = str.split("").map(function (d) { return "<span>" + d + "</span>"; }).join("") +
      (el.dataset.suffix ? '<span class="u">' + el.dataset.suffix + "</span>" : "");
  }

  /* ---------- Reveal on scroll ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var odos = document.querySelectorAll("[data-odo]");
  odos.forEach(function (el) { renderOdo(el, reduce ? el.dataset.odo : 0); });

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (el.hasAttribute("data-odo")) {
          var target = parseInt(el.dataset.odo, 10), start = null, dur = 1400;
          var step = function (ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            renderOdo(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        } else {
          el.classList.add("in");
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal, [data-odo]").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Deep links (e.g. services.html#tyres) ---------- */
  if (window.location.hash.length > 1) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target) window.addEventListener("load", function () { target.scrollIntoView(); });
  }

  /* ---------- Year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
