/**
 * tree-engine.js
 * Motor lógico desacoplado para el Generador y Parseador Inverso de Árboles ASCII/Unicode.
 * Soporta conversión bidireccional:
 * 1. Rutas / Indentación -> Árbol ASCII / Unicode / Markdown
 * 2. Árbol ASCII / Unicode -> Script ejecutable de comandos (Bash, PowerShell, CMD)
 * 100% Vanilla JavaScript - Cero dependencias externas.
 */

(function (global) {
    'use strict';

    // Estilos de caracteres para ramas de árbol
    const TREE_STYLES = {
        unicode: {
            item: '├── ',
            last: '└── ',
            pipe: '│   ',
            space: '    '
        },
        unicodeDouble: {
            item: '╠══ ',
            last: '╚══ ',
            pipe: '║   ',
            space: '    '
        },
        ascii: {
            item: '+-- ',
            last: '\\-- ',
            pipe: '|   ',
            space: '    '
        },
        minimal: {
            item: '|-- ',
            last: '`-- ',
            pipe: '|   ',
            space: '    '
        },
        markdown: {
            item: '- ',
            last: '- ',
            pipe: '  ',
            space: '  '
        }
    };

    // Mapeo heurístico de iconos por extensión / nombre
    const FILE_ICONS = {
        folder: '📁',
        folderOpen: '📂',
        js: '📜',
        ts: '📘',
        jsx: '⚛️',
        tsx: '⚛️',
        html: '🌐',
        css: '🎨',
        scss: '🎨',
        json: '📦',
        md: '📝',
        py: '🐍',
        rs: '🦀',
        go: '🐹',
        java: '☕',
        php: '🐘',
        sql: '🗄️',
        sh: '🐚',
        env: '🔒',
        yml: '⚙️',
        yaml: '⚙️',
        png: '🖼️',
        jpg: '🖼️',
        svg: '📐',
        txt: '📄',
        zip: '🗜️',
        pdf: '📕',
        defaultFile: '📄'
    };

    class TreeNode {
        constructor(name, isDirectory = false) {
            this.name = name;
            this.isDirectory = isDirectory;
            this.children = new Map(); // name -> TreeNode
        }

        getOrCreateChild(name, isDirectory) {
            if (!this.children.has(name)) {
                this.children.set(name, new TreeNode(name, isDirectory));
            }
            const child = this.children.get(name);
            if (isDirectory) child.isDirectory = true;
            return child;
        }

        getSortedChildren(foldersFirst = true) {
            const list = Array.from(this.children.values());
            list.sort((a, b) => {
                if (foldersFirst && a.isDirectory !== b.isDirectory) {
                    return a.isDirectory ? -1 : 1;
                }
                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            });
            return list;
        }
    }

    class AsciiTreeEngine {
        constructor() {
            this.styles = TREE_STYLES;
        }

        // =========================================================================
        // MODO 1: CONSTRUIR ÁRBOL DESDE RUTAS O TEXTO
        // =========================================================================

        /**
         * Parsea una lista de rutas de archivo (ej. ['src/index.js', 'src/components/Button.jsx'])
         * y retorna el nodo raíz del árbol.
         */
        parsePaths(paths, rootName = '.', options = {}) {
            const onlyDirectories = options.onlyDirectories || false;

            // Normalizar separadores a '/'
            let cleanPaths = paths.map(p => (p || '').replace(/\\/g, '/').trim()).filter(Boolean);
            if (cleanPaths.length === 0) return new TreeNode(rootName, true);

            const isFirstLinuxAbs = cleanPaths[0].startsWith('/');
            const isFirstWinAbs = /^[a-zA-Z]:\//.test(cleanPaths[0]);
            const isAbsolute = isFirstLinuxAbs || isFirstWinAbs;

            // Si son rutas absolutas desde la raíz (Linux / o Windows C:):
            if (isAbsolute) {
                let detectedRoot = '/';
                if (isFirstWinAbs) {
                    const driveMatch = cleanPaths[0].match(/^([a-zA-Z]:)/);
                    detectedRoot = driveMatch ? driveMatch[1].toUpperCase() + '\\' : 'C:\\';
                }

                // Si rootName es '.', 'root', vacío, o coincide con la raíz, usar la raíz del sistema
                if (!rootName || rootName === '.' || rootName === 'root' || rootName === '/' || /^[a-zA-Z]:[\\\/]?$/.test(rootName)) {
                    rootName = detectedRoot;
                }

                const root = new TreeNode(rootName, true);

                cleanPaths.forEach(clean => {
                    if (!clean) return;

                    const isExplicitDir = clean.endsWith('/');

                    // Quitar prefijo de raíz para descomponer en segmentos
                    let pathWithoutRoot = clean;
                    if (isFirstLinuxAbs) {
                        pathWithoutRoot = clean.replace(/^\/+/, '');
                    } else if (isFirstWinAbs) {
                        pathWithoutRoot = clean.replace(/^[a-zA-Z]:\/+/, '');
                    }

                    const segments = pathWithoutRoot.replace(/\/+$/g, '').split('/').filter(Boolean);
                    if (segments.length === 0) return;

                    let current = root;
                    for (let i = 0; i < segments.length; i++) {
                        const segment = segments[i];
                        const isLast = i === segments.length - 1;
                        const isDir = !isLast || isExplicitDir || !segment.includes('.');

                        if (isLast && onlyDirectories && !isDir) {
                            continue;
                        }

                        current = current.getOrCreateChild(segment, isDir);
                    }
                });

                return root;
            }

            // Rutas relativas estándar:
            const root = new TreeNode(rootName, true);

            cleanPaths.forEach(clean => {
                if (!clean) return;

                const isExplicitDir = clean.endsWith('/');
                const segments = clean.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
                if (segments.length === 0) return;

                let current = root;
                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    const isLast = i === segments.length - 1;
                    const isDir = !isLast || isExplicitDir || !segment.includes('.');

                    if (isLast && onlyDirectories && !isDir) {
                        continue;
                    }

                    current = current.getOrCreateChild(segment, isDir);
                }
            });

            return root;
        }

        /**
         * Parsea texto indentado con tabulaciones o espacios
         */
        parseIndentedText(text, rootName = '.', options = {}) {
            const onlyDirectories = options.onlyDirectories || false;
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length === 0) return new TreeNode(rootName, true);

            const root = new TreeNode(rootName, true);
            const stack = [{ node: root, depth: -1 }];

            lines.forEach(line => {
                const leadingWhitespaceMatch = line.match(/^([ \t]*)/);
                const indentStr = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : '';
                const depth = indentStr.replace(/\t/g, '    ').length;

                const name = line.trim().replace(/^[-*•]\s+/, '');
                if (!name) return;

                const isDir = name.endsWith('/') || !name.includes('.');
                if (onlyDirectories && !isDir) return;

                const cleanName = name.replace(/\/+$/, '');
                const node = new TreeNode(cleanName, isDir);

                while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
                    stack.pop();
                }

                const parent = stack[stack.length - 1].node;
                parent.children.set(cleanName, node);
                stack.push({ node, depth });
            });

            return root;
        }

        /**
         * Renderiza un nodo TreeNode en formato de árbol de texto
         */
        renderTree(root, options = {}) {
            const {
                style = 'unicode',
                showIcons = false,
                foldersFirst = true,
                includeRoot = true,
                addTrailingSlash = true,
                onlyDirectories = false,
                ignorePatterns = []
            } = options;

            const styleChars = this.styles[style] || this.styles.unicode;
            const outputLines = [];

            const shouldIgnore = (name) => {
                return ignorePatterns.some(pat => {
                    if (!pat) return false;
                    return name === pat || name.startsWith(pat + '/');
                });
            };

            const getIcon = (node) => {
                if (!showIcons) return '';
                if (node.isDirectory) return FILE_ICONS.folder + ' ';
                const ext = node.name.split('.').pop().toLowerCase();
                return (FILE_ICONS[ext] || FILE_ICONS.defaultFile) + ' ';
            };

            if (includeRoot) {
                const alreadyHasSlash = root.name.endsWith('/') || root.name.endsWith('\\');
                const rootSlash = (addTrailingSlash && root.isDirectory && !alreadyHasSlash) ? '/' : '';
                outputLines.push(`${getIcon(root)}${root.name}${rootSlash}`);
            }

            const traverse = (node, prefix = '') => {
                let children = node.getSortedChildren(foldersFirst).filter(c => !shouldIgnore(c.name));
                if (onlyDirectories) {
                    children = children.filter(c => c.isDirectory);
                }
                const count = children.length;

                children.forEach((child, index) => {
                    const isLast = index === count - 1;
                    const branch = isLast ? styleChars.last : styleChars.item;
                    const nextPrefix = prefix + (isLast ? styleChars.space : styleChars.pipe);

                    const slash = (addTrailingSlash && child.isDirectory) ? '/' : '';
                    const icon = getIcon(child);

                    outputLines.push(`${prefix}${branch}${icon}${child.name}${slash}`);

                    if (child.isDirectory && child.children.size > 0) {
                        traverse(child, nextPrefix);
                    }
                });
            };

            traverse(root, '');
            return outputLines.join('\n');
        }

        // =========================================================================
        // MODO 2: ÁRBOL A COMANDOS EJECUTABLES (MODO INVERSO)
        // =========================================================================

        /**
         * Parsea un árbol ASCII o Unicode existente copiado de un README o terminal
         * y extrae la lista completa de rutas relativas de carpetas y archivos.
         */
        parseTreeTextToPaths(treeText) {
            const lines = treeText.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length === 0) return { directories: [], files: [], rootDir: '' };

            const stack = [];
            const directories = new Set();
            const files = new Set();
            let rootDir = '';

            // Detectar si la primera línea es el nombre de la raíz (sin caracteres de rama)
            let startIndex = 0;
            const firstLine = lines[0].trim();
            const hasBranch = /[├└│\|\+\\]/.test(firstLine);

            if (!hasBranch && lines.length > 1) {
                // Es raíz
                if (firstLine === '/') {
                    rootDir = '/';
                } else if (/^[a-zA-Z]:[\\\/]?$/.test(firstLine)) {
                    rootDir = firstLine.replace(/\//g, '\\');
                } else {
                    rootDir = firstLine.replace(/[\/\\:*?"<>|]/g, '').trim();
                }
                startIndex = 1;
                stack.push({ depth: -1, name: rootDir, isDir: true });
                if (rootDir) directories.add(rootDir);
            }

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i];

                // Medir la profundidad buscando el inicio del texto tras los caracteres de rama
                const branchMatch = line.match(/^([\s│\|\s]*[├└\+\\`\-]+[\s─=-]*)/);
                let depth = 0;
                let cleanName = line;

                if (branchMatch) {
                    const prefix = branchMatch[1];
                    depth = prefix.length;
                    cleanName = line.substring(prefix.length).trim();
                } else {
                    // Indentación estándar por espacios
                    const spaceMatch = line.match(/^(\s*)/);
                    depth = spaceMatch ? spaceMatch[1].length : 0;
                    cleanName = line.trim();
                }

                // Limpiar posibles emojis/iconos al inicio
                cleanName = cleanName.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}\uFE0F?|[📁📂📄📜⚛️🌐🎨📦📝🐍🦀🐹☕🐘🗄️🐚🔒⚙️🖼️📐🗜️📕])\s*/u, '').trim();

                if (!cleanName) continue;

                // Determinar si es directorio (termina en / o no tiene punto de extensión)
                const isDir = cleanName.endsWith('/') || !cleanName.includes('.');
                const nodeName = cleanName.replace(/\/+$/, '');

                // Encontrar ancestro correspondiente en stack
                while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
                    stack.pop();
                }

                // Construir ruta completa acumulando el stack
                let fullPath = '';
                if (stack.length > 0 && stack[0].name === '/') {
                    const rest = stack.slice(1).map(s => s.name).concat(nodeName).join('/');
                    fullPath = '/' + rest;
                } else if (stack.length > 0 && /^[a-zA-Z]:[\\\/]?$/.test(stack[0].name)) {
                    const drive = stack[0].name.replace(/[\\\/]$/, '');
                    const rest = stack.slice(1).map(s => s.name).concat(nodeName).join('/');
                    fullPath = drive + '/' + rest;
                } else {
                    const parentPath = stack.map(s => s.name).filter(Boolean).join('/');
                    fullPath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
                }

                if (isDir) {
                    directories.add(fullPath);
                } else {
                    files.add(fullPath);
                    // Asegurar que el directorio padre esté en directories
                    if (parentPath) directories.add(parentPath);
                }

                stack.push({ depth, name: nodeName, isDir });
            }

            return {
                rootDir,
                directories: Array.from(directories),
                files: Array.from(files)
            };
        }

        /**
         * Genera script ejecutable en Bash / Zsh (Linux & macOS)
         */
        generateBashScript(parsed, options = {}) {
            const { createSampleFiles = false } = options;
            const lines = ['#!/usr/bin/env bash', '# Generado automáticamente por SimpleApps ASCII Tree Generator', ''];

            const dirs = parsed.directories;
            const files = parsed.files;

            if (dirs.length > 0) {
                // Optimizar mkdir -p
                lines.push('# 1. Crear directorios');
                lines.push(`mkdir -p ${dirs.map(d => `"${d}"`).join(' ')}`);
                lines.push('');
            }

            if (files.length > 0) {
                lines.push('# 2. Crear archivos base');
                if (createSampleFiles) {
                    files.forEach(f => {
                        lines.push(`echo "# ${f.split('/').pop()}" > "${f}"`);
                    });
                } else {
                    lines.push(`touch ${files.map(f => `"${f}"`).join(' ')}`);
                }
                lines.push('');
            }

            lines.push('echo "✓ Estructura de proyecto creada con éxito."');
            return lines.join('\n');
        }

        /**
         * Genera script ejecutable en PowerShell (Windows)
         */
        generatePowerShellScript(parsed) {
            const lines = ['# Generado automáticamente por SimpleApps ASCII Tree Generator', ''];
            const dirs = parsed.directories;
            const files = parsed.files;

            if (dirs.length > 0) {
                lines.push('# 1. Crear directorios');
                dirs.forEach(d => {
                    lines.push(`New-Item -ItemType Directory -Force -Path "${d}" | Out-Null`);
                });
                lines.push('');
            }

            if (files.length > 0) {
                lines.push('# 2. Crear archivos');
                files.forEach(f => {
                    lines.push(`New-Item -ItemType File -Force -Path "${f}" | Out-Null`);
                });
                lines.push('');
            }

            lines.push('Write-Host "✓ Estructura creada exitosamente." -ForegroundColor Green');
            return lines.join('\n');
        }

        /**
         * Genera script para Windows CMD (Command Prompt / .bat)
         */
        generateCmdScript(parsed) {
            const lines = ['@echo off', 'REM Generado por SimpleApps ASCII Tree Generator', ''];
            const dirs = parsed.directories;
            const files = parsed.files;

            if (dirs.length > 0) {
                lines.push('REM 1. Crear directorios');
                dirs.forEach(d => {
                    const winPath = d.replace(/\//g, '\\');
                    lines.push(`if not exist "${winPath}" mkdir "${winPath}"`);
                });
                lines.push('');
            }

            if (files.length > 0) {
                lines.push('REM 2. Crear archivos');
                files.forEach(f => {
                    const winPath = f.replace(/\//g, '\\');
                    lines.push(`type nul > "${winPath}"`);
                });
                lines.push('');
            }

            lines.push('echo Estructura creada con exito.');
            return lines.join('\n');
        }
    }

    // Exportación global o Node
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { AsciiTreeEngine, TreeNode, TREE_STYLES, FILE_ICONS };
    } else {
        global.AsciiTreeEngine = AsciiTreeEngine;
    }

})(typeof window !== 'undefined' ? window : this);
