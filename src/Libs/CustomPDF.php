<?php

require_once __DIR__ . '/../Libs/fpdf/fpdf.php';

class CustomPDF extends FPDF
{
    protected $rtName;
    protected $rtAddress;
    protected $headerLogoPath;
    protected $footerLogoPath;

    // --- FPDF EXTENSIONS ---
    public function Circle($x, $y, $r, $style = 'D')
    {
        $this->Ellipse($x, $y, $r, $r, $style);
    }

    public function Ellipse($x, $y, $rx, $ry, $style = 'D')
    {
        if ($style == 'F')
            $op = 'f';
        elseif ($style == 'FD' || $style == 'DF')
            $op = 'B';
        else
            $op = 'S';
        $lx = 4 / 3 * (M_SQRT2 - 1) * $rx;
        $ly = 4 / 3 * (M_SQRT2 - 1) * $ry;
        $k = $this->k;
        $h = $this->h;
        $this->_out(sprintf('%.2F %.2F m', ($x + $rx) * $k, ($h - $y) * $k));
        $this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c', ($x + $rx) * $k, ($h - ($y - $ly)) * $k, ($x + $lx) * $k, ($h - ($y - $ry)) * $k, $x * $k, ($h - ($y - $ry)) * $k));
        $this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c', ($x - $lx) * $k, ($h - ($y - $ry)) * $k, ($x - $rx) * $k, ($h - ($y - $ly)) * $k, ($x - $rx) * $k, ($h - $y) * $k));
        $this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c', ($x - $rx) * $k, ($h - ($y + $ly)) * $k, ($x - $lx) * $k, ($h - ($y + $ry)) * $k, $x * $k, ($h - ($y + $ry)) * $k));
        $this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c', ($x + $lx) * $k, ($h - ($y + $ry)) * $k, ($x + $rx) * $k, ($h - ($y + $ly)) * $k, ($x + $rx) * $k, ($h - $y) * $k));
        $this->_out($op);
    }

    public function RoundedRect($x, $y, $w, $h, $r, $style = '', $corners = '1234')
    {
        $k = $this->k;
        $hp = $this->h;
        if ($style == 'F')
            $op = 'f';
        elseif ($style == 'FD' || $style == 'DF')
            $op = 'B';
        else
            $op = 'S';
        $MyArc = 4 / 3 * (M_SQRT2 - 1);
        $this->_out(sprintf('%.2F %.2F m', ($x + $r) * $k, ($hp - $y) * $k));

        $xc = $x + $w - $r;
        $yc = $y + $r;
        $this->_out(sprintf('%.2F %.2F l', $xc * $k, ($hp - $y) * $k));
        if (strpos($corners, '2') !== false)
            $this->_Arc($xc + $r * $MyArc, $yc - $r, $xc + $r, $yc - $r * $MyArc, $xc + $r, $yc);
        else
            $this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - $y) * $k));

        $xc = $x + $w - $r;
        $yc = $y + $h - $r;
        $this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - $yc) * $k));
        if (strpos($corners, '3') !== false)
            $this->_Arc($xc + $r, $yc + $r * $MyArc, $xc + $r * $MyArc, $yc + $r, $xc, $yc + $r);
        else
            $this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - ($y + $h)) * $k));

        $xc = $x + $r;
        $yc = $y + $h - $r;
        $this->_out(sprintf('%.2F %.2F l', $xc * $k, ($hp - ($y + $h)) * $k));
        if (strpos($corners, '4') !== false)
            $this->_Arc($xc - $r * $MyArc, $yc + $r, $xc - $r, $yc + $r * $MyArc, $xc - $r, $yc);
        else
            $this->_out(sprintf('%.2F %.2F l', ($x) * $k, ($hp - ($y + $h)) * $k));

        $xc = $x + $r;
        $yc = $y + $r;
        $this->_out(sprintf('%.2F %.2F l', ($x) * $k, ($hp - $yc) * $k));
        if (strpos($corners, '1') !== false)
            $this->_Arc($xc - $r, $yc - $r * $MyArc, $xc - $r * $MyArc, $yc - $r, $xc, $yc - $r);
        else {
            $this->_out(sprintf('%.2F %.2F l', ($x) * $k, ($hp - $y) * $k));
            $this->_out(sprintf('%.2F %.2F l', ($x + $r) * $k, ($hp - $y) * $k));
        }
        $this->_out($op);
    }

    protected function _Arc($x1, $y1, $x2, $y2, $x3, $y3)
    {
        $h = $this->h;
        $this->_out(sprintf(
            '%.2F %.2F %.2F %.2F %.2F %.2F c ',
            $x1 * $this->k,
            ($h - $y1) * $this->k,
            $x2 * $this->k,
            ($h - $y2) * $this->k,
            $x3 * $this->k,
            ($h - $y3) * $this->k
        ));
    }

    public function SignatureBox($dateLocation, $creatorName, $creatorTitle = 'Bendahara', $knowName = 'Nama Ketua RT', $knowTitle = 'Mengetahui')
    {
        // 1. Check Space to prevent orphaned signatures (Avoid split across pages)
        if ($this->GetY() > 220) {
            $this->AddPage();
        }

        $this->Ln(10);
        $this->SetFont('Helvetica', '', 9);
        $this->SetTextColor(30, 41, 59);

        // Date and Location
        $this->Cell(0, 5, $dateLocation, 0, 1, 'R');
        $this->Ln(5);

        $startY = $this->GetY();
        $colWidth = ($this->GetPageWidth() - 20) / 2;

        // --- ROW 1: Titles ---
        $this->SetX(10);
        $this->Cell($colWidth, 5, $creatorTitle . ',', 0, 0, 'C');
        $this->SetX(10 + $colWidth);
        $this->Cell($colWidth, 5, $knowTitle . ',', 0, 1, 'C');

        $this->Ln(18); // Signature space

        // --- ROW 2: Names ---
        $this->SetFont('Helvetica', 'B', 9);
        $this->SetX(10);
        $this->Cell($colWidth, 5, $creatorName, 0, 0, 'C');
        $this->SetX(10 + $colWidth);
        $this->Cell($colWidth, 5, $knowName, 0, 1, 'C');

        // --- ROW 3: Helper Text ---
        $this->SetFont('Helvetica', '', 8);
        $this->SetTextColor(100, 116, 139);
        $this->SetX(10);
        $this->Cell($colWidth, 4, '(Tanda Tangan & Nama Terang)', 0, 0, 'C');
        $this->SetX(10 + $colWidth);
        $this->Cell($colWidth, 4, '(Tanda Tangan & Nama Terang)', 0, 1, 'C');
    }

    public function __construct($orientation = 'P', $unit = 'mm', $size = 'A4', $rtName = '', $rtAddress = '', $logoPath = null)
    {
        parent::__construct($orientation, $unit, $size);
        $this->rtName = $rtName;
        $this->rtAddress = $rtAddress;

        // Header Logo (Dynamic or Default)
        if ($logoPath && file_exists(__DIR__ . '/../../public' . $logoPath)) {
            $this->headerLogoPath = __DIR__ . '/../../public' . $logoPath;
        } else {
            $this->headerLogoPath = __DIR__ . '/../../public/assets/images/logo.png';
        }

        // Footer Logo (Always System Default)
        $this->footerLogoPath = __DIR__ . '/../../public/assets/images/logo.png';
    }

    function Header()
    {
        $hasLogo = file_exists($this->headerLogoPath);

        // 1. Logo (Left Side)
        if ($hasLogo) {
            $logoWidth = 20;
            $this->Image($this->headerLogoPath, 10, 10, $logoWidth);
        }

        // 2. Text Logic
        if ($hasLogo) {
            $this->SetX(33); // 10 margin + 20 logo + 3 padding
            $align = 'L';
        } else {
            $this->SetX(10);
            $align = 'C';
        }

        // Title
        $this->SetFont('Helvetica', 'B', 16);
        $this->Cell(0, 8, strtoupper($this->rtName ?: 'SISTEM MANAJEMEN RT'), 0, 1, $align);

        // Address
        if ($hasLogo)
            $this->SetX(33);
        else
            $this->SetX(10);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, $this->rtAddress ?: 'Jalan Contoh No. 123, Jakarta', 0, 1, $align);

        // Adjust Y position
        $currentY = $this->GetY();
        if ($currentY < 32) {
            $this->SetY(32);
        } else {
            $this->Ln(5);
        }

        // Horizontal line
        $this->SetDrawColor(80, 80, 80);
        $this->SetLineWidth(0.5);
        $this->Line(10, $this->GetY(), $this->GetPageWidth() - 10, $this->GetY());
        $this->SetLineWidth(0.2); // Reset
        $this->Ln(5);
    }

    function Footer()
    {
        // Position at 1.5 cm from bottom
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 8);
        $this->SetTextColor(128, 128, 128);

        // Content: "Generated by - " [Logo]
        $text = 'Generated by    ';
        $logoWidth = 24;

        $textWidth = $this->GetStringWidth($text);
        $totalWidth = $textWidth + $logoWidth;

        // Centering
        $startX = ($this->GetPageWidth() - $totalWidth) / 2;

        // Output Text
        $this->SetX($startX);
        $this->Cell($textWidth, 10, $text, 0, 0, 'L');

        // Output Logo - Use Footer Logo (Fixed)
        if (file_exists($this->footerLogoPath)) {
            $imageY = $this->GetY() + 2.5;
            $this->Image($this->footerLogoPath, $this->GetX(), $imageY, $logoWidth);
        }
    }
}
