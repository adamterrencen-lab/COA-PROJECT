/* ==========================================================
   COA / IMP - script.js
   Plain JavaScript (no libraries). Works on every page; each
   feature only runs if its part of the page exists.
   1. Mobile menu (logo + "COA IMP" + hamburger)
   2. FAQ accordion
   3. Survey form + thank-you message
   4. Gallery: search, filter, sort, photo counts, lightbox
      with zoom + slideshow
   5. Framework page: step cards, status badges, table scroll
   6. Back-to-top button
   ========================================================== */

(function () {
  "use strict";

  var MOBILE_WIDTH = 760; /* same breakpoint as style.css */

  /* ---------------------------------------------------------
     1. MOBILE MENU
     --------------------------------------------------------- */
  function initMenu() {
    var nav = document.querySelector(".nav");
    if (!nav) return;

    var title = document.createElement("span");
    title.className = "nav-title";
    title.textContent = "COA IMP";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-label", "Toggle menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "&#9776;"; /* the three-line icon */

    nav.appendChild(title);
    nav.appendChild(toggle);

    function setOpen(open) {
      nav.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = open ? "&times;" : "&#9776;";
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("menu-open"));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > MOBILE_WIDTH) setOpen(false);
    });
  }

  /* ---------------------------------------------------------
     2. FAQ ACCORDION (About page)
     --------------------------------------------------------- */
  function initFaq() {
    var items = document.querySelectorAll("details.faq");
    if (!items.length) return;

    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ---------------------------------------------------------
     3. SURVEY FORM (Survey page)
     --------------------------------------------------------- */
  function initSurvey() {
    var form = document.querySelector(".survey-left form");
    var thanks = document.querySelector(".side-card.thanks");
    if (!form) return;

    if (thanks) {
      thanks.classList.add("is-hidden");
      thanks.setAttribute("role", "status");
      thanks.setAttribute("aria-live", "polite");
    }

    var error = document.createElement("p");
    error.className = "form-error";
    error.hidden = true;
    error.setAttribute("role", "alert");
    form.insertBefore(error, form.querySelector(".survey-submit"));

    form.addEventListener("change", function (e) {
      if (e.target.type !== "radio") return;
      var box = e.target.closest(".question");
      if (box) box.classList.remove("has-error");
      error.hidden = true;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var missing = [];
      form.querySelectorAll(".question").forEach(function (box) {
        var answered = box.querySelector("input[type=radio]:checked");
        var legend = box.querySelector("legend");
        box.classList.toggle("has-error", !answered);
        if (!answered && legend) missing.push(legend.textContent.trim());
      });

      if (missing.length) {
        error.textContent = "Please answer: " + missing.join(", ") + ".";
        error.hidden = false;
        var firstBad = form.querySelector(".has-error");
        if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      error.hidden = true;

      var name = form.querySelector("#name").value.trim();
      if (thanks) {
        var msg = thanks.querySelector("p");
        if (msg) {
          msg.textContent = name
            ? "Thank you, " + name + ", for sharing your feedback."
            : "Thank you for sharing your feedback.";
        }
        thanks.classList.remove("is-hidden");
        thanks.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      form.reset();
    });

    form.addEventListener("reset", function () {
      form.querySelectorAll(".question").forEach(function (box) {
        box.classList.remove("has-error");
      });
    });
  }

  /* ---------------------------------------------------------
     4. GALLERY (Gallery page)
     --------------------------------------------------------- */
  function initGallery() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".gcard"));
    if (!cards.length) return;

    /* ---- put all cards in one grid so filtering/sorting looks neat ---- */
    var firstRow = cards[0].parentNode;
    var grid = document.createElement("div");
    grid.className = "gallery-grid";
    firstRow.parentNode.insertBefore(grid, firstRow);

    var oldRows = [];
    cards.forEach(function (card) {
      var row = card.parentNode;
      if (oldRows.indexOf(row) === -1) oldRows.push(row);
      card.classList.remove("gcard-last");
      grid.appendChild(card);
    });
    oldRows.forEach(function (row) {
      if (row.parentNode && row !== grid) row.parentNode.removeChild(row);
    });

    /* ---- collect info about each card ---- */
    var data = cards.map(function (card, i) {
      var thumb = card.querySelector(".gthumb");
      var title = card.querySelector("h3");
      var desc = card.querySelector(".desc");
      var date = card.querySelector(".date");
      var details = card.querySelector("details.photos");
      var photoCount = details ? details.querySelectorAll("a").length : 0;

      /* show how many photos in the summary, lazy-load the images */
      if (details) {
        var summary = details.querySelector("summary");
        if (summary) summary.textContent = "View photos (" + photoCount + ")";
        details.querySelectorAll("img").forEach(function (img) {
          img.loading = "lazy";
        });
      }

      /* clicking the coloured top of the card opens / closes its photos */
      if (thumb && details) {
        thumb.title = "Click to show or hide photos";
        thumb.setAttribute("role", "button");
        thumb.tabIndex = 0;
        var toggleDetails = function () { details.open = !details.open; };
        thumb.addEventListener("click", toggleDetails);
        thumb.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDetails();
          }
        });
      }

      return {
        el: card,
        order: i,
        category: thumb ? thumb.textContent.trim() : "",
        text: (
          (title ? title.textContent : "") + " " +
          (desc ? desc.textContent : "") + " " +
          (date ? date.textContent : "")
        ).toLowerCase(),
        time: date ? Date.parse(date.textContent.trim()) || 0 : 0
      };
    });

    /* only one photo set open at a time */
    var sets = document.querySelectorAll("details.photos");
    sets.forEach(function (set) {
      set.addEventListener("toggle", function () {
        if (!set.open) return;
        sets.forEach(function (other) {
          if (other !== set) other.open = false;
        });
      });
    });

    /* ---- toolbar: search + sort + category chips ---- */
    var categories = [];
    data.forEach(function (d) {
      if (d.category && categories.indexOf(d.category) === -1) categories.push(d.category);
    });

    var toolbar = document.createElement("div");
    toolbar.className = "g-toolbar";
    toolbar.innerHTML =
      '<div class="g-controls">' +
      '<input type="search" class="g-search" placeholder="Search activities (title, place, year)..." aria-label="Search gallery">' +
      '<select class="g-sort" aria-label="Sort gallery">' +
      '<option value="default">Sort: Default order</option>' +
      '<option value="new">Sort: Newest first</option>' +
      '<option value="old">Sort: Oldest first</option>' +
      "</select>" +
      "</div>" +
      '<div class="g-chips"></div>' +
      '<p class="g-count" aria-live="polite"></p>';
    grid.parentNode.insertBefore(toolbar, grid);

    var empty = document.createElement("p");
    empty.className = "g-empty";
    empty.hidden = true;
    empty.textContent = "No activities match your search. Try another word or choose All.";
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    var searchBox = toolbar.querySelector(".g-search");
    var sortBox = toolbar.querySelector(".g-sort");
    var chipBox = toolbar.querySelector(".g-chips");
    var countText = toolbar.querySelector(".g-count");

    var state = { category: "All", query: "", sort: "default" };

    ["All"].concat(categories).forEach(function (name) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "g-chip" + (name === "All" ? " is-active" : "");
      chip.textContent = name;
      chip.setAttribute("aria-pressed", name === "All" ? "true" : "false");
      chip.addEventListener("click", function () {
        state.category = name;
        chipBox.querySelectorAll(".g-chip").forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply();
      });
      chipBox.appendChild(chip);
    });

    searchBox.addEventListener("input", function () {
      state.query = searchBox.value.trim().toLowerCase();
      apply();
    });

    sortBox.addEventListener("change", function () {
      state.sort = sortBox.value;
      apply();
    });

    function apply() {
      var shown = 0;

      var ordered = data.slice().sort(function (a, b) {
        if (state.sort === "new") return b.time - a.time;
        if (state.sort === "old") return a.time - b.time;
        return a.order - b.order;
      });

      ordered.forEach(function (d) {
        var okCategory = state.category === "All" || d.category === state.category;
        var okText = !state.query || d.text.indexOf(state.query) !== -1;
        var visible = okCategory && okText;
        d.el.hidden = !visible;
        if (visible) shown++;
        grid.appendChild(d.el); /* moves the card into the new order */
      });

      countText.textContent = "Showing " + shown + " of " + data.length + " activities";
      empty.hidden = shown !== 0;
    }

    apply();

    /* ---- lightbox: next/prev, zoom, slideshow ---- */
    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Photo viewer");
    overlay.innerHTML =
      '<button type="button" class="lb-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lb-play" aria-label="Start slideshow">&#9654; Slideshow</button>' +
      '<button type="button" class="lb-prev" aria-label="Previous photo">&#8249;</button>' +
      '<figure class="lb-figure">' +
      '<img class="lb-img" alt="" title="Click to close">' +
      '<figcaption class="lb-caption"></figcaption>' +
      "</figure>" +
      '<button type="button" class="lb-next" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(overlay);

    var img = overlay.querySelector(".lb-img");
    var caption = overlay.querySelector(".lb-caption");
    var playBtn = overlay.querySelector(".lb-play");
    var items = [];
    var index = 0;
    var lastFocus = null;
    var timer = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var link = items[index];
      var thumb = link.querySelector("img");
      var text = thumb ? thumb.alt : "Photo";

      img.onerror = function () {
        caption.textContent = text + " (photo not found)";
      };
      img.src = link.getAttribute("href");
      img.alt = text;
      caption.textContent = text + " \u2022 " + (index + 1) + " / " + items.length;

      /* load the next photo early so the slideshow is smooth */
      var next = items[(index + 1) % items.length];
      if (next) {
        var pre = new Image();
        pre.src = next.getAttribute("href");
      }
    }

    function stopSlideshow() {
      if (timer) clearInterval(timer);
      timer = null;
      playBtn.innerHTML = "&#9654; Slideshow";
      playBtn.setAttribute("aria-label", "Start slideshow");
    }

    function startSlideshow() {
      stopSlideshow();
      timer = setInterval(function () { show(index + 1); }, 3000);
      playBtn.innerHTML = "&#10074;&#10074; Pause";
      playBtn.setAttribute("aria-label", "Pause slideshow");
    }

    function open(group, start) {
      items = Array.prototype.slice.call(group.querySelectorAll("a"));
      if (!items.length) return;
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add("no-scroll");
      show(start);
      overlay.querySelector(".lb-close").focus();
    }

    function close() {
      stopSlideshow();
      overlay.hidden = true;
      img.removeAttribute("src");
      document.body.classList.remove("no-scroll");
      if (lastFocus) lastFocus.focus();
    }

    sets.forEach(function (set) {
      set.addEventListener("click", function (e) {
        var link = e.target.closest("a");
        if (!link || !set.contains(link)) return;
        e.preventDefault();
        var all = Array.prototype.slice.call(set.querySelectorAll("a"));
        open(set, all.indexOf(link));
      });
    });

    overlay.querySelector(".lb-close").addEventListener("click", close);

    overlay.querySelector(".lb-prev").addEventListener("click", function () {
      show(index - 1);
    });

    overlay.querySelector(".lb-next").addEventListener("click", function () {
      show(index + 1);
    });

    playBtn.addEventListener("click", function () {
      if (timer) stopSlideshow();
      else startSlideshow();
    });

    /* click the photo to close the viewer */
    img.addEventListener("click", function () {
      close();
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === " " && document.activeElement !== playBtn) {
        e.preventDefault();
        if (timer) stopSlideshow();
        else startSlideshow();
      }
    });

    /* swipe left / right on phones */
    var startX = null;
    overlay.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    overlay.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 50) show(diff > 0 ? index - 1 : index + 1);
      startX = null;
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     5. FRAMEWORK PAGE
     --------------------------------------------------------- */
  function initFramework() {
    var steps = document.querySelectorAll(".step");
    steps.forEach(function (step) {
      step.tabIndex = 0;
      step.setAttribute("role", "button");

      function select() {
        var already = step.classList.contains("is-active");
        steps.forEach(function (s) { s.classList.remove("is-active"); });
        if (!already) step.classList.add("is-active");
      }

      step.addEventListener("click", select);
      step.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
    });

    document.querySelectorAll(".table td.center").forEach(function (cell) {
      var text = cell.textContent.trim().toLowerCase();
      if (text === "monitor" || text === "review") {
        cell.innerHTML = '<span class="badge badge-' + text + '">' + cell.textContent.trim() + "</span>";
      }
    });

    /* let wide tables scroll sideways on phones instead of breaking the page */
    document.querySelectorAll(".table").forEach(function (table) {
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ---------------------------------------------------------
     6. BACK-TO-TOP BUTTON
     --------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = "&uarr;";
    document.body.appendChild(btn);

    function update() {
      btn.classList.toggle("show", window.scrollY > 400);
    }

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------------------------------------------------
     START
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initFaq();
    initSurvey();
    initGallery();
    initFramework();
    initBackToTop();
  });
})();
