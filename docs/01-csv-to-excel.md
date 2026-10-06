# 📑 Módulo #01 • De CSV a Excel (.xlsx)

Documentación técnica y manual operativo del conversor local de archivos delimitados por caracteres a libros de cálculo de Microsoft Excel.

---

## 🎯 Propósito y Alcance

Permite transformar uno o múltiples archivos de texto plano estructurado (**CSV, TSV, TXT**) a libros de cálculo nativos de **Microsoft Excel (.xlsx)** sin necesidad de instalar suites de ofimática y de forma **100% offline en el navegador**.

Soluciona problemas habituales al abrir archivos CSV en Excel, tales como la pérdida de ceros a la izquierda (en códigos postales, documentos o IDs), delimitadores incompatibles entre configuraciones regionales (comas vs puntos y comas) y caracteres con tildes o eñes corrompidos por diferencias de codificación.

---

## ✨ Características Principales

1. **Autodetección Inteligente de Delimitadores:**
   - Analiza las primeras filas del archivo y puntúa el delimitador más probable entre coma (`,`), punto y coma (`;`), tabulador (`\t`) y barra vertical (`|`).
   - Respeta los delimitadores contenidos dentro de campos entre comillas dobles según el estándar **RFC 4180**.
2. **Doble Modalidad de Exportación:**
   - **Libro Único Consolidado:** Agrupa múltiples archivos CSV como hojas independientes dentro de un único archivo `.xlsx`, utilizando el nombre de cada archivo para titular cada hoja.
   - **Archivos Independientes (.ZIP):** Genera un archivo `.xlsx` individual por cada CSV subido y los empaqueta en una descarga comprimida `.zip`.
3. **Control de Tipado de Datos y Ceros a la Izquierda:**
   - Opción para preservar ceros a la izquierda (evita que `"00123"` se convierta en el número `123`).
   - Detección automática de números enteros, decimales y booleanos.
4. **Previsualización Reactiva:**
   - Tabla interactiva con paginación y recuento exacto de filas y columnas detectadas antes de iniciar la conversión.
5. **Cero Dependencia de Red:**
   - Procesamiento local mediante las librerías `SheetJS` (`xlsx.full.min.js`) y `JSZip` alojadas localmente en el proyecto.

---

## 📂 Arquitectura de Archivos

```
apps/csv-to-excel/
├── index.html           # Interfaz de usuario, área de Drag & Drop y opciones
├── style.css            # Estilos con tema verde esmeralda neón (#10B981)
├── converter.js         # Clase CsvToExcelConverter (Parsing RFC 4180 y generación)
├── app.js               # Gestor de cola de archivos, eventos DOM y descargas
└── libs/                # Dependencias offline (xlsx.full.min.js, jszip.min.js)
```

---

## ⚙️ Métodos y API del Motor (`converter.js`)

### `CsvToExcelConverter`

| Método | Argumentos | Descripción |
|---|---|---|
| `detectDelimiter(text)` | `text: string` | Evalúa la frecuencia y consistencia de delimitadores fuera de comillas en las primeras 15 líneas y retorna el delimitador ganador. |
| `parseCsvToMatrix(text, delimiter, options)` | `text: string, delimiter: string, options: Object` | Parsea el texto a una matriz bidimensional `Array<Array<any>>`, evaluando tipado numérico y escape de comillas dobles. |
| `createWorkbookFromMatrix(matrix, sheetName)` | `matrix: Array, sheetName: string` | Construye un objeto Workbook de SheetJS a partir de la matriz de datos. |
| `createMultiSheetWorkbook(filesData)` | `filesData: Array<Object>` | Crea un único Workbook agregando cada archivo CSV procesado como una hoja (`Worksheet`). |
| `exportWorkbookAsXlsx(workbook, filename)` | `workbook: Object, filename: string` | Serializa el libro a binario con tipo array y dispara la descarga en el navegador. |

---

## 🚀 Flujo de Trabajo del Usuario

1. **Carga de Archivos:** Arrastrar uno o más archivos CSV al área de carga o hacer clic en *"Explorar Archivos"*. También se incluye un botón para *"Cargar 3 CSVs de Ejemplo"*.
2. **Configuración de Opciones:**
   - Seleccionar delimitador (Automático o forzar Coma, Punto y coma, Tab, Pipe).
   - Activar o desactivar *"Preservar ceros a la izquierda"*.
   - Elegir el modo de salida: *"Libro único con múltiples hojas"* o *"Archivos separados (.ZIP)"*.
3. **Conversión y Descarga:** Hacer clic en *"Convertir y Descargar"*; el archivo resultante se genera en memoria y se guarda automáticamente en la carpeta de descargas del usuario.
