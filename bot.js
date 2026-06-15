const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode  = require('qrcode-terminal');
const Groq    = require('groq-sdk');
const fs      = require('fs');
const https   = require('https');
const path    = require('path');
const cfg     = require('./config');
const { getStokMetni, azStokYoxla } = require('./stok');

const groq = new Groq({ apiKey: cfg.groqApiKey });

// ── SİSTEM PROMPTU ───────────────────────────────────────────
function buildSystemPrompt(stokMetni) {
    const adiMehsullar = cfg.mehsullar
        .filter(m => m.renk === 'adi')
        .map(m => {
            const link = m.tiktok ? `\n   Video: ${m.tiktok}` : '';
            return `• ${m.ad} (${m.olcular}) — ${m.qiymet}${link}`;
        }).join('\n');

    const pinkMehsullar = cfg.mehsullar
        .filter(m => m.renk === 'pink')
        .map(m => {
            const link = m.tiktok ? `\n   Video: ${m.tiktok}` : '';
            return `• ${m.ad} (${m.olcular}) — ${m.qiymet}${link}`;
        }).join('\n');

    return `${cfg.botXarakteri}

Məhsullarımız:

Adi Seriya:
${adiMehsullar}

Pink Seriya:
${pinkMehsullar}

Çatdırılma:
- Bakı daxili: ${cfg.catdirilma.bakiOdenis} AZN (${cfg.catdirilma.bakiPulsuz} AZN-dən yuxarı PULSUZ)
- Regionlara: ${cfg.catdirilma.region}
- Müddət: ${cfg.catdirilma.muddet}

${stokMetni ? 'Cari stok:\n' + stokMetni : ''}

Qaydalar:
- Müştəri sifariş vermək istəsə: ad + telefon + ünvan + məhsul soruş
- Sifariş təsdiqləndikdə cavabın SONUNA əlavə et:
  [SİFARİŞ: ad=<ad>, telefon=<telefon>, unvan=<ünvan>, mehsul=<məhsul>]`;
}

// ── İŞ SAATLARI ──────────────────────────────────────────────
function isWorkingHours() {
    const now  = new Date();
    const hour = now.getHours();
    const day  = now.getDay();
    if (day === 0) return cfg.isNovbesi.bazar;
    if (day === 6) return hour >= cfg.isNovbesi.senbe.baslayir && hour < cfg.isNovbesi.senbe.bitir;
    return hour >= cfg.isNovbesi.hefte.baslayir && hour < cfg.isNovbesi.hefte.bitir;
}

function getOffHoursMessage() {
    const day = new Date().getDay();
    if (day === 0) return `Bağışlayın, bazar günü istirahət edirik 🙏\nHəftəiçi ${cfg.isNovbesi.hefte.baslayir}:00-${cfg.isNovbesi.hefte.bitir}:00 arasında cavab verəcəyik ✅`;
    return `Salam! Hal-hazırda iş saatlarımız bitib 🌙\nİş saatlarımız: Həftəiçi ${cfg.isNovbesi.hefte.baslayir}:00-${cfg.isNovbesi.hefte.bitir}:00\nSabah cavab verəcəyik ✅`;
}

// ── TELEGRAM ─────────────────────────────────────────────────
function sendTelegram(message) {
    const text = encodeURIComponent(message);
    const url  = `https://api.telegram.org/bot${cfg.telegramToken}/sendMessage?chat_id=${cfg.telegramChatId}&text=${text}`;
    https.get(url, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => log(`📱 Telegram OK`));
    }).on('error', e => log(`❌ Telegram: ${e.message}`));
}

// ── CSV ──────────────────────────────────────────────────────
const CSV_FILE = 'sifarisler.csv';

function initCSV() {
    if (!fs.existsSync(CSV_FILE)) {
        fs.writeFileSync(CSV_FILE, 'Tarix,Sifariş №,WA Nömrə,Ad,Telefon,Ünvan,Məhsul\n', 'utf8');
    }
}

function getNextOrderNumber() {
    const f   = 'order_counter.txt';
    let num   = 1;
    if (fs.existsSync(f)) num = parseInt(fs.readFileSync(f, 'utf8')) + 1;
    fs.writeFileSync(f, num.toString());
    return `#${String(num).padStart(3, '0')}`;
}

function saveToCSV(phone, orderNum, ad, telefon, unvan, mehsul) {
    const tarix = new Date().toLocaleString('az-AZ');
    fs.appendFileSync(CSV_FILE, `"${tarix}","${orderNum}","${phone}","${ad}","${telefon}","${unvan}","${mehsul}"\n`, 'utf8');
    log(`📊 CSV: ${orderNum} - ${ad}`);
}

// ── SİFARİŞ PARSE ────────────────────────────────────────────
function parseOrder(text) {
    const match = text.match(/\[SİFARİŞ:\s*ad=([^,]+),\s*telefon=([^,]+),\s*unvan=([^,]+),\s*mehsul=([^\]]+)\]/);
    if (!match) return null;
    return {
        ad:      match[1].trim(),
        telefon: match[2].trim(),
        unvan:   match[3].trim(),
        mehsul:  match[4].trim()
    };
}

// ── KATALOQ GÖNDƏR ───────────────────────────────────────────
async function sendKataloq(msg) {
    try {
        const media = MessageMedia.fromFilePath(cfg.kataloqFayl);
        await msg.reply(media, undefined, { caption: '📋 Carrus məhsul kataloqu. Sifariş üçün əlaqə saxlayın! 😊' });
        log(`📄 Kataloq göndərildi: ${msg.from}`);
    } catch (e) {
        log(`❌ Kataloq xətası: ${e.message}`);
        await msg.reply('Bağışlayın, kataloqu göndərə bilmədim. Zəhmət olmasa +994777227735 nömrəsinə müraciət edin 🙏');
    }
}

// ── AI CAVAB ─────────────────────────────────────────────────
const history = {};

async function getAIResponse(phone, userMessage) {
    if (!history[phone]) history[phone] = [];
    history[phone].push({ role: "user", content: userMessage });
    if (history[phone].length > 10) history[phone] = history[phone].slice(-10);

    let stokMetni = '';
    try { stokMetni = await getStokMetni(); } catch (e) {}

    const res = await groq.chat.completions.create({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages:   [
            { role: "system", content: buildSystemPrompt(stokMetni) },
            ...history[phone]
        ]
    });

    const reply = res.choices[0].message.content;
    history[phone].push({ role: "assistant", content: reply });
    return reply;
}

// ── LOG ───────────────────────────────────────────────────────
function log(msg) {
    console.log(`[${new Date().toLocaleTimeString('az-AZ')}] ${msg}`);
}

// ── WHATSAPP ─────────────────────────────────────────────────
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
    console.log('\n📱 QR kodu telefonunla oxut:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    initCSV();
    log('✅ Bot işə düşdü!');
    sendTelegram(`✅ ${cfg.botAdi} işə düşdü!`);

    // Hər 2 saatdan bir stok yoxla
    setInterval(async () => {
        try {
            const { azMehsullar, azXammal } = await azStokYoxla();
            if (!azMehsullar.length && !azXammal.length) return;
            let msg = '⚠️ STOK XƏBƏRDARLIQ!\n';
            azMehsullar.forEach(m => msg += `• ${m.mehsul}: ${m.stok} ədəd\n`);
            azXammal.forEach(x => msg += `• ${x.xammal}: ${x.stok} kq\n`);
            sendTelegram(msg);
        } catch (e) {}
    }, 2 * 60 * 60 * 1000);
});

client.on('message', async (msg) => {
    if (msg.isGroupMsg) return;
    if (msg.from === 'status@broadcast') return;

    const phone = msg.from;

    // Səs mesajı
    if (msg.hasMedia && msg.type === 'ptt') {
        const media    = await msg.downloadMedia();
        const tempFile = path.join(__dirname, 'temp_audio.ogg');
        fs.writeFileSync(tempFile, Buffer.from(media.data, 'base64'));
        try {
            const t = await groq.audio.transcriptions.create({
                file:  fs.createReadStream(tempFile),
                model: 'whisper-large-v3-turbo',
            });
            fs.unlinkSync(tempFile);
            const voiceText = t.text;
            log(`🎤 ${phone}: ${voiceText}`);
            sendTelegram(`🎤 Səs mesajı\n📞 ${phone}\n💬 ${voiceText}`);
            const reply = await getAIResponse(phone, voiceText);
            await msg.reply(`🎤 Səs mesajınızı eşitdim:\n"${voiceText}"\n\n${reply}`);
        } catch (e) {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            await msg.reply('Bağışlayın, səs mesajını anlaya bilmədim. Yazı ilə göndərin 🙏');
        }
        return;
    }

    const text = msg.body;
    log(`📩 ${phone}: ${text}`);

    // İş saatları
    if (!isWorkingHours()) {
        await msg.reply(getOffHoursMessage());
        sendTelegram(`🌙 İş saatı xaricində\n📞 ${phone}\n💬 ${text}`);
        return;
    }

    sendTelegram(`📩 Yeni mesaj\n📞 ${phone}\n💬 ${text}`);

    try {
        const reply = await getAIResponse(phone, text);

        // Kataloq göndər
        if (reply.includes('[KATALOQ_GONDER]')) {
            const cleanReply = reply.replace('[KATALOQ_GONDER]', '').trim();
            if (cleanReply) await msg.reply(cleanReply);
            await sendKataloq(msg);
            return;
        }

        // Sifariş parse
        const order = parseOrder(reply);
        if (order) {
            const orderNum = getNextOrderNumber();
            saveToCSV(phone, orderNum, order.ad, order.telefon, order.unvan, order.mehsul);
            sendTelegram(
                `🛒 YENİ SİFARİŞ ${orderNum}!\n` +
                `👤 ${order.ad}\n📞 ${order.telefon}\n📍 ${order.unvan}\n📦 ${order.mehsul}\n🔢 ${phone}`
            );
            const clean = reply.replace(/\[SİFARİŞ:[^\]]+\]/g, '').trim();
            await msg.reply(clean + `\n\nSifariş nömrəniz: ${orderNum} 📋`);
        } else {
            await msg.reply(reply);
        }

        log(`📤 Cavab: ${reply.substring(0, 60)}...`);
    } catch (e) {
        log(`❌ Xəta: ${e.message}`);
    }
});

client.on('auth_failure', () => log('❌ Auth xətası.'));
client.initialize();
