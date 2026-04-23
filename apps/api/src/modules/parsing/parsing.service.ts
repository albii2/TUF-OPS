import { pool } from '@packages/database';

interface RawRowInput {
  source_row_number: number;
  order_number?: string;
  customer_name?: string;
  email?: string;
  base_sku?: string;
  quantity?: number;
  size?: string;
  color?: string;
}

export async function createUpload(fileName: string, filePath: string, orderType: string, uploadedByUserId?: number) {
  const result = await pool.query(
    'INSERT INTO raw_order_uploads (file_name, file_path, order_type, uploaded_by_user_id, processing_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [fileName, filePath, orderType, uploadedByUserId ?? null, 'PENDING']
  );

  return result.rows[0];
}

export async function ingestRows(uploadId: number, rows: RawRowInput[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const uploadResult = await client.query('SELECT order_type FROM raw_order_uploads WHERE id = $1', [uploadId]);
    if (uploadResult.rows.length === 0) {
      throw new Error('Upload not found');
    }

    const uploadOrderType = uploadResult.rows[0].order_type;

    for (const row of rows) {
      const parseErrors: string[] = [];
      if (!row.order_number) parseErrors.push('order_number missing');
      if (!row.quantity || row.quantity <= 0) parseErrors.push('quantity must be greater than 0');
      if (!row.base_sku) parseErrors.push('base_sku missing');

      const validationStatus = parseErrors.length > 0 ? 'NEEDS_REVIEW' : 'VALID';

      await client.query(
        `INSERT INTO orders_raw (
          source_upload_id, source_row_number, order_number, email, customer_name, base_sku,
          quantity, size, color, order_type, validation_status, parse_errors
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          uploadId,
          row.source_row_number,
          row.order_number ?? null,
          row.email ?? null,
          row.customer_name ?? null,
          row.base_sku ?? null,
          row.quantity ?? null,
          row.size ?? null,
          row.color ?? null,
          uploadOrderType,
          validationStatus,
          parseErrors.length > 0 ? parseErrors : null,
        ]
      );
    }

    await client.query(
      `UPDATE raw_order_uploads
       SET processing_status = (
         CASE WHEN EXISTS (
           SELECT 1 FROM orders_raw WHERE source_upload_id = $1 AND validation_status = 'NEEDS_REVIEW'
         ) THEN 'NEEDS_REVIEW' ELSE 'VALIDATED' END
       )
       WHERE id = $1`,
      [uploadId]
    );

    await client.query('COMMIT');
    return { uploadId, rowsIngested: rows.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function normalizeUpload(uploadId: number, orderId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const rawRows = await client.query('SELECT * FROM orders_raw WHERE source_upload_id = $1 AND validation_status = $2', [uploadId, 'VALID']);

    for (const row of rawRows.rows) {
      await client.query(
        `INSERT INTO order_items (
          order_id, source_raw_row_id, order_number, customer_name, sku, color, quantity, size, validation_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (order_id, source_raw_row_id) DO NOTHING`,
        [orderId, row.id, row.order_number, row.customer_name, row.base_sku, row.color, row.quantity, row.size, 'READY_FOR_VENDOR']
      );
    }

    await client.query('UPDATE raw_order_uploads SET processing_status = $2 WHERE id = $1', [uploadId, 'NORMALIZED']);
    await client.query('COMMIT');
    return { uploadId, orderId, itemsWritten: rawRows.rows.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUploadStatus(uploadId: number) {
  const upload = await pool.query('SELECT * FROM raw_order_uploads WHERE id = $1', [uploadId]);
  const counts = await pool.query(
    `SELECT validation_status, COUNT(*)::int AS count
     FROM orders_raw
     WHERE source_upload_id = $1
     GROUP BY validation_status`,
    [uploadId]
  );

  return {
    upload: upload.rows[0] ?? null,
    rowStatusCounts: counts.rows,
  };
}

export async function retryUpload(uploadId: number) {
  await pool.query('UPDATE orders_raw SET validation_status = $2, parse_errors = NULL WHERE source_upload_id = $1 AND validation_status = $3', [uploadId, 'PENDING', 'NEEDS_REVIEW']);
  await pool.query('UPDATE raw_order_uploads SET processing_status = $2 WHERE id = $1', [uploadId, 'PENDING']);
  return { uploadId, status: 'PENDING' };
}
