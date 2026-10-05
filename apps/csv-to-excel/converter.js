/**
 * SimpleApps Suite - De CSV a Excel (.xlsx)
 * converter.js - Motor de Parsing y Generación Excel 100% Local con SheetJS
 */

class CsvToExcelConverter {
    constructor() {
        // Delimitadores soportados para autodetección
        this.commonDelimiters = [',', ';', '\t', '|'];
    }

    /**
     * Detecta automáticamente el delimitador más probable de un texto CSV
     * @param {string} text Primeras líneas del archivo
     * @returns {string} El delimitador detectado
     */
    detectDelimiter(text) {
        if (!text) return ',';
        const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0).slice(0, 15);
        if (lines.length === 0) return ',';

        const scores = {};
        for (const delim of this.commonDelimiters) {
            scores[delim] = 0;
            const countsPerLine = lines.map(line => {
                // Contar delimitadores fuera de comillas dobles
                let count = 0;
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') inQuotes = !inQuotes;
                    else if (char === delim && !inQuotes) count++;
                }
                return count;
            });

            // Si todas las líneas tienen la misma cantidad mayor a 0, excelente candidato
            const first = countsPerLine[0];
            if (first > 0 && countsPerLine.every(c => c === first)) {
                scores[delim] = first * 10;
            } else {
                // Promedio ponderado
                const sum = countsPerLine.reduce((a, b) => a + b, 0);
                scores[delim] = sum / countsPerLine.length;
            }
        }

        let bestDelim = ',';
        let maxScore = -1;
        for (const [delim, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestDelim = delim;
            }
        }

        return maxScore > 0 ? bestDelim : ',';
    }

    /**
     * Parser CSV robusto compatible con el estándar RFC 4180
     * Maneja comillas dobles, comas internas, saltos de línea dentro de campos y escape de comillas ("")
     * @param {string} text Contenido del archivo CSV
     * @param {string} delimiter Delimitador (',', ';', '\t', '|')
     * @param {Object} options Opciones de tipado
     * @returns {Array<Array<any>>} Matriz bidimensional de celdas
     */
    parseCsvToMatrix(text, delimiter = ',', options = {}) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;

        const preserveLeadingZeros = options.preserveLeadingZeros || false;
        const inferTypes = options.inferTypes !== false;

        const formatField = (val) => {
            val = val.trim();
            if (!inferTypes) return val;
            if (val === '') return null;

            // Si se deben preservar ceros a la izquierda (ej. "00123", códigos postales, DNI)
            if (preserveLeadingZeros && /^0\d+$/.test(val)) {
                return val;
            }

            // Detección de números enteros o decimales (soporta punto y coma como separador decimal si es consistente)
            if (/^-?\d+(\.\d+)?$/.test(val)) {
                const num = Number(val);
                if (!isNaN(num) && isFinite(num)) return num;
            }

            // Decimales con coma (ej. "12,50" cuando el delimitador de campos NO es coma)
            if (delimiter !== ',' && /^-?\d+(,\d+)?$/.test(val)) {
                const num = Number(val.replace(',', '.'));
                if (!isNaN(num) && isFinite(num)) return num;
            }

            // Booleanos
            const lower = val.toLowerCase();
            if (lower === 'true' || lower === 'verdadero') return true;
            if (lower === 'false' || lower === 'falso') return false;

            return val;
        };

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Comilla doble escapada dentro de campo ("")
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                // Fin de campo
                currentRow.push(formatField(currentField));
                currentField = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                // Fin de línea
                if (char === '\r' && nextChar === '\n') i++; // Consumir \r\n completo
                currentRow.push(formatField(currentField));
                currentField = '';
                // Evitar filas vacías al final
                if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== null)) {
                    rows.push(currentRow);
                }
                currentRow = [];
            } else {
                currentField += char;
            }
        }

        // Agregar último campo pendiente si el archivo no termina en salto de línea
        if (currentField.length > 0 || currentRow.length > 0) {
            currentRow.push(formatField(currentField));
            rows.push(currentRow);
        }

        return rows;
    }

    /**
     * Limpia y sanitiza el nombre de la hoja según las restricciones estrictas de Excel:
     * - Longitud máxima de 31 caracteres
     * - No puede contener los caracteres: \ / ? * : [ ]
     * @param {string} rawName Nombre original
     * @param {Array<string>} existingNames Nombres de hojas existentes para evitar duplicados
     * @returns {string} Nombre sanitizado y único
     */
    sanitizeSheetName(rawName, existingNames = []) {
        let name = (rawName || 'Hoja1')
            .replace(/[\\\/\?\*\:\[\]]/g, '_')
            .trim();

        if (name.length > 31) {
            name = name.substring(0, 31).trim();
        }
        if (!name) name = 'Hoja';

        // Asegurar unicidad si ya existe otra hoja con el mismo nombre
        let uniqueName = name;
        let counter = 1;
        while (existingNames.includes(uniqueName.toLowerCase())) {
            const suffix = ` (${counter})`;
            const baseLen = 31 - suffix.length;
            uniqueName = name.substring(0, baseLen) + suffix;
            counter++;
        }

        return uniqueName;
    }

    /**
     * Convierte una matriz bidimensional a un Worksheet de SheetJS con auto-ancho de columnas
     * @param {Array<Array<any>>} matrix Datos de la hoja
     * @returns {Object} SheetJS Worksheet
     */
    createWorksheet(matrix) {
        if (!window.XLSX) {
            throw new Error("La librería SheetJS (XLSX) no está disponible en la página.");
        }

        const ws = window.XLSX.utils.aoa_to_sheet(matrix);

        // Calcular auto-ajuste de ancho de columnas (Col Widths)
        if (matrix.length > 0) {
            const colWidths = [];
            const maxCols = Math.max(...matrix.slice(0, 100).map(r => r.length));

            for (let c = 0; c < maxCols; c++) {
                let maxLen = 10;
                for (let r = 0; r < Math.min(matrix.length, 100); r++) {
                    const cellVal = matrix[r][c];
                    if (cellVal !== undefined && cellVal !== null) {
                        const len = String(cellVal).length;
                        if (len > maxLen) maxLen = len;
                    }
                }
                colWidths.push({ wch: Math.min(maxLen + 3, 50) });
            }
            ws['!cols'] = colWidths;
        }

        return ws;
    }

    /**
     * Genera un único archivo Excel (.xlsx) a partir de un archivo CSV
     * @param {Object} fileItem Datos del archivo procesado
     * @param {Object} options Opciones de formato
     * @returns {Blob} Archivo binario Excel (.xlsx)
     */
    generateSingleWorkbook(fileItem, options = {}) {
        const wb = window.XLSX.utils.book_new();
        const sheetName = this.sanitizeSheetName(fileItem.sheetName || fileItem.name);
        const ws = this.createWorksheet(fileItem.data);

        window.XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const wbout = window.XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
            compression: true
        });

        return new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    /**
     * Genera un libro consolidado (.xlsx) con MÚLTIPLES HOJAS a partir de todos los CSV adjuntos
     * @param {Array<Object>} filesList Lista de archivos procesados
     * @param {Object} options Opciones de formato
     * @returns {Blob} Archivo binario Excel (.xlsx) consolidado
     */
    generateConsolidatedWorkbook(filesList, options = {}) {
        if (!filesList || filesList.length === 0) {
            throw new Error("No hay archivos CSV seleccionados para consolidar.");
        }

        const wb = window.XLSX.utils.book_new();
        const usedSheetNames = [];

        for (const fileItem of filesList) {
            const desiredName = fileItem.sheetName || fileItem.name.replace(/\.[^/.]+$/, "");
            const uniqueName = this.sanitizeSheetName(desiredName, usedSheetNames);
            usedSheetNames.push(uniqueName.toLowerCase());

            const ws = this.createWorksheet(fileItem.data);
            window.XLSX.utils.book_append_sheet(wb, ws, uniqueName);
        }

        const wbout = window.XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
            compression: true
        });

        return new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    /**
     * Genera un archivo ZIP conteniendo cada archivo Excel (.xlsx) de manera individual
     * @param {Array<Object>} filesList Lista de archivos procesados
     * @param {Object} options Opciones
     * @returns {Promise<Blob>} Archivo ZIP comprimido
     */
    async generateZipOfWorkbooks(filesList, options = {}) {
        if (typeof JSZip === 'undefined') {
            throw new Error("La librería JSZip no está disponible para empaquetar archivos ZIP.");
        }

        const zip = new JSZip();

        for (const fileItem of filesList) {
            const excelBlob = this.generateSingleWorkbook(fileItem, options);
            const filename = (fileItem.outputName || fileItem.name.replace(/\.[^/.]+$/, "")) + '.xlsx';
            zip.file(filename, excelBlob);
        }

        return await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    /**
     * Lee el contenido de un archivo como texto respetando la codificación especificada
     * @param {File} file Objeto File del navegador
     * @param {string} encoding Codificación ('UTF-8', 'ISO-8859-1', 'windows-1252')
     * @returns {Promise<string>} Contenido decodificado
     */
    async readFileAsText(file, encoding = 'UTF-8') {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buffer);
    }
}

// Instancia global
window.csvToExcelConverter = new CsvToExcelConverter();
