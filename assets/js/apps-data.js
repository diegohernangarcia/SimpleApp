/**
 * SimpleApps Suite - Catálogo de Micro-Aplicaciones
 * Datos y configuración de las 10 micro-apps iniciales
 */

const APPS_DATA = [
    {
        id: "csv-to-excel",
        number: "01",
        title: "De CSV a Excel",
        shortTitle: "CSV a Excel",
        category: "excel",
        categoryName: "Archivos & Excel",
        color: "#10B981", // Emerald
        gradient: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>`,
        description: "Convierte uno o múltiples archivos CSV a Excel (.xlsx). Permite generar un solo libro consolidado con múltiples hojas o archivos Excel independientes.",
        features: ["Conversión Multi-CSV", "1 Libro con Múltiples Hojas", "Excels Separados / ZIP", "Autodetección Delimitador"],
        status: "desarrollada", // desarrollada | en-proceso
        targetUrl: "apps/csv-to-excel/",
        tech: "Vanilla JS / SheetJS",
        specs: {
            input: "Uno o múltiples archivos .csv, .tsv o .txt",
            output: "Libro consolidado con múltiples hojas o archivos .xlsx separados",
            execution: "Procesamiento 100% local en tu navegador"
        }
    },
    {
        id: "excel-to-csv",
        number: "02",
        title: "De Excel a CSV",
        shortTitle: "Excel a CSV",
        category: "excel",
        categoryName: "Archivos & Excel",
        color: "#06B6D4", // Cyan
        gradient: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="m9 14 3 3 3-3"/><path d="M12 9v8"/></svg>`,
        description: "Convierte libros de Excel (.xlsx, .xls, .xlsm, .ods) con múltiples hojas a archivos CSV independientes. Exporta cada hoja a su propio archivo CSV o descarga todos juntos en un paquete .ZIP.",
        features: ["1 CSV por cada Hoja", "Descarga Individual o en .ZIP", "Previsualización de Hojas", "Delimitadores (, ; TAB |)"],
        status: "desarrollada",
        targetUrl: "apps/excel-to-csv/",
        tech: "Vanilla JS / SheetJS / JSZip",
        specs: {
            input: "Archivos Excel (.xlsx, .xls, .xlsm, .ods)",
            output: "Archivos .csv independientes por hoja o comprimidos en .zip",
            execution: "Procesamiento 100% local en tu navegador"
        }
    },
    {
        id: "diff-viewer",
        number: "03",
        title: "Diff Viewer",
        shortTitle: "Diff Viewer",
        category: "texto",
        categoryName: "Texto & Código",
        color: "#8B5CF6", // Electric Violet
        gradient: "linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>`,
        description: "Comparador visual de texto, código fuente y archivos estructurados. Visualización lado a lado (Side-by-Side) o unificada con resaltado de adiciones, borrados y cambios palabra por palabra.",
        features: ["Vista Side-by-Side", "Resaltado de Sintaxis", "Diferencias Inline", "Estadísticas de Cambios"],
        status: "desarrollada",
        targetUrl: "apps/diff-viewer/",
        tech: "Diff Match Patch / Vanilla JS",
        specs: {
            input: "Dos bloques de texto, código o archivos para comparar",
            output: "Visualización gráfica de diferencias y exportación de parche .diff",
            execution: "Comparación instantánea local de alto rendimiento"
        }
    },
    {
        id: "linux-permissions",
        number: "04",
        title: "Calculadora de Permisos Linux",
        shortTitle: "Permisos Chmod",
        category: "sysadmin",
        categoryName: "Dev & SysAdmin",
        color: "#EC4899", // Neon Pink
        gradient: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
        description: "Calculadora visual e interactiva de permisos Unix/Linux. Conversión bidireccional inmediata entre notación octal (755, 644, 777), simbólica (rwxr-xr-x), matriz de checkboxes y generador de comandos chmod.",
        features: ["Modo Octal / Simbólico", "Generador Chmod -R", "Cálculo de Umask", "Plantillas habituales"],
        status: "desarrollada",
        targetUrl: "apps/linux-permissions/",
        tech: "Matemática Binaria / Vanilla JS",
        specs: {
            input: "Clics visuales de permisos, valor octal (ej. 755) o cadena rwx",
            output: "Código chmod exacto, explicación detallada de seguridad y comando listo para terminal",
            execution: "Cálculo instantáneo reactivo en milisegundos"
        }
    },
    {
        id: "doc-to-markdown",
        number: "05",
        title: "Conversor PDF / Doc / Docx / ODT a MarkDown",
        shortTitle: "Docs a Markdown",
        category: "texto",
        categoryName: "Texto & Código",
        color: "#F59E0B", // Amber
        gradient: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        description: "Transforma documentos PDF, Word (.docx, .doc), OpenDocument (.odt) o texto enriquecido pegado desde el portapapeles a formato Markdown (.md) preservando títulos, listas y tablas.",
        features: ["PDF, DOCX, ODT y DOC", "Pegado Enriquecido", "Tablas y Títulos a MD", "Vista Dividida en Vivo"],
        status: "desarrollada",
        targetUrl: "apps/doc-to-markdown/",
        tech: "Mammoth.js / PDF.js / JSZip / Turndown",
        specs: {
            input: "Archivos .pdf, .docx, .doc, .odt o texto enriquecido del portapapeles",
            output: "Texto Markdown estructurado (.md) con vista previa en vivo",
            execution: "Procesamiento 100% local en el navegador"
        }
    },
    {
        id: "ascii-tree",
        number: "06",
        title: "Generador de Árbol de Carpetas (ASCII Tree)",
        shortTitle: "ASCII Tree Generator",
        category: "sysadmin",
        categoryName: "Dev & SysAdmin",
        color: "#3B82F6", // Electric Blue
        gradient: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        description: "Genera estructuras de directorios en texto plano / ASCII / Unicode para READMEs, especificaciones y documentación técnica. También funciona a la inversa: crea comandos mkdir/touch a partir de un árbol.",
        features: ["Estilos Unicode / ASCII", "Modo Inverso (mkdir/touch)", "Iconos de carpetas", "Exportar a Markdown"],
        status: "desarrollada",
        targetUrl: "apps/ascii-tree/",
        tech: "Algoritmos de Árboles / Vanilla JS",
        specs: {
            input: "Lista de rutas de archivos o texto tabulado con sangría",
            output: "Representación gráfica en árbol y script bash/cmd ejecutable",
            execution: "Procesador sintáctico en memoria"
        }
    },
    {
        id: "table-cross-join",
        number: "07",
        title: "Cruzador y Conciliador de Tablas (JOIN Express)",
        shortTitle: "Cruzador de Tablas",
        category: "datos",
        categoryName: "Datos & Conciliación",
        color: "#A855F7", // Purple Neon
        gradient: "linear-gradient(135deg, #A855F7 0%, #00F0FF 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,
        description: "Cruza dos conjuntos de datos mediante columnas clave (VLOOKUP / BUSCAV / SQL JOIN: Inner, Left, Right, Full Outer). Concilia saldos contables, cruza inventarios y detecta discrepancias al instante.",
        features: ["Inner, Left, Right, Outer", "Multi-Columna Clave", "Reporte de Discrepancias", "Exportación Directa"],
        status: "en-proceso",
        targetUrl: "apps/table-cross-join/",
        tech: "Motor Relacional JS / Vanilla JS",
        specs: {
            input: "Dos archivos Excel o CSV (Tabla A y Tabla B)",
            output: "Tabla conciliada con columnas combinadas e indicadores de coincidencia",
            execution: "Indexación hash en memoria de alta velocidad"
        }
    },
    {
        id: "duplicate-detector",
        number: "08",
        title: "Detector de Duplicados con Jerarquía",
        shortTitle: "Detector de Duplicados",
        category: "datos",
        categoryName: "Datos & Conciliación",
        color: "#14B8A6", // Teal
        gradient: "linear-gradient(135deg, #14B8A6 0%, #10B981 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>`,
        description: "Identifica filas repetidas en bases de datos o planillas según campos clave y aplica reglas jerárquicas de descarte: conservar la más reciente, la fila con mayor información completa o mayor valor numérico.",
        features: ["Reglas de Prioridad", "Conservar Más Completo", "Auditoría de Descartados", "Limpieza Segura"],
        status: "en-proceso",
        targetUrl: "apps/duplicate-detector/",
        tech: "Heurística de Datos / Vanilla JS",
        specs: {
            input: "Archivos CSV o Excel con posibles registros duplicados",
            output: "Conjunto de datos único depurado + archivo separado de descartes con motivo",
            execution: "Análisis determinista en memoria"
        }
    },
    {
        id: "sql-generator",
        number: "09",
        title: "Generador SQL INSERT / UPDATE desde Excel",
        shortTitle: "Generador SQL Excel",
        category: "excel",
        categoryName: "Archivos & Excel",
        color: "#6366F1", // Indigo
        gradient: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`,
        description: "Transforma tablas de Excel o datos copiados en sentencias SQL estándar (INSERT INTO, ON DUPLICATE KEY UPDATE, REPLACE o UPDATE por lotes) con escape seguro y tipado automático.",
        features: ["Sintaxis SQL Estándar", "ON DUPLICATE KEY UPDATE", "Escape Seguro de Strings", "Lotes de 500/1000 filas"],
        status: "en-proceso",
        targetUrl: "apps/sql-generator/",
        tech: "SQL Builder / Vanilla JS",
        specs: {
            input: "Filas de Excel, CSV o tabla copiada al portapapeles",
            output: "Script SQL (.sql) optimizado para importar o ejecutar",
            execution: "Generación de sentencias en bloques de inserción masiva"
        }
    },
    {
        id: "excel-consolidator",
        number: "10",
        title: "Unificador / Consolidador de Archivos Excel",
        shortTitle: "Consolidador Excel",
        category: "excel",
        categoryName: "Archivos & Excel",
        color: "#E11D48", // Rose
        gradient: "linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
        description: "Une y concatena decenas de archivos Excel o CSV que comparten la misma estructura de columnas en un solo libro maestro consolidado, agregando columna con el nombre del archivo origen.",
        features: ["Múltiples Archivos", "Columna de Origen", "Omitir Cabeceras Repetidas", "Soporte Multi-Hoja"],
        status: "en-proceso",
        targetUrl: "apps/excel-consolidator/",
        tech: "Consolidador Multi-Buffer / SheetJS",
        specs: {
            input: "2 o más archivos .xlsx, .xls o .csv con columnas similares",
            output: "Archivo maestro consolidado único en formato Excel .xlsx",
            execution: "Lectura secuencial y fusión inteligente de esquemas"
        }
    }
];

// Categorías del sistema
const CATEGORIES = [
    { id: "todas", name: "Todas las Apps", icon: "grid", count: 10 },
    { id: "excel", name: "Archivos & Excel", icon: "file-spreadsheet", count: 4 },
    { id: "sysadmin", name: "Dev & SysAdmin", icon: "terminal", count: 2 },
    { id: "texto", name: "Texto & Código", icon: "code", count: 2 },
    { id: "datos", name: "Datos & Conciliación", icon: "database", count: 2 },
    { id: "favoritos", name: "Favoritos", icon: "star", count: 0 }
];
