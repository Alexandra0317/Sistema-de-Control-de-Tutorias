const multer = require('multer');

const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        const allowedMime = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
        ];
        const isExcelName = /\.xlsx?$/i.test(file.originalname || '');
        const isAllowedMime = allowedMime.includes(file.mimetype);

        if (isExcelName || isAllowedMime) {
            cb(null, true);
            return;
        }

        cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    },
});

function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'El archivo no debe superar 5 MB' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err) {
        return res.status(400).json({ message: err.message || 'Error al subir archivo' });
    }

    return next();
}

module.exports = { excelUpload, handleUploadError };
