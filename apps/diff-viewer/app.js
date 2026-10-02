/**
 * SimpleApps - Diff Viewer UI Logic v2.0
 * Comparación Carácter a Carácter de Alta Precisión con Visor Spotlight de Contraste.
 */

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        diffEngine: new DiffEngine(),
        currentDiffIndex: 0,
        diffList: [],
        viewMode: 'side-by-side', // 'side-by-side' | 'unified'
        isSyncScrolling: true
    };

    // Referencias DOM
    const dom = {
        textareaA: document.getElementById('textareaA'),
        textareaB: document.getElementById('textareaB'),
        fileInputA: document.getElementById('fileInputA'),
        fileInputB: document.getElementById('fileInputB'),
        fileNameA: document.getElementById('fileNameA'),
        fileNameB: document.getElementById('fileNameB'),
        lineCountA: document.getElementById('lineCountA'),
        lineCountB: document.getElementById('lineCountB'),
        charCountA: document.getElementById('charCountA'),
        charCountB: document.getElementById('charCountB'),
        dropzoneA: document.getElementById('dropzoneA'),
        dropzoneB: document.getElementById('dropzoneB'),

        // Acciones Globales
        btnCompare: document.getElementById('btnCompare'),
        btnSwap: document.getElementById('btnSwap'),
        btnClear: document.getElementById('btnClear'),
        btnSample: document.getElementById('btnSample'),
        btnCopyPatch: document.getElementById('btnCopyPatch'),
        btnSideBySide: document.getElementById('btnSideBySide'),
        btnUnified: document.getElementById('btnUnified'),

        // Opciones
        optWhitespace: document.getElementById('optWhitespace'),
        optCase: document.getElementById('optCase'),
        optTrim: document.getElementById('optTrim'),

        // Ribbon de Estadísticas
        statTotalDiffs: document.getElementById('statTotalDiffs'),
        statModifications: document.getElementById('statModifications'),
        statAdditions: document.getElementById('statAdditions'),
        statDeletions: document.getElementById('statDeletions'),

        // Inspector & Spotlight
        diffInspectorPanel: document.getElementById('diffInspectorPanel'),
        inspectorBadgeCount: document.getElementById('inspectorBadgeCount'),
        inspectorTableBody: document.getElementById('inspectorTableBody'),
        btnPrevDiff: document.getElementById('btnPrevDiff'),
        btnNextDiff: document.getElementById('btnNextDiff'),
        inspectorCurrentIndicator: document.getElementById('inspectorCurrentIndicator'),

        // Elementos Spotlight Carácter a Carácter
        charSpotlightCard: document.getElementById('charSpotlightCard'),
        spotlightTitle: document.getElementById('spotlightTitle'),
        spotlightLocation: document.getElementById('spotlightLocation'),
        btnSpotlightJump: document.getElementById('btnSpotlightJump'),
        spotlightLineNumA: document.getElementById('spotlightLineNumA'),
        spotlightLineNumB: document.getElementById('spotlightLineNumB'),
        spotlightCodeA: document.getElementById('spotlightCodeA'),
        spotlightCodeB: document.getElementById('spotlightCodeB'),
        spotlightDelSnippet: document.getElementById('spotlightDelSnippet'),
        spotlightAddSnippet: document.getElementById('spotlightAddSnippet'),
        spotlightCharCount: document.getElementById('spotlightCharCount'),

        // Visual Panes
        panesWrapper: document.getElementById('panesWrapper'),
        leftPane: document.getElementById('leftPane'),
        rightPane: document.getElementById('rightPane'),
        tableBodyA: document.getElementById('tableBodyA'),
        tableBodyB: document.getElementById('tableBodyB')
    };

    // =========================================================================
    // Manejo de Carga y Drag & Drop de Archivos
    // =========================================================================
    function readFileContent(file, target) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (target === 'A') {
                dom.textareaA.value = content;
                dom.fileNameA.textContent = file.name;
                dom.fileNameA.title = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                updateCounter('A');
            } else {
                dom.textareaB.value = content;
                dom.fileNameB.textContent = file.name;
                dom.fileNameB.title = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                updateCounter('B');
            }
            executeDiff();
        };
        reader.readAsText(file);
    }

    // Input de archivos
    dom.fileInputA.addEventListener('change', (e) => {
        if (e.target.files.length > 0) readFileContent(e.target.files[0], 'A');
    });
    dom.fileInputB.addEventListener('change', (e) => {
        if (e.target.files.length > 0) readFileContent(e.target.files[0], 'B');
    });

    // Configurar zonas Drag & Drop
    function setupDragAndDrop(textareaEl, dropzoneEl, target) {
        const container = textareaEl.closest('.diff-box-card');

        ['dragenter', 'dragover'].forEach(eventName => {
            container.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzoneEl.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzoneEl.classList.remove('dragover');
            }, false);
        });

        container.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files.length > 0) {
                readFileContent(dt.files[0], target);
            }
        });
    }

    setupDragAndDrop(dom.textareaA, dom.dropzoneA, 'A');
    setupDragAndDrop(dom.textareaB, dom.dropzoneB, 'B');

    // Botones de pegar del portapapeles
    document.querySelectorAll('.btn-paste-clipboard').forEach(btn => {
        btn.addEventListener('click', async () => {
            const target = btn.getAttribute('data-target');
            try {
                const text = await navigator.clipboard.readText();
                if (target === 'A') {
                    dom.textareaA.value = text;
                    dom.fileNameA.textContent = 'Portapapeles';
                    updateCounter('A');
                } else {
                    dom.textareaB.value = text;
                    dom.fileNameB.textContent = 'Portapapeles';
                    updateCounter('B');
                }
                executeDiff();
            } catch (err) {
                alert('No se pudo acceder al portapapeles directamente. Usa Ctrl+V en el área de texto.');
            }
        });
    });

    // Botones de limpiar caja individual
    document.querySelectorAll('.btn-clear-box').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target === 'A') {
                dom.textareaA.value = '';
                dom.fileNameA.textContent = 'Sin archivo';
                dom.fileInputA.value = '';
                updateCounter('A');
            } else {
                dom.textareaB.value = '';
                dom.fileNameB.textContent = 'Sin archivo';
                dom.fileInputB.value = '';
                updateCounter('B');
            }
            executeDiff();
        });
    });

    // =========================================================================
    // Actualización de Métricas de Texto
    // =========================================================================
    function updateCounter(target) {
        if (target === 'A') {
            const text = dom.textareaA.value;
            const lines = text ? text.split(/\r?\n/).length : 0;
            dom.lineCountA.textContent = `${lines} líneas`;
            dom.charCountA.textContent = `${text.length} caracteres`;
        } else {
            const text = dom.textareaB.value;
            const lines = text ? text.split(/\r?\n/).length : 0;
            dom.lineCountB.textContent = `${lines} líneas`;
            dom.charCountB.textContent = `${text.length} caracteres`;
        }
    }

    dom.textareaA.addEventListener('input', () => {
        updateCounter('A');
        debounceDiff();
    });
    dom.textareaB.addEventListener('input', () => {
        updateCounter('B');
        debounceDiff();
    });

    let debounceTimer;
    function debounceDiff() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(executeDiff, 350);
    }

    // =========================================================================
    // Ejecución de la Comparación Carácter a Carácter
    // =========================================================================
    function executeDiff() {
        const textA = dom.textareaA.value;
        const textB = dom.textareaB.value;

        // Actualizar opciones del motor
        state.diffEngine.options.ignoreWhitespace = dom.optWhitespace.checked;
        state.diffEngine.options.ignoreCase = dom.optCase.checked;
        state.diffEngine.options.trimLines = dom.optTrim.checked;

        const result = state.diffEngine.compare(textA, textB);
        state.diffList = result.diffList;
        state.currentDiffIndex = 0;

        renderStats(result.stats, result.diffList.length);
        renderInspector(result.diffList);
        renderVisualPanes(result.rows);

        // Mostrar Spotlight en la primera diferencia si existe
        if (result.diffList.length > 0) {
            renderSpotlight(result.diffList[0], 0);
        } else {
            dom.charSpotlightCard.style.display = 'none';
        }
    }

    function renderStats(stats, totalDiffs) {
        dom.statTotalDiffs.textContent = totalDiffs;
        dom.statModifications.textContent = stats.modifications;
        dom.statAdditions.textContent = stats.additions;
        dom.statDeletions.textContent = stats.deletions;
    }

    // =========================================================================
    // Renderizado del Visor Spotlight (Enfoque Carácter a Carácter con Contraste)
    // =========================================================================
    function renderSpotlight(diff, index) {
        if (!diff || !dom.charSpotlightCard) {
            if (dom.charSpotlightCard) dom.charSpotlightCard.style.display = 'none';
            return;
        }

        dom.charSpotlightCard.style.display = 'block';

        // Título y Contador
        dom.spotlightTitle.textContent = `Diferencia #${diff.id} • ${diff.typeLabel}`;
        
        let locText = '';
        if (diff.type === 'modify') {
            locText = `Línea ${diff.lineA} [Cols ${diff.colStartA} - ${diff.colEndA}] ➔ Línea ${diff.lineB} [Cols ${diff.colStartB} - ${diff.colEndB}]`;
        } else if (diff.type === 'delete') {
            locText = `Línea ${diff.lineA} [Cols ${diff.colStartA} - ${diff.colEndA}] (Eliminado)`;
        } else if (diff.type === 'insert') {
            locText = `Línea ${diff.lineB} [Cols ${diff.colStartB} - ${diff.colEndB}] (Añadido)`;
        }
        dom.spotlightLocation.textContent = locText;

        // Renderizado Línea Original A
        if (diff.fullLineA !== undefined && diff.fullLineA !== '') {
            const line = diff.fullLineA;
            if (diff.colStartA && diff.colEndA) {
                const s = diff.colStartA - 1;
                const e = diff.colEndA;
                const before = line.slice(0, s);
                const mark = line.slice(s, e);
                const after = line.slice(e);

                dom.spotlightCodeA.innerHTML = escapeHtml(before) + 
                    `<mark class="spotlight-mark-del" title="Col ${diff.colStartA} a ${diff.colEndA}">${escapeHtml(mark || ' ')}</mark>` + 
                    escapeHtml(after);
            } else {
                dom.spotlightCodeA.innerHTML = `<mark class="spotlight-mark-del">${escapeHtml(line)}</mark>`;
            }
            dom.spotlightLineNumA.textContent = `Línea ${diff.lineA}`;
        } else {
            dom.spotlightCodeA.innerHTML = `<span style="color:#64748B;font-style:italic;">(Inexistente en el archivo original)</span>`;
            dom.spotlightLineNumA.textContent = '---';
        }

        // Renderizado Línea Modificada B
        if (diff.fullLineB !== undefined && diff.fullLineB !== '') {
            const line = diff.fullLineB;
            if (diff.colStartB && diff.colEndB) {
                const s = diff.colStartB - 1;
                const e = diff.colEndB;
                const before = line.slice(0, s);
                const mark = line.slice(s, e);
                const after = line.slice(e);

                dom.spotlightCodeB.innerHTML = escapeHtml(before) + 
                    `<mark class="spotlight-mark-add" title="Col ${diff.colStartB} a ${diff.colEndB}">${escapeHtml(mark || ' ')}</mark>` + 
                    escapeHtml(after);
            } else {
                dom.spotlightCodeB.innerHTML = `<mark class="spotlight-mark-add">${escapeHtml(line)}</mark>`;
            }
            dom.spotlightLineNumB.textContent = `Línea ${diff.lineB}`;
        } else {
            dom.spotlightCodeB.innerHTML = `<span style="color:#64748B;font-style:italic;">(Eliminada en el archivo modificado)</span>`;
            dom.spotlightLineNumB.textContent = '---';
        }

        // Snippets y Conteo de caracteres
        dom.spotlightDelSnippet.textContent = diff.textA ? `"${diff.textA}"` : '(vacío)';
        dom.spotlightAddSnippet.textContent = diff.textB ? `"${diff.textB}"` : '(vacío)';

        if (diff.type === 'modify') {
            dom.spotlightCharCount.textContent = `${diff.textA.length} caracteres cambiados por ${diff.textB.length} caracteres`;
        } else if (diff.type === 'delete') {
            dom.spotlightCharCount.textContent = `${diff.textA.length} caracteres eliminados`;
        } else if (diff.type === 'insert') {
            dom.spotlightCharCount.textContent = `${diff.textB.length} caracteres añadidos`;
        }

        dom.btnSpotlightJump.onclick = () => jumpToDiff(index);
    }

    // =========================================================================
    // Renderizado del Inspector de Diferencias (Tabla con Columna y Caracteres)
    // =========================================================================
    function renderInspector(diffList) {
        dom.inspectorBadgeCount.textContent = `${diffList.length} detectadas`;

        if (diffList.length === 0) {
            dom.inspectorTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2.5rem; color: #64748B;">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🎉</div>
                        <strong>No se detectaron diferencias entre ambos textos.</strong><br>
                        <span style="font-size: 0.8rem;">Ambos contenidos son 100% idénticos caracter a caracter.</span>
                    </td>
                </tr>
            `;
            dom.btnPrevDiff.disabled = true;
            dom.btnNextDiff.disabled = true;
            dom.inspectorCurrentIndicator.textContent = '0 / 0';
            return;
        }

        dom.btnPrevDiff.disabled = false;
        dom.btnNextDiff.disabled = false;
        dom.inspectorCurrentIndicator.textContent = `1 / ${diffList.length}`;

        dom.inspectorTableBody.innerHTML = diffList.map((diff, idx) => {
            let positionHtml = '';
            let snippetHtml = '';

            if (diff.type === 'modify') {
                positionHtml = `
                    <span class="position-tag">
                        Línea ${diff.lineA} [Col ${diff.colStartA} - ${diff.colEndA}]
                        <span style="color: var(--accent-violet-light); margin: 0 3px;">➔</span>
                        Línea ${diff.lineB} [Col ${diff.colStartB} - ${diff.colEndB}]
                    </span>
                `;
                snippetHtml = `
                    <span class="snippet-preview">
                        <span class="char-del-badge">${escapeHtml(diff.textA)}</span>
                        <span style="color: var(--text-muted); margin: 0 4px;">➔</span>
                        <span class="char-add-badge">${escapeHtml(diff.textB)}</span>
                    </span>
                `;
            } else if (diff.type === 'delete') {
                positionHtml = `
                    <span class="position-tag" style="border-color: rgba(239, 68, 68, 0.4);">
                        Línea ${diff.lineA} [Col ${diff.colStartA} - ${diff.colEndA}]
                    </span>
                `;
                snippetHtml = `
                    <span class="snippet-preview">
                        <span class="char-del-badge">${escapeHtml(diff.textA)}</span>
                        <span style="color: #F87171; font-size: 0.75rem; margin-left: 5px;">(borrado)</span>
                    </span>
                `;
            } else if (diff.type === 'insert') {
                positionHtml = `
                    <span class="position-tag" style="border-color: rgba(16, 185, 129, 0.4);">
                        Línea ${diff.lineB} [Col ${diff.colStartB} - ${diff.colEndB}]
                    </span>
                `;
                snippetHtml = `
                    <span class="snippet-preview">
                        <span class="char-add-badge">${escapeHtml(diff.textB)}</span>
                        <span style="color: #34D399; font-size: 0.75rem; margin-left: 5px;">(insertado)</span>
                    </span>
                `;
            }

            return `
                <tr class="diff-row-item ${idx === 0 ? 'active-item' : ''}" data-index="${idx}">
                    <td style="font-family: var(--font-mono); font-weight: 700; color: #fff;">#${diff.id}</td>
                    <td>
                        <span class="badge-diff-type ${diff.type}">${diff.typeLabel}</span>
                    </td>
                    <td>${positionHtml}</td>
                    <td>${snippetHtml}</td>
                    <td style="text-align: right;">
                        <button class="btn-mini-action" onclick="window.jumpToDiffIndex(${idx})">
                            <span>Examinar</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Clic en fila del inspector
        dom.inspectorTableBody.querySelectorAll('.diff-row-item').forEach(row => {
            row.addEventListener('click', () => {
                const idx = parseInt(row.getAttribute('data-index'));
                jumpToDiff(idx);
            });
        });
    }

    // =========================================================================
    // Renderizado del Visualizador Gráfico con Resaltado Carácter a Carácter
    // =========================================================================
    function renderVisualPanes(rows) {
        let htmlA = '';
        let htmlB = '';

        rows.forEach((row, rowIdx) => {
            const rowClass = row.type === 'equal' ? '' :
                             row.type === 'delete' ? 'row-delete' :
                             row.type === 'insert' ? 'row-insert' :
                             row.type === 'modify' ? 'row-modify' : '';

            const rowId = `diff-row-${rowIdx}`;

            // --- Panel A (Original) ---
            if (row.type === 'insert') {
                htmlA += `
                    <tr class="code-diff-row row-empty" id="${rowId}-A">
                        <td class="line-num-cell"></td>
                        <td class="line-marker-cell"></td>
                        <td class="line-content-cell">&nbsp;</td>
                    </tr>
                `;
            } else {
                let contentRenderA = '';
                if (row.partsA && row.partsA.length > 0) {
                    contentRenderA = row.partsA.map(p => {
                        if (p.isDiff) {
                            return `<mark class="char-diff-del" data-col="${p.colStart || 1}" title="Línea ${row.lineNumA} [Col ${p.colStart || 1}-${p.colEnd || ''}]">${escapeHtml(p.text)}</mark>`;
                        }
                        return escapeHtml(p.text);
                    }).join('');
                } else {
                    contentRenderA = escapeHtml(row.contentA);
                }

                const marker = row.type === 'delete' ? '-' : row.type === 'modify' ? '~' : '';
                htmlA += `
                    <tr class="code-diff-row ${rowClass}" id="${rowId}-A" data-line="${row.lineNumA}">
                        <td class="line-num-cell">${row.lineNumA}</td>
                        <td class="line-marker-cell">${marker}</td>
                        <td class="line-content-cell">${contentRenderA || '&nbsp;'}</td>
                    </tr>
                `;
            }

            // --- Panel B (Modificado) ---
            if (row.type === 'delete') {
                htmlB += `
                    <tr class="code-diff-row row-empty" id="${rowId}-B">
                        <td class="line-num-cell"></td>
                        <td class="line-marker-cell"></td>
                        <td class="line-content-cell">&nbsp;</td>
                    </tr>
                `;
            } else {
                let contentRenderB = '';
                if (row.partsB && row.partsB.length > 0) {
                    contentRenderB = row.partsB.map(p => {
                        if (p.isDiff) {
                            return `<mark class="char-diff-add" data-col="${p.colStart || 1}" title="Línea ${row.lineNumB} [Col ${p.colStart || 1}-${p.colEnd || ''}]">${escapeHtml(p.text)}</mark>`;
                        }
                        return escapeHtml(p.text);
                    }).join('');
                } else {
                    contentRenderB = escapeHtml(row.contentB);
                }

                const marker = row.type === 'insert' ? '+' : row.type === 'modify' ? '~' : '';
                htmlB += `
                    <tr class="code-diff-row ${rowClass}" id="${rowId}-B" data-line="${row.lineNumB}">
                        <td class="line-num-cell">${row.lineNumB}</td>
                        <td class="line-marker-cell">${marker}</td>
                        <td class="line-content-cell">${contentRenderB || '&nbsp;'}</td>
                    </tr>
                `;
            }
        });

        dom.tableBodyA.innerHTML = htmlA || '<tr><td colspan="3" style="padding:1rem;color:#64748B;">Sin contenido</td></tr>';
        dom.tableBodyB.innerHTML = htmlB || '<tr><td colspan="3" style="padding:1rem;color:#64748B;">Sin contenido</td></tr>';
    }

    // =========================================================================
    // Salto a Diferencia y Resaltado Visual Sincronizado
    // =========================================================================
    function jumpToDiff(index) {
        if (!state.diffList || state.diffList.length === 0) return;
        if (index < 0) index = 0;
        if (index >= state.diffList.length) index = state.diffList.length - 1;

        state.currentDiffIndex = index;
        const diff = state.diffList[index];

        dom.inspectorCurrentIndicator.textContent = `${index + 1} / ${state.diffList.length}`;

        // Actualizar Visor Spotlight
        renderSpotlight(diff, index);

        // Resaltar fila activa en la tabla
        dom.inspectorTableBody.querySelectorAll('.diff-row-item').forEach((row, i) => {
            if (i === index) {
                row.classList.add('active-item');
                row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                row.classList.remove('active-item');
            }
        });

        // Limpiar resaltados previos en los códigos
        document.querySelectorAll('.active-char').forEach(el => el.classList.remove('active-char'));

        // Localizar fila en paneles de código
        let targetRowEl = null;

        if (diff.lineA) {
            targetRowEl = dom.leftPane.querySelector(`.code-diff-row[data-line="${diff.lineA}"]`);
        }
        if (!targetRowEl && diff.lineB) {
            targetRowEl = dom.rightPane.querySelector(`.code-diff-row[data-line="${diff.lineB}"]`);
        }

        if (targetRowEl) {
            const topPos = targetRowEl.offsetTop - 90;
            dom.leftPane.scrollTo({ top: topPos, behavior: 'smooth' });
            dom.rightPane.scrollTo({ top: topPos, behavior: 'smooth' });

            // Flash de la fila
            targetRowEl.classList.remove('flash-highlight');
            void targetRowEl.offsetWidth;
            targetRowEl.classList.add('flash-highlight');

            // Resaltar los caracteres específicos de esta diferencia
            if (diff.lineA) {
                const rowA = dom.leftPane.querySelector(`.code-diff-row[data-line="${diff.lineA}"]`);
                if (rowA) {
                    rowA.querySelectorAll('.char-diff-del').forEach(mark => {
                        const col = parseInt(mark.getAttribute('data-col'));
                        if (!diff.colStartA || Math.abs(col - diff.colStartA) < 3) {
                            mark.classList.add('active-char');
                        }
                    });
                }
            }
            if (diff.lineB) {
                const rowB = dom.rightPane.querySelector(`.code-diff-row[data-line="${diff.lineB}"]`);
                if (rowB) {
                    rowB.querySelectorAll('.char-diff-add').forEach(mark => {
                        const col = parseInt(mark.getAttribute('data-col'));
                        if (!diff.colStartB || Math.abs(col - diff.colStartB) < 3) {
                            mark.classList.add('active-char');
                        }
                    });
                }
            }
        }
    }

    window.jumpToDiffIndex = jumpToDiff;

    dom.btnPrevDiff.addEventListener('click', () => {
        if (state.currentDiffIndex > 0) {
            jumpToDiff(state.currentDiffIndex - 1);
        }
    });

    dom.btnNextDiff.addEventListener('click', () => {
        if (state.currentDiffIndex < state.diffList.length - 1) {
            jumpToDiff(state.currentDiffIndex + 1);
        }
    });

    // =========================================================================
    // Scroll Sincronizado entre Paneles
    // =========================================================================
    let isSyncingLeft = false;
    let isSyncingRight = false;

    dom.leftPane.addEventListener('scroll', () => {
        if (!state.isSyncScrolling || isSyncingLeft) return;
        isSyncingRight = true;
        dom.rightPane.scrollTop = dom.leftPane.scrollTop;
        dom.rightPane.scrollLeft = dom.leftPane.scrollLeft;
        setTimeout(() => isSyncingRight = false, 50);
    });

    dom.rightPane.addEventListener('scroll', () => {
        if (!state.isSyncScrolling || isSyncingRight) return;
        isSyncingLeft = true;
        dom.leftPane.scrollTop = dom.rightPane.scrollTop;
        dom.leftPane.scrollLeft = dom.rightPane.scrollLeft;
        setTimeout(() => isSyncingLeft = false, 50);
    });

    // =========================================================================
    // Modos de Vista (Side-by-Side vs Unificado)
    // =========================================================================
    dom.btnSideBySide.addEventListener('click', () => {
        dom.btnSideBySide.classList.add('btn-diff-primary');
        dom.btnUnified.classList.remove('btn-diff-primary');
        dom.panesWrapper.classList.remove('unified-mode');
        state.viewMode = 'side-by-side';
    });

    dom.btnUnified.addEventListener('click', () => {
        dom.btnUnified.classList.add('btn-diff-primary');
        dom.btnSideBySide.classList.remove('btn-diff-primary');
        dom.panesWrapper.classList.add('unified-mode');
        state.viewMode = 'unified';
    });

    // =========================================================================
    // Botones de Acción Global
    // =========================================================================
    dom.btnCompare.addEventListener('click', executeDiff);

    // Intercambiar A y B
    dom.btnSwap.addEventListener('click', () => {
        const tempText = dom.textareaA.value;
        dom.textareaA.value = dom.textareaB.value;
        dom.textareaB.value = tempText;

        const tempFile = dom.fileNameA.textContent;
        dom.fileNameA.textContent = dom.fileNameB.textContent;
        dom.fileNameB.textContent = tempFile;

        updateCounter('A');
        updateCounter('B');
        executeDiff();
    });

    // Limpiar Ambos
    dom.btnClear.addEventListener('click', () => {
        if (confirm('¿Deseas limpiar el contenido de ambas cajas de texto?')) {
            dom.textareaA.value = '';
            dom.textareaB.value = '';
            dom.fileNameA.textContent = 'Sin archivo';
            dom.fileNameB.textContent = 'Sin archivo';
            dom.fileInputA.value = '';
            dom.fileInputB.value = '';
            updateCounter('A');
            updateCounter('B');
            executeDiff();
        }
    });

    // Cargar Ejemplo Práctico con múltiples cambios precisos de caracteres
    dom.btnSample.addEventListener('click', () => {
        dom.textareaA.value = `// Configuración de Producción v1.0
const appConfig = {
    appName: "SimpleApp Suite",
    serverPort: 8080,
    dbHost: "127.0.0.1",
    dbUser: "root_developer",
    maxConnections: 50,
    debugMode: false,
    allowedOrigins: ["https://example.com"],
    cacheTtl: 3600
};

function startService() {
    console.log("Iniciando servicio en puerto " + appConfig.serverPort);
    connectDatabase(appConfig.dbHost);
}

startService();`;

        dom.textareaB.value = `// Configuración de Producción v2.0 (Actualizada)
const appConfig = {
    appName: "SimpleApps Suite",
    serverPort: 8090,
    dbHost: "localhost",
    dbUser: "admin_superuser",
    maxConnections: 100,
    debugMode: true,
    allowedOrigins: ["https://example.com", "https://app.example.com"],
    timeoutMs: 5000,
    cacheTtl: 7200
};

function startService() {
    console.log("Iniciando servicio en puerto " + appConfig.serverPort);
    connectDatabase(appConfig.dbHost);
    setupMonitoring();
}

startService();`;

        dom.fileNameA.textContent = 'config.v1.js';
        dom.fileNameB.textContent = 'config.v2.js';
        updateCounter('A');
        updateCounter('B');
        executeDiff();
    });

    // Copiar Reporte / Parche
    dom.btnCopyPatch.addEventListener('click', () => {
        if (!state.diffList || state.diffList.length === 0) {
            alert('No hay diferencias para copiar.');
            return;
        }

        let report = `=== REPORTE DETALLADO CARÁCTER A CARÁCTER (SimpleApps Diff Viewer) ===\n`;
        report += `Archivo A: ${dom.fileNameA.textContent}\n`;
        report += `Archivo B: ${dom.fileNameB.textContent}\n`;
        report += `Total Diferencias: ${state.diffList.length}\n`;
        report += `Fecha: ${new Date().toLocaleString()}\n`;
        report += `---------------------------------------------------------------------\n\n`;

        state.diffList.forEach(d => {
            report += `#${d.id} [${d.typeLabel.toUpperCase()}] ${d.description}\n`;
            if (d.textA) report += `  - [ORIGINAL ]: "${d.textA}"\n`;
            if (d.textB) report += `  + [MODIFICADO]: "${d.textB}"\n`;
            report += `\n`;
        });

        navigator.clipboard.writeText(report).then(() => {
            alert('¡Reporte detallado carácter a carácter copiado al portapapeles!');
        }).catch(() => {
            alert('No se pudo copiar automáticamente al portapapeles.');
        });
    });

    // Checkboxes de opciones
    dom.optWhitespace.addEventListener('change', executeDiff);
    dom.optCase.addEventListener('change', executeDiff);
    dom.optTrim.addEventListener('change', executeDiff);

    // Escape HTML Helper
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Iniciar con ejemplo
    dom.btnSample.click();
});
