# 📑 Módulo #02 • De Excel a CSV

Documentación técnica y manual operativo del extractor y conversor de hojas de cálculo de Microsoft Excel a archivos CSV limpios y configurables.

---

## 🎯 Propósito y Alcance

Permite abrir libros de cálculo en múltiples formatos (**`.xlsx`, `.xls`, `.xlsm`, `.ods`, `.xlsb`**) y extraer cada una de sus hojas como archivos independientes en formato **CSV o TSV**.

Facilita la migración de datos hacia bases de datos (PostgreSQL, MySQL), scripts de Python/Pandas o herramientas de Business Intelligence que requieren archivos de texto plano estructurado según el estándar **RFC 4180**, sin depender de Excel instalado en la máquina ni subir información confidencial a la nube.

---

## ✨ Características Principales

1. **Soporte Multi-Formato Amplio:**
   - Lee archivos modernos de Excel (`.xlsx`), libros binarios antiguos (`.xls`), libros con macros (`.xlsm`) y formatos abiertos de LibreOffice/OpenOffice (`.ods`).
2. **Inspección y Selección Flexible de Hojas:**
   - Detecta automáticamente todas las hojas que componen el libro.
   - Permite seleccionar hojas específicas para exportar mediante casillas de verificación o descargar hojas de forma individual con un solo clic.
3. **Configuración de Delimitadores y Formato de Salida:**
   - Delimitadores soportados: Coma (`,`), Punto y coma (`;`), Tabulador TSV (`\t`) y Pipe (`|`).
   - Opción para incluir o descartar la marca de orden de bytes (**UTF-8 BOM**), asegurando compatibilidad perfecta tanto en sistemas Linux/Mac como en Windows Excel.
4. **Exportación Individual o en Paquete Comprimido (.ZIP):**
   - Descarga directa del archivo CSV de cualquier hoja en milisegundos.
   - Generación de un archivo comprimido `.zip` que contiene todas las hojas seleccionadas con nombres sanitizados y normalizados.
5. **Visor de Previsualización:**
   - Muestra las primeras 30 filas de cada hoja antes de exportar, con recuento de filas y columnas efectivas.

---

## 📂 Arquitectura de Archivos

```
apps/excel-to-csv/
├── index.html           # Interfaz de usuario con visor de libros y selector de hojas
├── style.css            # Estilos con tema cian / aguamarina neón (#06B6D4)
├── converter.js         # Clase ExcelToCsvConverter (Lectura de hojas y serialización CSV)
├── app.js               # Coordinador de eventos DOM, preview modal y empaquetador ZIP
└── libs/                # Librerías locales (xlsx.full.min.js, jszip.min.js)
```

---

## ⚙️ Métodos y API del Motor (`converter.js`)

### `ExcelToCsvConverter`

| Método | Argumentos | Descripción |
|---|---|---|
| `parseWorkbook(file)` | `file: File` | Lee el buffer del archivo con SheetJS, extrae nombres de hojas, calcula dimensiones y retorna una estructura de datos detallada con muestras previas. |
| `sheetToCsv(matrix, options)` | `matrix: Array<Array>, options: Object` | Convierte una matriz bidimensional a una cadena de texto CSV cumpliendo RFC 4180 (entrecomillado automático si hay delimitadores o saltos de línea). |
| `generateZip(sheets, options)` | `sheets: Array<Object>, options: Object` | Construye en memoria un archivo ZIP utilizando JSZip con todas las hojas seleccionadas serializadas a CSV. |
| `downloadBlob(blob, filename)` | `blob: Blob, filename: string` | Genera una URL temporal con `URL.createObjectURL` e inicia la descarga local. |

---

## 🚀 Flujo de Trabajo del Usuario

1. **Carga del Libro:** Arrastrar el archivo Excel al área de entrada o pulsar el botón *"Cargar Libro de Ejemplo"* (incluye 3 hojas: Clientes, Ventas y Productos).
2. **Selección de Hojas y Delimitador:**
   - Marcar o desmarcar las hojas que se desean convertir.
   - Elegir el delimitador deseado (ej. Coma para bases de datos o Punto y coma para Excel en español).
3. **Descarga:**
   - Para una sola hoja: presionar el botón *"Exportar CSV"* en la tarjeta de la hoja correspondiente.
   - Para todas las hojas: presionar *"Descargar Hojas Seleccionadas (.ZIP)"*.
