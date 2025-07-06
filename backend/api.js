require('dotenv').config({ path: './backend/.env' }); // تحميل المتغيرات البيئية

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
const productsFilePath = path.join(__dirname, 'products.json');

// مفتاح API لسعر الذهب
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const GOLD_PRICE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`; // جلب أحدث أسعار الصرف من USD

// دالة لجلب سعر الذهب (بالنسبة للدولار الأمريكي)
async function getGoldPrice() {
    try {
        const response = await fetch(GOLD_PRICE_API_URL);
        if (!response.ok) {
            throw new Error(`Error fetching exchange rates: ${response.statusText}`);
        }
        const data = await response.json();
        
        // **ملاحظة:** ExchangeRate-API يقدم أسعار صرف العملات. لا يوفر سعر الذهب مباشرة (XAU).
        // لذا، سنفترض سعر ذهب ثابت لغرض الحساب. في مشروع حقيقي، ستحتاج إلى API خاص بسعر الذهب.
        const assumedGoldPricePerGramUSD = 65; // سعر افتراضي لغرام الذهب بالدولار الأمريكي

        return assumedGoldPricePerGramUSD;

    } catch (error) {
        console.error('Failed to fetch gold price:', error);
        // في حالة الفشل، نرجع قيمة افتراضية لمنع توقف التطبيق
        return 60; // قيمة افتراضية في حالة الفشل
    }
}

// نقطة نهاية API لجلب المنتجات مع الأسعار المحسوبة
app.get('/api/products', async (req, res) => {
    try {
        // قراءة المنتجات من ملف JSON
        const data = await fs.readFile(productsFilePath, 'utf8');
        let products = JSON.parse(data);

        // جلب سعر الذهب
        const goldPrice = await getGoldPrice();

        // حساب السعر لكل منتج
        const productsWithCalculatedPrices = products.map(product => {
            // تأكد من وجود popularityScore و weight في بيانات المنتج
            const popularityScore = product.popularityScore || 0; // افتراضيًا 0 إذا لم يكن موجودًا
            const weight = product.weight || 1; // افتراضيًا 1 إذا لم يكن موجودًا

            // Price = (popularityScore + 1) * weight * goldPrice
            const calculatedPrice = (popularityScore + 1) * weight * goldPrice;

            return {
                ...product,
                price: parseFloat(calculatedPrice.toFixed(2)) // تقريب السعر إلى منزلتين عشريتين
            };
        });

        res.json(productsWithCalculatedPrices);

    } catch (error) {
        console.error('Error in /api/products:', error);
        res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
    }
});

// بدء تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Access products at: http://localhost:${PORT}/api/products`);
});