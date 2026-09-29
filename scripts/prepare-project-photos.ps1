$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Create web-sized copies; the source photos remain untouched.
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot 'project photos'
$outputRoot = Join-Path $projectRoot 'public/projects'
$folders = [ordered]@{
  'residential/Aaranya 99' = 'aaranya-99'
  'residential/ankleshwar' = 'ankleshwar'
  'residential/auro vivanta' = 'auro-vivanta'
  'residential/hiya horizon' = 'hiya-horizon'
  'residential/Krishnapark waghodia' = 'krishnapark-waghodia'
  'residential/Samriddhi 60 onyx' = 'samriddhi-60-onyx'
  'residential/vriund (2 Properties)' = 'vriund-residences'
  'commercial/Ahmedabad office' = 'ahmedabad-office'
  'commercial/janmahal Sayajigunj office' = 'janmahal-sayajigunj-office'
  'commercial/manjalpur office' = 'manjalpur-office'
  'commercial/racecourse office' = 'racecourse-office'
  'commercial/studio' = 'studio'
  'industrial/Industrial jayant packing' = 'jayant-packing'
}
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$metadata = [ordered]@{}
foreach ($folder in $folders.Keys) {
  $slug = $folders[$folder]
  $destination = Join-Path $outputRoot $slug
  New-Item -ItemType Directory -Force $destination | Out-Null
  foreach ($file in (Get-ChildItem -LiteralPath (Join-Path $sourceRoot $folder) -File | Sort-Object Name)) {
    if ($file.Extension -notmatch '^\.(png|jpe?g)$') { continue }
    $id = ($file.Name -split '\.')[0].ToLowerInvariant()
    $photo = [System.Drawing.Image]::FromFile($file.FullName)
    try {
      if ($photo.PropertyIdList -contains 274) {
        $orientation = [BitConverter]::ToUInt16($photo.GetPropertyItem(274).Value, 0)
        $rotations = @{ 2 = 4; 3 = 2; 4 = 6; 5 = 5; 6 = 1; 7 = 7; 8 = 3 }
        if ($rotations.ContainsKey([int]$orientation)) {
          $photo.RotateFlip([System.Drawing.RotateFlipType]$rotations[[int]$orientation])
        }
      }
      $metadata["/projects/$slug/$id.jpg"] = @{ width = $photo.Width; height = $photo.Height }
      foreach ($targetWidth in @(320, 1000, 2000)) {
        $scale = [math]::Min(1.0, $targetWidth / $photo.Width)
        $bitmap = New-Object System.Drawing.Bitmap([int][math]::Round($photo.Width * $scale), [int][math]::Round($photo.Height * $scale))
        $canvas = [System.Drawing.Graphics]::FromImage($bitmap)
        $settings = New-Object System.Drawing.Imaging.EncoderParameters(1)
        try {
          $canvas.Clear([System.Drawing.Color]::White)
          $canvas.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $canvas.DrawImage($photo, 0, 0, $bitmap.Width, $bitmap.Height)
          $settings.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
          $suffix = if ($targetWidth -eq 2000) { '' } else { "-$targetWidth" }
          $bitmap.Save((Join-Path $destination "$id$suffix.jpg"), $encoder, $settings)
        } finally {
          $settings.Dispose()
          $canvas.Dispose()
          $bitmap.Dispose()
        }
      }
    } finally {
      $photo.Dispose()
    }
  }
}
$json = $metadata | ConvertTo-Json -Depth 3
[System.IO.File]::WriteAllText((Join-Path $projectRoot 'src/data/project-images.json'), $json + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Prepared $($metadata.Count) project images in three sizes."
