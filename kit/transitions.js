/* felt kit view-transition wiring. CLASSIC script (no import/export) so it can be render-blocking:
   pagereveal fires before first render, a deferred module would register too late.
   Include in <head>, before any module:  <script src="/kit/transitions.js"></script>
   Exposes globalThis.feltTransitions = { morphNameFor, navDirection, install }; motion.js re-exports the pure fns. */
(function () {
  var CASES = ['codewisp', 'shiba-inu', 'openspeaker', 'gatheredhere', 'elasticswap', 'koji', 'aftertutor'];

  function morphNameFor(href, origin) {
    var u;
    try { u = new URL(href, origin); } catch (e) { return null; }
    if (u.origin !== origin) return null;
    var m = /^\/([a-z0-9-]+)\.html$/.exec(u.pathname);
    if (!m || m[1] === 'index') return null;
    return (CASES.indexOf(m[1]) >= 0 ? 'case-' : 'post-') + m[1];
  }

  function navDirection(type, from, to) {
    if (type !== 'traverse') return 'push';
    return to < from ? 'back' : 'forward';
  }

  function install(win, root) {
    var origin = win.location.origin;
    function addType(vt, type, from, to) {
      try { vt.types.add(navDirection(type, from, to)); } catch (e) { /* no viewTransition/types (Firefox) */ }
    }

    win.addEventListener('pageswap', function (e) {
      try {
        var a = e.activation;
        if (!e.viewTransition) return; // no transition: nothing to name (and nothing to go stale)
        addType(e.viewTransition, a && a.navigationType, a && a.from && a.from.index, a && a.entry && a.entry.index);
        var dest = a && a.entry && a.entry.url;
        var name = dest && morphNameFor(dest, origin);
        if (!name) return;
        var want = new URL(dest).href;
        var cards = root.querySelectorAll('[data-morph]');
        for (var i = 0; i < cards.length; i++) {
          try {
            if (new URL(cards[i].getAttribute('href') || cards[i].dataset.morph, win.location.href).href === want) {
              cards[i].style.viewTransitionName = name;
              break;
            }
          } catch (e2) { /* bad href */ }
        }
      } catch (e3) { /* never break navigation */ }
    });

    win.addEventListener('pagereveal', function (e) {
      try {
        var a = win.navigation && win.navigation.activation;
        if (!e.viewTransition) return;
        addType(e.viewTransition, a && a.navigationType, a && a.from && a.from.index, a && a.entry && a.entry.index);
        var name = morphNameFor(win.location.href, origin);
        if (!name) return;
        var t = root.querySelector('[data-morph-target="' + name + '"]');
        if (!t) return;
        t.style.viewTransitionName = name;
        e.viewTransition.finished.then(clear, clear);
        function clear() { t.style.viewTransitionName = ''; }
      } catch (e4) { /* never break navigation */ }
    });

    // bfcache restore: a card named on pageswap must not keep its name
    win.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      var cards = root.querySelectorAll('[data-morph]');
      for (var i = 0; i < cards.length; i++) cards[i].style.viewTransitionName = '';
    });
  }

  var api = { morphNameFor: morphNameFor, navDirection: navDirection, install: install };
  globalThis.feltTransitions = api;
  if (typeof window !== 'undefined' && window.document) install(window, window.document);
})();
