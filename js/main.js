(function () {
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
    });
    document.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll-driven: header state, progress bar, parallax
  var header = document.querySelector(".header");
  var progress = document.createElement("div");
  progress.className = "progress";
  body.appendChild(progress);
  var parallax = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 10);
      header.classList.toggle("is-hidden", y > 400 && y > lastY);
    }
    lastY = y;

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";

    var vh = window.innerHeight;
    parallax.forEach(function (el) {
      var rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      var speed = parseFloat(el.dataset.parallax) || 0.1;
      var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      el.style.translate = "0 " + offset.toFixed(1) + "px";
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Stagger children of [data-stagger]
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    group.querySelectorAll(".reveal, .reveal-img").forEach(function (el, i) {
      el.style.setProperty("--d", i);
    });
  });

  // Count-up numbers
  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.firstChild.nodeValue = target; return; }
    var start = null;
    var duration = 1800;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.firstChild.nodeValue = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll(".reveal, .reveal-img");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Cursor spotlight on cards
  if (finePointer) {
    document.querySelectorAll(".spotlight").forEach(function (card) {
      var glow = document.createElement("span");
      glow.className = "glow";
      card.prepend(glow);
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  // Magnetic buttons
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  // Tabs with sliding pill
  document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    var list = tabs.querySelector('[role="tablist"]');
    var buttons = tabs.querySelectorAll('[role="tab"]');
    var pill = document.createElement("span");
    pill.className = "tabs__pill";
    pill.setAttribute("aria-hidden", "true");
    list.prepend(pill);
    list.classList.add("has-pill");

    function movePill(btn) {
      pill.style.width = btn.offsetWidth + "px";
      pill.style.height = btn.offsetHeight + "px";
      pill.style.top = btn.offsetTop + "px";
      pill.style.transform = "translateX(" + btn.offsetLeft + "px)";
    }
    function select(btn) {
      buttons.forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-selected", on);
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
      });
      movePill(btn);
    }
    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () { select(btn); });
      btn.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        var next = buttons[(i + dir + buttons.length) % buttons.length];
        select(next);
        next.focus();
      });
    });
    function current() { return tabs.querySelector('[aria-selected="true"]'); }
    window.addEventListener("resize", function () { movePill(current()); });
    if (document.fonts) document.fonts.ready.then(function () { movePill(current()); });
    movePill(current());
  });

  // Services page: highlight the section in view
  var serviceLinks = document.querySelectorAll(".service-nav a");
  if (serviceLinks.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        serviceLinks.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", on);
          if (on) {
            var bar = a.parentElement;
            bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
          }
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".service-row").forEach(function (row) { spy.observe(row); });
  }

  // File upload label
  document.querySelectorAll(".upload input[type=file]").forEach(function (input) {
    input.addEventListener("change", function () {
      var label = input.closest(".upload").querySelector("span");
      if (input.files.length) label.textContent = input.files[0].name;
    });
  });

  // Contact forms — open the visitor's email client with the details filled in.
  // Swap this for a form backend (e.g. Formspree / Netlify Forms) when going live.
  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var lines = [];
      form.querySelectorAll("input:not([type=file]), textarea").forEach(function (f) {
        if (f.value) lines.push(f.dataset.label + ": " + f.value);
      });
      var hasFile = form.querySelector("input[type=file]");
      if (hasFile && hasFile.files.length) lines.push("(Image to be attached: " + hasFile.files[0].name + ")");
      var subject = encodeURIComponent(form.dataset.subject || "Website enquiry");
      window.location.href = "mailto:" + form.dataset.mailto + "?subject=" + subject + "&body=" + encodeURIComponent(lines.join("\n"));
      status.className = "form-status is-success";
      status.innerHTML = "<strong>Thank you for contacting us.</strong><br>We will get back to you as soon as possible";
    });
  });

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
