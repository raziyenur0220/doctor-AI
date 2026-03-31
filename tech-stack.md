# DermScan AI - Teknoloji Yığını (Tech Stack)

DermScan AI projesinin geliştirilmesinde, dış bağımlılıklardan (framework'lerden) olabildiğince uzak, saf ve performanslı bir mimari hedeflenmiştir. 

Aşağıda uygulamayı hayata geçiren temel teknolojilerin ve entegrasyonların bir özeti bulunmaktadır:

## 1. Kullanıcı Arayüzü (Frontend)
- **HTML5:** Uygulamanın anlamsal (semantic) yapısını ve erişilebilirliğini sağlayan iskelet yapımız.
- **Vanilla CSS (Özel Tasarım):** Harici bir kütüphane (Tailwind veya Bootstrap vb.) kullanılmadan;
  - `CSS Grid` ve `Flexbox` ile tamamen **mobil uyumlu (Responsive)** bir düzen kuruldu.
  - Özel `:root` değişkenleriyle (CSS Custom Properties) renk yönetimi ve "Glassmorphism" odaklı modern arayüz tasarlandı.
  - Mobil cihazlarda buton ve seçim kutularının rahat tıklanmasını sağlayan genişletilmiş "touch-target" kuralları tanımlandı.
- **Vanilla JavaScript (ES5/ES6):** Tarayıcıda doğuştan (native) gelen Web API'leri kullanılarak kodlandı. Uygulamada herhangi bir SPA kütüphanesi (React, Vue vb.) kullanılmamıştır.
  - Sayfalar arası geçiş, modal açılışları ve galerinin yüklenmesi işlemleri tamamen DOM manüpülasyonu ile yapıldı.
  - Görüntü filtreleme işlemleri doğrudan `Canvas API` ile milisaniyeler (ms) içerisinde istemci (client) tarafında gerçekleştirilmekte.
  - Veritabanı tutulmadığı için tamamen kullanıcının tarayıcısına bağlı çalışan Web Storage API (`localStorage`) ile fotoğraf arşivlenmektedir.

## 2. Yapay Zeka (AI Temsilcisi)
- **Google Gemini API (`gemini-2.5-flash`):** Hastanın veya kullanıcının girdiği bölgesel lezyon (ben, sivilce) verileri, resmi ve opsiyonel iki resim arasındaki zaman farkı Google'ın multimodal modelleri tarafından görsel (vision) olarak analiz edilir. 
  - Modele özel System Prompt'lar ile bir dermatoloji asistanı gibi davranması ve risk skoru (`1 ile 10 arası`) iletmesi sağlanmıştır. 
  - Rest API ile JSON payload üzerinden JavaScript'in yerleşik `fetch()` fonksiyonuyla veriler gönderilir.

## 3. Güvenlik, Ağ (Network) ve Sunucu Yapılandırması 
Uygulamanın statik bir dosya formatında (`.html + .js`) olmasına karşın backend API çağrılarında (Gemini'ye yönelik) **CORS (Cross-Origin Resource Sharing)** hatalarını engellemek için akıllı bir "Network Routing" entegrasyonu vardır:
- **Netlify Proxy (`netlify.toml`):** Uygulama üretim (Production) amacıyla Lovable/Netlify ortamına sunulduğunda, `netlify.toml` üzerinden **Reverse Proxy** (Ters Vekil Sunucu) mantığı kullanılır. Uygulama `/api/gemini/` adresine istek atar ve Netlify sunucuları Google sunucularıyla güvenli bir el sıkışma işlemi gerçekleştirerek CORS duvarını tarayıcı (Frontend) tarafına hissettirmeden kalıcı olarak çözer.
- **Yerel Geliştirme Köprüsü:** Uygulama `localhost` üzerinden açıldığında (`corsproxy.io`) kullanılarak testlerin güvenli bir şekilde kesintiye uğramadan devam etmesi güvenceye alınır.
- **PDF Optimizasyonu:** Uygulamanın içerdiği "Doktor Bilgilendirme Raporu", tamamen yerel `@media print` CSS kuralları ile işletim sisteminin native (doğal) yazdır yeteneklerine bırakılarak dış PDF bağımlılıklarından arındırılmıştır.
