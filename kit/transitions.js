/* felt kit view-transition wiring. CLASSIC script (no import/export) so it can be render-blocking:
   pagereveal fires before first render, a deferred module would register too late.
   Include in <head>, before any module:  <script src="/kit/transitions.js"></script>
   Exposes globalThis.feltTransitions = { morphNameFor, navDirection, cardFor, morphPairs, install }; motion.js re-exports the pure fns. */
(function () {
  if (globalThis.feltTransitions) return; // included twice: the first copy already listens
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

  // the [data-morph] card whose href (or data-morph) points at url's page; hash and query ignored
  function cardFor(cards, url, base) {
    var want;
    try { want = new URL(url, base); } catch (e) { return null; }
    for (var i = 0; i < cards.length; i++) {
      try {
        var u = new URL(cards[i].getAttribute('href') || cards[i].dataset.morph, base);
        if (u.origin === want.origin && u.pathname === want.pathname) return cards[i];
      } catch (e2) { /* bad href */ }
    }
    return null;
  }

  // The morph pair for one side of a navigation, as [element, name] pairs.
  // This page's own morph target (a case or post header) carries its page's name; the card for the other page
  // carries that page's name. Forward: the tapped card grows into the next page's header. Back: the header
  // shrinks into the card it came from. One name per side: a clash would abort the whole transition.
  function morphPairs(root, here, other, origin) {
    var pairs = [];
    var own = morphNameFor(here, origin);
    var t = own && root.querySelector('[data-morph-target="' + own + '"]');
    if (t) pairs.push([t, own]);
    var name = other && morphNameFor(other, origin);
    var card = name && name !== own && cardFor(root.querySelectorAll('[data-morph]'), other, here);
    if (card) pairs.push([card, name]);
    return pairs;
  }

  function install(win, root) {
    var origin = win.location.origin;
    function addType(vt, type, from, to) {
      try { vt.types.add(navDirection(type, from, to)); } catch (e) { /* no viewTransition/types (Firefox) */ }
    }
    function name(vt, pairs) {
      for (var i = 0; i < pairs.length; i++) pairs[i][0].style.viewTransitionName = pairs[i][1];
      function clear() { for (var j = 0; j < pairs.length; j++) pairs[j][0].style.viewTransitionName = ''; }
      if (pairs.length) vt.finished.then(clear, clear);
    }

    // old page: name this page's header and the card for the destination
    win.addEventListener('pageswap', function (e) {
      try {
        var a = e.activation;
        if (!e.viewTransition) return; // no transition: nothing to name (and nothing to go stale)
        addType(e.viewTransition, a && a.navigationType, a && a.from && a.from.index, a && a.entry && a.entry.index);
        name(e.viewTransition, morphPairs(root, win.location.href, a && a.entry && a.entry.url, origin));
      } catch (e3) { /* never break navigation */ }
    });

    // new page: name this page's header and the card for the page we came from
    win.addEventListener('pagereveal', function (e) {
      try {
        var a = win.navigation && win.navigation.activation;
        if (!e.viewTransition) return;
        addType(e.viewTransition, a && a.navigationType, a && a.from && a.from.index, a && a.entry && a.entry.index);
        name(e.viewTransition, morphPairs(root, win.location.href, a && a.from && a.from.url, origin));
      } catch (e4) { /* never break navigation */ }
    });

    // bfcache restore: anything named on pageswap must not keep its name
    win.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      var named = root.querySelectorAll('[data-morph], [data-morph-target]');
      for (var i = 0; i < named.length; i++) named[i].style.viewTransitionName = '';
    });
  }

  var api = { morphNameFor: morphNameFor, navDirection: navDirection, cardFor: cardFor, morphPairs: morphPairs, install: install };
  globalThis.feltTransitions = api;
  if (typeof window !== 'undefined' && window.document) install(window, window.document);
})();
