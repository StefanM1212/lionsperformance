/* =========================================================
   Lions Performance — JS
   - Mobile-Navigation
   - Scroll-State der Navigation
   - Reveal-on-Scroll Animationen
   - Kontaktformular (Stub)
   - Jahr im Footer
========================================================= */

(() => {
    const $  = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    /* ----- Jahr im Footer ----- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    /* ----- Nav: Scroll-State ----- */
    const nav = $('#nav');
    const setNavState = () => {
        if (!nav) return;
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    setNavState();
    window.addEventListener('scroll', setNavState, { passive: true });

    /* ----- Mobile Navigation ----- */
    const toggle = $('#navToggle');
    const mobile = $('#navMobile');

    const closeMobile = () => {
        if (!toggle || !mobile) return;
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
    };
    const openMobile = () => {
        if (!toggle || !mobile) return;
        toggle.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        mobile.hidden = false;
    };

    toggle?.addEventListener('click', () => {
        const isOpen = toggle.classList.contains('is-open');
        isOpen ? closeMobile() : openMobile();
    });

    $$('#navMobile a').forEach(a => a.addEventListener('click', closeMobile));

    /* ----- Reveal-on-Scroll ----- */
    const revealTargets = [
        '.hero__title',
        '.hero__lead',
        '.hero__cta',
        '.hero__points',
        '.hero__meta',
        '.section__head',
        '.card',
        '.case',
        '.method__steps li',
        '.value',
        '.personal__media',
        '.personal__copy',
        '.pstep',
        '.pillar',
        '.contact__copy',
        '.contact__form',
        '.closing h2',
        '.closing p',
        '.closing .btn'
    ];

    const els = $$(revealTargets.join(','));
    els.forEach(el => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

        els.forEach(el => io.observe(el));
    } else {
        els.forEach(el => el.classList.add('is-visible'));
    }

    /* ----- Smooth Scroll (mit Nav-Offset) ----- */
    $$('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href');
            if (!id || id === '#' || id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const navH = nav?.offsetHeight ?? 0;
            const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ----- Kontaktformular → Zapier Webhook ----- */
    const ZAPIER_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/9616404/uv4q7ii/';
    const form     = $('#contactForm');
    const success  = $('#formSuccess');
    const errorBox = $('#formError');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        /* Spamschutz: Honeypot ausgefüllt → Bot. Wir täuschen Erfolg vor, senden aber nichts. */
        const honeypot = form.querySelector('[name="hp_website"]');
        if (honeypot && honeypot.value.trim() !== '') {
            if (success) success.hidden = false;
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalLabel = submitBtn?.textContent;
        if (errorBox) errorBox.hidden = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Wird gesendet …';
        }

        try {
            const formData = new FormData(form);
            formData.delete('hp_website');

            /* Telefonnummer international normalisieren → verhindert falsche +1/US-Erkennung im CRM */
            const dial = form.querySelector('#telVorwahl')?.value || '+49';
            const rawTel = (form.querySelector('#telefon')?.value || '').trim();
            let national = rawTel.replace(/\D/g, '');          // nur Ziffern
            national = national.replace(/^0+/, '');            // nationale Trunk-0 entfernen (z. B. 0151 → 151)
            const dialDigits = dial.replace(/\D/g, '');         // z. B. "49"
            if (dialDigits && national.startsWith(dialDigits)) {
                national = national.slice(dialDigits.length);   // falls Vorwahl doppelt eingetippt (0049 / 49…)
            }
            const fullTel = national ? dial + national : rawTel;
            formData.set('telefon', fullTel);                   // z. B. +49151...
            formData.set('telefon_vorwahl', dial);              // optional separat fürs CRM
            formData.delete('telVorwahl');

            formData.append('source', 'lionsperformance.de');
            formData.append('submitted_at', new Date().toISOString());

            const response = await fetch(ZAPIER_WEBHOOK, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
            if (success) {
                success.hidden = false;
                success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalLabel || 'Erneut senden →';
            }
            if (errorBox) {
                errorBox.hidden = false;
                errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    /* ----- Count-Up Animation für Stats ----- */
    const counters = $$('[data-count-to]');
    const animateCount = (el) => {
        const target = parseFloat(el.dataset.countTo);
        const decimals = parseInt(el.dataset.countDecimals || '0', 10);
        const suffix = el.dataset.countSuffix || '';
        const duration = 2100;
        const startTime = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = target * easeOut(progress);
            el.textContent = value.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(decimals) + suffix;
        };
        requestAnimationFrame(tick);
    };

    if (counters.length && 'IntersectionObserver' in window) {
        const countObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    countObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach(c => countObs.observe(c));
    } else {
        counters.forEach(el => {
            const target = parseFloat(el.dataset.countTo);
            const decimals = parseInt(el.dataset.countDecimals || '0', 10);
            el.textContent = target.toFixed(decimals) + (el.dataset.countSuffix || '');
        });
    }

    /* ----- Active Nav-Link auf Scroll ----- */
    const sectionIds = ['ergebnisse', 'werte', 'ueber-uns', 'kontakt'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);
    const navLinks = $$('#nav .nav__menu a');

    if (sections.length && 'IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinks.forEach(link => {
                        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

        sections.forEach(sec => spy.observe(sec));
    }

})();

/* =========================================================
   Cookie-Consent (DSGVO)
   - Banner, Einstellungen-Dialog, Widerruf-Button
   - Sperrt externe Medien (YouTube/Vimeo) bis zur Einwilligung
========================================================= */
(() => {
    const STORAGE_KEY = 'lp_consent_v1';
    const DS_LINK = 'datenschutz.html';

    /* ----- Consent lesen / speichern ----- */
    const readConsent = () => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
        catch { return null; }
    };
    const saveConsent = (media) => {
        const data = { media: !!media, ts: new Date().toISOString() };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
        return data;
    };

    /* ----- Externe Medien laden / sperren ----- */
    const loadFrame = (frame) => {
        if (frame.dataset.cookiesrc && !frame.src) {
            frame.src = frame.dataset.cookiesrc;
        }
        const block = frame.parentElement?.querySelector('.cc-mediablock');
        if (block) block.remove();
    };

    const blockFrame = (frame) => {
        const wrap = frame.parentElement;
        if (!wrap || wrap.querySelector('.cc-mediablock')) return;
        if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';

        const provider = (frame.dataset.cookiesrc || '').includes('vimeo') ? 'Vimeo' : 'YouTube';
        const block = document.createElement('div');
        block.className = 'cc-mediablock';
        block.innerHTML =
            '<div class="cc-mediablock__icon">▶</div>' +
            '<p class="cc-mediablock__text">Hier wird ein Video von <strong>' + provider + '</strong> geladen. ' +
            'Dabei werden Daten an den Anbieter übertragen. Mehr in unserer ' +
            '<a href="' + DS_LINK + '" style="color:#fff;text-decoration:underline;">Datenschutzerklärung</a>.</p>' +
            '<button type="button" class="cc-btn cc-btn--primary cc-mediablock__btn">Video laden</button>' +
            '<label class="cc-mediablock__always"><input type="checkbox" class="cc-mediablock__always-cb"> Externe Medien künftig immer laden</label>';

        block.querySelector('.cc-mediablock__btn').addEventListener('click', () => {
            const always = block.querySelector('.cc-mediablock__always-cb').checked;
            if (always) { saveConsent(true); applyConsent(true); }
            else loadFrame(frame);
        });
        wrap.appendChild(block);
    };

    const applyConsent = (mediaAllowed) => {
        document.querySelectorAll('iframe[data-cookiesrc]').forEach(frame => {
            if (mediaAllowed) loadFrame(frame);
            else blockFrame(frame);
        });
    };

    /* ----- UI aufbauen ----- */
    const banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie-Hinweis');
    banner.innerHTML =
        '<div class="cc-banner__icon" aria-hidden="true">🍪</div>' +
        '<div class="cc-banner__title">Datenschutz ist uns wichtig</div>' +
        '<p class="cc-banner__text">Wir verwenden nur technisch notwendige Cookies. ' +
        'Für eingebettete Videos (YouTube, Vimeo) brauchen wir deine Einwilligung, ' +
        'da dabei Daten an Dritte übertragen werden. Details in der ' +
        '<a href="' + DS_LINK + '">Datenschutzerklärung</a>.</p>' +
        '<div class="cc-actions">' +
            '<div class="cc-actions__row">' +
                '<button type="button" class="cc-btn cc-btn--ghost" data-cc="necessary">Nur notwendige</button>' +
                '<button type="button" class="cc-btn cc-btn--primary" data-cc="all">Alle akzeptieren</button>' +
            '</div>' +
            '<button type="button" class="cc-btn cc-btn--text" data-cc="settings">Einstellungen</button>' +
        '</div>';

    const modal = document.createElement('div');
    modal.className = 'cc-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Datenschutz-Einstellungen');
    modal.innerHTML =
        '<div class="cc-modal__card">' +
            '<div class="cc-modal__title">Datenschutz-Einstellungen</div>' +
            '<p class="cc-modal__intro">Entscheide selbst, welche Inhalte geladen werden dürfen. ' +
            'Deine Auswahl kannst du jederzeit über das Cookie-Symbol unten links ändern. ' +
            'Mehr in der <a href="' + DS_LINK + '">Datenschutzerklärung</a>.</p>' +

            '<div class="cc-cat">' +
                '<div>' +
                    '<div class="cc-cat__title">Notwendig <span class="cc-cat__tag">Immer aktiv</span></div>' +
                    '<p class="cc-cat__desc">Erforderlich für den Betrieb der Website (z. B. Speichern deiner Cookie-Auswahl, Versand des Kontaktformulars). Es findet kein Tracking statt.</p>' +
                '</div>' +
                '<label class="cc-switch"><input type="checkbox" checked disabled><span class="cc-switch__slider"></span></label>' +
            '</div>' +

            '<div class="cc-cat">' +
                '<div>' +
                    '<div class="cc-cat__title">Externe Medien</div>' +
                    '<p class="cc-cat__desc">Lädt eingebettete Videos von YouTube und Vimeo. Dabei werden Daten (z. B. deine IP-Adresse) an diese Anbieter übertragen.</p>' +
                '</div>' +
                '<label class="cc-switch"><input type="checkbox" id="ccMedia"><span class="cc-switch__slider"></span></label>' +
            '</div>' +

            '<div class="cc-modal__actions">' +
                '<button type="button" class="cc-btn cc-btn--ghost" data-cc="save">Auswahl speichern</button>' +
                '<button type="button" class="cc-btn cc-btn--primary" data-cc="all">Alle akzeptieren</button>' +
            '</div>' +
        '</div>';

    const reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'cc-reopen';
    reopen.setAttribute('aria-label', 'Datenschutz-Einstellungen öffnen');
    reopen.innerHTML = '🍪';

    document.body.append(banner, modal, reopen);

    const mediaToggle = modal.querySelector('#ccMedia');

    /* ----- Sichtbarkeit ----- */
    const showBanner = () => requestAnimationFrame(() => banner.classList.add('is-visible'));
    const hideBanner = () => banner.classList.remove('is-visible');
    const openModal = () => {
        const c = readConsent();
        mediaToggle.checked = !!(c && c.media);
        modal.classList.add('is-open');
    };
    const closeModal = () => modal.classList.remove('is-open');

    const finalize = (media) => {
        saveConsent(media);
        applyConsent(media);
        hideBanner();
        closeModal();
    };

    /* ----- Events ----- */
    banner.addEventListener('click', (e) => {
        const action = e.target.closest('[data-cc]')?.dataset.cc;
        if (action === 'all') finalize(true);
        else if (action === 'necessary') finalize(false);
        else if (action === 'settings') openModal();
    });

    modal.addEventListener('click', (e) => {
        const action = e.target.closest('[data-cc]')?.dataset.cc;
        if (action === 'all') finalize(true);
        else if (action === 'save') finalize(mediaToggle.checked);
        else if (e.target === modal) closeModal();
    });

    reopen.addEventListener('click', openModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    /* ----- Init ----- */
    const consent = readConsent();
    if (consent) {
        applyConsent(consent.media);
    } else {
        applyConsent(false);
        showBanner();
    }
})();

/* =========================================================
   E-Mail-Spamschutz
   Die Adresse steht NICHT im HTML-Quelltext (Bots scrapen den).
   Sie wird erst hier per JS zusammengesetzt — bei [data-reveal]
   zusätzlich erst nach einem Klick des Nutzers.
========================================================= */
(() => {
    const buildLink = (user, domain) => {
        const addr = user + '@' + domain;
        const a = document.createElement('a');
        a.href = 'mailto:' + addr;
        a.textContent = addr;
        a.className = 'email-link';
        a.rel = 'nofollow';
        return a;
    };

    document.querySelectorAll('.email-protect').forEach((el) => {
        const user = el.dataset.eu;
        const domain = el.dataset.ed;
        if (!user || !domain) return;

        if (el.hasAttribute('data-reveal')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'email-reveal';
            btn.innerHTML = '<span aria-hidden="true">✉</span> E-Mail anzeigen';
            btn.setAttribute('aria-label', 'E-Mail-Adresse anzeigen');
            btn.addEventListener('click', () => {
                el.replaceChildren(buildLink(user, domain));
            }, { once: true });
            el.replaceChildren(btn);
        } else {
            el.replaceChildren(buildLink(user, domain));
        }
    });
})();
