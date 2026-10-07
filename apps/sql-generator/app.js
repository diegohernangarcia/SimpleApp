/**
 * =============================================================================
 * CONTROLADOR PRINCIPAL (APP.JS)
 * Módulo #09 • Generador SQL INSERT / UPDATE desde Excel • SimpleApps Suite
 * =============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Instancia del motor SQL
    const engine = window.sqlBuilderEngine || new SqlBuilderEngine();

    // Estado de la Aplicación
    const state = {
        rawData: [],
        columns: [],
        fileName: 'datos_excel',
        tableName: 'mi_tabla',
        dialectKey: 'mysql',
        operation: 'insert',
        batchSize: 500,
        includeTransaction: true,
        includeCreateTable: false,
        includeDropTable: false,
        includeComments: true,
        emptyAsNull: true,
        workbook: null,
        activeTab: 'sqlTab', // 'sqlTab', 'dataTab', 'ddlTab'
        generatedSql: '',
        generatedDdl: ''
    };

    // =========================================================================
    // REFERENCIAS AL DOM
    // =========================================================================
    const dom = {
        // Dropzone & Archivos
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        btnBrowseFile: document.getElementById('btnBrowseFile'),
        btnPasteData: document.getElementById('btnPasteData'),
        tableSummaryStrip: document.getElementById('tableSummaryStrip'),
        fileNameTag: document.getElementById('fileNameTag'),
        fileMetaCounts: document.getElementById('fileMetaCounts'),
        sheetSelectorContainer: document.getElementById('sheetSelectorContainer'),
        sheetSelect: document.getElementById('sheetSelect'),
        btnClearData: document.getElementById('btnClearData'),

        // Presets Rápidos
        btnPresetProducts: document.getElementById('btnPresetProducts'),
        btnPresetUsers: document.getElementById('btnPresetUsers'),
        btnPresetLedger: document.getElementById('btnPresetLedger'),

        // Mapeo de Columnas
        mappingTableBody: document.getElementById('mappingTableBody'),
        btnSelectAllCols: document.getElementById('btnSelectAllCols'),
        btnDeselectAllCols: document.getElementById('btnDeselectAllCols'),
        btnAutoSnakeCase: document.getElementById('btnAutoSnakeCase'),
        btnResetTypes: document.getElementById('btnResetTypes'),

        // Configuración SQL
        inputTableName: document.getElementById('inputTableName'),
        selectDialect: document.getElementById('selectDialect'),
        selectBatchSize: document.getElementById('selectBatchSize'),
        radioOperations: document.querySelectorAll('input[name="sqlOperation"]'),
        chkTransaction: document.getElementById('chkTransaction'),
        chkCreateTable: document.getElementById('chkCreateTable'),
        chkDropTable: document.getElementById('chkDropTable'),
        chkComments: document.getElementById('chkComments'),
        chkEmptyAsNull: document.getElementById('chkEmptyAsNull'),

        // Salida y Métricas
        sqlCodeOutput: document.getElementById('sqlCodeOutput'),
        previewTableContainer: document.getElementById('previewTableContainer'),
        ddlCodeOutput: document.getElementById('ddlCodeOutput'),
        btnCopySql: document.getElementById('btnCopySql'),
        btnDownloadSql: document.getElementById('btnDownloadSql'),
        btnRegenerateSql: document.getElementById('btnRegenerateSql'),
        tabSqlBtn: document.getElementById('tabSqlBtn'),
        tabDataBtn: document.getElementById('tabDataBtn'),
        tabDdlBtn: document.getElementById('tabDdlBtn'),
        metricRows: document.getElementById('metricRows'),
        metricStmts: document.getElementById('metricStmts'),
        metricCols: document.getElementById('metricCols'),
        metricSize: document.getElementById('metricSize'),
        metricDialect: document.getElementById('metricDialect'),

        // Modales
        helpModal: document.getElementById('helpModal'),
        btnOpenHelpModal: document.getElementById('btnOpenHelpModal'),
        btnOpenHelpHero: document.getElementById('btnOpenHelpHero'),
        btnCloseHelpModal: document.getElementById('btnCloseHelpModal'),
        btnFooterHelp: document.getElementById('btnFooterHelp'),
        helpTabBtns: document.querySelectorAll('.help-tab-btn'),
        helpTabContents: document.querySelectorAll('.help-tab-content'),
        stepHelpBtns: document.querySelectorAll('.btn-step-help[data-help-tab]'),

        pasteModal: document.getElementById('pasteModal'),
        btnClosePasteModal: document.getElementById('btnClosePasteModal'),
        pasteTextarea: document.getElementById('pasteTextarea'),
        btnProcessPaste: document.getElementById('btnProcessPaste'),

        // Toast
        sqlToast: document.getElementById('sqlToast')
    };

    // =========================================================================
    // DATOS DE EJEMPLO PRE-CONFIGURADOS (PRESETS)
    // =========================================================================
    const PRESETS = {
        products: {
            fileName: 'catalogo_productos.xlsx',
            tableName: 'productos_tech',
            data: [
                { id: 101, sku: 'MON-24-IPS', nombre_producto: 'Monitor IPS 24" 144Hz', categoria: 'Monitores', precio_unitario: 189.99, stock: 45, es_destacado: true, fecha_ingreso: '2026-01-15' },
                { id: 102, sku: 'TEC-MEC-RGB', nombre_producto: 'Teclado Mecánico Switch Blue', categoria: 'Periféricos', precio_unitario: 69.50, stock: 120, es_destacado: true, fecha_ingreso: '2026-02-10' },
                { id: 103, sku: 'MOU-GAM-PRO', nombre_producto: "Mouse Gamer 16000 DPI O'Connor", categoria: 'Periféricos', precio_unitario: 45.00, stock: 85, es_destacado: true, fecha_ingreso: '2026-02-18' },
                { id: 104, sku: 'AUR-WIRELESS', nombre_producto: 'Auriculares Bluetooth Pro', categoria: 'Audio', precio_unitario: 99.90, stock: 30, es_destacado: false, fecha_ingreso: '2026-03-01' },
                { id: 105, sku: 'WEBCAM-4K', nombre_producto: 'Webcam UltraHD 4K con Mic', categoria: 'Streaming', precio_unitario: 129.00, stock: 15, es_destacado: true, fecha_ingreso: '2026-03-22' }
            ]
        },
        users: {
            fileName: 'usuarios_registrados.csv',
            tableName: 'usuarios_sistema',
            data: [
                { user_id: 1, email: 'diego.admin@empresa.com', nombre_completo: 'Diego Hernán García', rol: 'ADMIN', saldo_credito: 1500.00, verificado: true, creado_el: '2025-11-01 10:30:00' },
                { user_id: 2, email: 'laura.ventas@empresa.com', nombre_completo: 'Laura Sofía Gómez', rol: 'VENTAS', saldo_credito: 450.50, verificado: true, creado_el: '2025-12-14 14:15:20' },
                { user_id: 3, email: 'marcos.dev@cliente.io', nombre_completo: "Marcos D'Angelo", rol: 'CLIENTE', saldo_credito: 0.00, verificado: false, creado_el: '2026-01-20 09:05:00' },
                { user_id: 4, email: 'ana.soporte@empresa.com', nombre_completo: 'Ana Belén Martínez', rol: 'SOPORTE', saldo_credito: 250.00, verificado: true, creado_el: '2026-02-05 18:40:12' }
            ]
        },
        ledger: {
            fileName: 'libro_diario_marzo.ods',
            tableName: 'transacciones_contables',
            data: [
                { tx_id: 5001, codigo_asiento: 'AS-2026-001', cuenta_origen: '1.1.01.01', cuenta_destino: '4.1.02.05', importe: 12500.00, moneda: 'USD', es_conciliado: true, fecha_registro: '2026-03-01' },
                { tx_id: 5002, codigo_asiento: 'AS-2026-002', cuenta_origen: '2.1.03.02', cuenta_destino: '1.1.01.02', importe: 8400.75, moneda: 'EUR', es_conciliado: false, fecha_registro: '2026-03-05' },
                { tx_id: 5003, codigo_asiento: 'AS-2026-003', cuenta_origen: '1.1.01.01', cuenta_destino: '5.2.01.10', importe: 3100.20, moneda: 'USD', es_conciliado: true, fecha_registro: '2026-03-10' }
            ]
        }
    };

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================
    function init() {
        setupEventListeners();
        // Cargar por defecto el preset de productos para mostrar la app operativa
        loadPreset('products');
    }

    // =========================================================================
    // GESTIÓN DE EVENTOS
    // =========================================================================
    function setupEventListeners() {
        // Drag & Drop
        if (dom.dropZone) {
            ['dragenter', 'dragover'].forEach(evt => {
                dom.dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dom.dropZone.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(evt => {
                dom.dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dom.dropZone.classList.remove('dragover');
                });
            });

            dom.dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    processFile(files[0]);
                }
            });

            dom.dropZone.addEventListener('click', (e) => {
                if (e.target.closest('#btnBrowseFile') || e.target.closest('#btnPasteData')) return;
                dom.fileInput.click();
            });
        }

        if (dom.btnBrowseFile) {
            dom.btnBrowseFile.addEventListener('click', (e) => {
                e.stopPropagation();
                dom.fileInput.click();
            });
        }

        if (dom.fileInput) {
            dom.fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    processFile(e.target.files[0]);
                }
            });
        }

        // Selector de hoja Excel
        if (dom.sheetSelect) {
            dom.sheetSelect.addEventListener('change', () => {
                if (!state.workbook) return;
                const sheetName = dom.sheetSelect.value;
                parseWorksheet(state.workbook, sheetName, state.fileName);
            });
        }

        // Limpiar datos
        if (dom.btnClearData) {
            dom.btnClearData.addEventListener('click', () => {
                clearData();
            });
        }

        // Presets
        if (dom.btnPresetProducts) dom.btnPresetProducts.addEventListener('click', () => loadPreset('products'));
        if (dom.btnPresetUsers) dom.btnPresetUsers.addEventListener('click', () => loadPreset('users'));
        if (dom.btnPresetLedger) dom.btnPresetLedger.addEventListener('click', () => loadPreset('ledger'));

        // Barra de Mapeo de Columnas
        if (dom.btnSelectAllCols) {
            dom.btnSelectAllCols.addEventListener('click', () => {
                state.columns.forEach(c => c.included = true);
                renderMappingTable();
                generateSql();
            });
        }

        if (dom.btnDeselectAllCols) {
            dom.btnDeselectAllCols.addEventListener('click', () => {
                state.columns.forEach(c => c.included = false);
                renderMappingTable();
                generateSql();
            });
        }

        if (dom.btnAutoSnakeCase) {
            dom.btnAutoSnakeCase.addEventListener('click', () => {
                state.columns.forEach(c => c.sqlName = engine.sanitizeIdentifier(c.originalName));
                renderMappingTable();
                generateSql();
                showToast('✨ Nombres de columnas convertidos a snake_case.');
            });
        }

        if (dom.btnResetTypes) {
            dom.btnResetTypes.addEventListener('click', () => {
                reInferTypes();
                renderMappingTable();
                generateSql();
                showToast('🔄 Tipos de datos re-analizados.');
            });
        }

        // Cambios en configuración SQL
        if (dom.inputTableName) {
            dom.inputTableName.addEventListener('input', () => {
                state.tableName = engine.sanitizeIdentifier(dom.inputTableName.value) || 'mi_tabla';
                generateSql();
            });
        }

        if (dom.selectDialect) {
            dom.selectDialect.addEventListener('change', () => {
                state.dialectKey = dom.selectDialect.value;
                generateSql();
            });
        }

        if (dom.selectBatchSize) {
            dom.selectBatchSize.addEventListener('change', () => {
                state.batchSize = parseInt(dom.selectBatchSize.value, 10);
                generateSql();
            });
        }

        dom.radioOperations.forEach(r => {
            r.addEventListener('change', () => {
                if (r.checked) {
                    state.operation = r.value;
                    generateSql();
                }
            });
        });

        // Switches
        if (dom.chkTransaction) dom.chkTransaction.addEventListener('change', (e) => { state.includeTransaction = e.target.checked; generateSql(); });
        if (dom.chkCreateTable) dom.chkCreateTable.addEventListener('change', (e) => { state.includeCreateTable = e.target.checked; generateSql(); });
        if (dom.chkDropTable) dom.chkDropTable.addEventListener('change', (e) => { state.includeDropTable = e.target.checked; generateSql(); });
        if (dom.chkComments) dom.chkComments.addEventListener('change', (e) => { state.includeComments = e.target.checked; generateSql(); });
        if (dom.chkEmptyAsNull) dom.chkEmptyAsNull.addEventListener('change', (e) => { state.emptyAsNull = e.target.checked; generateSql(); });

        // Pestañas de salida
        if (dom.tabSqlBtn) dom.tabSqlBtn.addEventListener('click', () => switchTab('sqlTab'));
        if (dom.tabDataBtn) dom.tabDataBtn.addEventListener('click', () => switchTab('dataTab'));
        if (dom.tabDdlBtn) dom.tabDdlBtn.addEventListener('click', () => switchTab('ddlTab'));

        // Acciones de Script
        if (dom.btnCopySql) dom.btnCopySql.addEventListener('click', copySqlToClipboard);
        if (dom.btnDownloadSql) dom.btnDownloadSql.addEventListener('click', downloadSqlFile);
        if (dom.btnRegenerateSql) dom.btnRegenerateSql.addEventListener('click', () => { generateSql(); showToast('⚡ Script SQL regenerado con éxito.'); });

        // Modales
        if (dom.btnOpenHelpModal) dom.btnOpenHelpModal.addEventListener('click', () => openHelpModal('tabHelpOverview'));
        if (dom.btnOpenHelpHero) dom.btnOpenHelpHero.addEventListener('click', () => openHelpModal('tabHelpOverview'));
        if (dom.btnFooterHelp) dom.btnFooterHelp.addEventListener('click', () => openHelpModal('tabHelpOverview'));
        if (dom.btnCloseHelpModal) dom.btnCloseHelpModal.addEventListener('click', closeHelpModal);
        if (dom.helpModal) {
            dom.helpModal.addEventListener('click', (e) => {
                if (e.target === dom.helpModal) closeHelpModal();
            });
        }

        dom.helpTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;
                switchHelpTab(target);
            });
        });

        dom.stepHelpBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabTarget = btn.dataset.helpTab || 'tabHelpOverview';
                openHelpModal(tabTarget);
            });
        });

        // Cerrar modales con Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeHelpModal();
                if (dom.pasteModal) dom.pasteModal.classList.remove('active', 'open');
            }
        });

        // Pegar Datos
        if (dom.btnPasteData) dom.btnPasteData.addEventListener('click', () => { dom.pasteModal.classList.add('active'); dom.pasteTextarea.focus(); });
        if (dom.btnClosePasteModal) dom.btnClosePasteModal.addEventListener('click', () => dom.pasteModal.classList.remove('active'));
        if (dom.pasteModal) {
            dom.pasteModal.addEventListener('click', (e) => {
                if (e.target === dom.pasteModal) dom.pasteModal.classList.remove('active');
            });
        }
        if (dom.btnProcessPaste) dom.btnProcessPaste.addEventListener('click', processPastedText);
    }

    // =========================================================================
    // PROCESAMIENTO DE ARCHIVOS
    // =========================================================================
    function processFile(file) {
        if (!file) return;

        const fileName = file.name;
        const ext = fileName.split('.').pop().toLowerCase();
        const validExts = ['xlsx', 'xls', 'ods', 'csv', 'tsv', 'txt'];

        if (!validExts.includes(ext)) {
            showToast('⚠️ Formato no admitido. Usa archivos .xlsx, .xls, .ods, .csv o .tsv.');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const buffer = e.target.result;
                const wb = XLSX.read(buffer, {
                    type: 'array',
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });

                state.workbook = wb;
                state.fileName = fileName;

                // Si tiene múltiples hojas
                if (wb.SheetNames.length > 1) {
                    dom.sheetSelectorContainer.style.display = 'flex';
                    dom.sheetSelect.innerHTML = wb.SheetNames.map(s => `<option value="${s}">${s}</option>`).join('');
                } else {
                    dom.sheetSelectorContainer.style.display = 'none';
                }

                const initialSheet = wb.SheetNames[0];
                parseWorksheet(wb, initialSheet, fileName);
                showToast(`✅ Archivo "${fileName}" cargado con éxito.`);
            } catch (err) {
                console.error(err);
                showToast('❌ Error al procesar el archivo. Verifica que no esté dañado.');
            }
        };

        reader.readAsArrayBuffer(file);
    }

    function parseWorksheet(wb, sheetName, fileName) {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;

        // Extraer matriz cruda de objetos
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        if (!rawJson || rawJson.length === 0) {
            showToast('⚠️ La hoja seleccionada no contiene registros.');
            return;
        }

        // Nombre de tabla sugerido a partir de la hoja o el archivo
        const rawTableName = sheetName.toLowerCase() !== 'sheet1' && sheetName.toLowerCase() !== 'hoja1'
            ? sheetName
            : fileName.replace(/\.[^/.]+$/, '');

        loadDataset(rawJson, fileName, rawTableName);
    }

    function processPastedText() {
        const text = dom.pasteTextarea.value.trim();
        if (!text) {
            showToast('⚠️ El área de texto está vacía.');
            return;
        }

        try {
            // Detección automática del delimitador
            const firstLine = text.split('\n')[0];
            let delimiter = '\t'; // Por defecto TSV de Excel
            if (firstLine.includes('\t')) delimiter = '\t';
            else if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
            else if (firstLine.includes(',')) delimiter = ',';
            else if (firstLine.includes('|')) delimiter = '|';

            const lines = text.split('\n').filter(l => l.trim().length > 0);
            if (lines.length < 2) {
                showToast('⚠️ Se requieren al menos 2 líneas (encabezados y 1 fila de datos).');
                return;
            }

            const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
            const rows = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
                const rowObj = {};
                headers.forEach((h, idx) => {
                    rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
                });
                rows.push(rowObj);
            }

            loadDataset(rows, 'datos_portapapeles.tsv', 'tabla_pegada');
            dom.pasteModal.classList.remove('active');
            dom.pasteTextarea.value = '';
            showToast(`📋 Se cargaron ${rows.length.toLocaleString()} filas desde el portapapeles.`);
        } catch (err) {
            console.error(err);
            showToast('❌ Error al procesar los datos pegados.');
        }
    }

    function loadPreset(presetKey) {
        const p = PRESETS[presetKey];
        if (!p) return;
        state.workbook = null;
        dom.sheetSelectorContainer.style.display = 'none';
        loadDataset(p.data, p.fileName, p.tableName);
        showToast(`⚡ Preset "${p.tableName}" activado.`);
    }

    // =========================================================================
    // CARGA Y NORMALIZACIÓN DE DATASET
    // =========================================================================
    function loadDataset(rows, fileName, suggestedTableName) {
        state.rawData = rows;
        state.fileName = fileName;
        state.tableName = engine.sanitizeIdentifier(suggestedTableName);
        dom.inputTableName.value = state.tableName;

        // Extraer nombres de columnas a partir de la primera fila o de las claves
        const sampleKeys = Object.keys(rows[0] || {});
        state.columns = sampleKeys.map((key, index) => {
            // Muestreo de valores para inferencia de tipo
            const sampleValues = rows.slice(0, 100).map(r => r[key]);
            const inferredType = engine.inferColumnType(sampleValues);
            const sqlName = engine.sanitizeIdentifier(key);

            // Auto-detectar Clave Primaria (PK): id, *_id, sku, codigo
            const lowerKey = key.toLowerCase();
            const isPkCandidate = index === 0 || lowerKey === 'id' || lowerKey.endsWith('_id') || lowerKey === 'sku' || lowerKey === 'codigo';

            return {
                originalName: key,
                sqlName: sqlName,
                type: inferredType,
                isPk: isPkCandidate,
                included: true
            };
        });

        // Asegurar que al menos una columna sea PK si hay candidatas
        const pkCount = state.columns.filter(c => c.isPk).length;
        if (pkCount === 0 && state.columns.length > 0) {
            state.columns[0].isPk = true;
        }

        // Actualizar UI
        updateSummaryStrip();
        renderMappingTable();
        renderDataPreview();
        generateSql();
    }

    function reInferTypes() {
        state.columns.forEach(col => {
            const sampleValues = state.rawData.slice(0, 100).map(r => r[col.originalName]);
            col.type = engine.inferColumnType(sampleValues);
        });
    }

    function clearData() {
        state.rawData = [];
        state.columns = [];
        state.workbook = null;
        state.generatedSql = '';
        state.generatedDdl = '';
        dom.tableSummaryStrip.style.display = 'none';
        dom.sheetSelectorContainer.style.display = 'none';
        dom.mappingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay archivo cargado. Arrastra una planilla arriba.</td></tr>';
        dom.sqlCodeOutput.value = '-- No hay datos cargados.';
        dom.previewTableContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 3rem;">No hay registros cargados.</div>';
        dom.ddlCodeOutput.value = '-- No hay definición DDL disponible.';
        updateMetrics({ totalStatements: 0, totalRows: 0, activeColumns: 0, formattedSize: '0 B' });
        showToast('🗑️ Datos limpiados.');
    }

    function updateSummaryStrip() {
        dom.tableSummaryStrip.style.display = 'flex';
        dom.fileNameTag.textContent = state.fileName;
        dom.fileMetaCounts.textContent = `${state.rawData.length.toLocaleString()} registros • ${state.columns.length} columnas detectadas`;
    }

    // =========================================================================
    // RENDERIZADO: TABLA DE MAPEO DE COLUMNAS (PASO 2)
    // =========================================================================
    function renderMappingTable() {
        if (!state.columns || state.columns.length === 0) {
            dom.mappingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay columnas cargadas.</td></tr>';
            return;
        }

        const typeOptions = [
            'INTEGER',
            'DECIMAL(12, 2)',
            'VARCHAR(255)',
            'TEXT',
            'BOOLEAN',
            'DATE',
            'DATETIME'
        ];

        let html = '';
        state.columns.forEach((col, idx) => {
            const isChecked = col.included ? 'checked' : '';
            const pkClass = col.isPk ? 'is-pk' : '';
            const pkLabel = col.isPk ? '🔑 PK' : 'No PK';

            const optionsHtml = typeOptions.map(t => {
                const selected = (col.type === t || (t.startsWith('VARCHAR') && col.type.startsWith('VARCHAR')) || (t.startsWith('DECIMAL') && col.type.startsWith('DECIMAL'))) ? 'selected' : '';
                return `<option value="${t}" ${selected}>${t}</option>`;
            }).join('');

            html += `
                <tr data-col-index="${idx}">
                    <td style="text-align: center; width: 48px;">
                        <input type="checkbox" class="col-include-chk" data-index="${idx}" ${isChecked}>
                    </td>
                    <td>
                        <strong style="color: #FFFFFF;">${escapeHtml(col.originalName)}</strong>
                    </td>
                    <td>
                        <input type="text" class="mapping-input-col" data-index="${idx}" value="${escapeHtml(col.sqlName)}" placeholder="nombre_sql">
                    </td>
                    <td>
                        <select class="mapping-select-type" data-index="${idx}">
                            ${optionsHtml}
                        </select>
                    </td>
                    <td style="text-align: center; width: 90px;">
                        <button type="button" class="pk-badge-toggle ${pkClass}" data-index="${idx}" title="Alternar Clave Primaria">
                            ${pkLabel}
                        </button>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.78rem; font-family: var(--font-mono);">
                        ${col.included ? '<span style="color: #34D399;">● Activa</span>' : '<span style="color: #64748B;">○ Omitida</span>'}
                    </td>
                </tr>
            `;
        });

        dom.mappingTableBody.innerHTML = html;

        // Asignar eventos interactivos
        dom.mappingTableBody.querySelectorAll('.col-include-chk').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                state.columns[index].included = e.target.checked;
                renderMappingTable();
                generateSql();
            });
        });

        dom.mappingTableBody.querySelectorAll('.mapping-input-col').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                state.columns[index].sqlName = engine.sanitizeIdentifier(e.target.value);
                generateSql();
            });
        });

        dom.mappingTableBody.querySelectorAll('.mapping-select-type').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                state.columns[index].type = e.target.value;
                generateSql();
            });
        });

        dom.mappingTableBody.querySelectorAll('.pk-badge-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index, 10);
                state.columns[index].isPk = !state.columns[index].isPk;
                renderMappingTable();
                generateSql();
            });
        });
    }

    // =========================================================================
    // RENDERIZADO: VISTA PREVIA DE DATOS (TABLA HTML)
    // =========================================================================
    function renderDataPreview() {
        if (!state.rawData || state.rawData.length === 0) {
            dom.previewTableContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 3rem;">No hay registros cargados.</div>';
            return;
        }

        const previewRows = state.rawData.slice(0, 50);
        const activeCols = state.columns.filter(c => c.included);

        let tableHtml = `
            <div style="padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.8rem; color: var(--text-secondary);">
                Mostrando los primeros <strong>${previewRows.length}</strong> de <strong>${state.rawData.length.toLocaleString()}</strong> registros.
            </div>
            <div class="table-responsive-wrapper" style="max-height: 480px;">
                <table class="mapping-table">
                    <thead>
                        <tr>
                            ${activeCols.map(c => `<th>${escapeHtml(c.sqlName)} ${c.isPk ? '🔑' : ''}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewRows.map(row => `
                            <tr>
                                ${activeCols.map(c => {
                                    const val = row[c.originalName] !== undefined ? row[c.originalName] : '';
                                    return `<td>${escapeHtml(String(val))}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        dom.previewTableContainer.innerHTML = tableHtml;
    }

    // =========================================================================
    // GENERACIÓN Y VISUALIZACIÓN DE SCRIPT SQL
    // =========================================================================
    function generateSql() {
        if (!state.rawData || state.rawData.length === 0) return;

        const result = engine.generateSqlScript({
            rows: state.rawData,
            columns: state.columns,
            tableName: state.tableName,
            dialectKey: state.dialectKey,
            operation: state.operation,
            batchSize: state.batchSize,
            includeTransaction: state.includeTransaction,
            includeCreateTable: state.includeCreateTable,
            includeDropTable: state.includeDropTable,
            includeComments: state.includeComments,
            emptyAsNull: state.emptyAsNull
        });

        state.generatedSql = result.sql;
        dom.sqlCodeOutput.value = result.sql;

        // DDL CREATE TABLE independiente
        state.generatedDdl = engine.buildCreateTable(state.tableName, state.columns, state.dialectKey);
        dom.ddlCodeOutput.value = state.generatedDdl;

        // Actualizar Métricas
        updateMetrics(result.stats);
    }

    function updateMetrics(stats) {
        if (!stats) return;
        dom.metricRows.textContent = (stats.totalRows || 0).toLocaleString();
        dom.metricStmts.textContent = (stats.totalStatements || 0).toLocaleString();
        dom.metricCols.textContent = (stats.activeColumns || state.columns.filter(c => c.included).length).toString();
        dom.metricSize.textContent = stats.formattedSize || '0 B';
        dom.metricDialect.textContent = engine.dialects[state.dialectKey]?.name || 'MySQL';
    }

    // =========================================================================
    // PESTAÑAS DEL VISOR DE SALIDA
    // =========================================================================
    function switchTab(tabKey) {
        state.activeTab = tabKey;

        dom.tabSqlBtn.classList.toggle('active', tabKey === 'sqlTab');
        dom.tabDataBtn.classList.toggle('active', tabKey === 'dataTab');
        dom.tabDdlBtn.classList.toggle('active', tabKey === 'ddlTab');

        document.getElementById('sqlViewerPane').style.display = tabKey === 'sqlTab' ? 'block' : 'none';
        document.getElementById('dataViewerPane').style.display = tabKey === 'dataTab' ? 'block' : 'none';
        document.getElementById('ddlViewerPane').style.display = tabKey === 'ddlTab' ? 'block' : 'none';
    }

    // =========================================================================
    // ACCIONES: COPIAR Y DESCARGAR
    // =========================================================================
    function copySqlToClipboard() {
        const textToCopy = state.activeTab === 'ddlTab' ? state.generatedDdl : state.generatedSql;
        if (!textToCopy) {
            showToast('⚠️ No hay contenido para copiar.');
            return;
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = dom.btnCopySql.innerHTML;
            dom.btnCopySql.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>¡Copiado!</span>
            `;
            dom.btnCopySql.style.background = 'rgba(16, 185, 129, 0.2)';
            dom.btnCopySql.style.borderColor = '#10B981';

            showToast('📋 Código SQL copiado al portapapeles.');

            setTimeout(() => {
                dom.btnCopySql.innerHTML = originalText;
                dom.btnCopySql.style.background = '';
                dom.btnCopySql.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            console.error(err);
            showToast('❌ Error al acceder al portapapeles.');
        });
    }

    function downloadSqlFile() {
        const content = state.activeTab === 'ddlTab' ? state.generatedDdl : state.generatedSql;
        if (!content) {
            showToast('⚠️ No hay script SQL para descargar.');
            return;
        }

        const baseName = state.activeTab === 'ddlTab' ? `create_${state.tableName}` : `${state.operation}_${state.tableName}`;
        const finalName = `${baseName}.sql`;

        const blob = new Blob([content], { type: 'text/sql;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`💾 Archivo "${finalName}" descargado.`);
    }

    // =========================================================================
    // MODAL DE AYUDA Y GUÍA DE USO
    // =========================================================================
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

    // =========================================================================
    // NOTIFICACIÓN TOAST
    // =========================================================================
    let toastTimeout = null;
    function showToast(message) {
        if (!dom.sqlToast) return;
        dom.sqlToast.textContent = message;
        dom.sqlToast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            dom.sqlToast.classList.remove('show');
        }, 3200);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Inicializar
    init();
});
