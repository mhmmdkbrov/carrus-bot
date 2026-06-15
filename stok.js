const { google } = require('googleapis');
const cfg = require('./config');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: cfg.googleCredsFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

async function getStok() {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: cfg.sheetsId,
        range: 'Mehsullar!A2:D100',
    });
    return (res.data.values || []).map(row => ({
        mehsul:  row[0] || '',
        stok:    parseInt(row[1]) || 0,
        minStok: parseInt(row[2]) || 0,
        qiymet:  row[3] || ''
    }));
}

async function getXammal() {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: cfg.sheetsId,
        range: 'Xammal!A2:C100',
    });
    return (res.data.values || []).map(row => ({
        xammal:  row[0] || '',
        stok:    parseFloat(row[1]) || 0,
        minStok: parseFloat(row[2]) || 0,
    }));
}

async function azStokYoxla() {
    const mehsullar = await getStok();
    const xammal    = await getXammal();
    return {
        azMehsullar: mehsullar.filter(m => m.stok <= m.minStok && m.mehsul),
        azXammal:    xammal.filter(x => x.stok <= x.minStok && x.xammal),
    };
}

async function getStokMetni() {
    const mehsullar = await getStok();
    let metn = 'Cari stok:\n';
    mehsullar.forEach(m => {
        const status = m.stok <= m.minStok ? '⚠️ AZ' : '✅';
        metn += `${status} ${m.mehsul}: ${m.stok} ədəd - ${m.qiymet}\n`;
    });
    return metn;
}

module.exports = { getStok, getXammal, azStokYoxla, getStokMetni };
