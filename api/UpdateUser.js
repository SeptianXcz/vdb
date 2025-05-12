import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { teks, mode } = req.body;
  if (!teks || !mode) return res.status(400).json({ error: 'Missing teks or mode' });

  const filePath = path.resolve('./public/listusers.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  let data = JSON.parse(rawData);

  const [nama, nomor] = teks.split('|').map(s => s.trim());
  if (!nama || !nomor) return res.status(400).json({ error: 'Invalid input format' });

  if (!Array.isArray(data.nomor)) data.nomor = [];

  if (mode === 'false') {
    if (!data.nomor.find(u => u.nomor === nomor)) {
      data.nomor.push({ nama, nomor, status: 'active' });
    }
  } else if (mode === 'true') {
    data.nomor = data.nomor.filter(u => !(u.nama === nama && u.nomor === nomor));
  } else if (mode === 'ban') {
    let found = false;
    data.nomor = data.nomor.map(u => {
      if (u.nomor === nomor) {
        found = true;
        return { ...u, status: 'blacklist' };
      }
      return u;
    });
    if (!found) {
      data.nomor.push({ nama, nomor, status: 'blacklist' });
    }
  } else if (mode === 'unban') {
    data.nomor = data.nomor.map(u => {
      if (u.nomor === nomor && u.status === 'blacklist') {
        return { ...u, status: 'active' };
      }
      return u;
    });
  } else {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return res.status(200).json({ success: true });
}
