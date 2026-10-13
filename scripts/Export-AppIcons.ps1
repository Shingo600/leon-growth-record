param(
  [string]$Source = (Join-Path $PSScriptRoot '../public/leon-icon-20261014-v2.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$output = Join-Path $PSScriptRoot '../public/icons'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source).Path)
try {
  foreach ($variant in @(
    @{ Name = '32'; Size = 32; Scale = 1.0 },
    @{ Name = '192'; Size = 192; Scale = 1.0 },
    @{ Name = '512'; Size = 512; Scale = 1.0 },
    @{ Name = 'apple-180'; Size = 180; Scale = 1.0 },
    @{ Name = 'maskable-512'; Size = 512; Scale = 0.72 }
  )) {
    $size = $variant.Size
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F7F2EA'))
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      # Extra inset keeps the upright ears within common launcher masks.
      $drawSize = [int][Math]::Round($size * $variant.Scale)
      $offset = [int][Math]::Floor(($size - $drawSize) / 2)
      $graphics.DrawImage($image, $offset, $offset, $drawSize, $drawSize)
      $path = Join-Path $output "leon-20261014-$($variant.Name).png"
      $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output $path
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
} finally {
  $image.Dispose()
}
