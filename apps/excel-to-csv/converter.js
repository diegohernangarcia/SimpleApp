/**
 * SimpleApps Suite - De Excel a CSV
 * converter.js - Motor de Extracción y Conversión Multi-Hoja 100% Local
 * Utiliza SheetJS (xlsx.full.min.js) y JSZip (jszip.min.js) sin conexiones externas.
 */

class ExcelToCsvConverter {
    constructor() {
        this.delimiters = {
            ',': 'Coma (,)',
            ';': 'Punto y coma (;)',
            '\t': 'Tabulación (TSV)',
            '|': 'Pipe (|)'
        };
    }

    /**
     * Lee un archivo Excel (.xlsx, .xls, .xlsm, .ods, .xlsb) y extrae todas sus hojas
     * @param {File} file Objeto File proveniente de input o drag&drop
     * @returns {Promise<Object>} Información del libro y lista detallada de hojas
     */
    async parseWorkbook(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    // Lectura del libro con soporte de fechas
                    const workbook = XLSX.read(data, {
                        type: 'array',
                        cellDates: true,
                        cellText: false,
                        cellNF: true
                    });

                    const baseName = file.name.replace(/\.[^/.]+$/, "");
                    const sheets = [];

                    for (const sheetName of workbook.SheetNames) {
                        const worksheet = workbook.Sheets[sheetName];
                        if (!worksheet) continue;

                        // Convertir a matriz 2D con valores sin recortar
                        const rawMatrix = XLSX.utils.sheet_to_json(worksheet, {
                            header: 1,
                            raw: false,
                            defval: '',
                            blankrows: false
                        });

                        // Determinar cantidad de filas y columnas efectivas
                        const rowCount = rawMatrix.length;
                        let maxCols = 0;
                        for (let r = 0; r < Math.min(rawMatrix.length, 100); r++) {
                            if (rawMatrix[r] && rawMatrix[r].length > maxCols) {
                                maxCols = rawMatrix[r].length;
                            }
                        }

                        // Encabezados (primera fila no vacía)
                        const headers = rawMatrix.length > 0 ? rawMatrix[0].map(h => String(h || '').trim()) : [];

                        // Limpiar nombre sugerido de archivo CSV
                        const safeSheetName = sheetName.replace(/[\/\\?%*:|"<>]/g, '_').trim();
                        const suggestedCsvName = `${baseName}_${safeSheetName}.csv`;

                        sheets.push({
                            id: 'sheet_' + Math.random().toString(36).substring(2, 9),
                            name: sheetName,
                            safeName: safeSheetName,
                            suggestedFileName: suggestedCsvName,
                            rowCount: rowCount,
                            colCount: maxCols,
                            headers: headers,
                            matrix: rawMatrix,
                            selected: true,
                            previewSample: rawMatrix.slice(0, 30) // Primeras 30 filas para preview
                        });
                    }

                    resolve({
                        fileId: 'excel_' + Math.random().toString(36).substring(2, 9),
                        fileName: file.name,
                        baseName: baseName,
                        fileSize: file.size,
                        fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        sheetCount: sheets.length,
                        sheets: sheets
                    });
                } catch (err) {
                    reject(new Error(`Error al procesar el archivo Excel "${file.name}": ${err.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error(`No se pudo leer el archivo "${file.name}".`));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Convierte una matriz 2D de datos de hoja a formato CSV cumpliendo con el estándar RFC 4180
     * @param {Array<Array<any>>} matrix Matriz de celdas
     * @param {Object} options Opciones de configuración
     * @returns {Object} { csvString, blob, sizeBytes }
     */
    generateCsv(matrix, options = {}) {
        const delimiter = options.delimiter || ',';
        const encoding = options.encoding || 'utf-8-bom'; // 'utf-8-bom', 'utf-8', 'latin1'
        const quotePolicy = options.quotePolicy || 'minimal'; // 'minimal', 'all_text', 'always'
        const trimWhitespace = options.trimWhitespace !== false;
        const skipEmptyRows = options.skipEmptyRows !== false;

        const lines = [];

        for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
            const row = matrix[rowIndex] || [];
            
            // Verificar si la fila está completamente vacía
            if (skipEmptyRows) {
                const hasValue = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
                if (!hasValue) continue;
            }

            const formattedRow = row.map(cell => {
                let val = (cell === null || cell === undefined) ? '' : String(cell);
                if (trimWhitespace) {
                    val = val.trim();
                }

                // Determinar si el campo debe ser encomillado
                let needQuotes = false;

                if (quotePolicy === 'always') {
                    needQuotes = true;
                } else if (quotePolicy === 'all_text') {
                    // Si no es un número puro, encomillar
                    const isNum = /^-?\d+(\.\d+)?$/.test(val);
                    needQuotes = !isNum || val === '';
                } else {
                    // RFC 4180 minimal: encomillar si contiene delimitador, comillas, o salto de línea
                    if (val.includes(delimiter) || val.includes('"') || val.includes('\n') || val.includes('\r')) {
                        needQuotes = true;
                    }
                }

                // Escapar comillas dobles internas duplicándolas ("" en lugar de ")
                if (val.includes('"')) {
                    val = val.replace(/"/g, '""');
                    needQuotes = true; // Por RFC 4180 debe ir entre comillas
                }

                return needQuotes ? `"${val}"` : val;
            });

            lines.push(formattedRow.join(delimiter));
        }

        const csvContent = lines.join('\r\n');
        let blob;

        if (encoding === 'utf-8-bom') {
            // UTF-8 con BOM (Byte Order Mark \uFEFF) para máxima compatibilidad con Microsoft Excel en español/Windows
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
            const encoder = new TextEncoder();
            const encodedContent = encoder.encode(csvContent);
            const combined = new Uint8Array(bom.length + encodedContent.length);
            combined.set(bom, 0);
            combined.set(encodedContent, bom.length);
            blob = new Blob([combined], { type: 'text/csv;charset=utf-8' });
        } else if (encoding === 'latin1') {
            // Codificación Latin-1 / ISO-8859-1 para sistemas legacy
            const buffer = new Uint8Array(csvContent.length);
            for (let i = 0; i < csvContent.length; i++) {
                buffer[i] = csvContent.charCodeAt(i) & 0xFF;
            }
            blob = new Blob([buffer], { type: 'text/csv;charset=iso-8859-1' });
        } else {
            // UTF-8 estándar sin BOM (estándar para Linux, Python, Base de datos)
            blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        }

        return {
            csvString: csvContent,
            blob: blob,
            sizeBytes: blob.size,
            rowCount: lines.length
        };
    }

    /**
     * Empaqueta múltiples archivos CSV en un archivo comprimido .ZIP
     * @param {Array<{filename: string, blob: Blob}>} filesToZip
     * @returns {Promise<Blob>} Blob del archivo ZIP
     */
    async createZipPackage(filesToZip) {
        if (!window.JSZip) {
            throw new Error('La librería JSZip no está disponible.');
        }

        const zip = new JSZip();
        for (const item of filesToZip) {
            zip.file(item.filename, item.blob);
        }

        return await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    /**
     * Genera un libro Excel (.xlsx) de ejemplo en memoria con 3 hojas para pruebas rápidas
     * @returns {Object} { fileName, file }
     */
    createSampleWorkbook() {
        const wb = XLSX.utils.book_new();

        // Hoja 1: Ventas y Finanzas
        const ventasData = [
            ["ID_Transaccion", "Fecha", "Vendedor", "Region", "Categoria", "Importe_USD", "Metodo_Pago", "Estado"],
            ["TX-1001", "2024-01-15", "Carlos Gómez", "América del Sur", "Hardware", 1250.00, "Transferencia", "Completado"],
            ["TX-1002", "2024-01-16", "Mariana López", "Europa", "Software", 480.50, "Tarjeta de Crédito", "Completado"],
            ["TX-1003", "2024-01-18", "Andrés Martínez", "Norteamérica", "Servicios Cloud", 3100.00, "Transferencia", "Pendiente"],
            ["TX-1004", "2024-01-20", "Valeria Rossi", "América del Sur", "Hardware", 950.00, "Tarjeta de Crédito", "Completado"],
            ["TX-1005", "2024-01-22", "Carlos Gómez", "Europa", "Consultoría", 2200.00, "Transferencia", "Completado"],
            ["TX-1006", "2024-01-25", "Sofía Fernández", "América del Sur", "Software", 750.25, "Tarjeta de Débito", "Completado"]
        ];
        const wsVentas = XLSX.utils.aoa_to_sheet(ventasData);
        XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas_2024");

        // Hoja 2: Cartera de Clientes
        const clientesData = [
            ["Codigo_Cliente", "Razon_Social", "Identificacion_Fiscal", "Pais", "Email_Contacto", "Telefono", "Segmento"],
            ["CLI-001", "TechNova Soluciones S.A.", "30-71458962-4", "Argentina", "contacto@technova.com.ar", "+54 11 4567-8900", "Enterprise"],
            ["CLI-002", "Iberia Cloud Labs S.L.", "B-88741256", "España", "info@iberiacloud.es", "+34 91 234 5678", "Corporate"],
            ["CLI-003", "Andina Logistics Corp", "901.458.712-3", "Colombia", "soporte@andinalog.co", "+57 1 890 1234", "Pyme"],
            ["CLI-004", "Global Retail Systems Inc", "84-1234567", "Estados Unidos", "orders@globalretail.com", "+1 305 555 0199", "Enterprise"],
            ["CLI-005", "Austral BioTech Ltda", "76.890.123-K", "Chile", "ventas@australbiotech.cl", "+56 2 2345 6789", "Corporate"]
        ];
        const wsClientes = XLSX.utils.aoa_to_sheet(clientesData);
        XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes_Corporativos");

        // Hoja 3: Inventario de Depósito
        const stockData = [
            ["SKU", "Descripcion_Producto", "Marca", "Ubicacion_Deposito", "Stock_Actual", "Punto_Reorden", "Costo_Unitario"],
            ["HW-SRV-01", "Servidor Rack 1U Xeon Gold 64GB", "Dell PowerEdge", "Depósito Norte - Pasillo A3", 14, 5, 2450.00],
            ["HW-SWT-24", "Switch Administrable 24 Puertos Gigabit", "Cisco Catalyst", "Depósito Norte - Pasillo B1", 38, 10, 420.00],
            ["NW-CAB-C6", "Bobina Cable UTP Categoría 6 (305m)", "Furukawa", "Depósito Sur - Estante 4", 85, 20, 115.50],
            ["PER-MOU-WL", "Mouse Ergonómico Inalámbrico Bluetooth", "Logitech MX Master", "Depósito Centro - Nivel 2", 120, 25, 78.90],
            ["UPS-1500VA", "Sistema UPS Online 1500VA Torre", "APC Smart-UPS", "Depósito Norte - Pasillo C2", 22, 8, 590.00]
        ];
        const wsStock = XLSX.utils.aoa_to_sheet(stockData);
        XLSX.utils.book_append_sheet(wb, wsStock, "Inventario_Stock");

        // Generar archivo binario XLSX
        const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        return new File([blob], "Demo_Empresa_MultiHoja.xlsx", {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    /**
     * Formatea el tamaño en bytes a KB o MB legibles
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Exponer la instancia en el ámbito global (navegador o node)
if (typeof window !== 'undefined') {
    window.excelToCsvConverter = new ExcelToCsvConverter();
} else if (typeof global !== 'undefined') {
    global.excelToCsvConverter = new ExcelToCsvConverter();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelToCsvConverter;
}
