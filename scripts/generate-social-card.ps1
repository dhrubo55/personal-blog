$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$output = Join-Path $root 'static/images/social/default.png'
New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null

$bitmap = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $graphics.Clear([System.Drawing.Color]::FromArgb(30, 30, 33))
    $accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(98, 159, 255))
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 245, 245))
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(190, 193, 200))
    $nameFont = New-Object System.Drawing.Font 'Segoe UI', 54, ([System.Drawing.FontStyle]::Bold)
    $tagFont = New-Object System.Drawing.Font 'Segoe UI', 29, ([System.Drawing.FontStyle]::Regular)
    $urlFont = New-Object System.Drawing.Font 'Segoe UI', 22, ([System.Drawing.FontStyle]::Regular)
    $graphics.FillRectangle($accent, 72, 82, 12, 390)
    $graphics.DrawString('Mohibul Hassan Chowdhury', $nameFont, $white, 118, 120)
    $graphics.DrawString('Java, distributed systems, production AI, and reliability', $tagFont, $muted, 120, 245)
    $graphics.DrawString('mohibulsblog.netlify.app', $urlFont, $accent, 120, 490)
    $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $bitmap.Dispose()
}
