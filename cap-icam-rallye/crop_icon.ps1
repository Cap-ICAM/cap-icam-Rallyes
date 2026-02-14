
Add-Type -AssemblyName System.Drawing

$sourcePath = "$PSScriptRoot/assets/logo.jpg"
$destPath = "$PSScriptRoot/assets/logo_zoomed.jpg"
$cropFactor = 0.85 

try {
    Write-Host "Loading image from $sourcePath"
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $width = $img.Width
    $height = $img.Height
    Write-Host "Original Size: $width x $height"
    
    $minDim = [Math]::Min($width, $height)
    $cropSize = [int][Math]::Floor($minDim * $cropFactor)
    
    $x = [int][Math]::Floor(($width - $cropSize) / 2)
    $y = [int][Math]::Floor(($height - $cropSize) / 2)
    
    Write-Host "Cropping to: $cropSize x $cropSize at ($x, $y)"
    
    $rect = New-Object System.Drawing.Rectangle $x, $y, $cropSize, $cropSize
    $destImg = New-Object System.Drawing.Bitmap $cropSize, $cropSize
    
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $destRect = New-Object System.Drawing.Rectangle 0, 0, $cropSize, $cropSize
    $graphics.DrawImage($img, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $destImg.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    
    Write-Host "Success: Created $destPath"
}
catch {
    Write-Error "Failed to process image: $_"
    exit 1
}
finally {
    if ($img) { $img.Dispose() }
    if ($destImg) { $destImg.Dispose() }
    if ($graphics) { $graphics.Dispose() }
}
