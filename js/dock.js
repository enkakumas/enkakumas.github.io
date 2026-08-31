/**
 * EN-KA Glass Dock — SPA Router + Draggable Indicator + Contact Overlay
 * Refactored: Proportional squircle indicator, corrected drag-snap calculation, white AI Sparkle.
 */
(function () {
    'use strict';

    const ROUTES = {
        home: 'index-6.html',
        urunler: 'urunler.html',
        kalip: 'kalip-koleksiyonu.html'
    };

    const ROUTE_FROM_FILE = {
        'index-6.html': 'home',
        'index.html': 'home',
        'urunler.html': 'urunler',
        'kalip-koleksiyonu.html': 'kalip'
    };

    /* Sadece beyaz ve parlaklık içeren Gemini benzeri yapay zeka logosu */
    const ENKAI_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="enkai-sparkle-glow-white" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
            </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#enkai-sparkle-glow-white)" opacity="0.4"/>
        <path d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z" fill="#FFFFFF"/>
        <path d="M18.5 3.5C18.5 5.16 17.16 6.5 15.5 6.5C17.16 6.5 18.5 7.84 18.5 9.5C18.5 7.84 19.84 6.5 21.5 6.5C19.84 6.5 18.5 5.16 18.5 3.5Z" fill="#FFFFFF" opacity="0.9"/>
        <path d="M6 16.5C6 17.6 5.1 18.5 4 18.5C5.1 18.5 6 19.4 6 20.5C6 19.4 6.9 18.5 8 18.5C6.9 18.5 6 17.6 6 16.5Z" fill="#FFFFFF" opacity="0.8"/>
    </svg>`;

    let currentRoute = 'home';
    let isNavigating = false;
    let dragState = null;
    let didDrag = false;

    /* ── Detect current page ── */
    function getCurrentFile() {
        const path = window.location.pathname;
        const file = path.split('/').pop() || 'index-6.html';
        return file.includes('.html') ? file : 'index-6.html';
    }

    function getRouteFromFile(file) {
        return ROUTE_FROM_FILE[file] || 'home';
    }

    /* ── Build Dock HTML ── */
    function buildDock() {
        if (document.getElementById('enka-dock-root')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'enka-dock-root';
        wrapper.innerHTML = `
            <div class="enka-dock-wrapper">
                <div class="enka-dock-row">
                    <div class="enka-dock-pill" id="enka-dock-pill">
                        <div class="enka-dock-indicator" id="enka-dock-indicator"></div>
                        <div class="enka-dock-items" id="enka-dock-items">
                            <button class="enka-dock-item" data-route="home" type="button">
                                <span class="enka-dock-item-icon"><i class="fas fa-house"></i></span>
                                <span class="enka-dock-item-label">Ana Sayfa</span>
                            </button>
                            <button class="enka-dock-item" data-route="urunler" type="button">
                                <span class="enka-dock-item-icon"><i class="fas fa-swatchbook"></i></span>
                                <span class="enka-dock-item-label">Ürünler</span>
                            </button>
                            <button class="enka-dock-item" data-route="kalip" type="button">
                                <span class="enka-dock-item-icon"><i class="fas fa-drafting-compass"></i></span>
                                <span class="enka-dock-item-label">Kalıplar</span>
                            </button>
                            <button class="enka-dock-item" data-route="contact" type="button">
                                <span class="enka-dock-item-icon"><i class="fas fa-comments"></i></span>
                                <span class="enka-dock-item-label">İletişim</span>
                            </button>
                        </div>
                    </div>
                    <button class="enka-dock-enkai" id="enka-dock-enkai" type="button" aria-label="EN-KAI Asistan">
                        ${ENKAI_SVG}
                    </button>
                </div>
            </div>

            <div class="enka-contact-overlay" id="enka-contact-overlay">
                <h2 class="enka-contact-title">Bize Ulaşın</h2>
                <button class="enka-contact-close" id="enka-contact-close" type="button" aria-label="Kapat">
                    <i class="fas fa-times"></i>
                </button>
                <div class="enka-contact-actions">
                    <a href="https://wa.me/905368938558" target="_blank" rel="noopener" class="enka-contact-action wa">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                    <a href="https://instagram.com/enka_kumascilik_a.s" target="_blank" rel="noopener" class="enka-contact-action ig">
                        <i class="fab fa-instagram"></i> Instagram
                    </a>
                    <a href="https://maps.app.goo.gl/QDJ8ei1FDQk6J7mv8" target="_blank" rel="noopener" class="enka-contact-action map">
                        <i class="fas fa-map-location-dot"></i> Google Haritalar
                    </a>
                    <a href="tel:+905368938558" class="enka-contact-action phone">
                        <i class="fas fa-phone" style="color:#E11D48;"></i> Hemen Ara
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);
    }

    /* ── Indicator positioning ── */
    const NAV_ROUTES = ['home', 'urunler', 'kalip'];

    function getItemBounds() {
        const pill = document.getElementById('enka-dock-pill');
        const items = document.querySelectorAll(
            '.enka-dock-item[data-route="home"], .enka-dock-item[data-route="urunler"], .enka-dock-item[data-route="kalip"]'
        );
        if (!pill || !items.length) return [];

        const pillRect = pill.getBoundingClientRect();
        const inset = 4; // Kenarlarla tam altın oran uyumu için estetik boşluk

        return Array.from(items).map(item => {
            const r = item.getBoundingClientRect();
            const left = r.left - pillRect.left + inset;
            const top = r.top - pillRect.top + inset;
            const width = r.width - inset * 2;
            const height = r.height - inset * 2;
            
            // Tam orantılı squircle (kavisli karemsi yuvarlak) oluşturmak için yüksekliğe duyarlı hesaplama
            const borderRadius = Math.min(height * 0.42, 22) + 'px';

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

    function applyIndicatorPosition(bounds, animate) {
        const indicator = document.getElementById('enka-dock-indicator');
        if (!indicator || !bounds) return;

        if (animate) {
            indicator.classList.add('is-snapping');
            indicator.classList.remove('is-dragging', 'edge-hit');
        } else {
            indicator.classList.remove('is-snapping', 'is-dragging', 'edge-hit');
        }

        indicator.style.left = bounds.left + 'px';
        indicator.style.width = bounds.width + 'px';
        if (bounds.top !== undefined) {
            indicator.style.top = bounds.top + 'px';
        }
        if (bounds.height !== undefined) {
            indicator.style.height = bounds.height + 'px';
        }
        if (bounds.borderRadius) {
            indicator.style.borderRadius = bounds.borderRadius;
        }

        if (animate) {
            clearTimeout(indicator._snapTimer);
            indicator._snapTimer = setTimeout(() => indicator.classList.remove('is-snapping'), 650);
        }
    }

    function moveIndicatorToIndex(index, animate) {
        const bounds = getItemBounds();
        if (!bounds[index]) return;
        applyIndicatorPosition(bounds[index], animate);
    }

    function findNearestIndex(indicatorCenter) {
        const bounds = getItemBounds();
        let closest = 0;
        let minDist = Infinity;
        bounds.forEach((b, i) => {
            const dist = Math.abs(b.centerX - indicatorCenter);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest;
    }

    function setActiveRoute(route) {
        currentRoute = route;
        document.querySelectorAll('.enka-dock-item').forEach(btn => {
            const r = btn.dataset.route;
            btn.classList.toggle('active', r === route);
        });

        const navRoutes = ['home', 'urunler', 'kalip'];
        const idx = navRoutes.indexOf(route);
        if (idx >= 0) moveIndicatorToIndex(idx, true);
    }

    /* ── Drag indicator ── */
    function initDragIndicator() {
        const indicator = document.getElementById('enka-dock-indicator');
        const pill = document.getElementById('enka-dock-pill');
        const items = document.querySelectorAll(
            '.enka-dock-item[data-route="home"], .enka-dock-item[data-route="urunler"], .enka-dock-item[data-route="kalip"]'
        );
        if (!indicator || !pill) return;

        let pressedRoute = null;

        function getIndicatorCenter() {
            const currentLeft = parseFloat(indicator.style.left);
            const currentWidth = parseFloat(indicator.style.width);
            if (!isNaN(currentLeft) && !isNaN(currentWidth)) {
                return currentLeft + currentWidth / 2;
            }
            // Güvenli yedek hesaplama
            const activeBounds = getItemBounds()[NAV_ROUTES.indexOf(currentRoute) >= 0 ? NAV_ROUTES.indexOf(currentRoute) : 0];
            return activeBounds ? (activeBounds.left + activeBounds.width / 2) : 0;
        }

        function startDrag(pointerId, clientX) {
            didDrag = false;
            indicator.classList.add('is-dragging');
            indicator.classList.remove('is-snapping', 'edge-hit');

            let startLeft = parseFloat(indicator.style.left);
            let startWidth = parseFloat(indicator.style.width);

            // Eğer değerler kaybolmuşsa mevcut aktif sekmeye göre yeniden güvenli kilitlenme
            if (isNaN(startLeft) || isNaN(startWidth)) {
                const bounds = getItemBounds();
                const idx = NAV_ROUTES.indexOf(currentRoute);
                const activeBounds = bounds[idx >= 0 ? idx : 0];
                if (activeBounds) {
                    startLeft = activeBounds.left;
                    startWidth = activeBounds.width;
                } else {
                    startLeft = 0;
                    startWidth = 64;
                }
            }

            indicator.style.left = startLeft + 'px';
            indicator.style.width = startWidth + 'px';

            dragState = {
                pointerId,
                startX: clientX,
                origLeft: startLeft,
                origWidth: startWidth
            };
        }

        function onPointerDown(e) {
            const navBtn = e.target.closest(
                '.enka-dock-item[data-route="home"], .enka-dock-item[data-route="urunler"], .enka-dock-item[data-route="kalip"]'
            );
            const onIndicator = e.target === indicator;

            if (navBtn) pressedRoute = navBtn.dataset.route;
            else if (onIndicator) pressedRoute = currentRoute;
            else return;

            startDrag(e.pointerId, e.clientX);
        }

        function onPointerMove(e) {
            if (!dragState || e.pointerId !== dragState.pointerId) return;

            const bounds = getItemBounds();
            if (!bounds.length) return;

            const deltaX = e.clientX - dragState.startX;
            if (Math.abs(deltaX) > 5) didDrag = true;

            const minLeft = bounds[0].left;
            const maxLeft = bounds[bounds.length - 1].left + bounds[bounds.length - 1].width - dragState.origWidth;
            let newLeft = dragState.origLeft + deltaX;

            const stretch = Math.min(Math.abs(deltaX) * 0.12, 16);
            let newWidth = dragState.origWidth + (didDrag ? stretch : 0);

            let hitEdge = false;
            if (newLeft < minLeft) {
                newLeft = minLeft;
                newWidth = dragState.origWidth * 0.88;
                hitEdge = true;
            } else if (newLeft > maxLeft) {
                newLeft = maxLeft;
                newWidth = dragState.origWidth * 0.88;
                hitEdge = true;
            }

            indicator.style.left = newLeft + 'px';
            indicator.style.width = newWidth + 'px';
            indicator.classList.toggle('edge-hit', hitEdge);
        }

        function onPointerUp(e) {
            if (!dragState || e.pointerId !== dragState.pointerId) return;

            indicator.classList.remove('is-dragging', 'edge-hit');

            // Eğer sürüklendiyse bırakıldığı yerin en yakın merkezine git
            if (didDrag) {
                const bounds = getItemBounds();
                const closest = findNearestIndex(getIndicatorCenter());
                const targetRoute = NAV_ROUTES[closest];
                const targetBounds = bounds[closest];

                /* Bırakıldığı lokasyondan hedefe animasyon ile geçiş */
                applyIndicatorPosition(targetBounds, true);

                setTimeout(() => {
                    if (targetRoute !== currentRoute) navigateTo(targetRoute);
                    pressedRoute = null;
                }, 580);
            } else {
                /* Sadece tıklandıysa ana sayfaya sıçramayı engelle, 
                   zaten 'click' eventi doğru sekmeye yönlendirecek. */
                const bounds = getItemBounds();
                const idx = NAV_ROUTES.indexOf(currentRoute);
                if (idx >= 0) {
                    applyIndicatorPosition(bounds[idx], true);
                }
                pressedRoute = null;
            }
            
            dragState = null;
        }

        pill.addEventListener('pointerdown', onPointerDown);
        items.forEach(item => item.addEventListener('pointerdown', onPointerDown));
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
    }

    /* ── Contact overlay ── */
    function openContact() {
        document.getElementById('enka-contact-overlay')?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeContact() {
        document.getElementById('enka-contact-overlay')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.toggleContactModal = openContact;

    /* ── SPA Navigation ── */
    function ensureSpaContent() {
        if (!document.getElementById('spa-content')) {
            const body = document.body;
            const dockRoot = document.getElementById('enka-dock-root');
            const wrapper = document.createElement('div');
            wrapper.id = 'spa-content';

            const children = Array.from(body.children).filter(
                el => el.id !== 'enka-dock-root' && !el.classList.contains('enka-dock-wrapper')
            );
            children.forEach(child => wrapper.appendChild(child));
            body.insertBefore(wrapper, dockRoot || null);
        }
    }

    function runPageScripts(file) {
        if (file.includes('index-6') || file.includes('index.html')) {
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
    }

    function extractHeadStyles(doc) {
        const styles = doc.querySelectorAll('head style, head link[rel="stylesheet"]');
        styles.forEach(el => {
            if (el.tagName === 'LINK' && el.href && el.href.includes('dock.css')) return;
            const id = 'spa-style-' + (el.href || el.textContent.slice(0, 20)).replace(/\W/g, '');
            if (!document.getElementById(id)) {
                const clone = el.cloneNode(true);
                clone.id = id;
                document.head.appendChild(clone);
            }
        });
    }

    async function navigateTo(route) {
        if (route === 'contact') { openContact(); return; }
        if (route === 'enkai') {
            window.location.href = 'chatbot-3.html';
            return;
        }

        const file = ROUTES[route];
        if (!file || isNavigating) return;

        const currentFile = getCurrentFile();
        if (getRouteFromFile(currentFile) === route) {
            setActiveRoute(route);
            return;
        }

        isNavigating = true;
        const spaContent = document.getElementById('spa-content');
        if (spaContent) spaContent.classList.add('spa-loading');

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
                    .filter(el => !el.id?.includes('dock') && !el.classList.contains('enka-dock-wrapper'))
                    .map(el => el.outerHTML)
                    .join('');

            if (spaContent) {
                spaContent.innerHTML = newInner;
                spaContent.classList.remove('spa-loading');
            }

            /* Re-execute inline scripts from fetched page */
            const scripts = doc.querySelectorAll('body script:not([src*="dock.js"])');
            scripts.forEach(oldScript => {
                if (oldScript.src && oldScript.src.includes('dock.js')) return;
                const s = document.createElement('script');
                if (oldScript.src) {
                    s.src = oldScript.src;
                } else {
                    s.textContent = oldScript.textContent;
                }
                document.body.appendChild(s);
            });

            history.pushState({ route }, '', file);
            setActiveRoute(route);
            window.scrollTo(0, 0);

            setTimeout(() => runPageScripts(file), 100);
        } catch (err) {
            console.error('[EN-KA SPA]', err);
            window.location.href = ROUTES[route];
        } finally {
            isNavigating = false;
        }
    }

    /* ── Event bindings ── */
    function bindEvents() {
        /* Contact + tap navigation fallback */
        document.getElementById('enka-dock-items')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.enka-dock-item');
            if (!btn) return;
            const route = btn.dataset.route;
            if (route === 'contact') {
                openContact();
            } else if (['home', 'urunler', 'kalip'].includes(route)) {
                if (!didDrag) navigateTo(route);
                didDrag = false;
            }
        });

        document.getElementById('enka-dock-enkai')?.addEventListener('click', () => {
            window.location.href = 'chatbot-3.html';
        });

        document.getElementById('enka-contact-close')?.addEventListener('click', closeContact);
        document.getElementById('enka-contact-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'enka-contact-overlay') closeContact();
        });

        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || getRouteFromFile(getCurrentFile());
            if (route !== currentRoute) navigateTo(route);
        });

        window.addEventListener('resize', () => {
            const navRoutes = ['home', 'urunler', 'kalip'];
            const idx = navRoutes.indexOf(currentRoute);
            if (idx >= 0) moveIndicatorToIndex(idx, false);
        });
    }

    /* ── Remove old nav/modals ── */
    function removeLegacyNav() {
        document.querySelectorAll('[style*="bottom:20px"], [style*="bottom: 20px"]').forEach(el => {
            if (el.querySelector('.bottom-nav-liquid, .bottom-nav-glass')) el.remove();
        });
        document.querySelectorAll('.bottom-nav-liquid, .bottom-nav-glass').forEach(el => {
            el.closest('[style*="fixed"]')?.remove() || el.remove();
        });
        const oldContact = document.getElementById('contact-modal');
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

        requestAnimationFrame(() => {
            initDragIndicator();
            const navRoutes = ['home', 'urunler', 'kalip'];
            const idx = navRoutes.indexOf(currentRoute);
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
