/* Portfolio Châu Tuyết Vân — dựng trang từ assets/js/data.js
   Không cần server, không gọi mạng. Mở index.html là chạy. */
(function () {
  "use strict";
  var P = window.PORTFOLIO;
  if (!P) { return; }

  /* ---------- Trạng thái ---------- */
  var lang = "vi";
  try {
    var saved = localStorage.getItem("cvt-lang");
    if (saved === "vi" || saved === "en") { lang = saved; }
  } catch (e) { /* trình duyệt chặn lưu trữ: bỏ qua */ }

  var preview = /xem-tat-ca/.test(location.hash + location.search);
  var filters = { level: "all", medal: "all" };
  var lightboxItems = [];
  var lightboxIndex = 0;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Tiện ích ---------- */
  function $(id) { return document.getElementById(id); }
  function t(x) {
    if (x == null) { return ""; }
    if (typeof x === "string") { return x; }
    return x[lang] || x.vi || "";
  }
  function ui(key) { return t(P.ui[key]); }

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === false || v == null) { return; }
        if (k === "class") { el.className = v; }
        else if (k === "text") { el.textContent = v; }
        else { el.setAttribute(k, v === true ? "" : v); }
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) { return; }
      el.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return el;
  }
  function clear(el) { while (el.firstChild) { el.removeChild(el.firstChild); } }
  function visible(item) {
    if (preview) { return true; }
    return P.SHOW_STATUSES.indexOf(item.status || "verified") !== -1;
  }
  function hiddenClass(item) {
    return P.SHOW_STATUSES.indexOf(item.status || "verified") === -1 ? " is-hidden-status" : "";
  }
  /* Chỉ hiện ở chế độ rà soát */
  function reviewBits(item) {
    if (!preview) { return []; }
    var bits = [];
    var st = item.status || "verified";
    bits.push(h("span", { class: "flag " + st, text: ui("st_" + st) }));
    if (item.src) { bits.push(h("span", { class: "tag", text: ui("source") + ": " + item.src })); }
    return bits;
  }
  function todoNote(item) {
    if (!preview || !item.todo) { return null; }
    return h("div", { class: "todo", text: "⚠ " + item.todo });
  }
  function safeLink(url) { return /^https?:\/\//i.test(url) ? url : ""; }

  /* ---------- Chữ tĩnh trong HTML ---------- */
  function applyStaticText() {
    document.documentElement.lang = lang;
    document.title = ui("siteTitle");
    document.querySelectorAll("[data-i]").forEach(function (el) {
      var v = ui(el.getAttribute("data-i"));
      if (v) { el.textContent = v; }
    });
    var btn = $("langBtn");
    btn.textContent = ui("langBtn");
    btn.setAttribute("aria-label", ui("langAria"));
    $("lbClose").setAttribute("aria-label", ui("close"));
    $("lbPrev").setAttribute("aria-label", ui("prev"));
    $("lbNext").setAttribute("aria-label", ui("next"));
    $("footerText").textContent = ui("footer");
    var pb = $("previewBanner");
    pb.hidden = !preview;
    pb.textContent = preview ? ui("previewBanner") : "";
  }

  /* ---------- Hero ---------- */
  function heroArt() {
    var ns = "http://www.w3.org/2000/svg";
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<svg class="art" viewBox="0 0 400 500" role="img" aria-label="" xmlns="' + ns + '">' +
      '<defs><linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset="1" stop-color="#ecdcb8"/></linearGradient>' +
      '<linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7142f"/><stop offset="1" stop-color="#8f0b20"/></linearGradient></defs>' +
      '<rect width="400" height="500" fill="url(#gA)"/>' +
      '<circle cx="200" cy="210" r="132" fill="url(#gB)"/>' +
      '<path d="M40 410 C 120 300, 260 330, 372 150" fill="none" stroke="#b8862b" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M60 440 C 150 350, 270 380, 360 200" fill="none" stroke="#16120f" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
      '<circle cx="372" cy="150" r="9" fill="#b8862b"/>' +
      '<text x="200" y="258" text-anchor="middle" font-family="Cambria, Georgia, serif" font-weight="800" font-size="150" fill="#fff">V</text>' +
      '<rect x="120" y="448" width="160" height="6" rx="3" fill="#16120f" opacity=".85"/>' +
      '</svg>';
    return wrap.firstChild;
  }
  function renderHero() {
    var p = P.profile;
    $("heroName").textContent = p.name;
    $("heroRole").textContent = t(p.role);
    $("heroTagline").textContent = t(p.tagline);
    var meta = $("heroMeta");
    clear(meta);
    meta.appendChild(h("div", null, [h("b", { text: ui("heroBorn") + ": " }), String(p.birthYear)]));
    meta.appendChild(h("div", { text: t(p.unit) }));

    var fig = $("heroFigure");
    clear(fig);
    var frame = h("div", { class: "frame" });
    var art = heroArt();
    art.setAttribute("aria-label", t(p.heroImageAlt));
    frame.appendChild(art);
    fig.appendChild(frame);
    if (p.heroImage) {
      var probe = new Image();
      probe.onload = function () {
        clear(frame);
        frame.appendChild(h("img", { src: p.heroImage, alt: t(p.heroImageAlt), width: probe.naturalWidth, height: probe.naturalHeight }));
      };
      probe.src = p.heroImage;
    }
  }

  /* ---------- Số liệu ---------- */
  function renderStats() {
    var ul = $("stats");
    clear(ul);
    P.stats.filter(visible).forEach(function (s) {
      var num = h("div", { class: "stat-num", "data-count": s.count, "data-prefix": s.prefix || "", "data-suffix": s.suffix || "" });
      num.textContent = (s.prefix || "") + s.count + (s.suffix || "");
      ul.appendChild(h("li", { class: "stat" + hiddenClass(s) }, [
        num,
        h("div", { class: "stat-label", text: t(s.label) }),
        preview ? h("div", { class: "row-meta" }, reviewBits(s)) : null
      ]));
    });
  }
  function runCounters() {
    var nodes = document.querySelectorAll(".stat-num[data-count]");
    function setVal(el, v) { el.textContent = el.getAttribute("data-prefix") + v + el.getAttribute("data-suffix"); }
    if (reduceMotion || !("IntersectionObserver" in window)) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        io.unobserve(en.target);
        var el = en.target, end = Number(el.getAttribute("data-count")), start = performance.now(), dur = 1100;
        (function tick(now) {
          var k = Math.min(1, (now - start) / dur);
          setVal(el, Math.round(end * (1 - Math.pow(1 - k, 3))));
          if (k < 1) { requestAnimationFrame(tick); }
        })(start);
        /* Dự phòng: tab chạy nền làm requestAnimationFrame tạm dừng — luôn chốt giá trị cuối. */
        setTimeout(function () { setVal(el, end); }, dur + 300);
      });
    }, { threshold: 0.6 });
    /* Giữ nguyên giá trị cuối trong HTML (để bản in và trình duyệt không chạy hiệu ứng vẫn đúng);
       hiệu ứng đếm chỉ chạy thêm khi phần tử cuộn vào màn hình. */
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Tóm tắt + Vinh danh ---------- */
  function renderSummary() {
    var ol = $("summaryList");
    clear(ol);
    P.profile.summary.forEach(function (s) { ol.appendChild(h("li", { text: t(s) })); });
  }
  function renderHonor() {
    var hn = P.honor, box = $("honor"), sec = $("vinh-danh");
    clear(box);
    if (!visible(hn)) { sec.hidden = true; return; }
    sec.hidden = false;
    box.appendChild(h("div", { class: "honor-badge", "aria-hidden": "true" }, [
      h("div", null, [h("b", { text: hn.badge }), h("small", { text: lang === "vi" ? "năm VTF" : "years of VTF" })])
    ]));
    var body = h("div", null, [
      h("p", { class: "eyebrow", text: ui("honorEyebrow") }),
      h("h2", { id: "h-honor", text: t(hn.title) }),
      h("p", { class: "honor-text", text: hn.officialText || t(hn.text) }),
      h("p", { class: "honor-note", text: t(hn.note) })
    ]);
    if (preview) {
      body.appendChild(h("div", { class: "row-meta" }, reviewBits(hn)));
      var td = todoNote(hn); if (td) { body.appendChild(td); }
    }
    box.appendChild(body);
  }

  /* ---------- Thành tích ---------- */
  var LEVELS = [["all", "all"], ["world", "lvWorld"], ["asia", "lvAsia"], ["sea", "lvSea"], ["open", "lvOpen"], ["national", "lvNational"]];
  var MEDALS = [["all", "all"], ["gold", "mGold"], ["silver", "mSilver"], ["bronze", "mBronze"]];

  function chipRow(labelKey, defs, key) {
    var row = h("div", { class: "filter-row", role: "group", "aria-label": ui(labelKey) }, [
      h("span", { class: "filter-label", text: ui(labelKey) })
    ]);
    defs.forEach(function (d) {
      var b = h("button", { class: "chip", type: "button", "aria-pressed": String(filters[key] === d[0]), "data-key": key, "data-val": d[0], text: ui(d[1]) });
      b.addEventListener("click", function () {
        filters[key] = d[0];
        row.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-val") === filters[key])); });
        renderResults();
      });
      row.appendChild(b);
    });
    return row;
  }
  function renderFilters() {
    var box = $("filters");
    clear(box);
    box.appendChild(chipRow("filterLevel", LEVELS, "level"));
    box.appendChild(chipRow("filterMedal", MEDALS, "medal"));
  }
  function renderResults() {
    var box = $("results");
    clear(box);
    var list = P.achievements.filter(function (a) {
      return visible(a) &&
        (filters.level === "all" || a.level === filters.level) &&
        (filters.medal === "all" || a.medal === filters.medal);
    });
    $("resultCount").textContent = list.length + " " + ui("resultCount");
    if (!list.length) { box.appendChild(h("p", { class: "empty", text: ui("noResults") })); return; }

    var years = [];
    list.forEach(function (a) { if (years.indexOf(a.year) === -1) { years.push(a.year); } });
    years.sort(function (a, b) { return b - a; });

    var medalKey = { gold: "mGold", silver: "mSilver", bronze: "mBronze" };
    var levelKey = { world: "lvWorld", asia: "lvAsia", sea: "lvSea", open: "lvOpen", national: "lvNational" };

    years.forEach(function (y) {
      var rows = h("div", { class: "rows" });
      list.filter(function (a) { return a.year === y; }).forEach(function (a) {
        var meta = [
          h("span", { class: "medal-word " + a.medal, text: ui(medalKey[a.medal]) }),
          h("span", { class: "tag", text: ui(levelKey[a.level]) })
        ];
        var place = t(a.place);
        if (place) { meta.push(h("span", { text: place })); }
        meta = meta.concat(reviewBits(a));
        var info = h("div", null, [
          h("div", { class: "row-title", text: t(a.event) }),
          t(a.detail) ? h("div", { class: "row-detail", text: t(a.detail) }) : null,
          h("div", { class: "row-meta" }, meta),
          todoNote(a)
        ]);
        rows.appendChild(h("div", { class: "row" + hiddenClass(a) }, [
          h("span", { class: "medal " + a.medal, role: "img", "aria-label": ui(medalKey[a.medal]) }),
          info
        ]));
      });
      box.appendChild(h("div", { class: "year-group" }, [h("div", { class: "year-num", text: String(y) }), rows]));
    });
  }
  function renderHonours() {
    var ul = $("honours");
    clear(ul);
    P.honours.filter(visible).forEach(function (x) {
      var li = h("li", { class: (x.year ? "" : "noyear") + hiddenClass(x) }, [
        x.year ? h("span", { class: "h-year", text: x.year }) : null,
        h("span", { class: "h-title", text: t(x.title) })
      ]);
      if (preview) {
        li.appendChild(h("div", { class: "row-meta", style: "grid-column:1/-1" }, reviewBits(x)));
        var td = todoNote(x); if (td) { td.style.gridColumn = "1/-1"; li.appendChild(td); }
      }
      ul.appendChild(li);
    });
  }

  /* ---------- Hành trình ---------- */
  function renderJourney() {
    var ol = $("journey");
    clear(ol);
    P.journey.filter(visible).forEach(function (j) {
      ol.appendChild(h("li", { class: "reveal" + hiddenClass(j) }, [
        h("div", { class: "j-when", text: j.when }),
        h("div", { class: "j-title", text: t(j.title) }),
        t(j.text) ? h("p", { class: "j-text", text: t(j.text) }) : null,
        preview ? h("div", { class: "row-meta" }, reviewBits(j)) : null
      ]));
    });

    var side = $("journeySide");
    clear(side);
    var tr = P.training;
    side.appendChild(h("div", { class: "side-card" }, [
      h("h3", { text: ui("disciplinesTitle") }),
      h("ul", { class: "pill-list" }, tr.disciplines.map(function (d) { return h("li", { text: t(d) }); }))
    ]));
    side.appendChild(h("div", { class: "side-card" }, [
      h("h3", { text: ui("coachTitle") }),
      h("div", { class: "coach", text: P.profile.coach }),
      h("div", { class: "coach-role", text: t(P.profile.coachRole) })
    ]));
    if (tr.items && tr.items.length) {
      side.appendChild(h("div", { class: "side-card" }, [h("h3", { text: ui("trainingTitle") })].concat(
        tr.items.map(function (it) {
          return h("div", { class: "train-item" }, [
            h("b", { text: t(it.title) }),
            h("span", { text: t(it.text) }),
            it.src ? h("small", { class: "train-src", text: ui("source") + ": " + it.src }) : null
          ]);
        })
      )));
    }
    if (tr.quote) {
      side.appendChild(h("blockquote", { class: "quote" }, [t(tr.quote) + (tr.quote.by ? " — " + tr.quote.by : "")]));
    }
  }

  /* ---------- Ảnh + Video ---------- */
  function renderGallery() {
    var g = $("gallery");
    clear(g);
    lightboxItems = P.gallery.filter(visible);
    lightboxItems.forEach(function (it, i) {
      var cap = t(it.caption);
      var img = h("img", { src: it.src, alt: cap || P.profile.name, loading: "lazy" });
      img.addEventListener("error", function () { var b = img.closest("button"); if (b) { b.remove(); } });
      var btn = h("button", { type: "button", "aria-label": cap || P.profile.name }, [
        img,
        cap ? h("span", { class: "cap", text: (it.year ? it.year + " · " : "") + cap }) : null
      ]);
      btn.addEventListener("click", function () { openLightbox(i); });
      g.appendChild(btn);
    });
    g.hidden = !lightboxItems.length;

    var vids = P.videos.filter(visible);
    var ul = $("videos");
    clear(ul);
    vids.forEach(function (v) {
      var href = safeLink(v.url) || ("https://www.youtube.com/results?search_query=" + encodeURIComponent(v.title));
      ul.appendChild(h("li", null, [
        h("a", { href: href, target: "_blank", rel: "noopener noreferrer" }, [
          h("span", { class: "play", "aria-hidden": "true" }),
          h("span", { text: v.title })
        ])
      ]));
    });
    $("videosBlock").hidden = !vids.length;

    var any = lightboxItems.length || vids.length;
    $("hinh-anh").hidden = !any && !preview;
    $("navGallery").hidden = !any && !preview;
    $("galleryLead").hidden = !lightboxItems.length;
  }

  function openLightbox(i) {
    var dlg = $("lightbox");
    lightboxIndex = (i + lightboxItems.length) % lightboxItems.length;
    var it = lightboxItems[lightboxIndex];
    $("lbImg").src = it.src;
    $("lbImg").alt = t(it.caption) || P.profile.name;
    $("lbCap").textContent = [it.year, t(it.caption), it.credit].filter(Boolean).join(" · ");
    if (!dlg.open) {
      if (dlg.showModal) { dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    }
  }
  function closeLightbox() {
    var dlg = $("lightbox");
    if (dlg.close) { dlg.close(); } else { dlg.removeAttribute("open"); }
  }

  /* ---------- Báo chí ---------- */
  function renderPress() {
    var ul = $("press");
    clear(ul);
    P.press.filter(visible).forEach(function (p) {
      var direct = safeLink(p.url);
      var href = direct || ("https://www.google.com/search?q=" + encodeURIComponent(p.title + " " + p.outlet));
      ul.appendChild(h("li", null, [
        h("div", null, [
          h("div", { class: "outlet", text: p.outlet }),
          h("div", { class: "p-title", text: p.title })
        ]),
        h("a", { href: href, target: "_blank", rel: "noopener noreferrer", text: (direct ? ui("readArticle") : ui("findArticle")) + " →" })
      ]));
    });
  }

  /* ---------- Ngoài sàn đấu + Liên hệ ---------- */
  function renderBeyond() {
    var box = $("beyond");
    clear(box);
    P.beyond.filter(visible).forEach(function (b) {
      box.appendChild(h("article", { class: "reveal" + hiddenClass(b) }, [
        h("h3", { text: t(b.title) }),
        h("p", { text: t(b.text) })
      ]));
    });
  }
  function renderContact() {
    var c = P.contact;
    $("contactNote").textContent = t(c.note);
    var ul = $("contactList");
    clear(ul);
    function add(label, href, text) {
      ul.appendChild(h("li", null, [label + ": ", h("a", { href: href, target: href.indexOf("http") === 0 ? "_blank" : null, rel: "noopener noreferrer", text: text })]));
    }
    if (c.email) { add("Email", "mailto:" + c.email, c.email); }
    if (c.phone) { add(lang === "vi" ? "Điện thoại" : "Phone", "tel:" + c.phone.replace(/\s+/g, ""), c.phone); }
    if (safeLink(c.facebook)) { add("Facebook", c.facebook, c.facebook); }
    if (safeLink(c.instagram)) { add("Instagram", c.instagram, c.instagram); }
    if (safeLink(c.youtube)) { add("YouTube", c.youtube, c.youtube); }
  }

  /* ---------- Hiệu ứng cuộn + menu ---------- */
  function observeReveal() {
    var els = document.querySelectorAll(".reveal:not(.in)");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }
  function observeNav() {
    if (!("IntersectionObserver" in window)) { return; }
    var links = {};
    document.querySelectorAll("#nav a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (a && en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          a.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(links).forEach(function (id) { var s = $(id); if (s) { io.observe(s); } });
  }

  /* ---------- Dựng toàn bộ ---------- */
  function renderAll() {
    applyStaticText();
    renderHero();
    renderStats();
    renderSummary();
    renderHonor();
    renderFilters();
    renderResults();
    renderHonours();
    renderJourney();
    renderGallery();
    renderPress();
    renderBeyond();
    renderContact();
    document.querySelectorAll(".section .wrap > h2, .summary-list li, .honor-grid, .stat").forEach(function (e) { e.classList.add("reveal"); });
    runCounters();
    observeReveal();
  }

  /* ---------- Sự kiện ---------- */
  $("langBtn").addEventListener("click", function () {
    lang = lang === "vi" ? "en" : "vi";
    try { localStorage.setItem("cvt-lang", lang); } catch (e) { /* bỏ qua */ }
    renderAll();
  });
  $("menuBtn").addEventListener("click", function () {
    var nav = $("nav");
    var open = nav.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
  });
  $("nav").addEventListener("click", function (e) {
    if (e.target.tagName === "A") { $("nav").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", "false"); }
  });
  $("printBtn1").addEventListener("click", function () { window.print(); });
  $("printBtn2").addEventListener("click", function () { window.print(); });
  $("lbClose").addEventListener("click", closeLightbox);
  $("lbPrev").addEventListener("click", function () { openLightbox(lightboxIndex - 1); });
  $("lbNext").addEventListener("click", function () { openLightbox(lightboxIndex + 1); });
  $("lightbox").addEventListener("click", function (e) { if (e.target === this) { closeLightbox(); } });
  $("lightbox").addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { openLightbox(lightboxIndex - 1); }
    if (e.key === "ArrowRight") { openLightbox(lightboxIndex + 1); }
  });

  /* Khi chạy trong website vtf30.tkdai.vn: hiện nút quay về phần Di sản 30 năm */
  if (/(^|\.)tkdai\.vn$/.test(location.hostname)) { $("backLink").hidden = false; }

  renderAll();
  observeNav();
})();
