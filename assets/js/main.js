/**
 * SimpleApps Suite - JavaScript Principal
 * Control de vista, filtros reactivos, búsqueda instantánea, favoritos y modales.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Estado de la aplicación
    const state = {
        apps: [...APPS_DATA],
        filteredApps: [...APPS_DATA],
        activeCategory: 'todas',
        searchQuery: '',
        sortBy: 'default',
        viewMode: localStorage.getItem('simpleapps_view_mode') || 'grid', // 'grid' | 'list'
        favorites: JSON.parse(localStorage.getItem('simpleapps_favorites') || '[]')
    };

    // Referencias al DOM
    const dom = {
        appsContainer: document.getElementById('appsContainer'),
        appsCountBadge: document.getElementById('appsCountBadge'),
        totalKpiCount: document.getElementById('totalKpiCount'),
        categoryPills: document.querySelectorAll('.cat-pill'),
        navLinks: document.querySelectorAll('.nav-link'),
        headerSearchInput: document.getElementById('headerSearchInput'),
        headerSearchClear: document.getElementById('headerSearchClear'),
        sortSelect: document.getElementById('sortSelect'),
        viewGridBtn: document.getElementById('viewGridBtn'),
        viewListBtn: document.getElementById('viewListBtn'),
        activeSearchAlert: document.getElementById('activeSearchAlert'),
        searchQueryText: document.getElementById('searchQueryText'),
        searchMatchCount: document.getElementById('searchMatchCount'),
        btnResetSearch: document.getElementById('btnResetSearch'),
        appModal: document.getElementById('appModal'),
        modalCloseBtn: document.getElementById('modalCloseBtn'),
        modalOverlay: document.getElementById('appModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalSubtitle: document.getElementById('modalSubtitle'),
        modalIconBox: document.getElementById('modalIconBox'),
        modalDescription: document.getElementById('modalDescription'),
        modalSpecsInput: document.getElementById('modalSpecsInput'),
        modalSpecsOutput: document.getElementById('modalSpecsOutput'),
        modalSpecsExecution: document.getElementById('modalSpecsExecution'),
        modalFeatures: document.getElementById('modalFeatures'),
        modalLaunchBtn: document.getElementById('modalLaunchBtn'),
        headerClock: document.getElementById('headerClock'),
        serverStatusPill: document.getElementById('serverStatusPill'),
        toastContainer: document.getElementById('toastContainer')
    };

    // Inicialización del Reloj
    function startClock() {
        const update = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (dom.headerClock) {
                dom.headerClock.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${timeStr}</span>
                `;
            }
        };
        update();
        setInterval(update, 1000);
    }

    // Mostrar Notificación Toast
    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>${message}</span>
        `;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // Actualizar Contadores de Categorías
    function updateCategoryCounts() {
        const counts = {
            todas: state.apps.length,
            excel: state.apps.filter(a => a.category === 'excel').length,
            sysadmin: state.apps.filter(a => a.category === 'sysadmin').length,
            texto: state.apps.filter(a => a.category === 'texto').length,
            datos: state.apps.filter(a => a.category === 'datos').length,
            favoritos: state.favorites.length
        };

        dom.categoryPills.forEach(pill => {
            const cat = pill.getAttribute('data-category');
            const countEl = pill.querySelector('.cat-pill-count');
            if (countEl && counts[cat] !== undefined) {
                countEl.textContent = counts[cat];
            }
        });

        // Contadores en subnav horizontal
        dom.navLinks.forEach(link => {
            const cat = link.getAttribute('data-category');
            const badgeEl = link.querySelector('.nav-badge');
            if (badgeEl && counts[cat] !== undefined) {
                badgeEl.textContent = counts[cat];
            }
        });
    }

    // Alternar Favorito
    function toggleFavorite(appId, event) {
        if (event) event.stopPropagation();
        const index = state.favorites.indexOf(appId);
        const app = state.apps.find(a => a.id === appId);

        if (index === -1) {
            state.favorites.push(appId);
            showToast(`"${app ? app.shortTitle : appId}" agregado a favoritos ★`);
        } else {
            state.favorites.splice(index, 1);
            showToast(`"${app ? app.shortTitle : appId}" removido de favoritos`);
        }

        localStorage.setItem('simpleapps_favorites', JSON.stringify(state.favorites));
        updateCategoryCounts();
        applyFilters();
    }

    // Filtrar y Ordenar
    function applyFilters() {
        let result = [...state.apps];

        // 1. Filtro por categoría
        if (state.activeCategory === 'favoritos') {
            result = result.filter(app => state.favorites.includes(app.id));
        } else if (state.activeCategory !== 'todas') {
            result = result.filter(app => app.category === state.activeCategory);
        }

        // 2. Filtro por búsqueda de texto
        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase().trim();
            result = result.filter(app => 
                app.title.toLowerCase().includes(q) ||
                app.description.toLowerCase().includes(q) ||
                app.categoryName.toLowerCase().includes(q) ||
                app.features.some(f => f.toLowerCase().includes(q))
            );

            // Mostrar barra de alerta de búsqueda
            if (dom.activeSearchAlert) {
                dom.activeSearchAlert.classList.add('visible');
                dom.searchQueryText.textContent = `"${state.searchQuery}"`;
                dom.searchMatchCount.textContent = result.length;
            }
            if (dom.headerSearchClear) {
                dom.headerSearchClear.style.display = 'block';
            }
        } else {
            if (dom.activeSearchAlert) dom.activeSearchAlert.classList.remove('visible');
            if (dom.headerSearchClear) dom.headerSearchClear.style.display = 'none';
        }

        // 3. Ordenamiento
        if (state.sortBy === 'name-asc') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (state.sortBy === 'category') {
            result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
        } else if (state.sortBy === 'favorites-first') {
            result.sort((a, b) => {
                const aFav = state.favorites.includes(a.id) ? 1 : 0;
                const bFav = state.favorites.includes(b.id) ? 1 : 0;
                return bFav - aFav;
            });
        } else {
            // Orden por defecto numérico #01 -> #10
            result.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        }

        state.filteredApps = result;
        renderApps();
    }

    // Renderizado de las Tarjetas
    function renderApps() {
        if (!dom.appsContainer) return;

        dom.appsContainer.className = `apps-container ${state.viewMode === 'list' ? 'list-mode' : ''}`;

        if (state.filteredApps.length === 0) {
            dom.appsContainer.innerHTML = `
                <div class="no-results-box">
                    <div class="no-results-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m9 9 4 4"/><path d="m13 9-4 4"/></svg>
                    </div>
                    <h3 class="no-results-title">No se encontraron micro-apps</h3>
                    <p class="no-results-text">No hay aplicaciones que coincidan con tu criterio de búsqueda o categoría seleccionada.</p>
                    <button class="btn-subnav-ghost" style="margin: 0 auto;" id="btnResetNoResults">Restablecer todos los filtros</button>
                </div>
            `;

            const resetBtn = document.getElementById('btnResetNoResults');
            if (resetBtn) {
                resetBtn.addEventListener('click', resetFilters);
            }
            return;
        }

        dom.appsContainer.innerHTML = state.filteredApps.map(app => {
            const isFav = state.favorites.includes(app.id);
            const featuresHtml = app.features.map(f => `<span class="feature-pill">${f}</span>`).join('');

            return `
                <div class="app-card" 
                     data-id="${app.id}" 
                     style="--icon-color: ${app.color}; --icon-gradient: ${app.gradient}; --btn-gradient: ${app.gradient};">
                    
                    <div class="card-header-flex">
                        <div class="card-icon-wrapper">
                            <div class="card-icon-box">
                                ${app.icon}
                            </div>
                        </div>
                        <div class="card-meta-top">
                            <span class="app-number-badge">#${app.number}</span>
                            <button class="favorite-btn ${isFav ? 'favorited' : ''}" 
                                    data-id="${app.id}" 
                                    title="${isFav ? 'Quitar de favoritos' : 'Marcar como favorito'}">
                                <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="card-body">
                        <span class="card-category-tag">${app.categoryName}</span>
                        <h3 class="card-title">${app.title}</h3>
                        <p class="card-description">${app.description}</p>
                        <div class="card-features-list">
                            ${featuresHtml}
                        </div>
                    </div>

                    <div class="card-footer">
                        <button class="btn-launch-app" data-id="${app.id}">
                            <span>Abrir Herramienta</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                        <button class="btn-quick-view" data-id="${app.id}" title="Ver especificaciones">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                    </div>

                </div>
            `;
        }).join('');

        // Listeners para botones dentro de las tarjetas
        dom.appsContainer.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                toggleFavorite(id, e);
            });
        });

        dom.appsContainer.querySelectorAll('.btn-launch-app').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const app = state.apps.find(a => a.id === id);
                if (app && app.targetUrl) {
                    window.location.href = app.targetUrl;
                } else {
                    openAppModal(id);
                }
            });
        });

        dom.appsContainer.querySelectorAll('.btn-quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                openAppModal(id);
            });
        });
    }

    // Modal de Detalles / Lanzamiento de la App
    function openAppModal(appId) {
        const app = state.apps.find(a => a.id === appId);
        if (!app || !dom.appModal) return;

        dom.modalTitle.textContent = app.title;
        dom.modalSubtitle.textContent = `Módulo #${app.number} • ${app.categoryName} • ${app.tech}`;
        dom.modalIconBox.style.background = app.gradient;
        dom.modalIconBox.innerHTML = app.icon;
        dom.modalDescription.textContent = app.description;

        dom.modalSpecsInput.textContent = app.specs.input;
        dom.modalSpecsOutput.textContent = app.specs.output;
        dom.modalSpecsExecution.textContent = app.specs.execution;

        dom.modalFeatures.innerHTML = app.features.map(f => `
            <span class="feature-pill" style="border-color: rgba(168, 85, 247, 0.3); color: #fff; background: rgba(168, 85, 247, 0.1);">
                ✓ ${f}
            </span>
        `).join('');

        dom.modalLaunchBtn.onclick = () => {
            showToast(`Iniciando entorno para "${app.shortTitle}"...`, 'info');
            // Si la ruta existe o se desarrolla, navega
            setTimeout(() => {
                window.location.href = app.targetUrl;
            }, 600);
        };

        dom.appModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeAppModal() {
        if (!dom.appModal) return;
        dom.appModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Resetear filtros
    function resetFilters() {
        state.searchQuery = '';
        state.activeCategory = 'todas';
        if (dom.headerSearchInput) dom.headerSearchInput.value = '';
        setActiveCategory('todas');
    }

    // Cambiar categoría activa
    function setActiveCategory(catId) {
        state.activeCategory = catId;

        // Actualizar pills
        dom.categoryPills.forEach(p => {
            if (p.getAttribute('data-category') === catId) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        // Actualizar nav links
        dom.navLinks.forEach(n => {
            if (n.getAttribute('data-category') === catId) {
                n.classList.add('active');
            } else {
                n.classList.remove('active');
            }
        });

        applyFilters();
    }

    // Configurar listeners de categorías
    dom.categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const cat = pill.getAttribute('data-category');
            setActiveCategory(cat);
        });
    });

    dom.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-category');
            if (cat) {
                setActiveCategory(cat);
            }
        });
    });

    // Buscador en Tiempo Real
    if (dom.headerSearchInput) {
        dom.headerSearchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            applyFilters();
        });
    }

    if (dom.headerSearchClear) {
        dom.headerSearchClear.addEventListener('click', () => {
            state.searchQuery = '';
            dom.headerSearchInput.value = '';
            dom.headerSearchInput.focus();
            applyFilters();
        });
    }

    if (dom.btnResetSearch) {
        dom.btnResetSearch.addEventListener('click', resetFilters);
    }

    // Selector de Orden
    if (dom.sortSelect) {
        dom.sortSelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            applyFilters();
        });
    }

    // Selector de Vista (Grid vs List)
    function setViewMode(mode) {
        state.viewMode = mode;
        localStorage.setItem('simpleapps_view_mode', mode);

        if (mode === 'list') {
            dom.viewListBtn.classList.add('active');
            dom.viewGridBtn.classList.remove('active');
        } else {
            dom.viewGridBtn.classList.add('active');
            dom.viewListBtn.classList.remove('active');
        }
        renderApps();
    }

    if (dom.viewGridBtn) {
        dom.viewGridBtn.addEventListener('click', () => setViewMode('grid'));
    }
    if (dom.viewListBtn) {
        dom.viewListBtn.addEventListener('click', () => setViewMode('list'));
    }

    // Modal listeners
    if (dom.modalCloseBtn) {
        dom.modalCloseBtn.addEventListener('click', closeAppModal);
    }
    if (dom.modalOverlay) {
        dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === dom.modalOverlay) closeAppModal();
        });
    }

    // Indicador de Servidor Info Modal
    if (dom.serverStatusPill) {
        dom.serverStatusPill.addEventListener('click', () => {
            showToast("Suite de Utilidades Locales • Procesamiento 100% en el cliente", "info");
        });
    }

    // Atajos de Teclado (Ctrl + K o / para buscar, Esc para cerrar modal)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== dom.headerSearchInput)) {
            e.preventDefault();
            if (dom.headerSearchInput) {
                dom.headerSearchInput.focus();
                dom.headerSearchInput.select();
            }
        } else if (e.key === 'Escape') {
            closeAppModal();
        }
    });

    // Iniciar
    startClock();
    setViewMode(state.viewMode);
    updateCategoryCounts();
    applyFilters();
});
