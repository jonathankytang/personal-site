(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */

  var navToggle = document.querySelector('.nav-toggle');
  var navLinksList = document.querySelector('.nav-links');

  if (navToggle && navLinksList) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinksList.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    navLinksList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinksList.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ---------------------------------------------------------
     Nav turns solid once the hero has scrolled past
     --------------------------------------------------------- */

  var nav = document.querySelector('.wedding-nav');
  var hero = document.querySelector('.hero');

  if (nav && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-solid', !entries[0].isIntersecting);
    }, { rootMargin: '-70px 0px 0px 0px', threshold: 0 }).observe(hero);
  } else if (nav) {
    nav.classList.add('is-solid');
  }

  /* ---------------------------------------------------------
     FAQ accordions

     Set FAQ_START_EXPANDED to false if you'd rather every
     answer started closed. It applies to every page that
     loads this file, and keeps the "Expand all" button label
     in step automatically.
     --------------------------------------------------------- */

  var FAQ_START_EXPANDED = false;

  document.querySelectorAll('.faq-question').forEach(function (button, index) {
    var item = button.parentElement;
    var answer = item.querySelector('.faq-answer');
    var id = 'faq-answer-' + index;

    item.classList.toggle('open', FAQ_START_EXPANDED);

    if (answer) {
      answer.id = id;
      button.setAttribute('aria-controls', id);
    }
    button.setAttribute('aria-expanded', String(item.classList.contains('open')));

    button.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });

  document.querySelectorAll('.faq-toggle-all').forEach(function (toggleButton) {
    var section = toggleButton.closest('section');
    if (!section) return;

    var items = section.querySelectorAll('.faq-item');

    var setLabel = function () {
      var anyClosed = Array.prototype.some.call(items, function (item) {
        return !item.classList.contains('open');
      });
      toggleButton.textContent = anyClosed ? 'Expand all' : 'Collapse all';
    };

    toggleButton.addEventListener('click', function () {
      // Read the items, not the label — the two can't drift apart.
      var shouldExpand = Array.prototype.some.call(items, function (item) {
        return !item.classList.contains('open');
      });

      items.forEach(function (item) {
        item.classList.toggle('open', shouldExpand);
        var q = item.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', String(shouldExpand));
      });

      setLabel();
    });

    // Keep the label honest when individual answers are toggled.
    items.forEach(function (item) {
      var q = item.querySelector('.faq-question');
      if (q) q.addEventListener('click', setLabel);
    });

    setLabel();
  });

  /* ---------------------------------------------------------
     Highlight the nav link for the section in view.
     rootMargin (not a threshold) so tall sections still register.
     --------------------------------------------------------- */

  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-links a');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var visible = new Set();

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });

      var current = null;
      sections.forEach(function (section) {
        if (current === null && visible.has(section.id)) current = section.id;
      });

      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ---------------------------------------------------------
     Photo carousel — contained frame above the Welcome section.

     Tries each extension in EXTENSIONS for every numbered photo,
     so it works whether your files are .jpeg, .jpg or .png.
     Reports what it found in the browser console.
     --------------------------------------------------------- */

  var carousel = document.querySelector('.photo-carousel');
  var track = carousel && carousel.querySelector('.carousel-track');

  if (carousel && track) {
    /* --- configure the carousel here --- */
    var FOLDER = 'assets/photos/';
    var PHOTO_COUNT = 8;
    var EXTENSIONS = ['jpeg', 'jpg', 'JPEG', 'JPG', 'png', 'webp'];
    var AUTO_ADVANCE_MS = 5000;
    /* ----------------------------------- */

    var prevBtn = carousel.querySelector('.carousel-arrow.left');
    var nextBtn = carousel.querySelector('.carousel-arrow.right');
    var countEl = carousel.querySelector('.carousel-count');
    var currentEl = carousel.querySelector('.carousel-current');
    var totalEl = carousel.querySelector('.carousel-total');
    var emptyEl = carousel.querySelector('.carousel-empty');

    var slides = [];
    var position = 0;
    var timerId = null;
    var attempted = [];

    var refreshChrome = function () {
      var many = slides.length > 1;
      if (prevBtn) prevBtn.hidden = !many;
      if (nextBtn) nextBtn.hidden = !many;
      if (countEl) countEl.hidden = !many;
      if (currentEl) currentEl.textContent = String(position + 1);
      if (totalEl) totalEl.textContent = String(slides.length);
    };

    var goTo = function (index) {
      if (!slides.length) return;
      slides[position].classList.remove('is-active');
      position = (index + slides.length) % slides.length;
      slides[position].classList.add('is-active');
      refreshChrome();
    };

    var stop = function () {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    var start = function () {
      stop();
      if (slides.length > 1 && !reduceMotion) {
        timerId = setInterval(function () { goTo(position + 1); }, AUTO_ADVANCE_MS);
      }
    };

    var addSlide = function (src) {
      var img = document.createElement('img');
      img.className = 'carousel-slide';
      img.src = src;
      img.alt = 'Wedding photo ' + (slides.length + 1);
      if (slides.length > 0) img.loading = 'lazy';
      track.appendChild(img);
      slides.push(img);

      if (slides.length === 1) {
        img.classList.add('is-active');
        if (emptyEl) emptyEl.hidden = true;
      }
      if (slides.length === 2) start();

      refreshChrome();
    };

    /* Try photo `number` against each extension in turn. Move to the
       next photo as soon as one works, or when all have failed. */
    var tryPhoto = function (number, extIndex) {
      if (number > PHOTO_COUNT) return finish();

      if (extIndex >= EXTENSIONS.length) {
        return tryPhoto(number + 1, 0);
      }

      var src = FOLDER + number + '.' + EXTENSIONS[extIndex];
      var probe = new Image();

      probe.onload = function () {
        addSlide(src);
        tryPhoto(number + 1, 0);
      };
      probe.onerror = function () {
        attempted.push(src);
        tryPhoto(number, extIndex + 1);
      };
      probe.src = src;
    };

    var finish = function () {
      if (slides.length) {
        console.info('[carousel] loaded ' + slides.length + ' photo(s).');
        return;
      }

      if (emptyEl) emptyEl.hidden = false;
      console.warn(
        '[carousel] No photos loaded. Checked these paths, all failed:\n' +
        attempted.join('\n') +
        '\n\nThese paths are relative to italy.html. Confirm the folder ' +
        'name, the file names (1, 2, 3...) and the extension, then update ' +
        'FOLDER / PHOTO_COUNT / EXTENSIONS at the top of this block in wedding.js.'
      );
    };

    refreshChrome();
    tryPhoto(1, 0);

    if (prevBtn) {
      prevBtn.addEventListener('click', function () { goTo(position - 1); start(); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { goTo(position + 1); start(); });
    }

    carousel.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { goTo(position - 1); start(); }
      if (event.key === 'ArrowRight') { goTo(position + 1); start(); }
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { start(); }
    });
  }
})();