# 📑 Módulo #10 • Unificador / Consolidador de Archivos Excel

Documentación técnica y manual operativo del motor de fusión multi-buffer para unificar, concatenar y apilar decenas de archivos Excel (`.xlsx`, `.xls`), OpenDocument (`.ods`) y texto (`.csv`, `.tsv`) en un solo libro maestro consolidado con inyección de metadatos de procedencia y fusión inteligente de esquemas.

---

## 🎯 Propósito y Alcance

En empresas, departamentos contables, auditorías, áreas de ventas y logística, es frecuente recibir periódicamente decenas de archivos dispersos que comparten una misma estructura de columnas:
- Reportes mensuales de ventas (`ventas_enero.xlsx`, `ventas_febrero.xlsx`, etc.).
- Inventarios provenientes de distintas sucursales físicas o depósitos.
- Planillas de comisiones o gastos operativos de diferentes centros de costos.
- Exportaciones de CRM o ERP emitidas en lotes diarios.

Combinar estos archivos manualmente en Excel abriendo archivo por archivo, copiando y pegando rangos suele demandar horas, introduce errores humanos, olvida filas, desordena columnas y pierde la trazabilidad de qué archivo aportó cada fila.

El **Unificador / Consolidador de Archivos Excel** resuelve esta tarea en segundos mediante una arquitectura en memoria:

1. **Concatenación Masiva Multi-Buffer:** Procesa simultáneamente 2, 10 o más de 50 archivos mediante lectura secuencial optimizada en memoria RAM con SheetJS.
2. **Inyección Automática de Procedencia (Columna Origen):** Agrega una columna con el nombre del archivo de origen (ej. `_archivo_origen` o `Archivo_Origen`), garantizando trazabilidad absoluta de cada fila en el libro consolidado.
3. **Fusión Inteligente de Esquemas de Columnas:**
   - **Unión Completa (*Outer Union*):** Conserva todas las columnas únicas de todos los archivos, rellenando con celda vacía las ausencias.
   - **Intersección Estricta (*Inner Intersection*):** Conserva únicamente las columnas comunes a todos los archivos.
   - **Plantilla Maestra (*Master Template*):** Utiliza exactamente las columnas del primer archivo como molde estricto.
4. **Omisión de Cabeceras Repetidas y Filas Vacías:** Descarta automáticamente las filas de encabezado repetidas en archivos posteriores y purga filas nulas.
5. **Soporte Multi-Hoja:** Permite consolidar solo la primera hoja de cada archivo o apilar todas las hojas en una única tabla continua.
6. **100% Local y Confidencial (Zero-Upload Safe):** Ninguna planilla ni dato financiero se envía a servidores externos ni a la nube.

---

## ✨ Características Principales

### 1. Ingesta y Gestión de Cola de Archivos
- **Formatos Admitidos:** Excel moderno (`.xlsx`), Excel legado (`.xls`), LibreOffice / OpenOffice Calc (`.ods`), valores separados por coma (`.csv`) y tabuladores (`.tsv`).
- **Drag & Drop Masivo:** Permite arrastrar múltiples archivos simultáneamente hacia la zona de carga o seleccionarlos en el explorador de archivos.
- **Control de Secuencia y Reordenamiento:** Permite alterar el orden de apilado con botones interactivos (▲ Subir / ▼ Bajar). El orden de la cola define la secuencia vertical de las filas consolidadas.
- **Vista Previa Individual:** Modal de inspección para previsualizar las primeras filas y metadatos de cualquier archivo antes de fusionar.

### 2. Modos de Fusión de Esquema
- **Outer Union (Recomendado):** Si el archivo 1 contiene `[ID, Nombre, Monto]` y el archivo 2 contiene `[ID, Nombre, Monto, Sucursal]`, el consolidado final contendrá las 4 columnas.
- **Inner Intersection:** Conserva únicamente `[ID, Nombre, Monto]`, ignorando columnas que no existan en todos los archivos.
- **Master Template:** Conserva estrictamente las columnas del archivo #1, proyectando los datos de los demás archivos sobre esa plantilla.

### 3. Normalización y Limpieza de Datos
- **Normalización de Nombres de Columnas:** Insensibilidad a mayúsculas/minúsculas opcional (`PRECIO` = `Precio` = `precio`).
- **Limpieza de Espacios (*Trim*):** Elimina espacios en blanco invisibles al inicio y final de cabeceras y celdas.
- **Deduplicación Opcional:** Filtra filas completamente duplicadas entre diferentes archivos si se activa la opción.

### 4. Salidas y Formatos de Descarga
- **Libro Maestro Excel (`.xlsx`):** Archivo binario nativo con auto-ajuste de anchos de columna (`wch`), listo para abrir en Microsoft Excel, Google Sheets o LibreOffice Calc.
- **CSV Maestro (`.csv`):** Texto delimitado por comas según estándar RFC-4180 con codificación UTF-8 y marca BOM (`\uFEFF`) para compatibilidad directa con Excel.
- **Copia al Portapapeles:** Datos tabulados (TSV) listos para pegar con `Ctrl+V` en cualquier planilla activa.

---

## 📂 Arquitectura de Archivos

```
apps/excel-consolidator/
├── index.html                  # Interfaz de usuario en 3 pasos con centro de ayuda
├── style.css                   # Hoja de estilos con paleta esmeralda/menta y diseño responsive
├── consolidator-engine.js      # Motor puro en memoria para parsing, unión y generación XLSX
├── app.js                      # Controlador de eventos DOM, presets y renderizado reactivo
└── libs/
    ├── xlsx.full.min.js        # Librería SheetJS para lectura y escritura de libros
    └── jszip.min.js            # Soporte de descompresión para archivos OpenDocument / Office
```

---

## ⚙️ Especificaciones Técnicas

| Parámetro | Especificación |
| :--- | :--- |
| **Entrada admitida** | 2 o más archivos `.xlsx`, `.xls`, `.ods`, `.csv`, `.tsv` |
| **Salida generada** | Archivo maestro `.xlsx`, exportación opcional `.csv` y copia TSV |
| **Modo de procesamiento** | Lectura secuencial y fusión inteligente de esquemas en memoria RAM |
| **Complejidad algorítmica** | $\mathcal{O}(N \times C)$ donde $N$ es el total de filas y $C$ el total de columnas |
| **Privacidad** | 100% Local (Client-side Memory / Zero-Upload) |
| **Dialectos de hojas** | Hojas únicas, multi-hoja apilada, soporte de libros de varias pestañas |
| **Dependencias externas** | Ninguna (todo empaquetado localmente en `/libs/`) |

---

## 📘 Centro de Ayuda & Guía Operativa Integrada

El módulo incluye un Centro de Ayuda accesible en todo momento mediante el botón `📘 Ayuda & Guía de Uso` en la cabecera, el botón hero y los botones contextuales de cada paso (`Instrucciones Paso 1/2/3`).

### Pestañas del Manual:
1. **🌟 Visión General:** Propósito, flujo en 3 pasos y capacidades destacadas.
2. **⚡ Presets de Prueba:** Guía para probar los 3 escenarios prediseñados (Ventas Mensuales, Sucursales y Gastos).
3. **📂 Paso 1: Carga:** Métodos de carga múltiple, reordenamiento de cola y vista previa individual.
4. **⚙️ Paso 2: Fusión & Esquema:** Diferencias entre Unión, Intersección y Plantilla, y configuración de columna de origen.
5. **📊 Paso 3: Exportación:** Formatos de salida (.xlsx, .csv, portapapeles) y lectura del informe de auditoría.
6. **🛡️ Seguridad & Privacidad:** Garantía de arquitectura en cliente sin tráfico hacia servidores externos.
