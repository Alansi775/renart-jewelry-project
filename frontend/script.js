document.addEventListener('DOMContentLoaded', () => {
    const productListContainer = document.querySelector('.product-list-container');
    //const BACKEND_API_URL = 'http://localhost:3000/api/products'; // عنوان الـ API الخاص بنا
    const BACKEND_API_URL = 'https://renart-jewelry-project-f8h5o51nh.vercel.app'; // عنوان الـ API الخاص بنا (المنشور على Vercel)
    // دالة لجلب المنتجات من الـ backend
    async function fetchProducts() {
        try {
            const response = await fetch(BACKEND_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            displayProducts(products); // عرض المنتجات بعد جلبها
        } catch (error) {
            console.error('Error fetching products:', error);
            productListContainer.innerHTML = '<p>حدث خطأ أثناء تحميل المنتجات. الرجاء المحاولة لاحقاً.</p>';
        }
    }

    // دالة لعرض المنتجات في الواجهة
    function displayProducts(products) {
        productListContainer.innerHTML = ''; // مسح المحتوى القديم (إن وجد)

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

           
            
            const defaultColorKey = 'yellow'; 
            const defaultColorName = 'Yellow Gold'; // الاسم المعروض
            const defaultImage = product.images[defaultColorKey] || ''; // الصورة الافتراضية

            // بناء بطاقة المنتج
            productCard.innerHTML = `
                <img src="${defaultImage}" alt="${product.name}" class="product-image" data-current-color="${defaultColorKey}">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price ? product.price.toFixed(2) : 'N/A'} USD</p>
                    <div class="product-color-options" data-product-id="${product.id}">
                    <div class="color-option yellow-gold ${defaultColorKey === 'yellow' ? 'selected' : ''}" data-color="yellow" data-color-name="Yellow Gold"></div>
                    <div class="color-option white-gold ${defaultColorKey === 'white' ? 'selected' : ''}" data-color="white" data-color-name="White Gold"></div>
                    <div class="color-option rose-gold ${defaultColorKey === 'rose' ? 'selected' : ''}" data-color="rose" data-color-name="Rose Gold"></div>
                </div>
                <p class="product-current-color"><span class="selected-color-name">${defaultColorName}</span></p>
                <p class="product-rating">
                    <span class="stars">${generateStars(product.popularityScore)}</span>
                    ${product.popularityScore ? product.popularityScore.toFixed(1) : 'N/A'} / 5
                </p>
            `;  

            productListContainer.appendChild(productCard);
        });

        // إضافة مستمعي الأحداث لأزرار الألوان
        attachColorOptionListeners(products);
    }

    // دالة لإنشاء النجوم بناءً على تقييم الشعبية
    function generateStars(score) {
        if (score === undefined || score === null) return '';
        const roundedScore = Math.round(score); // تقريب لأقرب عدد صحيح للنجوم
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < roundedScore) {
                starsHtml += '★'; // نجمة ممتلئة
            } else {
                starsHtml += '☆'; // نجمة فارغة (يمكن استخدام &#9734; أو &#9733;)
            }
        }
        return starsHtml;
    }


    // دالة لإرفاق مستمعي الأحداث لخيارات الألوان
    function attachColorOptionListeners(products) {
        document.querySelectorAll('.product-color-options').forEach(optionsContainer => {
            optionsContainer.querySelectorAll('.color-option').forEach(colorOption => {
                colorOption.addEventListener('click', (event) => {
                    const selectedColor = event.target.dataset.color;
                    const selectedColorName = event.target.dataset.colorName;
                    
                    const productCard = event.target.closest('.product-card');
                    const productImage = productCard.querySelector('.product-image');
                    const selectedColorNameSpan = productCard.querySelector('.selected-color-name');

                    // إزالة فئة 'selected' من جميع خيارات الألوان لنفس المنتج
                    optionsContainer.querySelectorAll('.color-option').forEach(option => {
                        option.classList.remove('selected');
                    });
                    // إضافة فئة 'selected' للون المختار
                    event.target.classList.add('selected');

                    // تحديث صورة المنتج واللون المعروض
                    const productName = productCard.querySelector('.product-title').textContent;
                    const product = products.find(p => p.name === productName); // البحث عن المنتج الصحيح
                    
                    if (product && product.images && product.images[selectedColor]) {
                        productImage.src = product.images[selectedColor];
                        productImage.dataset.currentColor = selectedColor; // تحديث اللون الحالي للرجوع إليه
                        selectedColorNameSpan.textContent = selectedColorName; // تحديث اسم اللون المعروض
                    }
                });
            });
        });
    }

    // جلب المنتجات عند تحميل الصفحة
    fetchProducts();

       const scrollAmount = 320; // مقدار التمرير (عرض البطاقة 280px + الفجوة 20px + بعض الهامش)

    const leftArrow = document.querySelector('.carousel-nav-arrow.left');
    const rightArrow = document.querySelector('.carousel-nav-arrow.right');
    // productListContainer تم تعريفه بالفعل في بداية DOMContentLoaded

    leftArrow.addEventListener('click', () => {
        productListContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    rightArrow.addEventListener('click', () => {
        productListContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

});