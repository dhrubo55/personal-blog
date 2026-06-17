$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$supportPage = Join-Path $root 'content/support.md'
$supportCss = Join-Path $root 'assets/css/extended/support.css'
$config = Join-Path $root 'config.yml'

function Assert-FileContains {
    param(
        [string] $Path,
        [string] $Pattern,
        [string] $Message
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing file: $Path"
    }

    if (-not (Select-String -LiteralPath $Path -Pattern $Pattern -Quiet)) {
        throw $Message
    }
}

Assert-FileContains $supportPage '^title: Support Mohibul Hassan' 'Support page title is missing.'
Assert-FileContains $supportPage 'supportkori\.com/mohibulhassan' 'SupportKori link is missing from support page.'
Assert-FileContains $supportPage 'buymeacoffee\.com/celurian92c' 'Buy Me a Coffee link is missing from support page.'
Assert-FileContains $supportPage 'mohibulhassan100@gmail\.com' 'Contact email is missing from support page.'
Assert-FileContains $supportPage 'bKash' 'bKash section is missing from support page.'
Assert-FileContains $supportPage 'Personal account' 'bKash account type is missing from support page.'
Assert-FileContains $supportPage 'QR code coming soon' 'bKash QR placeholder is missing from support page.'
Assert-FileContains $supportPage 'tab-local' 'Local payment tab is missing from support page.'
Assert-FileContains $supportPage 'tab-intl' 'International payment tab is missing from support page.'
Assert-FileContains $supportPage 'switchSupportTab' 'Payment tab switching script is missing.'
Assert-FileContains $supportPage 'support-qr-overlay' 'QR modal is missing from support page.'
Assert-FileContains $supportPage 'showSupportQR' 'QR modal script is missing from support page.'
Assert-FileContains $supportPage 'copyAllBank' 'Copy-all bank helper is missing from support page.'
Assert-FileContains $supportPage 'BRAC Bank PLC' 'BRAC Bank name is missing from support page.'
Assert-FileContains $supportPage '1043831890002' 'BRAC Bank account number is missing from support page.'
Assert-FileContains $supportPage 'MOHIBUL HASSAN CHOWDHURY' 'BRAC Bank account name is missing from support page.'
Assert-FileContains $supportPage 'SATMASJID ROAD BRANCH' 'BRAC Bank branch is missing from support page.'
Assert-FileContains $supportPage '060276074' 'BRAC Bank routing number is missing from support page.'
Assert-FileContains $supportPage 'BRAKBDDH' 'BRAC Bank SWIFT code is missing from support page.'
Assert-FileContains $supportPage '@chowdhu_mohibul' 'nSave tag is missing from support page.'
Assert-FileContains $supportPage 'web\.nsave\.com/app\?path=accounts\?ntag=chowdhu_mohibul' 'nSave link is missing from support page.'
Assert-FileContains $supportPage 'support-shell' 'Support page wrapper class is missing.'
Assert-FileContains $supportPage 'support-payment-row' 'Payment detail rows are missing from support page.'
Assert-FileContains $supportCss '\.support-shell' 'Support page CSS wrapper is missing.'
Assert-FileContains $supportCss '\.support-tabs' 'Support page tab styling is missing.'
Assert-FileContains $supportCss '\.support-qr-overlay' 'Support page QR modal styling is missing.'
Assert-FileContains $supportCss '\.support-payment-row' 'Payment detail row styling is missing.'
Assert-FileContains $config 'url: support/' 'Support page navigation entry is missing.'

Write-Host 'Support page smoke test passed.'
