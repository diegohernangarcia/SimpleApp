/**
 * SimpleApps Suite - De CSV a Excel (.xlsx)
 * app.js - Controlador de Interfaz, Modos de Conversión, Vista Previa y Descargas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const dom = {
        // Dropzone y Selección de Archivos
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('fileInput'),
        btnSelectFiles: document.getElementById('btnSelectFiles'),
        btnLoadSamples: document.getElementById('btnLoadSamples'),

        // Configuración y Modos
        modeCards: document.querySelectorAll('.mode-selection-card'),
        consolidatedOptionsBox: document.getElementById('consolidatedOptionsBox'),
        consolidatedFilenameInput: document.getElementById('consolidatedFilenameInput'),
        optDelimiter: document.getElementById('optDelimiter'),
        optEncoding: document.getElementById('optEncoding'),
        optInferTypes: document.getElementById('optInferTypes'),
        optPreserveZeros: document.getElementById('optPreserveZeros'),

        // Lista de Archivos Cargados
        filesSection: document.getElementById('filesSection'),
        filesListContainer: document.getElementById('filesListContainer'),
        totalFilesCountBadge: document.getElementById('totalFilesCountBadge'),
        btnAddMoreFiles: document.getElementById('btnAddMoreFiles'),
        btnClearAllFiles: document.getElementById('btnClearAllFiles'),

        // Acciones Globales
        btnExecuteBatch: document.getElementById('btnExecuteBatch'),
        btnExecuteConsolidated: document.getElementById('btnExecuteConsolidated'),
        btnDownloadZip: document.getElementById('btnDownloadZip'),
        actionButtonsWrap: document.getElementById('actionButtonsWrap'),

        // Modal de Vista Previa de Tabla
        previewModal: document.getElementById('previewModal'),
        modalCloseBtn: document.getElementById('modalCloseBtn'),
        modalSheetTitle: document.getElementById('modalSheetTitle'),
        modalTableStats: document.getElementById('modalTableStats'),
        modalTableHead: document.getElementById('modalTableHead'),
        modalTableBody: document.getElementById('modalTableBody'),

        // Toast Container
        toastContainer: document.getElementById('toastContainer')
    };

    // Estado de la aplicación
    const state = {
        // Lista de objetos: { id, file, name, size, text, delimiter, encoding, data, sheetName, outputName, rowsCount, colsCount }
        files: [],
        conversionMode: 'consolidated', // 'consolidated' (1 libro multi-hojas) | 'individual' (archivos separados)
        previewingFileId: null
    };

    /* =========================================================================
       1. MANEJO DE DRAG & DROP Y SELECCIÓN MÚLTIPLE
       ========================================================================= */
    dom.btnSelectFiles.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.fileInput.click();
    });

    if (dom.btnAddMoreFiles) {
        dom.btnAddMoreFiles.addEventListener('click', () => {
            dom.fileInput.click();
        });
    }

    dom.dropzone.addEventListener('click', () => {
        dom.fileInput.click();
    });

    dom.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropzone.classList.add('drag-over');
    });

    dom.dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('drag-over');
    });

    dom.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleIncomingFiles(Array.from(e.dataTransfer.files));
        }
    });

    dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleIncomingFiles(Array.from(e.target.files));
        }
        dom.fileInput.value = ''; // Resetear para permitir re-seleccionar
    });

    /* =========================================================================
       2. PROCESAMIENTO E INCORPORACIÓN DE ARCHIVOS CSV
       ========================================================================= */
    async function handleIncomingFiles(fileList) {
        const validExtensions = ['csv', 'tsv', 'txt'];
        const acceptedFiles = fileList.filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            return validExtensions.includes(ext);
        });

        if (acceptedFiles.length === 0) {
            showToast("Por favor selecciona archivos válidos (.csv, .tsv o .txt).", "error");
            return;
        }

        const encodingPref = dom.optEncoding ? dom.optEncoding.value : 'auto';
        const delimiterPref = dom.optDelimiter ? dom.optDelimiter.value : 'auto';
        const inferTypes = dom.optInferTypes ? dom.optInferTypes.checked : true;
        const preserveZeros = dom.optPreserveZeros ? dom.optPreserveZeros.checked : true;

        for (const file of acceptedFiles) {
            try {
                // Decodificar archivo
                const encodingToUse = (encodingPref === 'auto') ? 'UTF-8' : encodingPref;
                const text = await window.csvToExcelConverter.readFileAsText(file, encodingToUse);

                // Detectar o asignar delimitador
                const delimToUse = (delimiterPref === 'auto') 
                    ? window.csvToExcelConverter.detectDelimiter(text) 
                    : (delimiterPref === '\\t' ? '\t' : delimiterPref);

                // Parsear matriz
                const matrix = window.csvToExcelConverter.parseCsvToMatrix(text, delimToUse, {
                    inferTypes,
                    preserveLeadingZeros: preserveZeros
                });

                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const sheetName = window.csvToExcelConverter.sanitizeSheetName(
                    baseName,
                    state.files.map(f => f.sheetName.toLowerCase())
                );

                const fileItem = {
                    id: 'csv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    file: file,
                    name: file.name,
                    size: file.size,
                    text: text,
                    delimiter: delimToUse,
                    encoding: encodingToUse,
                    data: matrix,
                    sheetName: sheetName,
                    outputName: baseName,
                    rowsCount: matrix.length,
                    colsCount: matrix.length > 0 ? Math.max(...matrix.map(r => r.length)) : 0
                };

                state.files.push(fileItem);
            } catch (err) {
                console.error(`Error procesando ${file.name}:`, err);
                showToast(`No se pudo leer "${file.name}": ${err.message}`, "error");
            }
        }

        updateUI();
        showToast(`${acceptedFiles.length} archivo(s) CSV incorporados con éxito.`, "success");
    }

    /* =========================================================================
       3. GESTIÓN DEL MODO DE CONVERSIÓN
       ========================================================================= */
    dom.modeCards.forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode');
            setConversionMode(mode);
        });
    });

    function setConversionMode(mode) {
        state.conversionMode = mode;
        dom.modeCards.forEach(card => {
            if (card.getAttribute('data-mode') === mode) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        if (mode === 'consolidated') {
            dom.consolidatedOptionsBox.style.display = 'block';
            dom.btnExecuteConsolidated.style.display = 'inline-flex';
            dom.btnDownloadZip.style.display = 'none';
        } else {
            dom.consolidatedOptionsBox.style.display = 'none';
            dom.btnExecuteConsolidated.style.display = 'none';
            dom.btnDownloadZip.style.display = 'inline-flex';
        }
    }

    /* =========================================================================
       4. ACTUALIZACIÓN VISUAL DE LA LISTA DE ARCHIVOS
       ========================================================================= */
    function updateUI() {
        const count = state.files.length;
        if (dom.totalFilesCountBadge) dom.totalFilesCountBadge.textContent = `${count} CSV${count === 1 ? '' : 's'}`;

        if (count === 0) {
            dom.filesSection.style.display = 'none';
            dom.actionButtonsWrap.style.display = 'none';
            dom.dropzone.classList.remove('has-files');
            return;
        }

        dom.filesSection.style.display = 'block';
        dom.actionButtonsWrap.style.display = 'flex';
        dom.dropzone.classList.add('has-files');

        renderFilesList();
    }

    function renderFilesList() {
        dom.filesListContainer.innerHTML = state.files.map((item, index) => {
            const delimLabel = getDelimiterName(item.delimiter);
            const isConsolidated = state.conversionMode === 'consolidated';

            return `
                <div class="csv-file-card" data-id="${item.id}">
                    <div class="csv-card-left">
                        <span class="csv-order-badge">#${index + 1}</span>
                        <div class="csv-icon-box">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="8" y1="13" x2="16" y2="13"/>
                                <line x1="8" y1="17" x2="16" y2="17"/>
                            </svg>
                        </div>
                        <div class="csv-main-info">
                            <div class="csv-title-row">
                                <strong class="csv-filename" title="${item.name}">${item.name}</strong>
                                <span class="csv-size-tag">${formatFileSize(item.size)}</span>
                            </div>
                            <div class="csv-meta-row">
                                <span class="csv-meta-pill delim" title="Delimitador detectado">
                                    Sep: <strong>${delimLabel}</strong>
                                </span>
                                <span class="csv-meta-pill rows">
                                    <strong>${item.rowsCount.toLocaleString()}</strong> filas
                                </span>
                                <span class="csv-meta-pill cols">
                                    <strong>${item.colsCount}</strong> columnas
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="csv-card-center">
                        <label class="sheet-name-label" title="Nombre que tendrá la hoja en Excel">
                            <span>${isConsolidated ? 'Nombre de la Hoja:' : 'Nombre archivo Excel:'}</span>
                            <div class="sheet-name-input-wrap">
                                <input type="text" 
                                       class="sheet-name-input" 
                                       data-id="${item.id}"
                                       value="${isConsolidated ? item.sheetName : item.outputName}" 
                                       maxlength="${isConsolidated ? 31 : 80}"
                                       placeholder="${isConsolidated ? 'Nombre hoja (máx 31)' : 'Nombre archivo'}">
                                ${isConsolidated ? '<span class="char-count">máx 31</span>' : ''}
                            </div>
                        </label>
                    </div>

                    <div class="csv-card-actions">
                        <button type="button" class="btn-card-action btn-preview-table" data-id="${item.id}" title="Ver vista previa de datos">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span>Previa</span>
                        </button>
                        <button type="button" class="btn-card-action btn-single-download" data-id="${item.id}" title="Convertir y descargar solo este Excel">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span>.xlsx</span>
                        </button>
                        <button type="button" class="btn-card-action btn-remove-item" data-id="${item.id}" title="Eliminar de la lista">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Listeners para los elementos de la tarjeta
        dom.filesListContainer.querySelectorAll('.sheet-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const fileItem = state.files.find(f => f.id === id);
                if (fileItem) {
                    if (state.conversionMode === 'consolidated') {
                        fileItem.sheetName = window.csvToExcelConverter.sanitizeSheetName(e.target.value);
                        e.target.value = fileItem.sheetName;
                    } else {
                        fileItem.outputName = e.target.value.trim() || fileItem.name.replace(/\.[^/.]+$/, "");
                    }
                }
            });
        });

        dom.filesListContainer.querySelectorAll('.btn-preview-table').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openDataPreview(id);
            });
        });

        dom.filesListContainer.querySelectorAll('.btn-single-download').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                downloadSingleExcel(id);
            });
        });

        dom.filesListContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                removeFileItem(id);
            });
        });
    }

    function removeFileItem(id) {
        state.files = state.files.filter(f => f.id !== id);
        updateUI();
        showToast("Archivo eliminado de la lista.", "info");
    }

    dom.btnClearAllFiles.addEventListener('click', () => {
        state.files = [];
        updateUI();
        showToast("Se vació la lista de archivos.", "info");
    });

    /* =========================================================================
       5. MODAL DE VISTA PREVIA DE DATOS (TABLA INTERACTIVA)
       ========================================================================= */
    function openDataPreview(fileId) {
        const item = state.files.find(f => f.id === fileId);
        if (!item) return;

        state.previewingFileId = fileId;
        dom.modalSheetTitle.textContent = `${item.name} (${item.sheetName})`;
        dom.modalTableStats.textContent = `${item.rowsCount.toLocaleString()} filas • ${item.colsCount} columnas • Separador: ${getDelimiterName(item.delimiter)}`;

        const maxPreviewRows = 25;
        const previewData = item.data.slice(0, maxPreviewRows);

        if (previewData.length === 0) {
            dom.modalTableHead.innerHTML = '<tr><th>Sin datos</th></tr>';
            dom.modalTableBody.innerHTML = '<tr><td>El archivo no contiene filas legibles.</td></tr>';
        } else {
            // Fila 0 como cabeceras
            const headers = previewData[0];
            dom.modalTableHead.innerHTML = `
                <tr>
                    <th style="width: 40px; text-align: center; color: var(--text-muted);">#</th>
                    ${headers.map((h, i) => `<th>${escapeHtml(h !== null ? String(h) : `Columna ${i+1}`)}</th>`).join('')}
                </tr>
            `;

            // Filas de datos
            dom.modalTableBody.innerHTML = previewData.slice(1).map((row, rIdx) => `
                <tr>
                    <td style="text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.75rem;">${rIdx + 1}</td>
                    ${headers.map((_, cIdx) => {
                        const cell = row[cIdx];
                        return `<td>${cell !== undefined && cell !== null ? escapeHtml(String(cell)) : '<span style="color:var(--text-muted)">null</span>'}</td>`;
                    }).join('')}
                </tr>
            `).join('');
        }

        dom.previewModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDataPreview() {
        dom.previewModal.classList.remove('open');
        document.body.style.overflow = '';
        state.previewingFileId = null;
    }

    dom.modalCloseBtn.addEventListener('click', closeDataPreview);
    dom.previewModal.addEventListener('click', (e) => {
        if (e.target === dom.previewModal) closeDataPreview();
    });

    /* =========================================================================
       6. CONVERSIÓN Y DESCARGAS
       ========================================================================= */
    // A) Descargar un solo Excel individual
    function downloadSingleExcel(fileId) {
        const item = state.files.find(f => f.id === fileId);
        if (!item) return;

        try {
            const blob = window.csvToExcelConverter.generateSingleWorkbook(item);
            const filename = (item.outputName || item.name.replace(/\.[^/.]+$/, "")) + '.xlsx';
            triggerDownload(blob, filename);
            showToast(`Descargado "${filename}"`, "success");
        } catch (err) {
            console.error("Error al generar Excel:", err);
            showToast(`Error al convertir: ${err.message}`, "error");
        }
    }

    // B) Descargar Libro Consolidado (1 solo Excel con cada CSV como una hoja)
    dom.btnExecuteConsolidated.addEventListener('click', () => {
        if (state.files.length === 0) return;

        try {
            const rawFilename = dom.consolidatedFilenameInput.value.trim() || 'Libro_Consolidado';
            const filename = rawFilename.replace(/\.[^/.]+$/, "") + '.xlsx';

            const blob = window.csvToExcelConverter.generateConsolidatedWorkbook(state.files);
            triggerDownload(blob, filename);

            showToast(`¡Libro consolidado con ${state.files.length} hojas descargado con éxito!`, "success");
        } catch (err) {
            console.error("Error al consolidar Excel:", err);
            showToast(`Error al consolidar: ${err.message}`, "error");
        }
    });

    // C) Descargar Todos en un ZIP (Archivos Excel individuales)
    dom.btnDownloadZip.addEventListener('click', async () => {
        if (state.files.length === 0) return;

        dom.btnDownloadZip.disabled = true;
        const originalText = dom.btnDownloadZip.innerHTML;
        dom.btnDownloadZip.innerHTML = `<span class="spinner-small"></span> Comprimiendo .ZIP...`;

        try {
            const zipBlob = await window.csvToExcelConverter.generateZipOfWorkbooks(state.files);
            const zipFilename = `Excels_Convertidos_${new Date().toISOString().slice(0,10)}.zip`;
            triggerDownload(zipBlob, zipFilename);
            showToast(`Archivo ZIP con ${state.files.length} libros Excel descargado.`, "success");
        } catch (err) {
            console.error("Error al crear ZIP:", err);
            showToast(`Error al comprimir ZIP: ${err.message}`, "error");
        } finally {
            dom.btnDownloadZip.disabled = false;
            dom.btnDownloadZip.innerHTML = originalText;
        }
    });

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* =========================================================================
       7. CARGAR ARCHIVOS CSV DE EJEMPLO
       ========================================================================= */
    dom.btnLoadSamples.addEventListener('click', async () => {
        const sample1 = `ID_Venta,Fecha,Cliente,Producto,Cantidad,Precio_Unitario,Total_USD
1001,2026-03-01,Distribuidora Norte,Servidor Blade X1,3,1450.00,4350.00
1002,2026-03-02,Tecnología & Redes,Switch Gestionable 24p,8,220.50,1764.00
1003,2026-03-03,Soluciones Globales,Router Fibra Óptica,5,310.00,1550.00
1004,2026-03-04,Data Center Chile,Módulo SFP+ 10G,24,45.00,1080.00
1005,2026-03-05,Servicios Digitales,Gabinete Rack 42U,2,890.00,1780.00`;

        const sample2 = `Codigo_Articulo;Descripcion;Categoria;Stock_Actual;Punto_Pedido;Estado
ART-001;Cable UTP Cat6 305m;Conectividad;45;15;Disponible
ART-002;Conectores RJ45 Blindados;Accesorios;1200;300;Disponible
ART-003;Patch Panel 24 Puertos;Infraestructura;18;8;Disponible
ART-004;Batería UPS 12V 9Ah;Energía;6;12;Bajo Stock
ART-005;Crimpadora Profesional;Herramientas;25;5;Disponible`;

        const sample3 = `Codigo_Postal\tCiudad\tRegion\tRepresentante\tMeta_Ventas\tActivo
08001\tBarcelona\tCataluña\tMartín Silva\t75000\ttrue
28001\tMadrid\tComunidad de Madrid\tSofía Vega\t95000\ttrue
41001\tSevilla\tAndalucía\tAlejandro Gómez\t60000\ttrue
46001\tValencia\tComunidad Valenciana\tElena Ramos\t65000\ttrue
48001\tBilbao\tPaís Vasco\tJon Ibarra\t70000\ttrue`;

        const mockFiles = [
            new File([sample1], "Reporte_Ventas_2026.csv", { type: "text/csv" }),
            new File([sample2], "Inventario_Stock.csv", { type: "text/csv" }),
            new File([sample3], "Regiones_Sucursales.tsv", { type: "text/tab-separated-values" })
        ];

        await handleIncomingFiles(mockFiles);
        showToast("¡3 archivos CSV de ejemplo cargados! Ahora puedes elegir convertirlos a 1 solo Excel o a Excels separados.", "info");
    });

    /* =========================================================================
       8. UTILIDADES
       ========================================================================= */
    function getDelimiterName(delim) {
        if (delim === ',') return 'Coma (,)';
        if (delim === ';') return 'Punto y coma (;)';
        if (delim === '\t') return 'Tabulación (\\t)';
        if (delim === '|') return 'Pipe (|)';
        return `Otro ('${delim}')`;
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconSvg = type === 'success' 
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
            : type === 'error'
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        dom.toastContainer.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3600);
    }

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

    // Inicializar modo de conversión por defecto (Consolidado: cada CSV en una hoja)
    setConversionMode('consolidated');
});
