/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { defaultLibrary } from './src/defaultCoefficients';
import { CoefficientLibrary, Style, CoefficientHistory } from './src/types';

const app = express();
const PORT = 3000;

// Path declarations relative to workspace root
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const COEFFICIENTS_FILE = path.join(DATA_DIR, 'coefficients.json');
const STYLES_FILE = path.join(DATA_DIR, 'styles.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure database directories and initial files exist on startup
function initializeDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created directory: ${DATA_DIR}`);
    }

    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
      console.log(`Created directory: ${BACKUPS_DIR}`);
    }

    if (!fs.existsSync(COEFFICIENTS_FILE)) {
      fs.writeFileSync(COEFFICIENTS_FILE, JSON.stringify(defaultLibrary, null, 2), 'utf-8');
      console.log(`Initialized coefficients with default library`);
    }

    if (!fs.existsSync(STYLES_FILE)) {
      fs.writeFileSync(STYLES_FILE, JSON.stringify([], null, 2), 'utf-8');
      console.log(`Initialized empty styles database`);
    }

    if (!fs.existsSync(HISTORY_FILE)) {
      const initialHistory: CoefficientHistory[] = [
        {
          id: 'hist-init',
          timestamp: new Date().toISOString(),
          versionBefore: 0,
          versionAfter: 1,
          action: 'Khởi tạo hệ thống',
          details: 'Khởi tạo thư viện hệ số mẫu thành công (Áo thun, Sơ mi, Quần jeans, Áo khoác, Đồ trẻ em, Váy/Đầm x Easy/Normal/Hard/Very Hard).'
        }
      ];
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(initialHistory, null, 2), 'utf-8');
      console.log(`Initialized history file`);
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

initializeDatabase();

// Middleware
app.use(express.json());

// Helpers to read/write JSON files safely
function readJSONFile<T>(filePath: string, defaultVal: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultVal;
}

function writeJSONFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    return false;
  }
}

// ==================== API ENDPOINTS ====================

// GET: Coefficients Library
app.get('/api/coefficients', (req, res) => {
  const library = readJSONFile<CoefficientLibrary>(COEFFICIENTS_FILE, defaultLibrary);
  res.json(library);
});

// POST: Update Coefficients Library (increases version & records history)
app.post('/api/coefficients', (req, res) => {
  const { coefficients, partTiers, changeDescription } = req.body;

  if (!coefficients || !partTiers) {
    res.status(400).json({ error: 'Missing coefficients or partTiers data' });
    return;
  }

  const currentLibrary = readJSONFile<CoefficientLibrary>(COEFFICIENTS_FILE, defaultLibrary);
  const oldVersion = currentLibrary.version;
  const newVersion = oldVersion + 1;

  const updatedLibrary: CoefficientLibrary = {
    version: newVersion,
    updatedAt: new Date().toISOString(),
    coefficients,
    partTiers
  };

  const success = writeJSONFile(COEFFICIENTS_FILE, updatedLibrary);

  if (success) {
    // Record to history
    const history = readJSONFile<CoefficientHistory[]>(HISTORY_FILE, []);
    const newHistoryItem: CoefficientHistory = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      versionBefore: oldVersion,
      versionAfter: newVersion,
      action: 'Cập nhật hệ số',
      details: changeDescription || `Cập nhật thư viện hệ số lên phiên bản ${newVersion}`
    };

    history.unshift(newHistoryItem); // newest first
    writeJSONFile(HISTORY_FILE, history);

    res.json({ library: updatedLibrary, history: newHistoryItem });
  } else {
    res.status(500).json({ error: 'Failed to write updated coefficients to disk' });
  }
});

// GET: Coefficient History Log
app.get('/api/coefficients/history', (req, res) => {
  const history = readJSONFile<CoefficientHistory[]>(HISTORY_FILE, []);
  res.json(history);
});

// POST: Trigger Coefficient Library Backup
app.post('/api/coefficients/backup', (req, res) => {
  try {
    const library = readJSONFile<CoefficientLibrary>(COEFFICIENTS_FILE, defaultLibrary);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `coefficients_v${library.version}_${timestamp}.json`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    fs.copyFileSync(COEFFICIENTS_FILE, backupFilePath);

    res.json({
      success: true,
      fileName: backupFileName,
      timestamp: new Date().toISOString(),
      version: library.version
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup file: ' + error.message });
  }
});

// GET: List all Backups
app.get('/api/coefficients/backups', (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(BACKUPS_DIR);
    const backupList = files
      .filter(f => f.startsWith('coefficients_') && f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          fileName: f,
          createdAt: stats.birthtime.toISOString(),
          sizeBytes: stats.size
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first

    res.json(backupList);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list backups: ' + error.message });
  }
});

// POST: Restore Coefficients from a backup
app.post('/api/coefficients/restore', (req, res) => {
  const { fileName } = req.body;
  if (!fileName) {
    res.status(400).json({ error: 'Missing fileName parameter' });
    return;
  }

  const backupFilePath = path.join(BACKUPS_DIR, fileName);
  if (!fs.existsSync(backupFilePath)) {
    res.status(404).json({ error: 'Backup file not found' });
    return;
  }

  try {
    // Read and validate first
    const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
    const parsed = JSON.parse(backupContent) as CoefficientLibrary;

    if (!parsed.version || !parsed.coefficients || !parsed.partTiers) {
      res.status(400).json({ error: 'Invalid backup file format' });
      return;
    }

    // Backup current before restoring
    const currentLibrary = readJSONFile<CoefficientLibrary>(COEFFICIENTS_FILE, defaultLibrary);
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const autoBackupPath = path.join(BACKUPS_DIR, `coefficients_v${currentLibrary.version}_pre_restore_${backupTimestamp}.json`);
    fs.copyFileSync(COEFFICIENTS_FILE, autoBackupPath);

    // Overwrite with backup
    fs.copyFileSync(backupFilePath, COEFFICIENTS_FILE);

    // Log history
    const history = readJSONFile<CoefficientHistory[]>(HISTORY_FILE, []);
    const restoreHistoryItem: CoefficientHistory = {
      id: `hist-restore-${Date.now()}`,
      timestamp: new Date().toISOString(),
      versionBefore: currentLibrary.version,
      versionAfter: parsed.version,
      action: 'Khôi phục hệ số',
      details: `Khôi phục thư viện hệ số về phiên bản ${parsed.version} từ file backup: ${fileName}`
    };
    history.unshift(restoreHistoryItem);
    writeJSONFile(HISTORY_FILE, history);

    res.json({ success: true, restoredLibrary: parsed, history: restoreHistoryItem });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to restore backup: ' + error.message });
  }
});

// GET: Retrieve all Styles
app.get('/api/styles', (req, res) => {
  const styles = readJSONFile<Style[]>(STYLES_FILE, []);
  res.json(styles);
});

// POST: Save a new Style
app.post('/api/styles', (req, res) => {
  const newStyle: Style = req.body;

  if (!newStyle || !newStyle.styleCode || !newStyle.styleName) {
    res.status(400).json({ error: 'Mã hàng và Tên Style là bắt buộc.' });
    return;
  }

  const styles = readJSONFile<Style[]>(STYLES_FILE, []);

  // Check if style code already exists
  const existingIndex = styles.findIndex(s => s.styleCode.toLowerCase() === newStyle.styleCode.toLowerCase());
  if (existingIndex >= 0) {
    res.status(400).json({ error: `Mã hàng "${newStyle.styleCode}" đã tồn tại trong danh sách.` });
    return;
  }

  styles.unshift(newStyle); // Place newest at the top
  const success = writeJSONFile(STYLES_FILE, styles);

  if (success) {
    res.status(201).json(newStyle);
  } else {
    res.status(500).json({ error: 'Lỗi ghi Style xuống đĩa cứng.' });
  }
});

// PUT: Update an existing Style
app.put('/api/styles/:id', (req, res) => {
  const { id } = req.params;
  const updatedStyle: Style = req.body;

  if (!updatedStyle || !updatedStyle.styleCode || !updatedStyle.styleName) {
    res.status(400).json({ error: 'Mã hàng và Tên Style là bắt buộc.' });
    return;
  }

  const styles = readJSONFile<Style[]>(STYLES_FILE, []);
  const index = styles.findIndex(s => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Không tìm thấy Style cần cập nhật.' });
    return;
  }

  // Check for styleCode duplicates
  const duplicateIndex = styles.findIndex(s => s.styleCode.toLowerCase() === updatedStyle.styleCode.toLowerCase() && s.id !== id);
  if (duplicateIndex >= 0) {
    res.status(400).json({ error: `Mã hàng "${updatedStyle.styleCode}" đã trùng với một sản phẩm khác.` });
    return;
  }

  styles[index] = { ...updatedStyle, updatedAt: new Date().toISOString() };
  const success = writeJSONFile(STYLES_FILE, styles);

  if (success) {
    res.json(styles[index]);
  } else {
    res.status(500).json({ error: 'Lỗi cập nhật Style.' });
  }
});

// DELETE: Delete a Style
app.delete('/api/styles/:id', (req, res) => {
  const { id } = req.params;
  const styles = readJSONFile<Style[]>(STYLES_FILE, []);
  const initialLength = styles.length;
  const filteredStyles = styles.filter(s => s.id !== id);

  if (filteredStyles.length === initialLength) {
    res.status(404).json({ error: 'Không tìm thấy Style để xoá.' });
    return;
  }

  const success = writeJSONFile(STYLES_FILE, filteredStyles);

  if (success) {
    res.json({ success: true, message: 'Xoá Style thành công.' });
  } else {
    res.status(500).json({ error: 'Lỗi ghi file khi xoá Style.' });
  }
});


// ==================== VITE & STATIC SERVING ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In development mode, mount Vite as middleware
    console.log('Starting server in DEVELOPMENT mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built files
    console.log('Starting server in PRODUCTION mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SMV Estimator server running on http://localhost:${PORT}`);
  });
}

startServer();
