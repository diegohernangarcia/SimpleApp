/**
 * SimpleApps Suite - Módulo #10: Unificador / Consolidador de Archivos Excel
 * app.js - Controlador de Interfaz, Eventos, Presets y Renderizado Reactivo
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. ESTADO DE LA APLICACIÓN
    // =========================================================================
    const state = {
        loadedFiles: [], // Array de objetos parseados por el motor
        lastConsolidation: null,
        previewFilter: '',
        previewLimit: 50
    };

    // =========================================================================
    // 2. REFERENCIAS AL DOM
    // =========================================================================
    const dom = {
        // Presets y Ayuda en Hero / Header
        btnPresetSales: document.getElementById('btnPresetSales'),
        btnPresetStores: document.getElementById('btnPresetStores'),
        btnPresetExpenses: document.getElementById('btnPresetExpenses'),
        btnOpenHelpModal: document.getElementById('btnOpenHelpModal'),
        btnOpenHelpHero: document.getElementById('btnOpenHelpHero'),
        btnFooterHelp: document.getElementById('btnFooterHelp'),
        stepHelpBtns: document.querySelectorAll('.btn-step-help[data-help-tab]'),

        // Modales
        helpModal: document.getElementById('helpModal'),
        btnCloseHelpModal: document.getElementById('btnCloseHelpModal'),
        btnDismissHelp: document.getElementById('btnDismissHelp'),
        helpTabBtns: document.querySelectorAll('#helpModal .help-tab-btn'),
        helpTabContents: document.querySelectorAll('#helpModal .help-tab-content'),

        filePreviewModal: document.getElementById('filePreviewModal'),
        btnClosePreviewModal: document.getElementById('btnClosePreviewModal'),
        btnDismissPreview: document.getElementById('btnDismissPreview'),
        filePreviewTitle: document.getElementById('filePreviewTitle'),
        filePreviewSubtitle: document.getElementById('filePreviewSubtitle'),
        filePreviewMetadata: document.getElementById('filePreviewMetadata'),
        singleFileHead: document.getElementById('singleFileHead'),
        singleFileBody: document.getElementById('singleFileBody'),

        // Paso 1: Carga
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('fileInput'),
        btnSelectFiles: document.getElementById('btnSelectFiles'),
        filesQueueContainer: document.getElementById('filesQueueContainer'),
        filesList: document.getElementById('filesList'),
        filesCountBadge: document.getElementById('filesCountBadge'),
        btnClearFiles: document.getElementById('btnClearFiles'),

        // Paso 2: Opciones
        schemaModeRadios: document.querySelectorAll('input[name="schemaMode"]'),
        chkAddSourceFile: document.getElementById('chkAddSourceFile'),
        txtSourceFileColName: document.getElementById('txtSourceFileColName'),
        selSourceColPos: document.getElementById('selSourceColPos'),
        chkAddSourceSheet: document.getElementById('chkAddSourceSheet'),
        selSheetMode: document.getElementById('selSheetMode'),
        chkCaseInsensitive: document.getElementById('chkCaseInsensitive'),
        chkTrimWhitespace: document.getElementById('chkTrimWhitespace'),
        chkRemoveEmptyRows: document.getElementById('chkRemoveEmptyRows'),
        chkRemoveDuplicates: document.getElementById('chkRemoveDuplicates'),

        // Paso 3: Consolidación y Resultados
        btnRunConsolidation: document.getElementById('btnRunConsolidation'),
        step3Section: document.getElementById('step3Section'),
        metricFiles: document.getElementById('metricFiles'),
        metricRows: document.getElementById('metricRows'),
        metricCols: document.getElementById('metricCols'),
        metricTime: document.getElementById('metricTime'),
        txtOutputFileName: document.getElementById('txtOutputFileName'),
        btnDownloadExcel: document.getElementById('btnDownloadExcel'),
        btnDownloadCsv: document.getElementById('btnDownloadCsv'),
        btnCopyTable: document.getElementById('btnCopyTable'),
        previewCountBadge: document.getElementById('previewCountBadge'),
        tableFilterInput: document.getElementById('tableFilterInput'),
        previewPageSize: document.getElementById('previewPageSize'),
        consolidatedTable: document.getElementById('consolidatedTable'),
        tableHead: document.getElementById('tableHead'),
        tableBody: document.getElementById('tableBody'),
        fileContributionList: document.getElementById('fileContributionList'),

        // Toast
        consolidatorToast: document.getElementById('consolidatorToast'),
        toastMessage: document.getElementById('toastMessage')
    };

    // =========================================================================
    // 3. GENERADOR DE CASOS DE PRUEBA (PRESETS EN MEMORIA)
    // =========================================================================
    const PRESET_DEFINITIONS = {
        sales: [
            {
                name: 'ventas_enero_2026.xlsx',
                rows: [
                    { id_pedido: 'PED-1001', fecha: '2026-01-05', cliente: 'TechCorp S.A.', producto: 'Licencia Cloud Anual', cantidad: 5, precio_unitario: 120.00, total: 600.00 },
                    { id_pedido: 'PED-1002', fecha: '2026-01-12', cliente: 'Inversiones Global', producto: 'Router WiFi 6 Pro', cantidad: 3, precio_unitario: 85.50, total: 256.50 },
                    { id_pedido: 'PED-1003', fecha: '2026-01-20', cliente: 'Comercial Andina', producto: 'Monitor 27" QHD', cantidad: 2, precio_unitario: 240.00, total: 480.00 },
                    { id_pedido: 'PED-1004', fecha: '2026-01-28', cliente: 'Logística Austral', producto: 'Switch 24 Puertos', cantidad: 1, precio_unitario: 310.00, total: 310.00 }
                ]
            },
            {
                name: 'ventas_febrero_2026.xlsx',
                rows: [
                    { id_pedido: 'PED-1005', fecha: '2026-02-03', cliente: 'Distribuidora Norte', producto: 'Teclado Mecánico RGB', cantidad: 10, precio_unitario: 45.00, total: 450.00 },
                    { id_pedido: 'PED-1006', fecha: '2026-02-14', cliente: 'TechCorp S.A.', producto: 'Mouse Ergonómico USB', cantidad: 8, precio_unitario: 25.00, total: 200.00 },
                    { id_pedido: 'PED-1007', fecha: '2026-02-22', cliente: 'Banco Metropolitano', producto: 'Servidor Rack 1U', cantidad: 1, precio_unitario: 1850.00, total: 1850.00 }
                ]
            },
            {
                name: 'ventas_marzo_2026.xlsx',
                rows: [
                    { id_pedido: 'PED-1008', fecha: '2026-03-04', cliente: 'Agencia Alfa', producto: 'Laptop Core i7 16GB', cantidad: 4, precio_unitario: 950.00, total: 3800.00 },
                    { id_pedido: 'PED-1009', fecha: '2026-03-15', cliente: 'Comercial Andina', producto: 'Base Refrigerante', cantidad: 6, precio_unitario: 18.00, total: 108.00 },
                    { id_pedido: 'PED-1010', fecha: '2026-03-25', cliente: 'Inversiones Global', producto: 'Cámara Web 4K Pro', cantidad: 5, precio_unitario: 90.00, total: 450.00 },
                    { id_pedido: 'PED-1011', fecha: '2026-03-29', cliente: 'Distribuidora Norte', producto: 'Memoria RAM 32GB DDR5', cantidad: 12, precio_unitario: 65.00, total: 780.00 }
                ]
            }
        ],
        stores: [
            {
                name: 'inventario_sucursal_norte.xlsx',
                rows: [
                    { sku: 'ART-001', descripcion: 'Cafetera Express 15 Bar', categoria: 'Electro', stock_actual: 42, precio_lista: 89.90, pasillo: 'A-12' },
                    { sku: 'ART-002', descripcion: 'Tostadora Acero Inox', categoria: 'Electro', stock_actual: 18, precio_lista: 34.50, pasillo: 'A-14' },
                    { sku: 'ART-003', descripcion: 'Pava Eléctrica Digital', categoria: 'Electro', stock_actual: 65, precio_lista: 29.99, pasillo: 'A-15' }
                ]
            },
            {
                name: 'inventario_sucursal_centro.xlsx',
                rows: [
                    { sku: 'ART-001', descripcion: 'Cafetera Express 15 Bar', categoria: 'Electro', stock_actual: 75, precio_lista: 89.90, pasillo: 'B-02' },
                    { sku: 'ART-004', descripcion: 'Licuadora Jarra Vidrio', categoria: 'Electro', stock_actual: 30, precio_lista: 54.00, pasillo: 'B-05' },
                    { sku: 'ART-005', descripcion: 'Microondas Digital 25L', categoria: 'Electro', stock_actual: 12, precio_lista: 145.00, pasillo: 'B-08' }
                ]
            },
            {
                name: 'inventario_sucursal_sur.xlsx',
                rows: [
                    { sku: 'ART-002', descripcion: 'Tostadora Acero Inox', categoria: 'Electro', stock_actual: 25, precio_lista: 34.50, pasillo: 'S-01' },
                    { sku: 'ART-003', descripcion: 'Pava Eléctrica Digital', categoria: 'Electro', stock_actual: 40, precio_lista: 29.99, pasillo: 'S-02' },
                    { sku: 'ART-006', descripcion: 'Batidora Planetaria 5L', categoria: 'Electro', stock_actual: 8, precio_lista: 189.00, pasillo: 'S-04' }
                ]
            }
        ],
        expenses: [
            {
                name: 'gastos_enero_marketing.csv',
                rows: [
                    { id_gasto: 'GTO-101', fecha: '2026-01-10', concepto: 'Campaña Google Ads', centro_costos: 'Marketing', monto: 1200.00, moneda: 'USD' },
                    { id_gasto: 'GTO-102', fecha: '2026-01-18', concepto: 'Diseño Gráfico Banners', centro_costos: 'Marketing', monto: 450.00, moneda: 'USD' }
                ]
            },
            {
                name: 'gastos_febrero_it_operaciones.csv',
                rows: [
                    { id_gasto: 'GTO-103', fecha: '2026-02-05', concepto: 'Servidores AWS Hosting', centro_costos: 'IT & Cloud', monto: 880.50, proveedor: 'Amazon Web Services' },
                    { id_gasto: 'GTO-104', fecha: '2026-02-12', concepto: 'Licencias Slack & Jira', centro_costos: 'IT & Cloud', monto: 340.00, proveedor: 'Atlassian Corp' }
                ]
            },
            {
                name: 'gastos_marzo_logistica.csv',
                rows: [
                    { id_gasto: 'GTO-105', fecha: '2026-03-08', concepto: 'Fletes y Envíos Clientes', centro_costos: 'Logística', monto: 720.00, notas_adicionales: 'Envíos urgentes norte' },
                    { id_gasto: 'GTO-106', fecha: '2026-03-22', concepto: 'Embalajes y Cajas', centro_costos: 'Logística', monto: 195.00, notas_adicionales: 'Lote de 500 unidades' }
                ]
            }
        ]
    };

    /**
     * Carga un preset transformándolo a binario XLSX para procesar como archivo real
     */
    async function loadPreset(presetKey) {
        const fileDefs = PRESET_DEFINITIONS[presetKey];
        if (!fileDefs) return;

        showToast(`Cargando escenario "${presetKey}"...`);
        const parsedFiles = [];

        for (const def of fileDefs) {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(def.rows);
            XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            
            const parsed = await ExcelConsolidatorEngine.parseFile(wbout, def.name);
            parsedFiles.push(parsed);
        }

        state.loadedFiles = parsedFiles;
        renderFilesQueue();
        updateConsolidateButtonState();
        showToast(`⚡ ${parsedFiles.length} archivos de prueba cargados listos para consolidar.`);
    }

    // =========================================================================
    // 4. MANEJO DE ARCHIVOS (CARGA, DRAG & DROP, REORDENAMIENTO)
    // =========================================================================

    // Drag & Drop
    dom.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropzone.classList.add('dragover');
    });

    dom.dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('dragover');
    });

    dom.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleIncomingFiles(e.dataTransfer.files);
        }
    });

    dom.dropzone.addEventListener('click', (e) => {
        if (e.target !== dom.btnSelectFiles && !dom.btnSelectFiles.contains(e.target)) {
            dom.fileInput.click();
        }
    });

    dom.btnSelectFiles.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.fileInput.click();
    });

    dom.fileInput.addEventListener('change', () => {
        if (dom.fileInput.files && dom.fileInput.files.length > 0) {
            handleIncomingFiles(dom.fileInput.files);
            dom.fileInput.value = '';
        }
    });

    dom.btnClearFiles.addEventListener('click', () => {
        state.loadedFiles = [];
        state.lastConsolidation = null;
        renderFilesQueue();
        updateConsolidateButtonState();
        dom.step3Section.style.display = 'none';
        showToast('Cola de archivos limpiada.');
    });

    /**
     * Procesa la lista de archivos que el usuario arrastra o selecciona
     */
    async function handleIncomingFiles(fileList) {
        const filesArray = Array.from(fileList);
        let successCount = 0;
        let errorCount = 0;

        for (const file of filesArray) {
            try {
                const parsed = await ExcelConsolidatorEngine.parseFile(file);
                // Evitar duplicados por nombre exacto si ya existe
                const existingIndex = state.loadedFiles.findIndex(f => f.fileName === parsed.fileName);
                if (existingIndex >= 0) {
                    state.loadedFiles[existingIndex] = parsed; // Reemplazar
                } else {
                    state.loadedFiles.push(parsed);
                }
                successCount++;
            } catch (err) {
                console.error('Error parseando archivo:', file.name, err);
                errorCount++;
            }
        }

        renderFilesQueue();
        updateConsolidateButtonState();

        if (errorCount > 0) {
            showToast(`⚠️ Se cargaron ${successCount} archivos. ${errorCount} fallaron al leerse.`);
        } else {
            showToast(`✅ ${successCount} archivos procesados y añadidos a la cola.`);
        }
    }

    /**
     * Renderiza la cola visual de archivos
     */
    function renderFilesQueue() {
        if (state.loadedFiles.length === 0) {
            dom.filesQueueContainer.style.display = 'none';
            return;
        }

        dom.filesQueueContainer.style.display = 'block';
        dom.filesCountBadge.textContent = `${state.loadedFiles.length} archivo${state.loadedFiles.length === 1 ? '' : 's'}`;
        dom.filesList.innerHTML = '';

        state.loadedFiles.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'file-item-card';

            const sizeKb = (file.sizeBytes / 1024).toFixed(1);
            const sheetsInfo = file.sheetNames.join(', ');
            const extClass = `file-ext-${file.extension}`;

            card.innerHTML = `
                <div class="file-item-left">
                    <div class="file-order-badge">${index + 1}</div>
                    <div class="file-ext-icon ${extClass}">.${file.extension}</div>
                    <div class="file-meta-box">
                        <span class="file-name-text" title="${file.fileName}">${escapeHtml(file.fileName)}</span>
                        <div class="file-details-row">
                            <span>${sizeKb} KB</span>
                            <span>•</span>
                            <span class="file-sheet-pill">${file.totalRows} filas detectadas</span>
                            <span>•</span>
                            <span style="color: var(--emerald-bright);">${file.sheetNames.length} hoja${file.sheetNames.length === 1 ? '' : 's'} (${escapeHtml(sheetsInfo)})</span>
                        </div>
                    </div>
                </div>

                <div class="file-item-right">
                    <button type="button" class="btn-file-action" data-action="preview" data-index="${index}" title="Previsualizar primeras filas">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button type="button" class="btn-file-action" data-action="up" data-index="${index}" ${index === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Subir en orden de apilado">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="btn-file-action" data-action="down" data-index="${index}" ${index === state.loadedFiles.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Bajar en orden de apilado">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button type="button" class="btn-file-action delete" data-action="delete" data-index="${index}" title="Quitar archivo de la cola">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;

            // Event listeners de acciones de fila
            const btnPreview = card.querySelector('[data-action="preview"]');
            const btnUp = card.querySelector('[data-action="up"]');
            const btnDown = card.querySelector('[data-action="down"]');
            const btnDelete = card.querySelector('[data-action="delete"]');

            if (btnPreview) btnPreview.addEventListener('click', () => openFilePreview(index));
            if (btnUp && index > 0) {
                btnUp.addEventListener('click', () => {
                    const temp = state.loadedFiles[index];
                    state.loadedFiles[index] = state.loadedFiles[index - 1];
                    state.loadedFiles[index - 1] = temp;
                    renderFilesQueue();
                });
            }
            if (btnDown && index < state.loadedFiles.length - 1) {
                btnDown.addEventListener('click', () => {
                    const temp = state.loadedFiles[index];
                    state.loadedFiles[index] = state.loadedFiles[index + 1];
                    state.loadedFiles[index + 1] = temp;
                    renderFilesQueue();
                });
            }
            if (btnDelete) {
                btnDelete.addEventListener('click', () => {
                    state.loadedFiles.splice(index, 1);
                    renderFilesQueue();
                    updateConsolidateButtonState();
                });
            }

            dom.filesList.appendChild(card);
        });
    }

    function updateConsolidateButtonState() {
        dom.btnRunConsolidation.disabled = state.loadedFiles.length < 1;
    }

    // =========================================================================
    // 5. MOTOR DE CONSOLIDACIÓN Y EJECUCIÓN
    // =========================================================================
    dom.btnRunConsolidation.addEventListener('click', executeConsolidation);

    function executeConsolidation() {
        if (state.loadedFiles.length === 0) {
            showToast('⚠️ Debes cargar al menos 1 archivo para consolidar.');
            return;
        }

        // Obtener modo de esquema
        let selectedSchemaMode = 'union';
        dom.schemaModeRadios.forEach(r => {
            if (r.checked) selectedSchemaMode = r.value;
        });

        const options = {
            schemaMode: selectedSchemaMode,
            addSourceFileCol: dom.chkAddSourceFile.checked,
            sourceFileColName: dom.txtSourceFileColName.value || 'Archivo_Origen',
            sourceColPosition: dom.selSourceColPos.value,
            addSourceSheetCol: dom.chkAddSourceSheet.checked,
            sourceSheetColName: 'Hoja_Origen',
            sheetMode: dom.selSheetMode.value,
            caseInsensitiveHeaders: dom.chkCaseInsensitive.checked,
            trimCellWhitespace: dom.chkTrimWhitespace.checked,
            removeEmptyRows: dom.chkRemoveEmptyRows.checked,
            removeDuplicateRows: dom.chkRemoveDuplicates.checked
        };

        try {
            const result = ExcelConsolidatorEngine.consolidateFiles(state.loadedFiles, options);
            state.lastConsolidation = result;

            renderConsolidationResults(result);
            dom.step3Section.style.display = 'block';
            dom.step3Section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast(`🚀 ¡Consolidación exitosa! ${result.totalRows} filas combinadas en ${result.durationMs} ms.`);
        } catch (err) {
            console.error('Error durante consolidación:', err);
            showToast(`❌ Error al consolidar: ${err.message}`);
        }
    }

    /**
     * Renderiza los resultados en el Paso 3
     */
    function renderConsolidationResults(result) {
        // Métricas
        dom.metricFiles.textContent = result.totalFiles;
        dom.metricRows.textContent = result.totalRows.toLocaleString();
        dom.metricCols.textContent = result.totalColumns;
        dom.metricTime.textContent = `${result.durationMs} ms`;

        // Nombre de archivo sugerido con fecha
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        dom.txtOutputFileName.value = `consolidado_${result.totalFiles}_archivos_${dateStr}.xlsx`;

        // Desglose por archivo
        renderFileContributionSummary(result.fileSummary);

        // Tabla de vista previa
        renderTablePreview();
    }

    function renderFileContributionSummary(summaryList) {
        dom.fileContributionList.innerHTML = '';
        summaryList.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-md); padding: 0.75rem 1rem;';
            card.innerHTML = `
                <div style="font-size: 0.82rem; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.name}">${escapeHtml(item.name)}</div>
                <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.2rem;">
                    Filas aportadas: <strong style="color: var(--emerald-bright);">${item.contributedRows.toLocaleString()}</strong>
                </div>
            `;
            dom.fileContributionList.appendChild(card);
        });
    }

    function renderTablePreview() {
        if (!state.lastConsolidation) return;
        const { headers, rows } = state.lastConsolidation;

        // Filtrar filas si hay término de búsqueda
        let filteredRows = rows;
        const query = dom.tableFilterInput.value.trim().toLowerCase();
        if (query) {
            filteredRows = rows.filter(r => {
                return headers.some(h => String(r[h] || '').toLowerCase().includes(query));
            });
        }

        const pageSize = dom.previewPageSize.value;
        const displayLimit = pageSize === 'all' ? filteredRows.length : parseInt(pageSize, 10);
        const displayedRows = filteredRows.slice(0, displayLimit);

        dom.previewCountBadge.textContent = `Mostrando ${displayedRows.length} de ${filteredRows.length} fila${filteredRows.length === 1 ? '' : 's'}`;

        // Render encabezados
        dom.tableHead.innerHTML = `
            <tr>
                ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
        `;

        // Render cuerpo
        const sourceColName = dom.txtSourceFileColName.value || 'Archivo_Origen';
        dom.tableBody.innerHTML = displayedRows.map(row => {
            return `
                <tr>
                    ${headers.map(h => {
                        const cellVal = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                        if (h === sourceColName) {
                            return `<td><span class="origin-badge">${escapeHtml(cellVal)}</span></td>`;
                        }
                        return `<td>${escapeHtml(cellVal)}</td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');
    }

    dom.tableFilterInput.addEventListener('input', () => renderTablePreview());
    dom.previewPageSize.addEventListener('change', () => renderTablePreview());

    // =========================================================================
    // 6. ACCIONES DE EXPORTACIÓN Y DESCARGA
    // =========================================================================
    dom.btnDownloadExcel.addEventListener('click', () => {
        if (!state.lastConsolidation) return;
        try {
            const binary = ExcelConsolidatorEngine.createMasterWorkbookBinary(state.lastConsolidation);
            const blob = new Blob([binary], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            let fileName = dom.txtOutputFileName.value.trim() || 'consolidado_maestro.xlsx';
            if (!fileName.toLowerCase().endsWith('.xlsx')) fileName += '.xlsx';

            triggerDownload(blob, fileName);
            showToast(`📥 Descarga iniciada: ${fileName}`);
        } catch (err) {
            console.error('Error generando archivo Excel:', err);
            showToast(`❌ Error al generar Excel: ${err.message}`);
        }
    });

    dom.btnDownloadCsv.addEventListener('click', () => {
        if (!state.lastConsolidation) return;
        try {
            const csvText = ExcelConsolidatorEngine.exportToCsvText(state.lastConsolidation);
            const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
            
            let baseName = dom.txtOutputFileName.value.trim().replace(/\.xlsx$/i, '') || 'consolidado_maestro';
            const fileName = `${baseName}.csv`;

            triggerDownload(blob, fileName);
            showToast(`📄 CSV maestro descargado: ${fileName}`);
        } catch (err) {
            console.error('Error exportando CSV:', err);
            showToast(`❌ Error al generar CSV: ${err.message}`);
        }
    });

    dom.btnCopyTable.addEventListener('click', async () => {
        if (!state.lastConsolidation) return;
        try {
            const { headers, rows } = state.lastConsolidation;
            const tsvLines = [headers.join('\t')];
            rows.forEach(r => {
                tsvLines.push(headers.map(h => String(r[h] || '').replace(/[\t\n\r]/g, ' ')).join('\t'));
            });
            await navigator.clipboard.writeText(tsvLines.join('\n'));
            showToast('📋 Tabla consolidada copiada al portapapeles.');
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            showToast('❌ No se pudo copiar al portapapeles.');
        }
    });

    function triggerDownload(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    // =========================================================================
    // 7. MODALES (AYUDA INTERACTIVA Y VISTA PREVIA INDIVIDUAL)
    // =========================================================================

    // A. Modal de Ayuda
    function openHelpModal(targetTabId = 'tabHelpOverview') {
        if (!dom.helpModal) return;
        switchHelpTab(targetTabId);
        dom.helpModal.classList.add('active', 'open');
        document.body.style.overflow = 'hidden';
    }

    function closeHelpModal() {
        if (!dom.helpModal) return;
        dom.helpModal.classList.remove('active', 'open');
        document.body.style.overflow = '';
    }

    function switchHelpTab(tabKey) {
        const candidate = tabKey || 'tabHelpOverview';
        let found = false;
        dom.helpTabContents.forEach(c => {
            if (c.id === candidate) found = true;
        });
        const activeTab = found ? candidate : 'tabHelpOverview';

        dom.helpTabBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.tab === activeTab);
        });
        dom.helpTabContents.forEach(c => {
            c.style.display = c.id === activeTab ? 'block' : 'none';
        });
    }

    if (dom.btnOpenHelpModal) dom.btnOpenHelpModal.addEventListener('click', () => openHelpModal('tabHelpOverview'));
    if (dom.btnOpenHelpHero) dom.btnOpenHelpHero.addEventListener('click', () => openHelpModal('tabHelpPresets'));
    if (dom.btnFooterHelp) dom.btnFooterHelp.addEventListener('click', () => openHelpModal('tabHelpOverview'));
    if (dom.btnCloseHelpModal) dom.btnCloseHelpModal.addEventListener('click', closeHelpModal);
    if (dom.btnDismissHelp) dom.btnDismissHelp.addEventListener('click', closeHelpModal);

    if (dom.helpModal) {
        dom.helpModal.addEventListener('click', (e) => {
            if (e.target === dom.helpModal) closeHelpModal();
        });
    }

    dom.helpTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchHelpTab(btn.dataset.tab));
    });

    dom.stepHelpBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.helpTab || 'tabHelpOverview';
            openHelpModal(tab);
        });
    });

    // B. Modal de Vista Previa Individual
    function openFilePreview(fileIndex) {
        const file = state.loadedFiles[fileIndex];
        if (!file || !dom.filePreviewModal) return;

        dom.filePreviewTitle.textContent = file.fileName;
        dom.filePreviewSubtitle.textContent = `Extensión .${file.extension} • ${(file.sizeBytes / 1024).toFixed(1)} KB`;
        dom.filePreviewMetadata.textContent = `Hojas: ${file.sheetNames.join(', ')} • Total de filas: ${file.totalRows}`;

        const firstSheet = file.sheets[0];
        if (firstSheet && firstSheet.rows.length > 0) {
            dom.singleFileHead.innerHTML = `<tr>${firstSheet.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
            const previewRows = firstSheet.rows.slice(0, 30);
            dom.singleFileBody.innerHTML = previewRows.map(r => {
                return `<tr>${firstSheet.headers.map(h => `<td>${escapeHtml(String(r[h] || ''))}</td>`).join('')}</tr>`;
            }).join('');
        } else {
            dom.singleFileHead.innerHTML = '';
            dom.singleFileBody.innerHTML = '<tr><td style="text-align:center; padding: 2rem;">Archivo sin datos o vacío.</td></tr>';
        }

        dom.filePreviewModal.classList.add('active', 'open');
        document.body.style.overflow = 'hidden';
    }

    function closeFilePreview() {
        if (!dom.filePreviewModal) return;
        dom.filePreviewModal.classList.remove('active', 'open');
        document.body.style.overflow = '';
    }

    if (dom.btnClosePreviewModal) dom.btnClosePreviewModal.addEventListener('click', closeFilePreview);
    if (dom.btnDismissPreview) dom.btnDismissPreview.addEventListener('click', closeFilePreview);
    if (dom.filePreviewModal) {
        dom.filePreviewModal.addEventListener('click', (e) => {
            if (e.target === dom.filePreviewModal) closeFilePreview();
        });
    }

    // Cerrar con Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHelpModal();
            closeFilePreview();
        }
    });

    // =========================================================================
    // 8. EVENTOS DE PRESETS RÁPIDOS
    // =========================================================================
    if (dom.btnPresetSales) dom.btnPresetSales.addEventListener('click', () => loadPreset('sales'));
    if (dom.btnPresetStores) dom.btnPresetStores.addEventListener('click', () => loadPreset('stores'));
    if (dom.btnPresetExpenses) dom.btnPresetExpenses.addEventListener('click', () => loadPreset('expenses'));

    // =========================================================================
    // 9. UTILIDADES Y TOAST
    // =========================================================================
    let toastTimer = null;
    function showToast(msg) {
        if (!dom.consolidatorToast) return;
        dom.toastMessage.textContent = msg;
        dom.consolidatorToast.classList.add('show');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            dom.consolidatorToast.classList.remove('show');
        }, 3400);
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
