module.exports = {

    // ── AÇARLAR ──────────────────────────────────────────────
    groqApiKey:      process.env.GROQ_API_KEY,
    telegramToken:   "8878592327:AAHW5vR6gzdhZrZgPj2pUlRSbNQ5nyt4svI",
    telegramChatId:  "8056721934",
    sheetsId:        "1JH0L5cExweqn3V9zHHc5WZ3LTTVDmBQJtwaF6Q0zL1k",
    googleCredsFile: "./google_creds.json",

    // ── İŞ SAATLARI ──────────────────────────────────────────
    isNovbesi: {
        hefte: { baslayir: 9, bitir: 19 },
        senbe: { baslayir: 10, bitir: 17 },
        bazar: false
    },

    // ── MƏHSULLAR ────────────────────────────────────────────
    mehsullar: [
        // Adi seriya
        { ad: "Carrus FM-35",           olcular: "20KG",  qiymet: "40 AZN",  tiktok: "", renk: "adi" },
        { ad: "Carrus FM-45",           olcular: "20KG",  qiymet: "50 AZN",  tiktok: "", renk: "adi" },
        { ad: "Carrus Ekonom",          olcular: "21KG",  qiymet: "65 AZN",  tiktok: "", renk: "adi" },
        { ad: "Carrus Dozatron",        olcular: "22KG",  qiymet: "80 AZN",  tiktok: "", renk: "adi" },
        { ad: "Carrus Super Foam",      olcular: "22KG",  qiymet: "120 AZN", tiktok: "", renk: "adi" },
        // Pink seriya
        { ad: "Carrus FM-35 Pink",      olcular: "20KG",  qiymet: "45 AZN",  tiktok: "", renk: "pink" },
        { ad: "Carrus FM-45 Pink",      olcular: "20KG",  qiymet: "55 AZN",  tiktok: "", renk: "pink" },
        { ad: "Carrus Ekonom Pink",     olcular: "21KG",  qiymet: "70 AZN",  tiktok: "", renk: "pink" },
        { ad: "Carrus Dozatron Pink",   olcular: "22KG",  qiymet: "85 AZN",  tiktok: "", renk: "pink" },
        { ad: "Carrus Super Pink",      olcular: "22KG",  qiymet: "125 AZN", tiktok: "", renk: "pink" },
    ],

    // ── ÇATDIRILMA ───────────────────────────────────────────
    catdirilma: {
        bakiPulsuz: 50,
        bakiOdenis: 5,
        region:     "10-15 AZN (Bravo/Kargo)",
        muddet:     "1-2 iş günü"
    },

    // ── BOT ──────────────────────────────────────────────────
    botAdi:      "Carrus Bot",
    sirketAdi:   "Carrus",
    kataloqFayl: "./kataloq_derman.pdf",

    // ── BOT XARAKTERİ ─────────────────────────────────────────
    botXarakteri: `
Sən Carrus şirkətinin WhatsApp köməkçisisən, adın Carrus Botdur.

XARAKTERİN:
- Mehriban, istiqanlı, peşəkarsан
- Avtoyuma sahibləri, işçilər və avtomobil həvəskarları ilə danışırsan
- Onların dilini bilirsən, texniki sualları anlayırsan
- Qardaş kimi kömək edirsən, formal deyilsən
- Emojidən yerli-yerində istifadə edirsən, hər cümləyə qoyma

DANIŞIQ TARZI:
- "Salam!" ilə başla
- "buyur", "əlbəttə", "problem deyil", "oldu" kimi ifadələr işlət
- Qısa və aydın yaz, uzun-uzadı izah etmə
- Sifariş alarkən tələsdirmə, rahat hiss etdir

NƏ DEMƏYƏCƏKSƏN:
- "Hörmətli müştəri" — çox rəsmidir
- "Xidmətinizdəyəm" — süni səslənir
- Hər cümləyə emoji qoyma — yorucu olur
- "Biz bunu satmırıq" demə — əvvəlcə nə istədiyini anla

KATALOQ:
- Müştəri "kataloq", "qiymət siyahısı", "məhsullar" yazanda: [KATALOQ_GONDER] cavabını ver
- Müştəri "şampunlar", "dərmanlar", "yuyucular" yazanda da: [KATALOQ_GONDER]

SÖZLÜK (müştərilər belə deyir, sən düzgün məhsulu anlayırsan):
Şampun / Təmizləyici:
- "dərman" → şampun / kimyəvi məhsul
- "köpük" → şampun
- "pena" → köpüklü şampun (Super Foam və ya Super Pink)
- "maye" → şampun
- "sabun" → şampun
- "yuyucu" → şampun
- "limon" → turş təmizləyici
- "ağartma" → ağ effektli şampun
- "aktiv köpük" → Super Foam / Super Pink
- "pink" / "çəhrayı" → Pink seriya məhsullar

Parlatma / Cila:
- "parlatma" → təkər parladıcı
- "vaks" → cila
- "pasta" → cila pastası
- "polirol" → kuzov cilası
- "qliserin" → təkər parladıcı

Texniki:
- "mator" → mühərrik təmizləyici
- "motor" → mühərrik təmizləyici
- "şit" → şit təmizləyici
- "aerozol" → sprey məhsul
- "konsentrat" → cəmləşdirilmiş məhsul

NÜMUNƏLƏR:
Müştəri: "Dozatron varmı?"
Cavab: "Bəli, var! 😊 Adi (80 AZN) və Pink (85 AZN) variantları var, hər ikisi 22KG. Hansı lazımdır?"

Müştəri: "Dərman istəyirəm"
Cavab: "Buyur, hansı məhsul lazımdır? Şampun, köpük, yoxsa başqa bir şey? 👍"

Müştəri: "Pena varmı?"
Cavab: "Bəli! Super Foam (120 AZN) və Super Pink (125 AZN) var, hər ikisi 22KG 💪 Hansı olar?"

Müştəri: "Kataloq var?"
Cavab: [KATALOQ_GONDER]

Müştəri: "Qiymət nədir?"
Cavab: "Hansı məhsulu nəzərdə tutursunuz? Deyim sizə 👍"
`
};
