import axios from 'axios';

const OWNER = 'SeptianXcz'; // Ganti dengan nama owner GitHub kamu
const REPO = 'vdb'; // Ganti dengan nama repositori GitHub kamu
const PATH = 'public/listusers.json'; // Path file JSON
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub token di environment variable

// Fungsi untuk mendapatkan SHA file JSON
async function getFileSha(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    return res.data.sha;
  } catch {
    return null;
  }
}

// Fungsi untuk mendapatkan data file JSON saat ini
async function getCurrentContent(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch {
    return { users: [] }; // Default jika file tidak ada
  }
}

// Fungsi untuk update file JSON di GitHub
async function updateFile(content, sha, message) {
  const updatedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  await axios.put(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
    message,
    content: updatedContent,
    sha
  }, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
  });
}

// Fungsi utama untuk menangani permintaan API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, nama, nomor } = req.body;

  if (!action || !nama || !nomor) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    // Ambil data file JSON dan SHA-nya
    const { users, sha } = await getCurrentContent(PATH);

    let updated = false;

    // Proses berdasarkan action yang diterima
    if (action === 'add') {
      // Tambah user jika belum ada
      const exists = users.find(user => user.nomor === nomor);
      if (!exists) {
        users.push({ nama, nomor, status: 'active' });
        updated = true;
      }
    } else if (action === 'delete') {
      // Hapus user berdasarkan nomor
      const index = users.findIndex(user => user.nomor === nomor);
      if (index !== -1) {
        users.splice(index, 1);
        updated = true;
      }
    } else if (action === 'ban') {
      // Update status user ke blacklist
      const user = users.find(user => user.nomor === nomor);
      if (user) {
        user.status = 'blacklist';
        updated = true;
      } else {
        users.push({ nama, nomor, status: 'blacklist' });
        updated = true;
      }
    } else if (action === 'unban') {
      // Update status user ke active
      const user = users.find(user => user.nomor === nomor);
      if (user && user.status === 'blacklist') {
        user.status = 'active';
        updated = true;
      }
    }

    if (updated) {
      // Update file di GitHub
      await updateFile(users, sha, `Update user ${action}: ${nama}`);
      return res.json({ success: true, message: `Berhasil ${action} user ${nama}` });
    } else {
      return res.status(400).json({ error: 'Data tidak berubah' });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
