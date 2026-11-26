/**
 * Crosta — GSAP ScrollTrigger + Conic Pie Sweep + Curved Dial Controller
 */
(() => {
  "use strict";

  const PIES = window.CROSTA_PIES || [];
  if (!PIES.length || typeof window.gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const track = document.getElementById("crTrack");
  const root = document.getElementById("crostaRoot");
  const floodBase = document.getElementById("floodBase");
  const floodIn = document.getElementById("floodIn");
  const wordsWrap = document.getElementById("crWords");
  const scatterWrap = document.getElementById("crScatter");
  const piesWrap = document.getElementById("crPies");
  const ringEl = document.getElementById("crRing");

  const pieNumEl = document.getElementById("pieNum");
  const pieTitleEl = document.getElementById("pieTitle");
  const pieDescEl = document.getElementById("pieDesc");
  const pieTagsEl = document.getElementById("pieTags");
  const sizesGroup = document.getElementById("crSizes");
  const piePriceEl = document.getElementById("piePrice");
  const pieServesEl = document.getElementById("pieServes");
  const addToBoxBtn = document.getElementById("addToBoxBtn");

  // Box Drawer
  const boxTrigger = document.getElementById("boxTrigger");
  const boxCountEl = document.getElementById("boxCount");
  const boxDrawer = document.getElementById("boxDrawer");
  const closeBoxBtn = document.getElementById("closeBoxBtn");
  const boxEmpty = document.getElementById("boxEmpty");
  const boxItems = document.getElementById("boxItems");
  const boxFoot = document.getElementById("boxFoot");
  const boxTotal = document.getElementById("boxTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const srAnnouncer = document.getElementById("srAnnouncer");

  const state = {
    activeIndex: 0,
    size: "whole", // "whole" | "slice"
    box: [],
    isBoxOpen: false,
    isTransitioning: false,
  };

  const wordEls = [];
  const pieEls = [];
  const toppingGroups = [];
  const dialBtns = [];
  let sweepTween = null;

  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatEuro(n) {
    return Number.isInteger(n) ? `\u20AC${n}` : `\u20AC${n.toFixed(2)}`;
  }

  /* ========================================================================
     1. Build DOM Layers (Words, Toppings, Pies, Dial Stops)
     ======================================================================== */
  function buildDOM() {
    PIES.forEach((pie, idx) => {
      // Split-letter Wordmark
      const wordDiv = document.createElement("div");
      wordDiv.className = "cr-word";
      const label = pie.name.toLowerCase();
      wordDiv.style.setProperty("--len", String(label.length));
      [...label].forEach((ch, li) => {
        const sp = document.createElement("span");
        sp.style.setProperty("--li", String(li));
        sp.textContent = ch;
        wordDiv.appendChild(sp);
      });
      wordsWrap.appendChild(wordDiv);
      wordEls.push(wordDiv);

      // Toppings Group
      const group = [];
      pie.toppings.forEach((t, n) => {
        const topEl = document.createElement("div");
        topEl.className = `cr-top${t.front ? " is-front" : ""}`;
        topEl.style.setProperty("--x", String(t.x));
        topEl.style.setProperty("--y", String(t.y));
        topEl.style.setProperty("--s", String(t.s));
        topEl.style.setProperty("--r", t.r);
        topEl.style.setProperty("--d", String(t.d));
        topEl.style.setProperty("--b", t.b);
        topEl.style.setProperty("--n", String(n));

        topEl.innerHTML = `<span class="cr-par"><img src="${t.img}" alt="" draggable="false" /></span>`;
        scatterWrap.appendChild(topEl);
        group.push({ el: topEl, cfg: t });
      });
      toppingGroups.push(group);

      // Pie Layer (body + slice wedge)
      const pieDiv = document.createElement("div");
      pieDiv.className = `cr-pie${idx === 0 ? " is-now" : ""}`;
      pieDiv.innerHTML = `
        <div class="cr-spin">
          <img class="cr-body" src="${pie.pieImage}" alt="${pie.alt}" draggable="false" />
          <img class="cr-wedge" src="${pie.pieImage}" alt="" draggable="false" />
        </div>
      `;
      piesWrap.appendChild(pieDiv);
      pieEls.push(pieDiv);

      // Curved Dial Stop
      const stopBtn = document.createElement("button");
      stopBtn.type = "button";
      stopBtn.className = `cr-stop${idx === 0 ? " is-on" : ""}`;
      stopBtn.setAttribute("role", "tab");
      stopBtn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
      stopBtn.style.setProperty("--k", String(-idx));
      stopBtn.style.setProperty("--away", String(idx));
      stopBtn.textContent = pie.name;
      stopBtn.addEventListener("click", () => scrollToFlavour(idx));
      ringEl.appendChild(stopBtn);
      dialBtns.push(stopBtn);
    });
  }

  /* ========================================================================
     2. GSAP Animations: Word Letters, Scattered Toppings, Conic Pie Sweep
     ======================================================================== */
  function animateWord(prevIdx, nextIdx, instant = false) {
    wordEls.forEach((word, idx) => {
      const spans = word.querySelectorAll("span");
      gsap.killTweensOf(spans);

      if (idx === nextIdx) {
        if (instant || reducedMotion()) {
          gsap.set(spans, { opacity: 1, yPercent: 0, rotate: 0 });
        } else {
          gsap.fromTo(
            spans,
            { opacity: 0, yPercent: 38, rotate: 7 },
            {
              opacity: 1,
              yPercent: 0,
              rotate: 0,
              duration: 0.7,
              stagger: 0.032,
              delay: 0.16,
              ease: "power3.out",
            }
          );
        }
      } else if (idx === prevIdx && prevIdx !== nextIdx) {
        if (instant || reducedMotion()) {
          gsap.set(spans, { opacity: 0 });
        } else {
          gsap.to(spans, {
            opacity: 0,
            yPercent: -34,
            rotate: -6,
            duration: 0.4,
            stagger: 0.016,
            ease: "power2.in",
          });
        }
      } else {
        gsap.set(spans, { opacity: 0 });
      }
    });
  }

  function animateToppings(prevIdx, nextIdx, instant = false) {
    const D = Math.min(window.innerHeight * 0.58, window.innerWidth * 0.42);
    const sx = window.innerWidth <= 760 ? 0.6 : 1;
    const sy = window.innerWidth <= 760 ? 1.02 : 1;

    toppingGroups.forEach((group, idx) => {
      group.forEach(({ el, cfg }, n) => {
        gsap.killTweensOf(el);
        const targetX = cfg.x * D * sx;
        const targetY = cfg.y * D * sy;
        const targetRot = parseFloat(cfg.r) || 0;

        if (idx === nextIdx) {
          if (instant || reducedMotion()) {
            gsap.set(el, { opacity: 1, x: targetX, y: targetY, rotation: targetRot, scale: 1 });
          } else {
            gsap.fromTo(
              el,
              {
                opacity: 0,
                x: targetX * 2.4,
                y: targetY * 2.4,
                rotation: targetRot + 150,
                scale: 0.6,
              },
              {
                opacity: 1,
                x: targetX,
                y: targetY,
                rotation: targetRot,
                scale: 1,
                duration: 0.95,
                delay: 0.22 + n * 0.04,
                ease: "power3.out",
              }
            );
          }
        } else if (idx === prevIdx && prevIdx !== nextIdx && !instant && !reducedMotion()) {
          gsap.to(el, {
            opacity: 0,
            x: targetX * 2.4,
            y: targetY * 2.4,
            rotation: targetRot - 90,
            scale: 0.6,
            duration: 0.55,
            delay: n * 0.02,
            ease: "power2.in",
          });
        } else {
          gsap.set(el, { opacity: 0 });
        }
      });
    });
  }

  function renderPieInfo(pie, animate = true) {
    pieNumEl.textContent = pie.number;
    pieTitleEl.textContent = pie.title;
    pieDescEl.textContent = pie.desc;

    pieTagsEl.innerHTML = "";
    pie.tags.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      pieTagsEl.appendChild(li);
    });

    updatePriceDisplay();

    if (animate && !reducedMotion()) {
      gsap.fromTo(
        document.querySelectorAll("#crInfo > *"),
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.06, ease: "power3.out", clearProps: "transform" }
      );
    }
  }

  function updatePriceDisplay() {
    const pie = PIES[state.activeIndex];
    const isSlice = state.size === "slice";
    piePriceEl.textContent = formatEuro(isSlice ? pie.slicePrice : pie.wholePrice);
    pieServesEl.textContent = isSlice ? "an eighth" : "serves eight";

    root.classList.toggle("is-slice", isSlice);
    root.classList.toggle("has-hole", isSlice);

    if (!reducedMotion()) {
      gsap.fromTo(
        "#crPriceWrap",
        { y: 10, autoAlpha: 0.4 },
        { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", clearProps: "transform" }
      );
    }
  }

  function switchFlavour(nextIdx, { instant = false } = {}) {
    if (nextIdx === state.activeIndex && !instant) return;
    const prevIdx = state.activeIndex;
    const nextPie = PIES[nextIdx];
    const prevPie = PIES[prevIdx];
    const dir = nextIdx >= prevIdx ? 1 : -1;

    state.activeIndex = nextIdx;
    root.dataset.dir = String(dir);
    root.style.setProperty("--ink", nextPie.ink);
    root.style.setProperty("--paper", nextPie.paper);
    root.style.setProperty("--turn", String(nextIdx));
    document.documentElement.style.background = nextPie.paper;

    dialBtns.forEach((btn, i) => {
      const away = Math.abs(i - nextIdx);
      btn.classList.toggle("is-on", i === nextIdx);
      btn.setAttribute("aria-selected", i === nextIdx ? "true" : "false");
      btn.style.setProperty("--away", String(away));
    });

    // Background flood + Conic pie sweep
    if (instant || reducedMotion()) {
      floodBase.style.background = nextPie.gradient;
      floodIn.style.background = nextPie.gradient;
      root.style.setProperty("--flood", "1");
      pieEls.forEach((p, i) => {
        p.classList.remove("is-in", "is-out");
        p.classList.toggle("is-now", i === nextIdx);
      });
    } else {
      floodBase.style.background = prevPie.gradient;
      floodIn.style.background = nextPie.gradient;

      pieEls.forEach((p, i) => {
        p.classList.remove("is-now", "is-in", "is-out");
        if (i === nextIdx) p.classList.add("is-in");
        else if (i === prevIdx) p.classList.add("is-out");
      });

      if (sweepTween) sweepTween.kill();
      const animObj = { sweep: 0, flood: 0, spin: 0, pulse: 0 };
      sweepTween = gsap.to(animObj, {
        sweep: 361,
        flood: 1,
        spin: dir * 360,
        pulse: 1,
        duration: 0.95,
        ease: "power3.inOut",
        onUpdate: () => {
          const pulseVal = 1 - Math.sin(animObj.pulse * Math.PI) * 0.07;
          root.style.setProperty("--sweep", `${animObj.sweep.toFixed(1)}deg`);
          root.style.setProperty("--flood", animObj.flood.toFixed(4));
          root.style.setProperty("--spin", `${animObj.spin.toFixed(1)}deg`);
          root.style.setProperty("--pulse", pulseVal.toFixed(4));
        },
        onComplete: () => {
          root.style.setProperty("--spin", "0deg");
          root.style.setProperty("--pulse", "1");
          floodBase.style.background = nextPie.gradient;
          pieEls.forEach((p, i) => {
            p.classList.remove("is-in", "is-out");
            p.classList.toggle("is-now", i === nextIdx);
          });
        },
      });
    }

    animateWord(prevIdx, nextIdx, instant);
    animateToppings(prevIdx, nextIdx, instant);
    renderPieInfo(nextPie, !instant);
    srAnnouncer.textContent = `${nextPie.title}, ${formatEuro(nextPie.wholePrice)}`;
  }

  /* ========================================================================
     3. ScrollTrigger + Dial Click + Pie Spin/Parallax
     ======================================================================== */
  let isProgrammaticScroll = false;

  function scrollToFlavour(idx) {
    const maxScroll = track.offsetHeight - window.innerHeight;
    switchFlavour(idx);
    if (maxScroll <= 0) return;
    isProgrammaticScroll = true;
    const targetY = track.offsetTop + (idx / (PIES.length - 1)) * maxScroll;
    window.scrollTo({ top: targetY, behavior: "instant" });
    requestAnimationFrame(() => {
      isProgrammaticScroll = false;
    });
  }

  function initScrollAndInteractions() {
    ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        if (isProgrammaticScroll) return;
        const p = self.progress;
        const idx = Math.min(PIES.length - 1, Math.round(p * (PIES.length - 1)));
        if (idx !== state.activeIndex) {
          switchFlavour(idx);
        }
      },
    });

    // Mouse parallax for scattered toppings
    window.addEventListener("pointermove", (e) => {
      if (reducedMotion()) return;
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty("--mx", mx.toFixed(3));
      root.style.setProperty("--my", my.toFixed(3));
    });

    // Interactive pie drag spin
    let spinning = false;
    let startX = 0;
    let baseAngle = 0;
    piesWrap.addEventListener("pointerdown", (e) => {
      spinning = true;
      startX = e.clientX;
      baseAngle = parseFloat(getComputedStyle(root).getPropertyValue("--spin")) || 0;
      piesWrap.setPointerCapture(e.pointerId);
    });
    piesWrap.addEventListener("pointermove", (e) => {
      if (!spinning) return;
      const delta = (e.clientX - startX) * 0.45;
      root.style.setProperty("--spin", `${(baseAngle + delta).toFixed(1)}deg`);
    });
    const stopSpin = (e) => {
      if (!spinning) return;
      spinning = false;
      if (piesWrap.hasPointerCapture(e.pointerId)) piesWrap.releasePointerCapture(e.pointerId);
    };
    piesWrap.addEventListener("pointerup", stopSpin);
    piesWrap.addEventListener("pointercancel", stopSpin);

    // Size toggle (Whole pie / One slice)
    sizesGroup.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextSize = btn.dataset.size;
        if (nextSize === state.size) return;
        state.size = nextSize;
        sizesGroup.querySelectorAll("button").forEach((b) => {
          const on = b.dataset.size === nextSize;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-checked", on ? "true" : "false");
        });
        updatePriceDisplay();
      });
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.isBoxOpen) closeBox();
      if (state.isBoxOpen) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        scrollToFlavour(Math.min(PIES.length - 1, state.activeIndex + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        scrollToFlavour(Math.max(0, state.activeIndex - 1));
      }
    });

    window.addEventListener("resize", () => {
      animateToppings(state.activeIndex, state.activeIndex, true);
    });
  }

  /* ========================================================================
     4. Box Cart Drawer
     ======================================================================== */
  function updateBoxUI(bump = false) {
    boxCountEl.textContent = String(state.box.length);
    boxTrigger.setAttribute("aria-label", `Your box, ${state.box.length} items`);
    if (bump && !reducedMotion()) {
      gsap.fromTo(boxCountEl, { scale: 1.4 }, { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.5)" });
    }

    boxItems.innerHTML = "";
    if (!state.box.length) {
      boxEmpty.hidden = false;
      boxFoot.hidden = true;
      return;
    }

    boxEmpty.hidden = true;
    boxFoot.hidden = false;
    let total = 0;

    state.box.forEach((item, i) => {
      total += item.price;
      const li = document.createElement("li");
      li.className = "cr-drawer-item";
      li.innerHTML = `
        <div>
          <h4>${item.title}</h4>
          <p>${item.sizeLabel}</p>
        </div>
        <div>
          <span>${formatEuro(item.price)}</span>
          <button type="button" class="cr-drawer-remove">Remove</button>
        </div>
      `;
      li.querySelector(".cr-drawer-remove").addEventListener("click", () => {
        state.box.splice(i, 1);
        updateBoxUI(false);
      });
      boxItems.appendChild(li);
    });

    boxTotal.textContent = formatEuro(total);
  }

  function openBox() {
    state.isBoxOpen = true;
    boxDrawer.setAttribute("aria-hidden", "false");
    boxTrigger.setAttribute("aria-expanded", "true");
    gsap.fromTo(
      boxDrawer,
      { autoAlpha: 1, x: 0, xPercent: 103 },
      { x: 0, xPercent: 0, duration: reducedMotion() ? 0 : 0.65, ease: "power3.out" }
    );
  }

  function closeBox() {
    state.isBoxOpen = false;
    boxDrawer.setAttribute("aria-hidden", "true");
    boxTrigger.setAttribute("aria-expanded", "false");
    gsap.to(boxDrawer, {
      xPercent: 103,
      duration: reducedMotion() ? 0 : 0.5,
      ease: "power3.inOut",
      onComplete: () => gsap.set(boxDrawer, { autoAlpha: 0 }),
    });
  }

  addToBoxBtn.addEventListener("click", () => {
    const pie = PIES[state.activeIndex];
    const isSlice = state.size === "slice";
    state.box.push({
      title: pie.title,
      sizeLabel: isSlice ? "One slice (1/8)" : "Whole pie (serves 8)",
      price: isSlice ? pie.slicePrice : pie.wholePrice,
    });
    updateBoxUI(true);

    const span = addToBoxBtn.querySelector("span");
    const orig = span.textContent;
    span.textContent = "Added to box \u2713";
    setTimeout(() => {
      span.textContent = orig;
    }, 1300);
  });

  boxTrigger.addEventListener("click", () => (state.isBoxOpen ? closeBox() : openBox()));
  closeBoxBtn.addEventListener("click", closeBox);
  checkoutBtn.addEventListener("click", () => {
    checkoutBtn.querySelector("span").textContent = "Order reserved \u2713";
    setTimeout(() => {
      checkoutBtn.querySelector("span").textContent = "Order for morning";
    }, 1800);
  });

  buildDOM();
  initScrollAndInteractions();
  updateBoxUI(false);
  switchFlavour(0, { instant: true });
})();
