$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$zipPath = Join-Path (Split-Path -Parent $repoRoot) 'edynora-marketing-agent-source.zip'
Add-Type -AssemblyName System.IO.Compression
$zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
$zipArchive = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
function Add-SourceFolder([string]$folder) {
    foreach ($entry in Get-ChildItem -LiteralPath $folder -Force | Sort-Object Name) {
        if ($entry.PSIsContainer) {
            if ($entry.Name -notin @('.git', 'node_modules', 'dist', 'work', '.edynora')) { Add-SourceFolder $entry.FullName }
        } elseif ($entry.Extension -ne '.tgz') {
            $relativeName = $entry.FullName.Substring($repoRoot.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArchive, $entry.FullName, ('edynora-marketing-agent/' + $relativeName), [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
}
try { Add-SourceFolder $repoRoot } finally { $zipArchive.Dispose(); $zipStream.Dispose() }
Get-Item -LiteralPath $zipPath | Select-Object FullName, Length
