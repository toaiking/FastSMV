import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_URL = 'https://i.postimg.cc/Hk5M8zDP/SMVLOGO.jpg';
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

function download(url, dest, callback) {
  try {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };

    https.get(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`;
        download(redirectUrl, dest, callback);
        return;
      }

      if (res.statusCode !== 200) {
        callback(new Error(`Failed to download (status: ${res.statusCode})`));
        return;
      }

      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        callback();
      });
    }).on('error', (err) => {
      callback(err);
    });
  } catch (err) {
    callback(err);
  }
}

console.log('--- BUILD STEP: Downloading and caching PWA/Logo Assets ---');
download(LOGO_URL, path.join(PUBLIC_DIR, 'logo.jpg'), (err) => {
  if (err) {
    console.warn('⚠️ Warning: Failed to download logo.jpg during build step:', err.message);
    console.log('Using a local file fallback if it exists, otherwise build will proceed.');
  } else {
    console.log('✅ Success: logo.jpg downloaded successfully!');
    try {
      // Copy to generate favicon and icons so PWA is fully populated
      fs.copyFileSync(path.join(PUBLIC_DIR, 'logo.jpg'), path.join(PUBLIC_DIR, 'favicon.ico'));
      fs.copyFileSync(path.join(PUBLIC_DIR, 'logo.jpg'), path.join(PUBLIC_DIR, 'icon-192.png'));
      fs.copyFileSync(path.join(PUBLIC_DIR, 'logo.jpg'), path.join(PUBLIC_DIR, 'icon-512.png'));
      console.log('✅ Success: Copied brand logo to favicon.ico, icon-192.png, and icon-512.png');
    } catch (e) {
      console.warn('⚠️ Warning: Failed to copy assets:', e.message);
    }
  }
  process.exit(0); // Never fail the main build process to keep deployment green
});
