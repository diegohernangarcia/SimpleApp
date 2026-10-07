# SimpleApp • Suite de Micro-Aplicaciones

Colección de 10 herramientas ágiles, directas y de alto rendimiento diseñadas para procesar datos localmente con total privacidad y sin dependencias pesadas.

## 🚀 Arquitectura y Tecnologías
- **Frontend:** HTML5 semántico, Vanilla CSS3 (diseño responsivo con estética Aithm AI y layout horizontal tipo Xacton), Vanilla JavaScript puro.
- **Sin dependencias pesadas:** Cero React, cero librerías pesadas en producción.
- **100% Local:** Ejecución directa en tu navegador con privacidad garantizada y cero telemetría.

---

## 🛠️ Catálogo de las 10 Micro-Apps

| # | Micro-App | Estado | Documentación | Descripción |
|---|---|---|---|---|
| **01** | **De CSV a Excel** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #01](docs/01-csv-to-excel.md) | Convierte CSV a libros .xlsx con autodetección de separador y codificación. |
| **02** | **De Excel a CSV** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #02](docs/02-excel-to-csv.md) | Exporta hojas de Excel a CSV limpio configurable según RFC 4180. |
| **03** | **Diff Viewer** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #03](docs/03-diff-viewer.md) | Comparador de texto y código caracter a caracter con visualizador Side-by-Side, sincronización de scroll e inspector de líneas y columnas exactas. |
| **04** | **Calculadora de Permisos Linux** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #04](docs/04-linux-permissions.md) | Calculadora interactiva visual de permisos Chmod / Octal (755, 644, rwxr-xr-x). |
| **05** | **Conversor Docs & Excel a Markdown** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #05](docs/05-doc-to-markdown.md) | Transforma Word (.docx), Excel (.xlsx, .xls, .ods, .csv) y PDF a Markdown con tablas GFM. |
| **06** | **Generador ASCII Tree** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #06](docs/06-ascii-tree.md) | Genera árboles de directorios en texto plano y viceversa (comandos mkdir/touch). |
| **07** | **Cruzador y Conciliador de Tablas** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #07](docs/07-table-cross-join.md) | Cruza conjuntos de datos por claves compuestas (VLOOKUP / SQL JOIN), concilia saldos e identifica discrepancias. |
| **08** | **Detector de Duplicados con Jerarquía** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #08](docs/08-duplicate-detector.md) | Identifica filas repetidas y aplica reglas de descarte prioritarias (más completa, más reciente, mayor valor, reglas condicionales) con doble salida y auditoría. |
| **09** | **Generador SQL INSERT / UPDATE** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #09](docs/09-sql-generator.md) | Transforma tablas Excel o CSV en sentencias SQL masivas (INSERT, UPSERT, REPLACE, UPDATE) con tipado heurístico y escape seguro. |
| **10** | **Unificador / Consolidador de Archivos Excel** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #10](docs/10-excel-consolidator.md) | Une y concatena decenas de archivos Excel o CSV en un solo libro maestro consolidado con columna de origen y omisión de cabeceras. |

---

## 📚 Documentación Técnica Detallada
Todos los detalles de arquitectura, algoritmos, APIs de motores lógicos y manuales de usuario se encuentran centralizados en el directorio **[`docs/`](docs/)**:
- [Índice General de Documentación](docs/README.md)
- Cada micro-app cuenta con su propio manual individual con especificaciones de entrada/salida y casos de uso.
- *Regla del proyecto:* Al desarrollar o actualizar cada micro-app, se documenta exhaustivamente en `docs/`.

---

## 💻 Ejecución Local
Al ser una aplicación web basada en estándares web:
1. Clonar este repositorio dentro del directorio web del servidor local (ej. `/opt/lampp/htdocs/SimpleApp` en LAMPP o `htdocs/SimpleApp` en XAMPP).
2. Abrir en el navegador:
   ```
   http://localhost/SimpleApp/
   ```
