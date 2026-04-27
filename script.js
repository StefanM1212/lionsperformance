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
