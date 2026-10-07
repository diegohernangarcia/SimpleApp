/**
 * SimpleApps Suite - Módulo #10: Unificador / Consolidador de Archivos Excel
 * consolidator-engine.js - Motor de Consolidación Multi-Buffer y Fusión de Esquemas en Memoria
 * 
 * Capacidades:
 * - Lectura multi-buffer de XLSX, XLS, ODS, CSV, TSV vía SheetJS
 * - Fusión inteligente de esquemas: Unión Completa, Intersección Estricta, Master Template
 * - Inyección automática de metadatos de procedencia (Archivo Origen, Hoja Origen)
 * - Omisión y deduplicación de cabeceras repetidas y filas nulas
 * - Detección y métricas de tipos de datos y cobertura de columnas
 * - 100% Local en RAM (Zero-Upload)
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['xlsx'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('xlsx'));
    } else {
        root.ExcelConsolidatorEngine = factory(root.XLSX);
    }
}(typeof self !== 'undefined' ? self : this, function (XLSX) {
    'use strict';

    if (!XLSX) {
        console.warn('ExcelConsolidatorEngine: SheetJS (XLSX) no está cargado aún en el entorno.');
    }

    /**
     * Limpia y normaliza texto de encabezados
     */
    function normalizeHeaderName(header, caseInsensitive = false) {
        if (header === null || header === undefined) return '';
        let str = String(header).trim();
        return caseInsensitive ? str.toLowerCase() : str;
    }

    /**
     * Parsea un archivo File / Blob / ArrayBuffer a objeto estructurado
     * @param {File|Blob|ArrayBuffer} fileInput
     * @param {string} fileName
     * @returns {Promise<Object>}
     */
    async function parseFile(fileInput, fileName = '') {
        const name = fileName || (fileInput && fileInput.name) || 'archivo_desconocido';
        const ext = name.split('.').pop().toLowerCase();
        
        let arrayBuffer;
        if (fileInput instanceof ArrayBuffer) {
            arrayBuffer = fileInput;
        } else if (fileInput instanceof Blob || (typeof File !== 'undefined' && fileInput instanceof File)) {
            arrayBuffer = await fileInput.arrayBuffer();
        } else {
            throw new Error(`Tipo de archivo o buffer no soportado para ${name}`);
        }

        const readOptions = {
            type: 'array',
            cellDates: true,
            raw: false,
            dateNF: 'yyyy-mm-dd'
        };

        let workbook;
        try {
            workbook = XLSX.read(arrayBuffer, readOptions);
        } catch (err) {
            // Reintento con codificación para CSV en caso de fallo
            if (ext === 'csv' || ext === 'tsv') {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(arrayBuffer);
                workbook = XLSX.read(text, { type: 'string' });
            } else {
                throw new Error(`Error al leer el archivo ${name}: ${err.message}`);
            }
        }

        const sheetsData = [];
        let totalRowsCount = 0;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Convertir hoja a matriz de objetos o filas
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, {
                header: 1, // Array de arrays para controlar cabeceras exactamente
                defval: '',
                blankrows: false
            });

            if (!jsonRows || jsonRows.length === 0) {
                sheetsData.push({
                    name: sheetName,
                    headers: [],
                    rows: [],
                    rowCount: 0
                });
                return;
            }

            // La primera fila no vacía es la cabecera
            let headerRowIndex = 0;
            while (headerRowIndex < jsonRows.length && jsonRows[headerRowIndex].every(cell => cell === '' || cell === null || cell === undefined)) {
                headerRowIndex++;
            }

            if (headerRowIndex >= jsonRows.length) {
                sheetsData.push({
                    name: sheetName,
                    headers: [],
                    rows: [],
                    rowCount: 0
                });
                return;
            }

            const rawHeaders = jsonRows[headerRowIndex].map((h, idx) => {
                const val = (h !== null && h !== undefined) ? String(h).trim() : '';
                return val || `Columna_${idx + 1}`;
            });

            // Evitar cabeceras duplicadas agregando sufijo
            const uniqueHeaders = [];
            const headerCounts = {};
            rawHeaders.forEach(h => {
                if (!headerCounts[h]) {
                    headerCounts[h] = 1;
                    uniqueHeaders.push(h);
                } else {
                    headerCounts[h]++;
                    uniqueHeaders.push(`${h}_${headerCounts[h]}`);
                }
            });

            // Filas de datos
            const dataRows = [];
            for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
                const row = jsonRows[i];
                // Verificar si no está completamente vacía
                const isBlank = row.every(cell => cell === '' || cell === null || cell === undefined);
                if (!isBlank) {
                    const rowObj = {};
                    uniqueHeaders.forEach((colName, colIdx) => {
                        const cellVal = row[colIdx];
                        rowObj[colName] = (cellVal !== undefined && cellVal !== null) ? cellVal : '';
                    });
                    dataRows.push(rowObj);
                }
            }

            sheetsData.push({
                name: sheetName,
                headers: uniqueHeaders,
                rows: dataRows,
                rowCount: dataRows.length
            });
            totalRowsCount += dataRows.length;
        });

        return {
            fileName: name,
            extension: ext,
            sizeBytes: arrayBuffer.byteLength,
            sheetNames: workbook.SheetNames,
            sheets: sheetsData,
            totalRows: totalRowsCount,
            workbookRef: workbook
        };
    }

    /**
     * Algoritmo principal de consolidación
     * @param {Array<Object>} parsedFiles Lista de archivos parseados con parseFile()
     * @param {Object} options Opciones de configuración
     * @returns {Object} Resultado de consolidación
     */
    function consolidateFiles(parsedFiles, options = {}) {
        const startTime = performance.now();

        const opts = {
            schemaMode: options.schemaMode || 'union', // 'union' | 'intersection' | 'template'
            addSourceFileCol: options.addSourceFileCol !== false, // default true
            sourceFileColName: options.sourceFileColName || 'Archivo_Origen',
            sourceColPosition: options.sourceColPosition || 'first', // 'first' | 'last'
            addSourceSheetCol: !!options.addSourceSheetCol, // default false
            sourceSheetColName: options.sourceSheetColName || 'Hoja_Origen',
            sheetMode: options.sheetMode || 'first', // 'first' | 'all' | 'by_name'
            targetSheetName: options.targetSheetName || '',
            caseInsensitiveHeaders: !!options.caseInsensitiveHeaders,
            trimCellWhitespace: options.trimCellWhitespace !== false,
            removeEmptyRows: options.removeEmptyRows !== false,
            removeDuplicateRows: !!options.removeDuplicateRows,
            ...options
        };

        if (!parsedFiles || parsedFiles.length === 0) {
            throw new Error('No se han proporcionado archivos para consolidar.');
        }

        // 1. Recolectar las tablas de datos según la política de hojas
        const fileDatasets = [];

        parsedFiles.forEach((fileObj, fileIndex) => {
            let activeSheets = [];

            if (opts.sheetMode === 'first') {
                if (fileObj.sheets.length > 0) {
                    activeSheets = [fileObj.sheets[0]];
                }
            } else if (opts.sheetMode === 'all') {
                activeSheets = fileObj.sheets;
            } else if (opts.sheetMode === 'by_name') {
                if (opts.targetSheetName) {
                    const match = fileObj.sheets.find(s => s.name.toLowerCase() === opts.targetSheetName.toLowerCase());
                    activeSheets = match ? [match] : [];
                } else {
                    activeSheets = fileObj.sheets.length > 0 ? [fileObj.sheets[0]] : [];
                }
            }

            activeSheets.forEach(sheet => {
                if (sheet.rows && sheet.rows.length > 0) {
                    fileDatasets.push({
                        fileName: fileObj.fileName,
                        sheetName: sheet.name,
                        headers: sheet.headers,
                        rows: sheet.rows,
                        fileIndex: fileIndex
                    });
                }
            });
        });

        if (fileDatasets.length === 0) {
            return {
                headers: [],
                rows: [],
                totalFiles: parsedFiles.length,
                totalRows: 0,
                totalColumns: 0,
                durationMs: performance.now() - startTime,
                fileSummary: parsedFiles.map(f => ({ name: f.fileName, rows: 0, sheets: f.sheetNames })),
                columnAnalysis: []
            };
        }

        // 2. Determinar el esquema unificado de columnas
        let masterHeaders = [];
        const headerFileOccurrences = {}; // Cuántos archivos contienen esta columna

        // Mapeo canónico si caseInsensitiveHeaders está activo
        const canonicalHeaderMap = new Map(); // lowercase -> original preferred casing

        fileDatasets.forEach(ds => {
            const seenInThisDataset = new Set();
            ds.headers.forEach(h => {
                const key = opts.caseInsensitiveHeaders ? h.toLowerCase() : h;
                if (!canonicalHeaderMap.has(key)) {
                    canonicalHeaderMap.set(key, h);
                }
                const canonicalName = canonicalHeaderMap.get(key);

                if (!seenInThisDataset.has(canonicalName)) {
                    seenInThisDataset.add(canonicalName);
                    headerFileOccurrences[canonicalName] = (headerFileOccurrences[canonicalName] || 0) + 1;
                }
            });
        });

        if (opts.schemaMode === 'template') {
            // Basado exclusivamente en el primer conjunto de datos
            masterHeaders = [...fileDatasets[0].headers];
        } else if (opts.schemaMode === 'intersection') {
            // Solo columnas presentes en TODOS los conjuntos de datos
            const totalDatasets = fileDatasets.length;
            masterHeaders = Object.keys(headerFileOccurrences).filter(
                col => headerFileOccurrences[col] === totalDatasets
            );
        } else {
            // 'union': todas las columnas únicas respetando el orden de aparición
            const seen = new Set();
            fileDatasets.forEach(ds => {
                ds.headers.forEach(h => {
                    const key = opts.caseInsensitiveHeaders ? h.toLowerCase() : h;
                    const canonical = canonicalHeaderMap.get(key) || h;
                    if (!seen.has(canonical)) {
                        seen.add(canonical);
                        masterHeaders.push(canonical);
                    }
                });
            });
        }

        // 3. Preparar encabezados finales con metadatos de procedencia
        const finalHeaders = [...masterHeaders];
        const sourceColName = opts.sourceFileColName.trim() || 'Archivo_Origen';
        const sourceSheetColName = opts.sourceSheetColName.trim() || 'Hoja_Origen';

        if (opts.addSourceSheetCol) {
            if (opts.sourceColPosition === 'first') {
                finalHeaders.unshift(sourceSheetColName);
            } else {
                finalHeaders.push(sourceSheetColName);
            }
        }

        if (opts.addSourceFileCol) {
            if (opts.sourceColPosition === 'first') {
                finalHeaders.unshift(sourceColName);
            } else {
                finalHeaders.push(sourceColName);
            }
        }

        // 4. Procesar y unificar las filas
        const consolidatedRows = [];
        const seenRowHashes = opts.removeDuplicateRows ? new Set() : null;

        const fileSummaryMap = {};
        parsedFiles.forEach(f => {
            fileSummaryMap[f.fileName] = {
                name: f.fileName,
                contributedRows: 0,
                sheetsIncluded: []
            };
        });

        fileDatasets.forEach(ds => {
            if (!fileSummaryMap[ds.fileName].sheetsIncluded.includes(ds.sheetName)) {
                fileSummaryMap[ds.fileName].sheetsIncluded.push(ds.sheetName);
            }

            // Mapeo rápido de columnas del dataset al nombre canónico
            const dsColMap = new Map();
            ds.headers.forEach(col => {
                const key = opts.caseInsensitiveHeaders ? col.toLowerCase() : col;
                const canonical = canonicalHeaderMap.get(key) || col;
                dsColMap.set(canonical, col);
            });

            ds.rows.forEach(row => {
                const unifiedRow = {};

                // Inyectar columnas de origen
                if (opts.addSourceFileCol) {
                    unifiedRow[sourceColName] = ds.fileName;
                }
                if (opts.addSourceSheetCol) {
                    unifiedRow[sourceSheetColName] = ds.sheetName;
                }

                // Inyectar columnas de datos
                masterHeaders.forEach(colName => {
                    const actualColName = dsColMap.get(colName);
                    let cellVal = (actualColName && row[actualColName] !== undefined) ? row[actualColName] : '';
                    if (opts.trimCellWhitespace && typeof cellVal === 'string') {
                        cellVal = cellVal.trim();
                    }
                    unifiedRow[colName] = cellVal;
                });

                // Deduplicación si está activa
                if (opts.removeDuplicateRows) {
                    // Hash basado en las columnas de datos maestros (no en el archivo de origen)
                    const hashData = masterHeaders.map(col => String(unifiedRow[col] || '')).join('|||');
                    if (seenRowHashes.has(hashData)) {
                        return; // Omitir duplicado
                    }
                    seenRowHashes.add(hashData);
                }

                consolidatedRows.push(unifiedRow);
                fileSummaryMap[ds.fileName].contributedRows++;
            });
        });

        // 5. Análisis estadístico de columnas unificadas
        const columnAnalysis = masterHeaders.map(colName => {
            const occurrences = headerFileOccurrences[colName] || 0;
            const presencePercent = Math.round((occurrences / fileDatasets.length) * 100);
            
            // Inferencia de tipo en base a las primeras 100 filas
            let numericCount = 0;
            let dateCount = 0;
            let totalChecked = 0;

            for (let i = 0; i < Math.min(consolidatedRows.length, 100); i++) {
                const val = consolidatedRows[i][colName];
                if (val !== '' && val !== null && val !== undefined) {
                    totalChecked++;
                    if (!isNaN(Number(val)) && !isNaN(parseFloat(val))) {
                        numericCount++;
                    } else if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
                        dateCount++;
                    }
                }
            }

            let inferredType = 'Texto';
            if (totalChecked > 0) {
                if (numericCount / totalChecked > 0.8) inferredType = 'Numérico';
                else if (dateCount / totalChecked > 0.8) inferredType = 'Fecha';
            }

            return {
                name: colName,
                presenceFiles: occurrences,
                totalFiles: fileDatasets.length,
                presencePercent: presencePercent,
                inferredType: inferredType
            };
        });

        const durationMs = performance.now() - startTime;

        return {
            headers: finalHeaders,
            dataHeaders: masterHeaders,
            rows: consolidatedRows,
            totalFiles: parsedFiles.length,
            totalDatasets: fileDatasets.length,
            totalRows: consolidatedRows.length,
            totalColumns: finalHeaders.length,
            durationMs: Number(durationMs.toFixed(1)),
            fileSummary: Object.values(fileSummaryMap),
            columnAnalysis: columnAnalysis,
            optionsUsed: opts
        };
    }

    /**
     * Construye un libro de Excel XLSX a partir del dataset consolidado
     * @param {Object} consolidationResult Resultado de consolidateFiles()
     * @param {string} sheetName Nombre de la hoja en el libro maestro
     * @returns {Uint8Array} Archivo Excel en binario
     */
    function createMasterWorkbookBinary(consolidationResult, sheetName = 'Consolidado_Maestro') {
        const wb = XLSX.utils.book_new();
        
        // Crear hoja a partir de JSON respetando el orden estricto de headers
        const ws = XLSX.utils.json_to_sheet(consolidationResult.rows, {
            header: consolidationResult.headers
        });

        // Configurar anchos de columna automáticos sugeridos
        const colWidths = consolidationResult.headers.map(header => {
            let maxLen = header.length;
            // Muestreo de longitud
            const sampleCount = Math.min(consolidationResult.rows.length, 60);
            for (let i = 0; i < sampleCount; i++) {
                const val = consolidationResult.rows[i][header];
                if (val !== null && val !== undefined) {
                    maxLen = Math.max(maxLen, String(val).length);
                }
            }
            return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
        });
        ws['!cols'] = colWidths;

        // Limpiar nombre de hoja (Excel no admite : \ / ? * [ ])
        const cleanSheetName = String(sheetName).replace(/[:\\/?*\[\]]/g, '_').substring(0, 31) || 'Consolidado';
        XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

        // Generar binario
        const wbBinary = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array'
        });

        return new Uint8Array(wbBinary);
    }

    /**
     * Exporta el dataset consolidado a formato CSV estándar RFC-4180 con BOM UTF-8
     * @param {Object} consolidationResult 
     * @returns {string} Texto CSV listo con BOM
     */
    function exportToCsvText(consolidationResult) {
        const headers = consolidationResult.headers;
        const rows = consolidationResult.rows;

        const escapeCsvCell = (val) => {
            if (val === null || val === undefined) return '';
            let str = String(val);
            if (str.includes('"') || str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
                str = '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const lines = [];
        // Cabecera
        lines.push(headers.map(escapeCsvCell).join(','));

        // Filas
        rows.forEach(row => {
            const rowValues = headers.map(h => escapeCsvCell(row[h]));
            lines.push(rowValues.join(','));
        });

        // Retornar con BOM UTF-8 (\uFEFF) para correcta apertura en Excel
        return '\uFEFF' + lines.join('\r\n');
    }

    return {
        parseFile,
        consolidateFiles,
        createMasterWorkbookBinary,
        exportToCsvText,
        normalizeHeaderName
    };
}));
