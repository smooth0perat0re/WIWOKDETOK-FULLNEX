<?php

declare(strict_types=1);

/**
 * oracle-bridge — jembatan privat wiwokdetok ke Oracle kampus (schema EIS).
 *
 * Bukan bagian dari service-civitas — repo/container terpisah total, cuma dipakai
 * wiwokdetok sendiri. Alasan butuh PHP+OCI8 (bukan langsung dari Next.js/Node):
 * Oracle server kampus versinya gak didukung node-oracledb mode Thin (NJS-138),
 * wajib mode Thick (Instant Client asli) — OCI8 di sini reuse binary Instant
 * Client Linux yang sama kayak yang dipakai civitas (lihat oracle-instanclient/,
 * cuma file zip Oracle, bukan kode civitas).
 *
 * Endpoint:
 *   GET /libur-nasional?tahun=YYYY   -> [{ "date": "YYYY-MM-DD", "name": "..." }, ...]
 *
 * Auth: header X-Bridge-Key harus cocok BRIDGE_API_KEY (shared secret sederhana —
 * service ini gak pernah dipublish ke internet/LAN, cuma reachable dari wiwok-app
 * lewat localhost/docker network internal).
 */

header('Content-Type: application/json');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

$expectedKey = getenv('BRIDGE_API_KEY') ?: '';
$givenKey = $_SERVER['HTTP_X_BRIDGE_KEY'] ?? '';
if ($expectedKey === '' || !hash_equals($expectedKey, $givenKey)) {
    respond(401, ['error' => 'Unauthorized']);
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if ($path === '/libur-nasional' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $tahun = isset($_GET['tahun']) ? (int) $_GET['tahun'] : (int) date('Y');

    $conn = @oci_connect(getenv('ORACLE_USER'), getenv('ORACLE_PASS'), getenv('ORACLE_DSN'));
    if (!$conn) {
        $e = oci_error();
        error_log('oracle-bridge connect failed: ' . ($e['message'] ?? 'unknown'));
        respond(502, ['error' => 'Oracle connect failed']);
    }

    $stmt = oci_parse($conn, "
        SELECT TO_CHAR(tanggal, 'YYYY-MM-DD') AS tgl, TRIM(desc_libur) AS keterangan
        FROM EIS.LIBUR_NASIONAL
        WHERE EXTRACT(YEAR FROM tanggal) = :tahun
        ORDER BY tanggal
    ");
    oci_bind_by_name($stmt, ':tahun', $tahun);

    if (!oci_execute($stmt)) {
        $e = oci_error($stmt);
        error_log('oracle-bridge query failed: ' . ($e['message'] ?? 'unknown'));
        oci_close($conn);
        respond(500, ['error' => 'Query failed']);
    }

    $result = [];
    while ($row = oci_fetch_assoc($stmt)) {
        $result[] = [
            'date' => $row['TGL'],
            // Oracle TRIM() cuma strip spasi, bukan newline — beberapa desc_libur ada
            // "\n" nyangkut di akhir (typo input manual), bersihin di sini juga.
            'name' => trim($row['KETERANGAN']),
        ];
    }

    oci_free_statement($stmt);
    oci_close($conn);

    respond(200, $result);
}

respond(404, ['error' => 'Not found']);
