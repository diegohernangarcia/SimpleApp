/**
 * SimpleApps Suite - Motor Unificado de Tema (Modo Claro / Modo Oscuro)
 * Permite cambiar de tema dinámicamente y sincronizarlo entre la página principal y todas las micro-apps.
 */
(function() {
    'use strict';

    // 1. Detección y aplicación inmediata del tema (Anti-FOUC)
    function getStoredTheme() {
        return localStorage.getItem('simpleapps_theme') || 'dark';
    }

    const currentTheme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);

    // 2. API Global de Control de Tema
    window.SimpleAppsTheme = {
        get: function() {
            return document.documentElement.getAttribute('data-theme') || 'dark';
        },
        set: function(theme, showToast) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('simpleapps_theme', theme);

            // Actualizar botones de alternancia en el DOM
            document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn').forEach(function(btn) {
                const label = btn.querySelector('.theme-toggle-label, #themeToggleLabel');
                if (label) {
                    label.textContent = theme === 'light' ? 'Modo Oscuro' : 'Modo Claro';
                }
                const titleText = theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
                btn.setAttribute('title', titleText);
                btn.setAttribute('aria-label', titleText);
            });

            // Disparar evento personalizado para que las apps reactivas puedan redibujar si lo necesitan
            window.dispatchEvent(new CustomEvent('simpleapps:themechange', { detail: { theme: theme } }));

            // Mostrar toast si se solicita
            if (showToast) {
                showThemeToast(theme === 'light' ? '☀️ Modo Claro activado' : '🌙 Modo Oscuro activado');
            }
        },
        toggle: function(showToast) {
            const nextTheme = this.get() === 'light' ? 'dark' : 'light';
            this.set(nextTheme, showToast !== false);
            return nextTheme;
        }
    };

    // 3. Notificación Toast Flotante
    function showThemeToast(message) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2800);
    }

    // 4. Vincular listeners al cargar el DOM
    function initThemeButtons() {
        const activeTheme = SimpleAppsTheme.get();
        SimpleAppsTheme.set(activeTheme, false);

        document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn').forEach(function(btn) {
            if (btn.__themeInitialized) return;
            btn.__themeInitialized = true;
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                SimpleAppsTheme.toggle(true);
            });
        });
    }

    // 5. Sincronización entre pestañas en tiempo real
    window.addEventListener('storage', function(e) {
        if (e.key === 'simpleapps_theme' && e.newValue) {
            SimpleAppsTheme.set(e.newValue, false);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeButtons);
    } else {
        initThemeButtons();
    }
})();
