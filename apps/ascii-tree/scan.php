<?php
/**
 * scan.php
 * Endpoint local para escanear directorios del sistema de archivos local
 * y devolver la lista de rutas relativas o absolutas desde la raíz para el Generador ASCII Tree.
 * Soporta Linux (/) y Windows (C:\).
 * Compatible con PHP 5.6+ y PHP 7/8.
 * SimpleApps Suite • Módulo #06
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(array('success' => false, 'error' => 'Método no permitido.'));
    exit;
}

$rawInput = file_get_contents('php://input');
$input = array();
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}
if (empty($input) && !empty($_POST)) {
    $input = $_POST;
}
if (empty($input) && !empty($_GET)) {
    $input = $_GET;
}

$targetPath = isset($input['path']) ? trim($input['path']) : '';
$onlyDirs = isset($input['onlyDirs']) ? filter_var($input['onlyDirs'], FILTER_VALIDATE_BOOLEAN) : false;
$fromRoot = isset($input['fromRoot']) ? filter_var($input['fromRoot'], FILTER_VALIDATE_BOOLEAN) : true;
$maxDepth = isset($input['maxDepth']) ? max(1, min(12, intval($input['maxDepth']))) : 8;
$includeHidden = isset($input['includeHidden']) ? filter_var($input['includeHidden'], FILTER_VALIDATE_BOOLEAN) : false;

if (empty($targetPath)) {
    echo json_encode(array('success' => false, 'error' => 'Por favor proporciona una ruta del sistema válida.'));
    exit;
}

// Expandir tilde ~ a home si aplica
if ($targetPath === '~' || strpos($targetPath, '~/') === 0) {
    $home = getenv('HOME') ? getenv('HOME') : (isset($_SERVER['HOME']) ? $_SERVER['HOME'] : '');
    if ($home) {
        $targetPath = preg_replace('/^~/', $home, $targetPath);
    }
}

// Normalizar separadores y eliminar slash final
$targetPath = rtrim(str_replace('\\', '/', $targetPath), '/');

if (!file_exists($targetPath)) {
    echo json_encode(array(
        'success' => false,
        'error' => "La ruta no existe en el sistema: \"" . $targetPath . "\""
    ));
    exit;
}

if (!is_dir($targetPath)) {
    echo json_encode(array(
        'success' => false,
        'error' => "La ruta indicada es un archivo individual, no un directorio: \"" . $targetPath . "\""
    ));
    exit;
}

if (!is_readable($targetPath)) {
    echo json_encode(array(
        'success' => false,
        'error' => "Permiso denegado: el servidor local no tiene permisos de lectura sobre \"" . $targetPath . "\"."
    ));
    exit;
}

// Detectar raíz del sistema (Linux / o Windows C:\)
$isWindows = false;
$systemRoot = '/';
if (preg_match('/^([a-zA-Z]:)/', $targetPath, $driveMatches)) {
    $isWindows = true;
    $systemRoot = strtoupper($driveMatches[1]) . '\\';
} elseif (strpos($targetPath, '/') === 0) {
    $systemRoot = '/';
}

$folderName = basename($targetPath);
$fullPaths = array();
$relPaths = array();
$totalDirs = 0;
$totalFiles = 0;

$ignoreList = array('.git', 'node_modules', '.DS_Store', 'Thumbs.db', 'dist', 'build', '__pycache__', '.idea', '.vscode');

function scanDirRecursive($baseDir, $currentRelPath, $depth, $maxDepth, $onlyDirs, $includeHidden, $ignoreList, &$fullPaths, &$relPaths, &$totalDirs, &$totalFiles) {
    if ($depth > $maxDepth) return;

    $fullPath = $currentRelPath === '' ? $baseDir : $baseDir . '/' . $currentRelPath;
    $items = @scandir($fullPath);
    if ($items === false) return;

    // Ordenar: directorios primero, luego alfabético natural
    usort($items, function($a, $b) use ($fullPath) {
        $isDirA = is_dir($fullPath . '/' . $a);
        $isDirB = is_dir($fullPath . '/' . $b);
        if ($isDirA !== $isDirB) {
            return $isDirA ? -1 : 1;
        }
        return strnatcasecmp($a, $b);
    });

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        if (!$includeHidden && strpos($item, '.') === 0) continue;
        if (in_array($item, $ignoreList)) continue;

        $itemRelPath = $currentRelPath === '' ? $item : $currentRelPath . '/' . $item;
        $itemFullPath = $fullPath . '/' . $item;

        if (is_dir($itemFullPath)) {
            $totalDirs++;
            $relPaths[] = $itemRelPath . '/';
            $fullPaths[] = $itemFullPath . '/';
            scanDirRecursive($baseDir, $itemRelPath, $depth + 1, $maxDepth, $onlyDirs, $includeHidden, $ignoreList, $fullPaths, $relPaths, $totalDirs, $totalFiles);
        } else {
            if (!$onlyDirs) {
                $totalFiles++;
                $relPaths[] = $itemRelPath;
                $fullPaths[] = $itemFullPath;
            }
        }
    }
}

scanDirRecursive($targetPath, '', 1, $maxDepth, $onlyDirs, $includeHidden, $ignoreList, $fullPaths, $relPaths, $totalDirs, $totalFiles);

$chosenPaths = $fromRoot ? $fullPaths : $relPaths;
$detectedRootName = $fromRoot ? $systemRoot : $folderName;

echo json_encode(array(
    'success' => true,
    'rootName' => $detectedRootName,
    'systemRoot' => $systemRoot,
    'folderName' => $folderName,
    'basePath' => $targetPath,
    'fromRoot' => $fromRoot,
    'onlyDirs' => $onlyDirs,
    'totalDirs' => $totalDirs,
    'totalFiles' => $totalFiles,
    'totalItems' => count($chosenPaths),
    'paths' => $chosenPaths,
    'fullPaths' => $fullPaths,
    'relativePaths' => $relPaths
));
