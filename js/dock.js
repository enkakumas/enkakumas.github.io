/**
 * EN-KA Glass Dock — SPA Router + Loading Spinner
 * Fixed: slider timer stacking, second-visit content loss, page cleanup
 */
(function () {
    'use strict';

    const ROUTES = {
        home: 'index.html',
        urunler: 'urunler.html',
        kalip: 'kalip-koleksiyonu.html'
    };

    /* ── Global page cleanup registry ── */
    window._pageCleanupFns = window._pageCleanupFns || [];
    function registerCleanup(fn) {
        if (typeof fn === 'function') {
            window._pageCleanupFns.push(fn);
        }
    }

    function destroyCurrentPage() {
        /* Clear all registered cleanup functions */
        if (window._pageCleanupFns && window._pageCleanupFns.length) {
            window._pageCleanupFns.forEach(function (fn) {
                try { fn(); } catch (e) { console.warn('[EN-KA cleanup]', e); }
            });
            window._pageCleanupFns = [];
        }
        /* Also clear any remaining intervals as safety net */
        if (window.sliderInterval) {
            clearInterval(window.sliderInterval);
            window.sliderInterval = null;
        }
    }

    window.destroyCurrentPage = destroyCurrentPage;
    window.registerCleanup = registerCleanup;

    /* ── Loading Spinner ── */
    let spinnerEl = null;

    function createLoadingSpinner() {
        if (document.getElementById('enka-loading-spinner')) {
            spinnerEl = document.getElementById('enka-loading-spinner');
            return;
        }
        const spinner = document.createElement('div');
        spinner.id = 'enka-loading-spinner';
        spinner.innerHTML =
            '<div class="enka-spinner-bg">' +
                '<div class="enka-spinner-loader"></div>' +
            '</div>';
        document.body.appendChild(spinner);
        spinnerEl = spinner;
    }

    function showSpinner() {
        if (spinnerEl) spinnerEl.classList.add('open');
    }

    function hideSpinner() {
        if (spinnerEl) spinnerEl.classList.remove('open');
        setTimeout(function () {
            if (spinnerEl) spinnerEl.style.display = 'none';
        }, 300);
    }

    /* ── Build Dock HTML ── */
    function buildDock() {
        if (document.getElementById('enka-dock-root')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'enka-dock-root';
        wrapper.innerHTML =
            '<div class="enka-dock-wrapper">' +
                '<div class="enka-dock-row">' +
                    '<div class="enka-dock-pill" id="enka-dock-pill">' +
                        '<div class="enka-dock-indicator" id="enka-dock-indicator"></div>' +
                        '<div class="enka-dock-items" id="enka-dock-items">' +
                            '<button class="enka-dock-item" data-route="home" type="button">' +
                                '<span class="enka-dock-item-icon"><i class="fas fa-house"></i></span>' +
                                '<span class="enka-dock-item-label">Ana Sayfa</span>' +
                            '</button>' +
                            '<button class="enka-dock-item" data-route="urunler" type="button">' +
                                '<span class="enka-dock-item-icon"><i class="fas fa-swatchbook"></i></span>' +
                                '<span class="enka-dock-item-label">Ürünler</span>' +
                            '</button>' +
                            '<button class="enka-dock-item" data-route="kalip" type="button">' +
                                '<span class="enka-dock-item-icon"><i class="fas fa-drafting-compass"></i></span>' +
                                '<span class="enka-dock-item-label">Kalıplar</span>' +
                            '</button>' +
                            '<button class="enka-dock-item" data-route="contact" type="button">' +
                                '<span class="enka-dock-item-icon"><i class="fas fa-comments"></i></span>' +
                                '<span class="enka-dock-item-label">İletişim</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<button class="enka-dock-enkai" id="enka-dock-enkai" type="button" aria-label="EN-KAI Asistan">' +
                        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                            '<defs>' +
                                '<radialGradient id="enkai-sparkle-glow-white" cx="50%" cy="50%" r="50%">' +
                                    '<stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>' +
                                    '<stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>' +
                                '</radialGradient>' +
                            '</defs>' +
                            '<circle cx="12" cy="12" r="10" fill="url(#enkai-sparkle-glow-white)" opacity="0.4"/>' +
                            '<path d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z" fill="#FFFFFF"/>' +
                            '<path d="M18.5 3.5C18.5 5.16 17.16 6.5 15.5 6.5C17.16 6.5 18.5 7.84 18.5 9.5C18.5 7.84 19.84 6.5 21.5 6.5C19.84 6.5 18.5 5.16 18.5 3.5Z" fill="#FFFFFF" opacity="0.9"/>' +
                            '<path d="M6 16.5C6 17.6 5.1 18.5 4 18.5C5.1 18.5 6 19.4 6 20.5C6 19.4 6.9 18.5 8 18.5C6.9 18.5 6 17.6 6 16.5Z" fill="#FFFFFF" opacity="0.8"/>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="enka-contact-overlay" id="enka-contact-overlay">' +
                '<h2 class="enka-contact-title">Bize Ulaşın</h2>' +
                '<button class="enka-contact-close" id="enka-contact-close" type="button" aria-label="Kapat"><i class="fas fa-times"></i></button>' +
                '<div class="enka-contact-actions">' +
                    '<a href="https://wa.me/905368938558" target="_blank" rel="noopener" class="enka-contact-action wa"><i class="fab fa-whatsapp"></i> WhatsApp</a>' +
                    '<a href="https://instagram.com/enka_kumascilik_a.s" target="_blank" rel="noopener" class="enka-contact-action ig"><i class="fab fa-instagram"></i> Instagram</a>' +
                    '<a href="https://maps.app.goo.gl/QDJ8ei1FDQk6J7mv8" target="_blank" rel="noopener" class="enka-contact-action map"><i class="fas fa-map-location-dot"></i> Google Haritalar</a>' +
                    '<a href="tel:+905368938558" class="enka-contact-action phone"><i class="fas fa-phone" style="color:#E11D48;"></i> Hemen Ara</a>' +
                '</div>' +
            '</div>';
        document.body.appendChild(wrapper);
    }

    /* ── SPA Content Management ── */
    function ensureSpaContent() {
        if (!document.getElementById('spa-content')) {
            const body = document.body;
            const dockRoot = document.getElementById('enka-dock-root');
            const wrapper = document.createElement('div');
            wrapper.id = 'spa-content';
            const children = Array.from(body.children).filter(function (el) {
                return el.id !== 'enka-dock-root' && !el.classList.contains('enka-dock-wrapper');
            });
            children.forEach(function (child) { wrapper.appendChild(child); });
            body.insertBefore(wrapper, dockRoot || null);
        }
    }

    /* ── Extract & inject styles (skip dock.css to avoid duplicates) ── */
    function extractHeadStyles(doc) {
        const styles = doc.querySelectorAll('head style, head link[rel="stylesheet"]');
        styles.forEach(function (el) {
            if (el.tagName === 'LINK' && el.href && el.href.includes('dock.css')) return;
            const id = 'spa-style-' + (el.href || el.textContent.slice(0, 20)).replace(/\W/g, '');
            if (!document.getElementById(id)) {
                const clone = el.cloneNode(true);
                clone.id = id;
                document.head.appendChild(clone);
            }
        });
    }

    /* ── Re-execute scripts safely (avoid const/let redeclaration errors) ── */
    function runPageScripts(file) {
        try {
            if (file.includes('index.html') || file.includes('index-6')) {
                if (typeof checkReveal === 'function') checkReveal();
                if (typeof initSlider === 'function') initSlider();
                if (typeof initTurkeyClock === 'function') initTurkeyClock();
                if (typeof fetchWeather === 'function') fetchWeather();
                if (typeof initImageAnimation === 'function') initImageAnimation();
                if (typeof initEnkaiDemo === 'function') initEnkaiDemo();
            } else if (file.includes('urunler')) {
                if (typeof renderProducts === 'function') renderProducts();
            } else if (file.includes('kalip')) {
                if (typeof initKalipPage === 'function') initKalipPage();
                else if (typeof loadFromSupabase === 'function') loadFromSupabase();
            }
        } catch (err) {
            console.error('[EN-KA runPageScripts]', err);
        }
    }

    /* ── Safe script re-execution that avoids const/let redeclaration ── */
    function reexecuteScriptsSafely(doc) {
        const scripts = doc.querySelectorAll('body script:not([src*="dock.js"])');
        scripts.forEach(function (oldScript) {
            if (oldScript.src && oldScript.src.includes('dock.js')) return;
            /* For inline scripts, wrap in an IIFE to avoid const/let redeclaration issues */
            if (!oldScript.src && oldScript.textContent.trim()) {
                var wrapper = document.createElement('script');
                var originalCode = oldScript.textContent;
                /* Replace top-level const/let declarations with var to allow re-execution */
                var sanitizedCode = originalCode.replace(/\bconst\b/g, 'var').replace(/\blet\b/g, 'var');
                wrapper.textContent = sanitizedCode;
                document.body.appendChild(wrapper);
            } else if (oldScript.src) {
                var s = document.createElement('script');
                s.src = oldScript.src;
                document.body.appendChild(s);
            }
        });
    }

    /* ── Main Navigation ── */
    async function navigateTo(route) {
        if (route === 'contact') { openContact(); return; }
        if (route === 'enkai') { window.location.href = 'chatbot.html'; return; }

        const file = ROUTES[route];
        if (!file || isNavigating) return;

        const currentFile = getCurrentFile();
        if (getRouteFromFile(currentFile) === route) {
            setActiveRoute(route);
            return;
        }

        /* ── Destroy current page: clear all intervals, timers, event listeners ── */
        destroyCurrentPage();

        isNavigating = true;
        createLoadingSpinner();

        const spaContent = document.getElementById('spa-content');
        if (spaContent) spaContent.classList.add('spa-loading');
        const loadingSpinner = document.getElementById('enka-loading-spinner');
        if (loadingSpinner) loadingSpinner.classList.add('open');

        try {
            const resp = await fetch(file);
            const html = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            document.title = doc.title;
            extractHeadStyles(doc);

            const fetchedContent = doc.getElementById('spa-content');
            const newInner = fetchedContent
                ? fetchedContent.innerHTML
                : Array.from(doc.body.children)
                    .filter(function (el) {
                        return !el.id?.includes('dock') && !el.classList.contains('enka-dock-wrapper');
                    })
                    .map(function (el) { return el.outerHTML; })
                    .join('');

            if (spaContent) {
                spaContent.innerHTML = newInner;
                spaContent.classList.remove('spa-loading');
            }

            /* Re-execute scripts safely to avoid const/let redeclaration errors */
            reexecuteScriptsSafely(doc);

            history.pushState({ route: route }, '', file);
            setActiveRoute(route);
            window.scrollTo(0, 0);

            /* Show spinner briefly, then hide and run init scripts */
            setTimeout(function () {
                if (loadingSpinner) loadingSpinner.classList.remove('open');
                setTimeout(function () {
                    if (loadingSpinner) loadingSpinner.style.display = 'none';
                    runPageScripts(file);
                }, 300);
            }, 100);
        } catch (err) {
            console.error('[EN-KA SPA]', err);
            if (loadingSpinner) loadingSpinner.classList.remove('open');
            setTimeout(function () {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            }, 300);
            window.location.href = ROUTES[route];
        } finally {
            isNavigating = false;
        }
    }

    /* ── Current page detection ── */
    function getCurrentFile() {
        const path = window.location.pathname;
        const file = path.split('/').pop() || 'index.html';
        return file.includes('.html') ? file : 'index.html';
    }

    function getRouteFromFile(file) {
        var map = {
            'index.html': 'home',
            'urunler.html': 'urunler',
            'kalip-koleksiyonu.html': 'kalip'
        };
        return map[file] || 'home';
    }

    /* ── Route & Active State ── */
    let currentRoute = 'home';
    let isNavigating = false;

    function setActiveRoute(route) {
        currentRoute = route;
        document.querySelectorAll('.enka-dock-item').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.route === route);
        });
        var navRoutes = ['home', 'urunler', 'kalip'];
        var idx = navRoutes.indexOf(route);
        if (idx >= 0) moveIndicatorToIndex(idx, true);
    }

    /* ── Indicator positioning ── */
    function getItemBounds() {
        var pill = document.getElementById('enka-dock-pill');
        var items = document.querySelectorAll(
            '.enka-dock-item[data-route="home"], .enka-dock-item[data-route="urunler"], .enka-dock-item[data-route="kalip"]'
        );
        if (!pill || !items.length) return [];
        var pillRect = pill.getBoundingClientRect();
        var inset = 4;
        return Array.from(items).map(function (item) {
            var r = item.getBoundingClientRect();
            var left = r.left - pillRect.left + inset;
            var top = r.top - pillRect.top + inset;
            var width = r.width - inset * 2;
            var height = r.height - inset * 2;
            var borderRadius = Math.min(height * 0.42, 22) + 'px';
            return {
                route: item.dataset.route,
                left: left,
                width: width,
                top: top,
                height: height,
                borderRadius: borderRadius,
                centerX: left + width / 2
            };
        });
    }

    function applyIndicatorPosition(bound, animate) {
        var indicator = document.getElementById('enka-dock-indicator');
        if (!indicator || !bound) return;
        if (animate) {
            indicator.classList.add('is-snapping');
            indicator.classList.remove('is-dragging', 'edge-hit');
        } else {
            indicator.classList.remove('is-snapping', 'is-dragging', 'edge-hit');
        }
        indicator.style.left = bound.left + 'px';
        indicator.style.width = bound.width + 'px';
        if (bound.top !== undefined) indicator.style.top = bound.top + 'px';
        if (bound.height !== undefined) indicator.style.height = bound.height + 'px';
        if (bound.borderRadius) indicator.style.borderRadius = bound.borderRadius + 'px';
        if (animate) {
            clearTimeout(indicator._snapTimer);
            indicator._snapTimer = setTimeout(function () { indicator.classList.remove('is-snapping'); }, 650);
        }
    }

    function moveIndicatorToIndex(index, animate) {
        var bounds = getItemBounds();
        if (!bounds[index]) return;
        applyIndicatorPosition(bounds[index], animate);
    }

    function findNearestIndex(indicatorCenter) {
        var bounds = getItemBounds();
        var closest = 0;
        var minDist = Infinity;
        bounds.forEach(function (b, i) {
            var dist = Math.abs(b.centerX - indicatorCenter);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest;
    }

    /* ── Drag Indicator ── */
    var dragState = null;
    var didDrag = false;

    function initDragIndicator() {
        var indicator = document.getElementById('enka-dock-indicator');
        var pill = document.getElementById('enka-dock-pill');
        var items = document.querySelectorAll(
            '.enka-dock-item[data-route="home"], .enka-dock-item[data-route="urunler"], .enka-dock-item[data-route="kalip"]'
        );
        if (!indicator || !pill) return;
        var pressedRoute = null;

        function getIndicatorCenter() {
            var currentLeft = parseFloat(indicator.style.left);
            var currentWidth = parseFloat(indicator.style.width);
            if (!isNaN(currentLeft) && !isNaN(currentWidth)) {
                return currentLeft + currentWidth / 2;
            }
            var bounds = getItemBounds();
            var activeBounds = bounds[0];
            return activeBounds ? (activeBounds.left + activeBounds.width / 2) : 0;
        }

        function startDrag(pointerId, clientX) {
            didDrag = false;
            indicator.classList.add('is-dragging');
            indicator.classList.remove('is-snapping', 'edge-hit');
            var startLeft = parseFloat(indicator.style.left);
            var startWidth = parseFloat(indicator.style.width);
            if (isNaN(startLeft) || isNaN(startWidth)) {
                var bounds = getItemBounds();
                var activeBounds = bounds[0];
                if (activeBounds) { startLeft = activeBounds.left; startWidth = activeBounds.width; }
                else { startLeft = 0; startWidth = 64; }
            }
            indicator.style.left = startLeft + 'px';
            indicator.style.width = startWidth + 'px';
            dragState = { pointerId: pointerId, startX: clientX, origLeft: startLeft, origWidth: startWidth };
        }

        function onPointerDown(e) {
            var navBtn = e.target.closest('.enka-dock-item[data-route="home"], .enka-dock-item[data-route="urunler"], .enka-dock-item[data-route="kalip"]');
            var onIndicator = e.target === indicator;
            if (navBtn) pressedRoute = navBtn.dataset.route;
            else if (onIndicator) pressedRoute = currentRoute;
            else return;
            startDrag(e.pointerId, e.clientX);
        }

        function onPointerMove(e) {
            if (!dragState || e.pointerId !== dragState.pointerId) return;
            var bounds = getItemBounds();
            if (!bounds.length) return;
            var deltaX = e.clientX - dragState.startX;
            if (Math.abs(deltaX) > 5) didDrag = true;
            var minLeft = bounds[0].left;
            var maxLeft = bounds[bounds.length - 1].left + bounds[bounds.length - 1].width - dragState.origWidth;
            var newLeft = dragState.origLeft + deltaX;
            var stretch = Math.min(Math.abs(deltaX) * 0.12, 16);
            var newWidth = dragState.origWidth + (didDrag ? stretch : 0);
            var hitEdge = false;
            if (newLeft < minLeft) { newLeft = minLeft; newWidth = dragState.origWidth * 0.88; hitEdge = true; }
            else if (newLeft > maxLeft) { newLeft = maxLeft; newWidth = dragState.origWidth * 0.88; hitEdge = true; }
            indicator.style.left = newLeft + 'px';
            indicator.style.width = newWidth + 'px';
            indicator.classList.toggle('edge-hit', hitEdge);
        }

        function onPointerUp(e) {
            if (!dragState || e.pointerId !== dragState.pointerId) return;
            indicator.classList.remove('is-dragging', 'edge-hit');
            if (didDrag) {
                var bounds = getItemBounds();
                var closest = findNearestIndex(getIndicatorCenter());
                var targetRoute = ['home', 'urunler', 'kalip'][closest];
                var targetBounds = bounds[closest];
                applyIndicatorPosition(targetBounds, true);
                setTimeout(function () {
                    if (targetRoute !== currentRoute) navigateTo(targetRoute);
                    pressedRoute = null;
                }, 580);
            } else {
                var bounds2 = getItemBounds();
                var idx = ['home', 'urunler', 'kalip'].indexOf(currentRoute);
                if (idx >= 0) applyIndicatorPosition(bounds2[idx], true);
                pressedRoute = null;
            }
            dragState = null;
        }

        pill.addEventListener('pointerdown', onPointerDown);
        items.forEach(function (item) { item.addEventListener('pointerdown', onPointerDown); });
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
    }

    /* ── Contact Overlay ── */
    function openContact() {
        document.getElementById('enka-contact-overlay')?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeContact() {
        document.getElementById('enka-contact-overlay')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ── Event Bindings ── */
    function bindEvents() {
        document.getElementById('enka-dock-items')?.addEventListener('click', function (e) {
            var btn = e.target.closest('.enka-dock-item');
            if (!btn) return;
            var route = btn.dataset.route;
            if (route === 'contact') { openContact(); }
            else if (['home', 'urunler', 'kalip'].includes(route)) {
                if (!didDrag) navigateTo(route);
                didDrag = false;
            }
        });

        document.getElementById('enka-dock-enkai')?.addEventListener('click', function () {
            window.location.href = 'chatbot.html';
        });

        document.getElementById('enka-contact-close')?.addEventListener('click', closeContact);
        document.getElementById('enka-contact-overlay')?.addEventListener('click', function (e) {
            if (e.target.id === 'enka-contact-overlay') closeContact();
        });

        window.addEventListener('popstate', function (e) {
            var route = e.state?.route || getRouteFromFile(getCurrentFile());
            if (route !== currentRoute) navigateTo(route);
        });

        window.addEventListener('resize', function () {
            var navRoutes = ['home', 'urunler', 'kalip'];
            var idx = navRoutes.indexOf(currentRoute);
            if (idx >= 0) moveIndicatorToIndex(idx, false);
        });
    }

    /* ── Remove old nav/modals ── */
    function removeLegacyNav() {
        document.querySelectorAll('[style*="bottom:20px"], [style*="bottom: 20px"]').forEach(function (el) {
            if (el.querySelector('.bottom-nav-liquid, .bottom-nav-glass')) el.remove();
        });
        document.querySelectorAll('.bottom-nav-liquid, .bottom-nav-glass').forEach(function (el) {
            el.closest('[style*="fixed"]')?.remove() || el.remove();
        });
        var oldContact = document.getElementById('contact-modal');
        if (oldContact) oldContact.remove();
    }

    /* ── Init ── */
    function init() {
        removeLegacyNav();
        buildDock();
        ensureSpaContent();
        bindEvents();

        currentRoute = getRouteFromFile(getCurrentFile());
        setActiveRoute(currentRoute);

        requestAnimationFrame(function () {
            initDragIndicator();
            var navRoutes = ['home', 'urunler', 'kalip'];
            var idx = navRoutes.indexOf(currentRoute);
            if (idx >= 0) moveIndicatorToIndex(idx, false);
        });

        history.replaceState({ route: currentRoute }, '', getCurrentFile());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
