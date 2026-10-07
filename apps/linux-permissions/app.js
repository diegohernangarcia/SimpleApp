/**
 * app.js
 * Controlador y gestor de eventos para la Calculadora de Permisos Linux / Unix.
 * Módulo #04 • SimpleApps Suite
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Instancia del motor de permisos
    const engine = new PermissionsEngine();

    // =========================================================================
    // LISTA DE PRESETS PREDEFINIDOS
    // =========================================================================
    const PRESETS = [
        {
            octal: '755',
            name: 'Directorios Web / Estándar',
            desc: 'Acceso total para el dueño, lectura y navegación pública para grupos y otros.',
            sym: 'drwxr-xr-x',
            category: 'web',
            fileType: 'd'
        },
        {
            octal: '644',
            name: 'Archivos Web (HTML, CSS, PHP)',
            desc: 'Lectura y escritura para el dueño, solo lectura para el resto del mundo.',
            sym: '-rw-r--r--',
            category: 'web',
            fileType: '-'
        },
        {
            octal: '600',
            name: 'Llave Privada SSH & .env',
            desc: 'Lectura y escritura estricta solo para el propietario. Bloqueo total exterior.',
            sym: '-rw-------',
            category: 'ssh',
            fileType: '-'
        },
        {
            octal: '700',
            name: 'Directorio ~/.ssh & Privados',
            desc: 'Permisos exclusivos del usuario para ingresar, crear y listar archivos.',
            sym: 'drwx------',
            category: 'ssh',
            fileType: 'd'
        },
        {
            octal: '644',
            name: 'Llave Pública SSH (id_rsa.pub)',
            desc: 'Clave pública accesible para verificación por parte del sistema.',
            sym: '-rw-r--r--',
            category: 'ssh',
            fileType: '-'
        },
        {
            octal: '750',
            name: 'Script para Operadores',
            desc: 'Ejecutable por el dueño y grupo de operaciones, inaccesible para otros.',
            sym: '-rwxr-x---',
            category: 'scripts',
            fileType: '-'
        },
        {
            octal: '755',
            name: 'Script Ejecutable Público',
            desc: 'Comando o herramienta que cualquier usuario del sistema puede invocar.',
            sym: '-rwxr-xr-x',
            category: 'scripts',
            fileType: '-'
        },
        {
            octal: '444',
            name: 'Solo Lectura Universal',
            desc: 'Archivos inmutables o de configuración congelada para evitar modificaciones.',
            sym: '-r--r--r--',
            category: 'special',
            fileType: '-'
        },
        {
            octal: '1777',
            name: 'Directorio /tmp (Sticky Bit)',
            desc: 'Todos pueden crear archivos, pero solo el dueño o root puede borrarlos.',
            sym: 'drwxrwxrwt',
            category: 'special',
            fileType: 'd'
        },
        {
            octal: '2775',
            name: 'Carpeta Colaborativa (SGID)',
            desc: 'Nuevos archivos heredan el grupo de la carpeta automáticamente.',
            sym: 'drwxrwsr-x',
            category: 'special',
            fileType: 'd'
        },
        {
            octal: '4755',
            name: 'Binario con SUID (ej. passwd)',
            desc: 'Se ejecuta con privilegios del dueño del archivo (habitualmente root).',
            sym: '-rwsr-xr-x',
            category: 'special',
            fileType: '-'
        },
        {
            octal: '777',
            name: 'Control Total (Inseguro)',
            desc: 'Sin ninguna restricción. Solo para pruebas locales y depuración.',
            sym: '-rwxrwxrwx',
            category: 'special',
            fileType: '-'
        }
    ];

    // =========================================================================
    // ELEMENTOS DEL DOM
    // =========================================================================
    const dom = {
        // Notaciones
        inputOctal: document.getElementById('inputOctal'),
        inputSymbolic: document.getElementById('inputSymbolic'),
        fileTypeSelect: document.getElementById('fileTypeSelect'),
        btnCopyOctal: document.getElementById('btnCopyOctal'),
        btnCopySymbolic: document.getElementById('btnCopySymbolic'),
        octalSpecialDigit: document.getElementById('octalSpecialDigit'),
        octalUserDigit: document.getElementById('octalUserDigit'),
        octalGroupDigit: document.getElementById('octalGroupDigit'),
        octalOthersDigit: document.getElementById('octalOthersDigit'),
        binaryDisplay: document.getElementById('binaryDisplay'),

        // Matriz de Checkboxes
        chkUserR: document.getElementById('chk_u_r'),
        chkUserW: document.getElementById('chk_u_w'),
        chkUserX: document.getElementById('chk_u_x'),
        chkGroupR: document.getElementById('chk_g_r'),
        chkGroupW: document.getElementById('chk_g_w'),
        chkGroupX: document.getElementById('chk_g_x'),
        chkOthersR: document.getElementById('chk_o_r'),
        chkOthersW: document.getElementById('chk_o_w'),
        chkOthersX: document.getElementById('chk_o_x'),

        // Special bits
        chkSpSuid: document.getElementById('chk_sp_suid'),
        chkSpSgid: document.getElementById('chk_sp_sgid'),
        chkSpSticky: document.getElementById('chk_sp_sticky'),

        // CLI Generador
        targetPath: document.getElementById('targetPath'),
        flagRecursive: document.getElementById('flagRecursive'),
        flagVerbose: document.getElementById('flagVerbose'),
        flagChanges: document.getElementById('flagChanges'),
        referenceFile: document.getElementById('referenceFile'),
        userOwner: document.getElementById('userOwner'),
        groupOwner: document.getElementById('groupOwner'),

        // Salidas CLI
        cmdChmodOctal: document.getElementById('cmdChmodOctal'),
        cmdChmodOctal4: document.getElementById('cmdChmodOctal4'),
        cmdChmodSymbolic: document.getElementById('cmdChmodSymbolic'),
        cmdFindDirs: document.getElementById('cmdFindDirs'),
        cmdFindFiles: document.getElementById('cmdFindFiles'),
        cmdChown: document.getElementById('cmdChown'),

        // Explicación humana & Seguridad
        auditBanner: document.getElementById('auditBanner'),
        auditIcon: document.getElementById('auditIcon'),
        auditTitle: document.getElementById('auditTitle'),
        auditReason: document.getElementById('auditReason'),
        humanUser: document.getElementById('humanUser'),
        humanGroup: document.getElementById('humanGroup'),
        humanOthers: document.getElementById('humanOthers'),
        humanSpecial: document.getElementById('humanSpecial'),

        // Umask
        inputUmask: document.getElementById('inputUmask'),
        btnApplyUmask: document.getElementById('btnApplyUmask'),
        umaskFileOctal: document.getElementById('umaskFileOctal'),
        umaskFileSym: document.getElementById('umaskFileSym'),
        umaskDirOctal: document.getElementById('umaskDirOctal'),
        umaskDirSym: document.getElementById('umaskDirSym'),

        // Presets
        presetsContainer: document.getElementById('presetsContainer'),
        presetTabs: document.querySelectorAll('.btn-preset-tab'),

        // Toasts
        toastContainer: document.getElementById('toastContainer')
    };

    // =========================================================================
    // SINCRONIZACIÓN Y RENDERIZADO
    // =========================================================================

    /**
     * Actualiza todos los componentes de la interfaz a partir del estado de 'engine'
     */
    function updateUI(skipInput = null) {
        // 1. Notación Octal
        const octal = engine.getOctal();
        if (skipInput !== 'octal' && dom.inputOctal) {
            dom.inputOctal.value = octal;
        }

        // 2. Notación Simbólica
        const symbolic = engine.getSymbolic(true);
        if (skipInput !== 'symbolic' && dom.inputSymbolic) {
            dom.inputSymbolic.value = symbolic;
        }

        if (dom.fileTypeSelect) {
            dom.fileTypeSelect.value = engine.state.fileType;
        }

        // 3. Desglose de dígitos octales
        if (dom.octalSpecialDigit) dom.octalSpecialDigit.textContent = engine.getSpecialOctal();
        if (dom.octalUserDigit) dom.octalUserDigit.textContent = engine.getCategoryOctal('user');
        if (dom.octalGroupDigit) dom.octalGroupDigit.textContent = engine.getCategoryOctal('group');
        if (dom.octalOthersDigit) dom.octalOthersDigit.textContent = engine.getCategoryOctal('others');

        // 4. Desglose binario
        if (dom.binaryDisplay) {
            const binData = engine.getBinaryBreakdown();
            dom.binaryDisplay.textContent = binData.fullBinary;
        }

        // 5. Matriz de Checkboxes
        if (dom.chkUserR) dom.chkUserR.checked = engine.state.user.r;
        if (dom.chkUserW) dom.chkUserW.checked = engine.state.user.w;
        if (dom.chkUserX) dom.chkUserX.checked = engine.state.user.x;

        if (dom.chkGroupR) dom.chkGroupR.checked = engine.state.group.r;
        if (dom.chkGroupW) dom.chkGroupW.checked = engine.state.group.w;
        if (dom.chkGroupX) dom.chkGroupX.checked = engine.state.group.x;

        if (dom.chkOthersR) dom.chkOthersR.checked = engine.state.others.r;
        if (dom.chkOthersW) dom.chkOthersW.checked = engine.state.others.w;
        if (dom.chkOthersX) dom.chkOthersX.checked = engine.state.others.x;

        // 6. Special Bits
        if (dom.chkSpSuid) dom.chkSpSuid.checked = engine.state.special.suid;
        if (dom.chkSpSgid) dom.chkSpSgid.checked = engine.state.special.sgid;
        if (dom.chkSpSticky) dom.chkSpSticky.checked = engine.state.special.sticky;

        // 7. Generador de Comandos CLI
        updateCliCommands();

        // 8. Traductor a Lenguaje Humano
        updateHumanDescription();

        // 9. Auditor de Seguridad
        updateSecurityAudit();
    }

    /**
     * Actualiza los bloques de comandos CLI con los parámetros actuales
     */
    function updateCliCommands() {
        const options = {
            targetPath: dom.targetPath ? dom.targetPath.value : 'archivo.txt',
            isRecursive: dom.flagRecursive ? dom.flagRecursive.checked : false,
            isVerbose: dom.flagVerbose ? dom.flagVerbose.checked : false,
            isChangesOnly: dom.flagChanges ? dom.flagChanges.checked : false,
            referenceFile: dom.referenceFile ? dom.referenceFile.value : '',
            userOwner: dom.userOwner ? dom.userOwner.value : 'usuario',
            groupOwner: dom.groupOwner ? dom.groupOwner.value : 'grupo'
        };

        const cmds = engine.generateCommands(options);

        if (dom.cmdChmodOctal) dom.cmdChmodOctal.textContent = cmds.chmodOctal;
        if (dom.cmdChmodOctal4) dom.cmdChmodOctal4.textContent = cmds.chmodOctal4;
        if (dom.cmdChmodSymbolic) dom.cmdChmodSymbolic.textContent = cmds.chmodSymbolic;
        if (dom.cmdFindDirs) dom.cmdFindDirs.textContent = cmds.findDirectories;
        if (dom.cmdFindFiles) dom.cmdFindFiles.textContent = cmds.findFiles;
        if (dom.cmdChown) dom.cmdChown.textContent = cmds.chownCmd;
    }

    /**
     * Actualiza la explicación en lenguaje natural
     */
    function updateHumanDescription() {
        const desc = engine.getHumanDescription();
        if (dom.humanUser) dom.humanUser.innerHTML = desc.userDesc;
        if (dom.humanGroup) dom.humanGroup.innerHTML = desc.groupDesc;
        if (dom.humanOthers) dom.humanOthers.innerHTML = desc.othersDesc;

        if (dom.humanSpecial) {
            if (desc.specialDescs.length > 0) {
                dom.humanSpecial.style.display = 'block';
                dom.humanSpecial.innerHTML = desc.specialDescs.join('<br>');
            } else {
                dom.humanSpecial.style.display = 'none';
            }
        }
    }

    /**
     * Actualiza el badge y explicación de seguridad
     */
    function updateSecurityAudit() {
        const audit = engine.getSecurityAudit();
        if (!dom.auditBanner) return;

        dom.auditBanner.className = `audit-status-banner ${audit.badgeClass}`;
        if (dom.auditTitle) dom.auditTitle.textContent = audit.title;
        if (dom.auditReason) dom.auditReason.textContent = audit.reason;

        if (dom.auditIcon) {
            let svgIcon = '';
            if (audit.level === 'danger') {
                svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            } else if (audit.level === 'warning') {
                svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
            } else {
                svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
            }
            dom.auditIcon.innerHTML = svgIcon;
        }
    }

    // =========================================================================
    // EVENTOS DE ENTRADA Y SINCRONIZACIÓN
    // =========================================================================

    // 1. Tipeo en el input Octal
    if (dom.inputOctal) {
        dom.inputOctal.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (/^[0-7]{3,4}$/.test(val)) {
                engine.setFromOctal(val);
                updateUI('octal');
            }
        });

        dom.inputOctal.addEventListener('blur', () => {
            // Revertir a válido si el usuario dejó algo inválido
            updateUI();
        });
    }

    // 2. Tipeo en el input Simbólico
    if (dom.inputSymbolic) {
        dom.inputSymbolic.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const res = engine.setFromSymbolic(val);
            if (res.success) {
                updateUI('symbolic');
            }
        });

        dom.inputSymbolic.addEventListener('blur', () => {
            updateUI();
        });
    }

    // 3. Selector de Tipo de Archivo
    if (dom.fileTypeSelect) {
        dom.fileTypeSelect.addEventListener('change', (e) => {
            engine.setFileType(e.target.value);
            updateUI();
        });
    }

    // 4. Eventos en Checkboxes de Matriz (User, Group, Others)
    const matrixCheckboxes = [
        { el: dom.chkUserR, target: 'user', perm: 'r' },
        { el: dom.chkUserW, target: 'user', perm: 'w' },
        { el: dom.chkUserX, target: 'user', perm: 'x' },
        { el: dom.chkGroupR, target: 'group', perm: 'r' },
        { el: dom.chkGroupW, target: 'group', perm: 'w' },
        { el: dom.chkGroupX, target: 'group', perm: 'x' },
        { el: dom.chkOthersR, target: 'others', perm: 'r' },
        { el: dom.chkOthersW, target: 'others', perm: 'w' },
        { el: dom.chkOthersX, target: 'others', perm: 'x' }
    ];

    matrixCheckboxes.forEach(({ el, target, perm }) => {
        if (el) {
            el.addEventListener('change', (e) => {
                engine.setPermission(target, perm, e.target.checked);
                updateUI();
            });
        }
    });

    // 5. Checkboxes de Special Bits
    const specialCheckboxes = [
        { el: dom.chkSpSuid, perm: 'suid' },
        { el: dom.chkSpSgid, perm: 'sgid' },
        { el: dom.chkSpSticky, perm: 'sticky' }
    ];

    specialCheckboxes.forEach(({ el, perm }) => {
        if (el) {
            el.addEventListener('change', (e) => {
                engine.setPermission('special', perm, e.target.checked);
                updateUI();
            });
        }
    });

    // 6. Botones de Acción Rápida por Columna (User, Group, Others)
    document.querySelectorAll('.btn-col-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target; // 'user' | 'group' | 'others'
            const octalVal = parseInt(btn.dataset.val, 10);
            if (target && !isNaN(octalVal)) {
                engine.setCategoryOctal(target, octalVal);
                updateUI();
            }
        });
    });

    // 7. Modificadores de Comandos CLI (Path, flags, owners)
    const cliInputs = [
        dom.targetPath,
        dom.flagRecursive,
        dom.flagVerbose,
        dom.flagChanges,
        dom.referenceFile,
        dom.userOwner,
        dom.groupOwner
    ];

    cliInputs.forEach(el => {
        if (el) {
            el.addEventListener('input', updateCliCommands);
            el.addEventListener('change', updateCliCommands);
        }
    });

    // =========================================================================
    // COPIADO AL PORTAPAPELES
    // =========================================================================

    /**
     * Copia texto al portapapeles y despliega feedback
     */
    function copyText(text, successMsg = 'Copiado al portapapeles', btnEl = null) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg, 'success');
            if (btnEl) {
                btnEl.classList.add('copied');
                setTimeout(() => {
                    btnEl.classList.remove('copied');
                }, 1600);
            }
        }).catch(() => {
            // Fallback execCommand
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast(successMsg, 'success');
            } catch (err) {
                showToast('No se pudo copiar el texto', 'error');
            }
        });
    }

    if (dom.btnCopyOctal) {
        dom.btnCopyOctal.addEventListener('click', () => {
            copyText(engine.getOctal(), `Notación octal (${engine.getOctal()}) copiada.`);
        });
    }

    if (dom.btnCopySymbolic) {
        dom.btnCopySymbolic.addEventListener('click', () => {
            copyText(engine.getSymbolic(true), `Notación simbólica (${engine.getSymbolic(true)}) copiada.`);
        });
    }

    // Botones de copia en bloques CLI
    document.querySelectorAll('.btn-copy-command').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.copyTarget;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                copyText(targetEl.textContent, 'Comando copiado al portapapeles.', btn);
            }
        });
    });

    // =========================================================================
    // CALCULADORA DE UMASK
    // =========================================================================
    function runUmaskCalculation() {
        const val = dom.inputUmask ? dom.inputUmask.value.trim() : '022';
        const res = PermissionsEngine.calculateUmask(val);
        if (res.success) {
            if (dom.umaskFileOctal) dom.umaskFileOctal.textContent = res.file.resultOctal;
            if (dom.umaskFileSym) dom.umaskFileSym.textContent = res.file.resultSymbolic;
            if (dom.umaskDirOctal) dom.umaskDirOctal.textContent = res.directory.resultOctal;
            if (dom.umaskDirSym) dom.umaskDirSym.textContent = res.directory.resultSymbolic;
        }
    }

    if (dom.inputUmask) {
        dom.inputUmask.addEventListener('input', runUmaskCalculation);
    }

    if (dom.btnApplyUmask) {
        dom.btnApplyUmask.addEventListener('click', () => {
            const val = dom.inputUmask ? dom.inputUmask.value.trim() : '022';
            const res = PermissionsEngine.calculateUmask(val);
            if (res.success) {
                engine.setFromOctal(res.directory.resultOctal);
                engine.setFileType('d');
                updateUI();
                showToast(`Umask ${val} aplicado a directorios (${res.directory.resultOctal}).`, 'info');
            }
        });
    }

    // =========================================================================
    // BIBLIOTECA DE PRESETS
    // =========================================================================
    function renderPresets(category = 'all') {
        if (!dom.presetsContainer) return;

        const filtered = category === 'all'
            ? PRESETS
            : PRESETS.filter(p => p.category === category);

        dom.presetsContainer.innerHTML = filtered.map(preset => `
            <div class="preset-chip-card" data-octal="${preset.octal}" data-type="${preset.fileType}">
                <div>
                    <div class="preset-top">
                        <span class="preset-octal-badge">${preset.octal}</span>
                        <span class="preset-category-tag">${preset.category.toUpperCase()}</span>
                    </div>
                    <div class="preset-name">${preset.name}</div>
                    <div class="preset-desc">${preset.desc}</div>
                </div>
                <div>
                    <span class="preset-sym-footer">${preset.sym}</span>
                </div>
            </div>
        `).join('');

        // Eventos de clic en tarjetas de preset
        dom.presetsContainer.querySelectorAll('.preset-chip-card').forEach(card => {
            card.addEventListener('click', () => {
                const octal = card.dataset.octal;
                const fType = card.dataset.type;
                engine.setFromOctal(octal);
                if (fType) engine.setFileType(fType);
                updateUI();
                showToast(`Plantilla "${octal}" cargada con éxito.`, 'info');
            });
        });
    }

    // Pestañas de categorías de presets
    if (dom.presetTabs) {
        dom.presetTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dom.presetTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderPresets(tab.dataset.category);
            });
        });
    }

    // =========================================================================
    // SISTEMA DE NOTIFICACIONES TOAST
    // =========================================================================
    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `
            ${iconSvg}
            <span>${message}</span>
        `;

        dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.25s forwards';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }, 3200);
    }

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================
    // Cargar estado inicial (755 directorio)
    engine.setFromOctal('755');
    engine.setFileType('d');
    updateUI();
    runUmaskCalculation();
    renderPresets('all');

    /* =========================================================================
       MANEJO DEL MODAL DE AYUDA Y GUÍA DE USO
       ========================================================================= */
    const helpModal = document.getElementById('helpModal');
    const btnOpenHelpModal = document.getElementById('btnOpenHelpModal');
    const btnOpenHelpHero = document.getElementById('btnOpenHelpHero');
    const btnCloseHelpModal = document.getElementById('btnCloseHelpModal');
    const btnDismissHelp = document.getElementById('btnDismissHelp');
    const helpTabBtns = document.querySelectorAll('#helpModal .help-tab-btn');
    const helpTabContents = document.querySelectorAll('#helpModal .help-tab-content');

    function openHelpModal() {
        if (!helpModal) return;
        helpModal.classList.add('active', 'open');
        document.body.style.overflow = 'hidden';
    }

    function closeHelpModal() {
        if (!helpModal) return;
        helpModal.classList.remove('active', 'open');
        document.body.style.overflow = '';
    }

    if (btnOpenHelpModal) {
        btnOpenHelpModal.addEventListener('click', (e) => {
            e.preventDefault();
            openHelpModal();
        });
    }

    if (btnOpenHelpHero) {
        btnOpenHelpHero.addEventListener('click', (e) => {
            e.preventDefault();
            openHelpModal();
        });
    }

    if (btnCloseHelpModal) {
        btnCloseHelpModal.addEventListener('click', closeHelpModal);
    }

    if (btnDismissHelp) {
        btnDismissHelp.addEventListener('click', closeHelpModal);
    }

    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelpModal();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal && (helpModal.classList.contains('open') || helpModal.classList.contains('active'))) {
            closeHelpModal();
        }
    });

    helpTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            helpTabBtns.forEach(b => b.classList.remove('active'));
            helpTabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            btn.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }
        });
    });

});
