# Cosmic Odyssey - Local HTTP Server
# Serves static files on http://localhost:8080 and bypasses ES6 module CORS issues.

$port = 8080
$localPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $localPath) { $localPath = Get-Location }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    COSMIC ODYSSEY LOCAL WEB SERVER      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Root Directory: $localPath"
Write-Host "Starting server on http://localhost:$port/..." -ForegroundColor Yellow

try {
    $listener.Start()
    Write-Host "Server successfully started!" -ForegroundColor Green
    Write-Host "Opening web browser to http://localhost:$port/..." -ForegroundColor Yellow
    Start-Process "http://localhost:$port/"
    
    Write-Host "Press Ctrl+C to terminate the server." -ForegroundColor Red
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        # Clean urlPath of trailing slashes or backslashes
        $urlPath = $urlPath -replace "^/", ""
        if ($urlPath -eq "" -or $urlPath -eq "/") {
            $urlPath = "index.html"
        }
        
        $filePath = Join-Path $localPath $urlPath
        
        # Safeguard path traversal
        $resolvedFilePath = [System.IO.Path]::GetFullPath($filePath)
        $resolvedLocalPath = [System.IO.Path]::GetFullPath($localPath)
        
        if (-not $resolvedFilePath.StartsWith($resolvedLocalPath)) {
            Write-Host "Access denied (Path traversal attempt): $urlPath" -ForegroundColor Red
            $response.StatusCode = 403
            $response.StatusDescription = "Forbidden"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            $response.OutputStream.Close()
            continue
        }
        
        if (Test-Path $resolvedFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($resolvedFilePath).ToLower()
            $mime = "application/octet-stream"
            switch ($ext) {
                ".html" { $mime = "text/html; charset=utf-8" }
                ".css"  { $mime = "text/css; charset=utf-8" }
                ".js"   { $mime = "application/javascript; charset=utf-8" }
                ".json" { $mime = "application/json; charset=utf-8" }
                ".png"  { $mime = "image/png" }
                ".jpg"  { $mime = "image/jpeg" }
                ".jpeg" { $mime = "image/jpeg" }
                ".gif"  { $mime = "image/gif" }
                ".svg"  { $mime = "image/svg+xml; charset=utf-8" }
                ".mp3"  { $mime = "audio/mpeg" }
                ".wav"  { $mime = "audio/wav" }
                ".ico"  { $mime = "image/x-icon" }
            }
            
            $response.ContentType = $mime
            try {
                $bytes = [System.IO.File]::ReadAllBytes($resolvedFilePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                Write-Host "Error sending file $urlPath: $_" -ForegroundColor Red
                $response.StatusCode = 500
            }
        } else {
            Write-Host "File not found: $urlPath (mapped to $resolvedFilePath)" -ForegroundColor Yellow
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 File Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Server failed to start or encountered an error: $_" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
        Write-Host "Server stopped." -ForegroundColor Red
    }
}
