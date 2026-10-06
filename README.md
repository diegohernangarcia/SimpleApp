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
| **05** | **Conversor PDF/Doc/Docx a Markdown** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #05](docs/05-doc-to-markdown.md) | Transforma documentos de oficina a Markdown estructurado con tablas. |
| **06** | **Generador ASCII Tree** | 🟢 **✓ Desarrollada** (Operativo) | [Manual #06](docs/06-ascii-tree.md) | Genera árboles de directorios en texto plano y viceversa (comandos mkdir/touch). |
| **07** | **Cruzador y Conciliador de Tablas** | 🔴 **✓ En proceso** (Scaffold) | *En desarrollo* | JOIN Express / VLOOKUP entre dos archivos para conciliación de discrepancias. |
| **08** | **Detector de Duplicados con Jerarquía** | 🔴 **✓ En proceso** (Scaffold) | *En desarrollo* | Identifica filas repetidas y aplica reglas de descarte prioritarias. |
| **09** | **Generador SQL INSERT / UPDATE** | 🔴 **✓ En proceso** (Scaffold) | *En desarrollo* | Genera sentencias SQL estándar (INSERT / UPDATE) desde tablas Excel. |
| **10** | **Consolidador de Múltiples Excel** | 🔴 **✓ En proceso** (Scaffold) | *En desarrollo* | Fusiona múltiples archivos Excel en una sola hoja maestra con trazabilidad. |

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
