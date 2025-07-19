const express = require('express');
const proxy = require('express-http-proxy');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// === آدرس اسپیس‌های جدید شما ===
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

// سرو کردن فایل‌های استاتیک از پوشه public
app.use(express.static(path.join(__dirname, 'public')));

// تعریف پراکسی برای API
app.use('/api/generate', proxy(() => {
    const worker = getNextWorker(); 
    console.log(`درخواست به اسپیس ارسال می‌شود: ${worker}`);
    return worker;
}, {
    // مهم: مسیر درخواست در اسپیس مقصد /generate خواهد بود
    proxyReqPathResolver: function (req) {
        return '/generate'; 
    },
    // مدیریت خطای پراکسی
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
