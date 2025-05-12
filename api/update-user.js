import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nama, nomor, mode } = req.body;
  if (!nama || !nomor || !mode) return res.status(400).json({ error: 'Missing parameters' });

  const filePath = path.join(process.cwd(), 'listusers.json');

  let data = { nomor: [] };

  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(raw);
    }

    if (!data.nomor) data.nomor = [];

    if (mode === 'false') {
      // Tambah user
      const exists = data.nomor.some(item => item.nomor === nomor);
      if (!exists) {
        data.nomor.push({ nama, nomor, status: 'active' });
      }
    } else if (mode === 'true') {
      // Hapus user
      data.nomor = data.nomor.filter(item => !(item.nama === nama && item.nomor === nomor));
    } else if (mode === 'ban') {
      let updated = false;
      data.nomor = data.nomor.map(item => {
        if (item.nomor === nomor) {
          updated = true;
          return { ...item, status: 'blacklist' };
        }
        return item;
      });
      if (!updated) {
        data.nomor.push({ nama, nomor, status: 'blacklist' });
      }
    } else if (mode === 'unban') {
      data.nomor = data.nomor.map(item => {
        if (item.nomor === nomor && item.status === 'blacklist') {
          return { ...item, status: 'active' };
        }
        return item;
      });
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return res.status(200).json({ message: 'Berhasil diupdate' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
