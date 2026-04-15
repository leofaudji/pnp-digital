<?php
require_once __DIR__ . '/src/Libs/fpdf/fpdf.php';
require_once __DIR__ . '/src/Libs/CustomPDF.php';

try {
    $pdf = new FPDF();
    $pdf->AddPage();
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(40, 10, 'Testing FPDF');
    
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=test";
    
    echo "Attempting to fetch image from: $qrUrl\n";
    $pdf->Image($qrUrl, 10, 30, 30, 30, 'PNG');
    
    echo "PDF generated successfully (not outputting binary to terminal)\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
