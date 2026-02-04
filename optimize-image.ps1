# PowerShell script to optimize PNG image
Add-Type -AssemblyName System.Drawing

$inputPath = "public\bg-sdsc.png"
$outputPath = "public\bg-sdsc-optimized.png"
$backupPath = "public\bg-sdsc-original.png"

Write-Host "Original size: $((Get-Item $inputPath).Length / 1KB) KB" -ForegroundColor Yellow

# Load the image
$image = [System.Drawing.Image]::FromFile((Resolve-Path $inputPath))

# Get original dimensions
$width = $image.Width
$height = $image.Height

Write-Host "Original dimensions: ${width}x${height}" -ForegroundColor Cyan

# Create a new bitmap with reduced quality/size
$newWidth = [int]($width * 0.8)  # Reduce to 80% of original size
$newHeight = [int]($height * 0.8)

$newBitmap = New-Object System.Drawing.Bitmap $newWidth, $newHeight
$graphics = [System.Drawing.Graphics]::FromImage($newBitmap)

# Set high quality rendering
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Draw the resized image
$graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)

# Save the optimized image
$newBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$newBitmap.Dispose()
$image.Dispose()

Write-Host "Optimized size: $((Get-Item $outputPath).Length / 1KB) KB" -ForegroundColor Green
Write-Host "New dimensions: ${newWidth}x${newHeight}" -ForegroundColor Cyan

# Backup original and replace
Copy-Item $inputPath $backupPath -Force
Move-Item $outputPath $inputPath -Force

Write-Host "`nOptimization complete!" -ForegroundColor Green
Write-Host "Original backed up to: $backupPath" -ForegroundColor Gray
Write-Host "Reduction: $([math]::Round((1 - ((Get-Item $inputPath).Length / (Get-Item $backupPath).Length)) * 100, 2))%" -ForegroundColor Green
