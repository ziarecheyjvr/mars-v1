(function () {
  var body = document.body;

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

  // Header shadow on scroll
  var header = document.querySelector(".header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Tabs
  document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    var buttons = tabs.querySelectorAll('[role="tab"]');
    function select(btn) {
      buttons.forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-selected", on);
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
      });
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
  });

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
