# 📚 Documentación Técnica • SimpleApps Suite

Bienvenido al centro de documentación técnica y manuales de usuario de **SimpleApps**, una suite de micro-herramientas web ultraligeras, autónomas y 100% locales diseñadas bajo una arquitectura *Zero-Server / Client-Side First*.

---

## 🏛️ Filosofía Arquitectónica

1. **100% Local & Privacidad Garantizada:**  
   Todos los procesamientos de datos (conversiones, análisis de diferencias, cómputos binarios y parsing de documentos) ocurren exclusivamente dentro del navegador web mediante JavaScript Vanilla y Web APIs. Ningún byte se transmite a servidores externos ni a APIs de terceros.
2. **Cero Dependencias Pesadas en Runtime:**  
   No se utilizan frameworks como React, Angular ni Vue. Se emplea JavaScript moderno modular, HTML5 semántico y CSS3 con diseño *Aithm AI* (estética oscura, gradientes HSL y efectos de desenfoque *glassmorphism*).
3. **Resiliencia Offline:**  
   Los motores lógicos están completamente desacoplados de la capa de interfaz (`app.js` vs `engine.js`/`converter.js`), lo que permite realizar pruebas unitarias automatizadas directamente con Node.js sin necesidad de emular el navegador.

---

## 📑 Índice de Micro-Apps Desarrolladas

A continuación se detalla la documentación técnica de los módulos completados y operativos:

| Módulo | Nombre | Descripción Técnica | Enlace a Documentación |
|---|---|---|---|
| **#01** | **De CSV a Excel** | Conversión individual o multi-hoja a `.xlsx`, autodetección RFC 4180 de delimitador y codificación UTF-8/ANSI. | [Manual Módulo #01](./01-csv-to-excel.md) |
| **#02** | **De Excel a CSV** | Extracción multi-hoja de `.xlsx`, `.xls`, `.ods` a archivos CSV independientes o paquete consolidado en `.ZIP`. | [Manual Módulo #02](./02-excel-to-csv.md) |
| **#03** | **Diff Viewer** | Comparador de código y texto carácter a carácter mediante algoritmo de diferencias de Myers, vista Side-by-Side con scroll sincronizado. | [Manual Módulo #03](./03-diff-viewer.md) |
| **#04** | **Calculadora de Permisos Linux** | Conversión bidireccional entre octal, simbólico y bits, matriz interactiva con Special Bits (SUID, SGID, Sticky), umask y generador CLI chmod/chown. | [Manual Módulo #04](./04-linux-permissions.md) |
| **#05** | **Doc a Markdown** | Conversor local de PDF, DOCX, DOC, ODT, HTML y texto pegado a GitHub Flavored Markdown con formateo de tablas y código. | [Manual Módulo #05](./05-doc-to-markdown.md) |
| **#06** | **Generador ASCII Tree** | Diagramador bidireccional de directorios en texto plano (Unicode, ASCII, Markdown) y generador inverso de scripts Bash/PowerShell/CMD. | [Manual Módulo #06](./06-ascii-tree.md) |

---

## 📋 Protocolo de Desarrollo para Nuevos Módulos

Al crear o completar una nueva micro-app en la suite, **es obligatorio**:
1. Implementar la herramienta dentro de su subdirectorio en `apps/<nombre-de-la-app>/` con:
   - `index.html`: Maquetación semántica y accesible.
   - `style.css`: Estilos coherentes con el diseño de SimpleApps.
   - `<app>-engine.js` / `converter.js`: Lógica desacoplada con soporte de exportación modular.
   - `app.js`: Controlador de eventos, integración DOM y notificaciones toast.
2. Registrar y actualizar su estado a `"desarrollada"` en:
   - [`assets/js/apps-data.js`](../assets/js/apps-data.js) (para tildes verdes y modales del frontend).
   - [`index.html`](../index.html) (contadores KPI en el Hero).
   - [`README.md`](../README.md) (tabla general del repositorio).
3. **Crear su archivo de documentación técnica correspondiente en `docs/XX-<nombre-de-la-app>.md`** siguiendo la estructura estándar y vincularlo en este índice.
