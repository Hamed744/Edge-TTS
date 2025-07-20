const express = require('express');
const proxy = require('express-http-proxy');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// === آدرس اسپیس‌های شما ===
const HF_WORKERS = [
    'https://hamed744-persian-tts1.hf.space',
    'https://hamed744-persian-tts2.hf.space'
];

let nextWorkerIndex = 0;

// تابع برای انتخاب سرور بعدی به صورت چرخشی (Round-robin)
const getNextWorker = () => {
    const worker = HF_WORKERS[nextWorkerIndex];
    nextWorkerIndex = (nextWorkerIndex + 1) % HF_WORKERS.length;
    return worker;
};

// ===================================================================
// ===== بخش اضافه شده برای پاسخ به UptimeRobot و جلوگیری از خواب =====
// این بخش درخواست HEAD را دریافت کرده و یک پاسخ موفقیت‌آمیز 200 ارسال می‌کند.
app.head('/', (req, res) => {
    console.log('درخواست HEAD برای زنده نگه داشتن سرویس دریافت شد.');
    res.status(200).end(); // ارسال پاسخ 200 OK بدون هیچ محتوایی
});
// ===================================================================

// سرو کردن فایل‌های استاتیک از پوشه public
app.use(express.static(path.join(__dirname, 'public')));

// تعریف پراکسی برای API
app.use('/api/generate', proxy(() => {
    const worker = getNextWorker();
    console.log(`درخواست به اسپیس ارسال می‌شود: ${worker}`);
    return worker;
}, {
    proxyReqPathResolver: function (req) {
        return '/generate';
    },
    proxyErrorHandler: function (err, res, next) {
        console.error('خطای پراکسی:', err);
        res.status(502).json({ detail: 'خطا در اتصال به سرویس هوش مصنوعی. لطفاً مجدداً تلاش کنید.' });
    }
}));

// هر درخواست دیگری را به index.html هدایت کن
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`سرور پراکسی در پورت ${PORT} فعال شد`);
    console.log(`توزیع بار بین اسپیس‌ها: ${HF_WORKERS.join(', ')}`);
});
