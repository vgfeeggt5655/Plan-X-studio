<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>بحث الصور الطبية</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: #f8f9fa;
            color: #202124;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid #dadce0;
            margin-bottom: 30px;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo-icon {
            font-size: 24px;
            color: #1a73e8;
        }
        
        .logo-text {
            font-size: 22px;
            font-weight: 500;
        }
        
        .search-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .search-box {
            display: flex;
            width: 100%;
            max-width: 600px;
            margin-bottom: 20px;
            box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
            border-radius: 24px;
            overflow: hidden;
        }
        
        .search-input {
            flex: 1;
            padding: 14px 20px;
            border: none;
            font-size: 16px;
            outline: none;
        }
        
        .search-button {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 0 20px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        
        .search-button:hover {
            background: #1967d2;
        }
        
        .suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .suggestion {
            background: #f1f3f4;
            padding: 8px 16px;
            border-radius: 16px;
            cursor: pointer;
            transition: background 0.3s;
            font-size: 14px;
        }
        
        .suggestion:hover {
            background: #e8eaed;
        }
        
        .results-info {
            margin-bottom: 20px;
            color: #70757a;
            font-size: 14px;
        }
        
        .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
        }
        
        .image-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .image-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .image-container {
            width: 100%;
            height: 180px;
            overflow: hidden;
        }
        
        .image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
        }
        
        .image-card:hover .image-container img {
            transform: scale(1.05);
        }
        
        .image-info {
            padding: 12px;
        }
        
        .image-title {
            font-weight: 500;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .image-source {
            color: #70757a;
            font-size: 12px;
        }
        
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 40px 0;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f1f3f4;
            border-top: 4px solid #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .no-results {
            text-align: center;
            padding: 40px 0;
            color: #70757a;
        }
        
        .initial-state {
            text-align: center;
            padding: 60px 0;
            color: #70757a;
        }
        
        .initial-icon {
            font-size: 48px;
            margin-bottom: 16px;
            color: #1a73e8;
        }
        
        @media (max-width: 768px) {
            .images-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
            
            .image-container {
                height: 120px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <div class="logo-icon">🏥</div>
                <div class="logo-text">بحث الصور الطبية</div>
            </div>
        </header>
        
        <div class="search-container">
            <div class="search-box">
                <input type="text" class="search-input" placeholder="ابحث عن صور طبية..." id="searchInput">
                <button class="search-button" id="searchButton">بحث</button>
            </div>
            
            <div class="suggestions">
                <div class="suggestion">قلب</div>
                <div class="suggestion">رئة</div>
                <div class="suggestion">دماغ</div>
                <div class="suggestion">عظام</div>
                <div class="suggestion">عين</div>
            </div>
        </div>
        
        <div id="resultsInfo" class="results-info"></div>
        
        <div id="imagesContainer">
            <div class="initial-state">
                <div class="initial-icon">🔍</div>
                <p>ابحث عن مصطلحات طبية لعرض الصور</p>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');
            const searchButton = document.getElementById('searchButton');
            const suggestions = document.querySelectorAll('.suggestion');
            const resultsInfo = document.getElementById('resultsInfo');
            const imagesContainer = document.getElementById('imagesContainer');
            
            // قاموس المصطلحات الطبية
            const medicalTerms = {
                'قلب': 'heart',
                'رئة': 'lung',
                'كبد': 'liver',
                'كلى': 'kidney',
                'دماغ': 'brain',
                'عين': 'eye',
                'أذن': 'ear',
                'جهاز هضمي': 'digestive system',
                'عظام': 'bones',
                'عضلات': 'muscles',
                'جلد': 'skin',
                'دم': 'blood',
                'سرطان': 'cancer',
                'التهاب': 'inflammation',
                'أشعة': 'xray',
                'تشريح': 'anatomy',
                'مرض': 'disease',
                'جراحة': 'surgery',
                'أعصاب': 'nerves',
                'هرمونات': 'hormones'
            };
            
            // دالة البحث
            function search(query) {
                if (!query.trim()) return;
                
                // عرض حالة التحميل
                imagesContainer.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>جاري البحث عن "${query}"</p>
                    </div>
                `;
                
                // ترجمة المصطلح إن وجد
                const englishTerm = medicalTerms[query] || query;
                
                // محاكاة وقت البحث (بدلاً من الاتصال بجوجل)
                setTimeout(() => {
                    performSearch(englishTerm, query);
                }, 1500);
            }
            
            // دالة محاكاة البحث
            function performSearch(englishTerm, originalQuery) {
                // إنشاء صور عشوائية بناء على البحث
                const images = [];
                const count = Math.floor(Math.random() * 10) + 15; // بين 15 و 25 صورة
                
                for (let i = 1; i <= count; i++) {
                    images.push({
                        id: i,
                        title: `${originalQuery} - صورة ${i}`,
                        source: 'مصدر طبي',
                        url: `https://source.unsplash.com/300x200/?medical,${encodeURIComponent(englishTerm)}&sig=${i}`,
                        thumbnail: `https://source.unsplash.com/300x200/?medical,${encodeURIComponent(englishTerm)}&sig=${i}`
                    });
                }
                
                // عرض المعلومات
                resultsInfo.textContent = `عرض ${images.length} نتيجة لـ "${originalQuery}"`;
                
                // عرض الصور
                displayImages(images);
            }
            
            // دالة عرض الصور
            function displayImages(images) {
                if (images.length === 0) {
                    imagesContainer.innerHTML = `
                        <div class="no-results">
                            <p>لم يتم العثور على نتائج</p>
                        </div>
                    `;
                    return;
                }
                
                let html = '<div class="images-grid">';
                
                images.forEach(image => {
                    html += `
                        <div class="image-card">
                            <div class="image-container">
                                <img src="${image.thumbnail}" alt="${image.title}" loading="lazy">
                            </div>
                            <div class="image-info">
                                <div class="image-title">${image.title}</div>
                                <div class="image-source">${image.source}</div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                imagesContainer.innerHTML = html;
            }
            
            // أحداث البحث
            searchButton.addEventListener('click', () => {
                search(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    search(searchInput.value);
                }
            });
            
            // أحداث الاقتراحات
            suggestions.forEach(suggestion => {
                suggestion.addEventListener('click', () => {
                    searchInput.value = suggestion.textContent;
                    search(suggestion.textContent);
                });
            });
        });
    </script>
</body>
</html>
