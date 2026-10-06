/**
 * app.js
 * Coordinador de interfaz para el Generador y Parseador Inverso de Árboles ASCII/Unicode.
 * Módulo #06 • SimpleApps Suite
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const engine = new AsciiTreeEngine();

    // Estado global de la aplicación
    const state = {
        currentMode: 'generator', // 'generator' | 'reverse'
        generatorStyle: 'unicode',
        reverseShell: 'bash', // 'bash' | 'powershell' | 'cmd'
        parsedTree: null,
        lastScannedData: null
    };

    // Plantillas de estructuras populares
    const PRESETS = [
        {
            title: 'React / Vite SPA',
            desc: 'Estructura moderna de frontend con componentes, hooks y assets.',
            paths: [
                'public/favicon.svg',
                'src/assets/logo.png',
                'src/components/Header.jsx',
                'src/components/Footer.jsx',
                'src/hooks/useAuth.js',
                'src/styles/main.css',
                'src/App.jsx',
                'src/main.jsx',
                'index.html',
                'package.json',
                'vite.config.js',
                'README.md'
            ],
            rootName: 'mi-react-app'
        },
        {
            title: 'Node / Express Clean Architecture',
            desc: 'Backend estructurado en controladores, servicios, modelos y rutas.',
            paths: [
                'src/config/db.js',
                'src/controllers/userController.js',
                'src/models/User.js',
                'src/routes/apiRoutes.js',
                'src/services/authService.js',
                'src/middlewares/authMiddleware.js',
                'src/app.js',
                'src/server.js',
                'tests/user.test.js',
                '.env.example',
                'package.json',
                'README.md'
            ],
            rootName: 'express-api'
        },
        {
            title: 'Python / FastAPI Microservice',
            desc: 'Arquitectura recomendada para APIs modernas en Python con schemas Pydantic.',
            paths: [
                'app/api/endpoints/users.py',
                'app/core/config.py',
                'app/core/security.py',
                'app/models/user.py',
                'app/schemas/user.py',
                'app/main.py',
                'tests/test_main.py',
                'Dockerfile',
                'requirements.txt',
                'README.md'
            ],
            rootName: 'fastapi-service'
        },
        {
            title: 'Extensión Web para Navegador',
            desc: 'Estructura estándar Manifest V3 para extensiones Chrome y Firefox.',
            paths: [
                'icons/icon-16.png',
                'icons/icon-48.png',
                'icons/icon-128.png',
                'popup/popup.html',
                'popup/popup.js',
                'popup/popup.css',
                'scripts/content.js',
                'scripts/background.js',
                'manifest.json',
                'README.md'
            ],
            rootName: 'mi-extension'
        },
        {
            title: 'Rust / Cargo CLI Crate',
            desc: 'Disposición canónica de un paquete CLI en Rust.',
            paths: [
                'src/commands/mod.rs',
                'src/commands/init.rs',
                'src/utils/terminal.rs',
                'src/cli.rs',
                'src/main.rs',
                'tests/cli_tests.rs',
                'Cargo.toml',
                'README.md'
            ],
            rootName: 'rust-cli'
        },
        {
            title: 'Documentación Docsify / GitHub Wiki',
            desc: 'Estructura de documentación estática con Markdown y assets.',
            paths: [
                'docs/guides/getting-started.md',
                'docs/guides/installation.md',
                'docs/api/endpoints.md',
                'docs/assets/diagram.png',
                'docs/_sidebar.md',
                'docs/index.html',
                'README.md'
            ],
            rootName: 'docs-site'
        }
    ];

    // Elementos DOM
    const dom = {
        // Selector de modo
        tabGenerator: document.getElementById('tabGenerator'),
        tabReverse: document.getElementById('tabReverse'),
        viewGenerator: document.getElementById('viewGenerator'),
        viewReverse: document.getElementById('viewReverse'),

        // Modo Generador
        generatorInput: document.getElementById('generatorInput'),
        generatorOutput: document.getElementById('generatorOutput'),
        selectStyle: document.getElementById('selectStyle'),
        selectContentFilter: document.getElementById('selectContentFilter'),
        inputRootName: document.getElementById('inputRootName'),
        chkFromRoot: document.getElementById('chkFromRoot'),
        chkFoldersFirst: document.getElementById('chkFoldersFirst'),
        chkShowIcons: document.getElementById('chkShowIcons'),
        chkIncludeRoot: document.getElementById('chkIncludeRoot'),
        chkTrailingSlash: document.getElementById('chkTrailingSlash'),
        chkIgnoreCommon: document.getElementById('chkIgnoreCommon'),

        // Escáner y Generador de Ruta Local del Sistema
        inputSystemPath: document.getElementById('inputSystemPath'),
        btnScanSystemPath: document.getElementById('btnScanSystemPath'),
        btnScanDiskContents: document.getElementById('btnScanDiskContents'),
        btnUserLinuxSample: document.getElementById('btnUserLinuxSample'),

        btnCopyPlain: document.getElementById('btnCopyPlain'),
        btnCopyMarkdown: document.getElementById('btnCopyMarkdown'),
        btnDownloadTxt: document.getElementById('btnDownloadTxt'),
        btnDownloadMd: document.getElementById('btnDownloadMd'),
        btnClearInput: document.getElementById('btnClearInput'),
        btnLoadSample: document.getElementById('btnLoadSample'),

        // Folder Dropzone
        folderDropzone: document.getElementById('folderDropzone'),
        folderInput: document.getElementById('folderInput'),

        // Modo Inverso
        reverseInput: document.getElementById('reverseInput'),
        reverseOutput: document.getElementById('reverseOutput'),
        selectReverseShell: document.getElementById('selectReverseShell'),
        chkSampleFiles: document.getElementById('chkSampleFiles'),
        btnCopyScript: document.getElementById('btnCopyScript'),
        btnDownloadScript: document.getElementById('btnDownloadScript'),
        btnLoadReverseSample: document.getElementById('btnLoadReverseSample'),
        statsReverseDirs: document.getElementById('statsReverseDirs'),
        statsReverseFiles: document.getElementById('statsReverseFiles'),

        // Presets y Toasts
        presetsContainer: document.getElementById('presetsContainer'),
        toastContainer: document.getElementById('toastContainer')
    };

    // =========================================================================
    // CONTROLADOR DE MODOS (Tabs)
    // =========================================================================
    function setMode(mode) {
        state.currentMode = mode;
        if (mode === 'generator') {
            dom.tabGenerator.classList.add('active');
            dom.tabReverse.classList.remove('active');
            dom.viewGenerator.style.display = 'grid';
            dom.viewReverse.style.display = 'none';
            updateGenerator();
        } else {
            dom.tabReverse.classList.add('active');
            dom.tabGenerator.classList.remove('active');
            dom.viewGenerator.style.display = 'none';
            dom.viewReverse.style.display = 'grid';
            updateReverse();
        }
    }

    if (dom.tabGenerator) dom.tabGenerator.addEventListener('click', () => setMode('generator'));
    if (dom.tabReverse) dom.tabReverse.addEventListener('click', () => setMode('reverse'));

    // =========================================================================
    // LÓGICA MODO 1: GENERADOR DE ÁRBOL
    // =========================================================================
    function updateGenerator() {
        if (!dom.generatorInput || !dom.generatorOutput) return;

        const rawText = dom.generatorInput.value.trim();
        if (!rawText) {
            dom.generatorOutput.textContent = 'Escribe o pega una lista de rutas, escanea una ruta del sistema o arrastra una carpeta local para generar el árbol...';
            return;
        }

        const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const isFromRoot = dom.chkFromRoot ? dom.chkFromRoot.checked : true;
        let rootName = (dom.inputRootName ? dom.inputRootName.value.trim() : '');
        if (!rootName || ((rootName === 'proyecto' || rootName === 'mi-proyecto') && isFromRoot && lines.length > 0)) {
            if (lines[0].startsWith('/')) {
                rootName = '/';
                if (dom.inputRootName) dom.inputRootName.value = '/';
            } else if (/^[a-zA-Z]:[\\\/]/.test(lines[0])) {
                const driveMatch = lines[0].match(/^([a-zA-Z]:)/);
                rootName = (driveMatch ? driveMatch[1].toUpperCase() : 'C:') + '\\';
                if (dom.inputRootName) dom.inputRootName.value = rootName;
            }
        }

        const onlyDirs = dom.selectContentFilter ? (dom.selectContentFilter.value === 'dirs') : false;

        const ignoreList = (dom.chkIgnoreCommon && dom.chkIgnoreCommon.checked)
            ? ['node_modules', '.git', '.DS_Store', 'dist', 'build', '__pycache__', '.env', '.idea', '.vscode']
            : [];

        const options = {
            style: dom.selectStyle ? dom.selectStyle.value : 'unicode',
            foldersFirst: dom.chkFoldersFirst ? dom.chkFoldersFirst.checked : true,
            showIcons: dom.chkShowIcons ? dom.chkShowIcons.checked : false,
            includeRoot: dom.chkIncludeRoot ? dom.chkIncludeRoot.checked : true,
            addTrailingSlash: dom.chkTrailingSlash ? dom.chkTrailingSlash.checked : true,
            onlyDirectories: onlyDirs,
            fromRoot: isFromRoot,
            ignorePatterns: ignoreList
        };

        // Detectar si el texto contiene rutas (con barras '/') o es indentado con espacios
        const hasPathSlashes = lines.some(l => l.includes('/') || l.includes('\\'));

        let rootNode;
        if (hasPathSlashes) {
            rootNode = engine.parsePaths(lines, rootName, options);
        } else {
            rootNode = engine.parseIndentedText(dom.generatorInput.value, rootName, options);
        }

        const treeStr = engine.renderTree(rootNode, options);
        dom.generatorOutput.textContent = treeStr;
    }

    // =========================================================================
    // GENERACIÓN DIRECTA DE ÁRBOL DESDE RUTA LOCAL (Sin red ni escaneos lentos)
    // =========================================================================
    function generateFromSystemPath(specifiedPath = null) {
        let raw = (specifiedPath || (dom.inputSystemPath ? dom.inputSystemPath.value : '')).trim();
        if (!raw) {
            showToast('Por favor escribe o pega una ruta del sistema válida.', 'warning');
            if (dom.inputSystemPath) dom.inputSystemPath.focus();
            return;
        }

        // Limpiar comillas si se pegó con comillas envolventes
        raw = raw.replace(/^["']|["']$/g, '');

        if (dom.inputSystemPath) {
            dom.inputSystemPath.value = raw;
        }

        const lines = raw.split(/\r?\n/).map(l => l.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        if (lines.length === 0) return;

        // Limpiar caché de escaneo de disco previo
        state.lastScannedData = null;

        const firstLine = lines[0];
        const isLinuxAbs = firstLine.startsWith('/');
        const isWinAbs = /^[a-zA-Z]:[\\\/]/.test(firstLine);

        if (isLinuxAbs) {
            if (dom.chkFromRoot) dom.chkFromRoot.checked = true;
            if (dom.inputRootName) dom.inputRootName.value = '/';
        } else if (isWinAbs) {
            if (dom.chkFromRoot) dom.chkFromRoot.checked = true;
            const driveMatch = firstLine.match(/^([a-zA-Z]:)/);
            if (dom.inputRootName) dom.inputRootName.value = (driveMatch ? driveMatch[1].toUpperCase() : 'C:') + '\\';
        }

        if (dom.generatorInput) {
            dom.generatorInput.value = lines.join('\n');
        }

        updateGenerator();
        showToast('¡Árbol generado directamente siguiendo la ruta indicada!', 'success');
    }

    // =========================================================================
    // LECTURA OPCIONAL DE ARCHIVOS EN DISCO LOCAL (scan.php)
    // =========================================================================
    async function scanSystemPath(specifiedPath = null) {
        const path = (specifiedPath || (dom.inputSystemPath ? dom.inputSystemPath.value : '')).trim().replace(/^["']|["']$/g, '');
        if (!path) {
            showToast('Por favor escribe o pega una ruta del sistema válida.', 'error');
            if (dom.inputSystemPath) dom.inputSystemPath.focus();
            return;
        }

        if (dom.inputSystemPath) {
            dom.inputSystemPath.value = path;
        }

        const onlyDirs = dom.selectContentFilter ? (dom.selectContentFilter.value === 'dirs') : false;
        const fromRoot = dom.chkFromRoot ? dom.chkFromRoot.checked : true;

        showToast(`Leyendo contenido local del disco en "${path}"...`, 'info');

        const scanBtn = dom.btnScanDiskContents || dom.btnScanSystemPath;
        if (scanBtn) {
            scanBtn.disabled = true;
            scanBtn.style.opacity = '0.7';
        }

        try {
            const resp = await fetch('scan.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: path,
                    onlyDirs: onlyDirs,
                    fromRoot: fromRoot,
                    maxDepth: 10
                })
            });

            const data = await resp.json();

            if (!data.success) {
                showToast(`Error al leer disco: ${data.error}`, 'error');
                return;
            }

            state.lastScannedData = data;

            if (dom.inputRootName) {
                dom.inputRootName.value = data.rootName || (fromRoot ? (data.systemRoot || '/') : (data.folderName || 'root'));
            }

            if (dom.generatorInput) {
                const pathsToUse = fromRoot ? (data.fullPaths || data.paths) : (data.relativePaths || data.paths);
                dom.generatorInput.value = pathsToUse.join('\n');
            }

            updateGenerator();

            const summary = onlyDirs 
                ? `${data.totalDirs} directorios (solo carpetas)`
                : `${data.totalDirs} carpetas y ${data.totalFiles} archivos`;

            showToast(`¡Lectura de disco completada! ${summary}.`, 'success');

        } catch (err) {
            showToast(`Error de conexión local: ${err.message}`, 'error');
        } finally {
            if (scanBtn) {
                scanBtn.disabled = false;
                scanBtn.style.opacity = '1';
            }
        }
    }

    // Eventos: Generación directa de la ruta indicada
    if (dom.btnScanSystemPath) {
        dom.btnScanSystemPath.addEventListener('click', () => generateFromSystemPath());
    }

    // Eventos: Lectura opcional de archivos en disco local
    if (dom.btnScanDiskContents) {
        dom.btnScanDiskContents.addEventListener('click', () => scanSystemPath());
    }

    if (dom.inputSystemPath) {
        dom.inputSystemPath.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                generateFromSystemPath();
            }
        });
        dom.inputSystemPath.addEventListener('paste', () => {
            setTimeout(() => generateFromSystemPath(), 50);
        });
    }

    // Botón de acceso rápido al ejemplo de distribuciones Linux
    if (dom.btnUserLinuxSample) {
        dom.btnUserLinuxSample.addEventListener('click', () => {
            const samplePath = '/home/dgarcia/Descargas/Distribuciones Linux - Windows - Office/Linux';
            generateFromSystemPath(samplePath);
        });
    }

    // Eventos del generador
    const genInputs = [
        dom.generatorInput,
        dom.selectStyle,
        dom.selectContentFilter,
        dom.chkFromRoot,
        dom.inputRootName,
        dom.chkFoldersFirst,
        dom.chkShowIcons,
        dom.chkIncludeRoot,
        dom.chkTrailingSlash,
        dom.chkIgnoreCommon
    ];

    genInputs.forEach(el => {
        if (el) {
            el.addEventListener('input', updateGenerator);
            el.addEventListener('change', updateGenerator);
        }
    });

    // Conmutador interactivo para alternar entre Ruta desde Raíz (/ o C:) y Ruta Relativa
    if (dom.chkFromRoot) {
        dom.chkFromRoot.addEventListener('change', () => {
            const isFromRoot = dom.chkFromRoot.checked;
            if (state.lastScannedData) {
                const data = state.lastScannedData;
                if (isFromRoot) {
                    if (dom.inputRootName) dom.inputRootName.value = data.systemRoot || '/';
                    if (dom.generatorInput) dom.generatorInput.value = (data.fullPaths || data.paths).join('\n');
                } else {
                    if (dom.inputRootName) dom.inputRootName.value = data.folderName || 'root';
                    if (dom.generatorInput) dom.generatorInput.value = (data.relativePaths || data.paths).join('\n');
                }
            } else {
                const currentRoot = dom.inputRootName ? dom.inputRootName.value.trim() : '';
                if (isFromRoot && (currentRoot === 'mi-proyecto' || currentRoot === 'proyecto' || !currentRoot)) {
                    if (dom.inputRootName) dom.inputRootName.value = '/';
                }
            }
            updateGenerator();
        });
    }

    // Si el usuario cambia el selector de contenido (Directorios y archivos vs Solo directorios):
    if (dom.selectContentFilter) {
        dom.selectContentFilter.addEventListener('change', () => {
            if (state.lastScannedData) {
                const currentSysPath = dom.inputSystemPath ? dom.inputSystemPath.value.trim() : '';
                if (currentSysPath) scanSystemPath(currentSysPath);
            } else {
                updateGenerator();
            }
        });
    }

    // Detección inteligente si se pega una ruta absoluta en el textarea principal
    if (dom.generatorInput) {
        dom.generatorInput.addEventListener('paste', () => {
            setTimeout(() => {
                const text = dom.generatorInput.value.trim();
                const lines = text.split(/\r?\n/).filter(Boolean);
                if (lines.length === 1 && (text.startsWith('/') || text.startsWith('~') || /^[a-zA-Z]:\\/.test(text))) {
                    if (dom.inputSystemPath) dom.inputSystemPath.value = text;
                }
            }, 100);
        });
    }

    if (dom.btnClearInput) {
        dom.btnClearInput.addEventListener('click', () => {
            dom.generatorInput.value = '';
            updateGenerator();
            showToast('Entrada limpiada.', 'info');
        });
    }

    if (dom.btnLoadSample) {
        dom.btnLoadSample.addEventListener('click', () => {
            loadPreset(PRESETS[0]);
        });
    }

    // =========================================================================
    // LECTURA DE CARPETAS LOCALES (Drag & Drop + Selector de Directorios)
    // =========================================================================
    if (dom.folderDropzone) {
        dom.folderDropzone.addEventListener('click', () => {
            if (dom.folderInput) dom.folderInput.click();
        });

        dom.folderDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dom.folderDropzone.classList.add('dragover');
        });

        dom.folderDropzone.addEventListener('dragleave', () => {
            dom.folderDropzone.classList.remove('dragover');
        });

        dom.folderDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dom.folderDropzone.classList.remove('dragover');

            const items = e.dataTransfer.items;
            if (items && items.length > 0) {
                readDirectoryItems(items);
            } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                readFilesList(e.dataTransfer.files);
            }
        });
    }

    if (dom.folderInput) {
        dom.folderInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                readFilesList(e.target.files);
            }
        });
    }

    /**
     * Lee recursivamente carpetas mediante webkitGetAsEntry
     */
    async function readDirectoryItems(items) {
        const paths = [];
        let rootDetected = '';

        async function traverseEntry(entry, currentPath = '') {
            if (entry.isFile) {
                paths.push(currentPath ? `${currentPath}/${entry.name}` : entry.name);
            } else if (entry.isDirectory) {
                const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                paths.push(`${dirPath}/`);
                const dirReader = entry.createReader();
                const entries = await new Promise(resolve => {
                    dirReader.readEntries(entries => resolve(entries));
                });
                for (const subEntry of entries) {
                    await traverseEntry(subEntry, dirPath);
                }
            }
        }

        showToast('Leyendo estructura de la carpeta...', 'info');

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
                if (!rootDetected && entry.isDirectory) rootDetected = entry.name;
                await traverseEntry(entry);
            }
        }

        if (paths.length > 0) {
            if (rootDetected && dom.inputRootName) dom.inputRootName.value = rootDetected;
            dom.generatorInput.value = paths.join('\n');
            updateGenerator();
            showToast(`¡Estructura importada! Se detectaron ${paths.length} elementos.`, 'success');
        }
    }

    function readFilesList(files) {
        const paths = [];
        let rootDetected = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const relPath = file.webkitRelativePath || file.name;
            paths.push(relPath);

            if (!rootDetected && file.webkitRelativePath) {
                rootDetected = file.webkitRelativePath.split('/')[0];
            }
        }

        if (paths.length > 0) {
            if (rootDetected && dom.inputRootName) dom.inputRootName.value = rootDetected;
            dom.generatorInput.value = paths.join('\n');
            updateGenerator();
            showToast(`¡Estructura importada con éxito (${paths.length} archivos)!`, 'success');
        }
    }

    // =========================================================================
    // LÓGICA MODO 2: ÁRBOL A COMANDOS (MODO INVERSO)
    // =========================================================================
    function updateReverse() {
        if (!dom.reverseInput || !dom.reverseOutput) return;

        const rawTree = dom.reverseInput.value.trim();
        if (!rawTree) {
            dom.reverseOutput.textContent = '# Pega un árbol ASCII/Unicode en el cuadro izquierdo para generar el script de creación...';
            if (dom.statsReverseDirs) dom.statsReverseDirs.textContent = '0';
            if (dom.statsReverseFiles) dom.statsReverseFiles.textContent = '0';
            state.parsedTree = null;
            return;
        }

        const parsed = engine.parseTreeTextToPaths(rawTree);
        state.parsedTree = parsed;

        if (dom.statsReverseDirs) dom.statsReverseDirs.textContent = parsed.directories.length;
        if (dom.statsReverseFiles) dom.statsReverseFiles.textContent = parsed.files.length;

        const shell = dom.selectReverseShell ? dom.selectReverseShell.value : 'bash';
        const createSamples = dom.chkSampleFiles ? dom.chkSampleFiles.checked : false;

        let script = '';
        if (shell === 'bash') {
            script = engine.generateBashScript(parsed, { createSampleFiles: createSamples });
        } else if (shell === 'powershell') {
            script = engine.generatePowerShellScript(parsed);
        } else if (shell === 'cmd') {
            script = engine.generateCmdScript(parsed);
        }

        dom.reverseOutput.textContent = script;
    }

    if (dom.reverseInput) dom.reverseInput.addEventListener('input', updateReverse);
    if (dom.selectReverseShell) dom.selectReverseShell.addEventListener('change', updateReverse);
    if (dom.chkSampleFiles) dom.chkSampleFiles.addEventListener('change', updateReverse);

    if (dom.btnLoadReverseSample) {
        dom.btnLoadReverseSample.addEventListener('click', () => {
            dom.reverseInput.value = `mi-proyecto/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── Card.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   └── index.js
├── public/
│   └── favicon.ico
├── docs/
│   └── README.md
├── package.json
└── .env.example`;
            updateReverse();
            showToast('Árbol de ejemplo cargado en el modo inverso.', 'info');
        });
    }

    // =========================================================================
    // ACCIONES DE COPIADO Y DESCARGA
    // =========================================================================

    function copyToClipboard(text, successMsg = 'Copiado al portapapeles') {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg, 'success');
        }).catch(() => {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast(successMsg, 'success');
            } catch (err) {
                showToast('Error al copiar al portapapeles', 'error');
            }
        });
    }

    function downloadFile(content, filename, type = 'text/plain') {
        if (!content) return;
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Archivo "${filename}" descargado.`, 'success');
    }

    // Copiar Texto Plano
    if (dom.btnCopyPlain) {
        dom.btnCopyPlain.addEventListener('click', () => {
            copyToClipboard(dom.generatorOutput.textContent, 'Árbol copiado como texto plano.');
        });
    }

    // Copiar como bloque Markdown
    if (dom.btnCopyMarkdown) {
        dom.btnCopyMarkdown.addEventListener('click', () => {
            const md = '```text\n' + dom.generatorOutput.textContent + '\n```';
            copyToClipboard(md, 'Árbol copiado en bloque Markdown (```text).');
        });
    }

    // Descargar .txt
    if (dom.btnDownloadTxt) {
        dom.btnDownloadTxt.addEventListener('click', () => {
            const root = dom.inputRootName.value.trim() || 'tree';
            downloadFile(dom.generatorOutput.textContent, `${root}-structure.txt`);
        });
    }

    // Descargar .md
    if (dom.btnDownloadMd) {
        dom.btnDownloadMd.addEventListener('click', () => {
            const root = dom.inputRootName.value.trim() || 'tree';
            const md = `# Estructura de Proyecto: ${root}\n\n\`\`\`text\n${dom.generatorOutput.textContent}\n\`\`\`\n`;
            downloadFile(md, `${root}-structure.md`, 'text/markdown');
        });
    }

    // Copiar Script Inverso
    if (dom.btnCopyScript) {
        dom.btnCopyScript.addEventListener('click', () => {
            copyToClipboard(dom.reverseOutput.textContent, 'Script de terminal copiado.');
        });
    }

    // Descargar Script Inverso
    if (dom.btnDownloadScript) {
        dom.btnDownloadScript.addEventListener('click', () => {
            const shell = dom.selectReverseShell ? dom.selectReverseShell.value : 'bash';
            let ext = 'sh';
            if (shell === 'powershell') ext = 'ps1';
            else if (shell === 'cmd') ext = 'bat';

            downloadFile(dom.reverseOutput.textContent, `create-structure.${ext}`);
        });
    }

    // =========================================================================
    // BIBLIOTECA DE PRESETS DE PROYECTOS
    // =========================================================================
    function loadPreset(preset) {
        if (!preset) return;
        setMode('generator');
        if (dom.inputRootName) dom.inputRootName.value = preset.rootName;
        if (dom.generatorInput) dom.generatorInput.value = preset.paths.join('\n');
        updateGenerator();
        showToast(`Plantilla "${preset.title}" cargada con éxito.`, 'info');
    }

    function renderPresets() {
        if (!dom.presetsContainer) return;
        dom.presetsContainer.innerHTML = PRESETS.map((p, idx) => `
            <div class="preset-card" data-idx="${idx}">
                <div class="preset-card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--tree-blue-light);"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    <span>${p.title}</span>
                </div>
                <div class="preset-card-desc">${p.desc}</div>
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:#60A5FA; margin-top:0.5rem;">
                    📁 ${p.rootName}/ (${p.paths.length} elementos)
                </div>
            </div>
        `).join('');

        dom.presetsContainer.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.dataset.idx, 10);
                loadPreset(PRESETS[idx]);
            });
        });
    }

    // =========================================================================
    // SISTEMA DE NOTIFICACIONES TOAST
    // =========================================================================
    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.25s forwards';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }, 3000);
    }

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================
    renderPresets();
    loadPreset(PRESETS[0]); // Cargar React/Vite por defecto
});
