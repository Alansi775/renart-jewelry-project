require('dotenv').config(); // تحميل المتغيرات البيئية من ملف .env (المفترض أنه في نفس مجلد api.js)

const express = require('express');
const cors = require('cors');
const fs = require('fs/promises'); // لاستخدام readFile بشكل غير متزامن
const path = require('path');
const fetch = require('node-fetch'); // لجلب البيانات من APIs خارجية

const app = express();
const PORT = process.env.PORT || 3000; // استخدام متغير بيئي للمنفذ أو 3000 افتراضيًا

app.use(cors()); // تفعيل CORS للسماح لطلبات الواجهة الأمامية
app.use(express.json()); // للسماح بتحليل طلبات JSON (إذا احتجنا لها لاحقًا)

// مسار لملف products.json
// بما أن products.json موجود في نفس مجلد api.js، نستخدم __dirname
const productsFilePath = path.join(__dirname, 'products.json');

// مفتاح API لسعر الذهب
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
// إضافة تحقق للتأكد من وجود المفتاح قبل بناء الرابط
const GOLD_PRICE_API_URL = EXCHANGE_RATE_API_KEY
    ? `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`
    : null; // إذا لم يكن المفتاح موجودًا، اجعل الرابط null

// دالة لجلب سعر الذهب (بالنسبة للدولار الأمريكي)
async function getGoldPrice() {
    if (!GOLD_PRICE_API_URL) {
        console.warn('EXCHANGE_RATE_API_KEY is not set or invalid. Using default gold price.');
        return 60; // قيمة افتراضية إذا لم يكن المفتاح موجودًا
    }
    try {
        const response = await fetch(GOLD_PRICE_API_URL);
        if (!response.ok) {
            throw new Error(`Error fetching exchange rates: ${response.statusText}`);
        }
        const data = await response.json();
        
        const assumedGoldPricePerGramUSD = 65; // سعر افتراضي لغرام الذهب بالدولار الأمريكي

        return assumedGoldPricePerGramUSD;

    } catch (error) {
        console.error('Failed to fetch gold price:', error);
        return 60; // قيمة افتراضية في حالة الفشل
    }
}

// نقطة نهاية API لجلب المنتجات مع الأسعار المحسوبة
// المسار /api/products هو الذي ستتصل به الواجهة الأمامية المحلية
app.get('/api/products', async (req, res) => {
    try {
        const data = await fs.readFile(productsFilePath, 'utf8');
        let products = JSON.parse(data);

        const goldPrice = await getGoldPrice();

        const productsWithCalculatedPrices = products.map(product => {
            const popularityScore = product.popularityScore || 0;
            const weight = product.weight || 1;

            const calculatedPrice = (popularityScore + 1) * weight * goldPrice;

            return {
                ...product,
                price: parseFloat(calculatedPrice.toFixed(2))
            };
        });

        res.json(productsWithCalculatedPrices);

    } catch (error) {
        console.error('Error in /api/products:', error);
        res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
    }
});

module.exports = app; // هذا السطر يخبر Vercel بتصدير تطبيق Express كـ Serverless Function

// --- بدء تشغيل الخادم محليًا ---
// يجب أن تكون هذه الأسطر غير معلقة لتشغيل السيرفر
// تذكر أن تعلقها مرة أخرى قبل الرفع إلى Vercel
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    // لاحظ المسار الكامل هنا (بما فيه /api) ليتطابق مع الواجهة الأمامية
    console.log(`Access products at: http://localhost:${PORT}/api/products`);
});