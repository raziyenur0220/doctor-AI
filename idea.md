# idea.md: DermScan AI (Asistan Modu)

### **Problem: Ne çözüyorum?**
Cilt kanseri ve deri hastalıklarında erken teşhis hayat kurtarıcıdır; ancak sadece yapay zekaya dayalı teşhisler kullanıcıda güven sorunu yaratabilir veya korkutucu olabilir. Bu proje, sağlıkta erişim sorununu bir "AI asistanı" eşliğinde çözerek; kullanıcıların kendi cilt kayıtlarını tutmalarını, değişimleri takip etmelerini ve sadece ihtiyaç duyduklarında bir yardımcı göz olarak yapay zekadan "ikinci görüş" almalarını sağlar.

### **Kullanıcı: Bu uygulamayı kim kullanacak?**
* Cildindeki benleri ve lekeleri düzenli takip etmek isteyen bilinçli bireyler.
* Geçmişe dönük cilt arşivini dijital ortamda saklamak isteyen kullanıcılar.
* Şüpheli bir değişim gördüğünde, bir uzmana gitmeden önce "asistan düzeyinde" bir ön analiz almak isteyen kişiler.

### **AI'ın Rolü: Yapay zeka bu çözümde ne yapıyor? (%25 Yan Yardımcı)**
* **Görsel Analiz Asistanı:** AI, uygulamanın merkezinde değil, bir "araç" konumundadır. Sadece kullanıcı talep ettiğinde (analiz butonuyla) devreye girer.
* **İkinci Görüş:** Gemini API (Vision), yüklenen fotoğrafı tıbbi bir otorite gibi değil, bir asistan gibi inceler; asimetri veya renk düzensizliği gibi teknik detayları kullanıcıya raporlar.
* **Kılavuzluk:** Kullanıcının çektiği fotoğrafın kalitesini kontrol ederek (ışık, netlik vb.) daha iyi bir takip dosyası oluşturmasına yardımcı olur.

### **Rakip Durum: Benzer çözümler var mı? Benimki nasıl farklı?**
* **Mevcut Çözümler:** Çoğu uygulama doğrudan "teşhis" odaklıdır ve kullanıcıyı korkutabilir.
* **Bizim Farkımız:** Uygulamamız bir "Cilt Günlüğü"dür. AI burada ana aktör değil, kullanıcının kendi takibini güçlendiren bir yardımcıdır. Gemini'nin açıklayıcı dil yeteneği sayesinde kullanıcıya sadece bir risk skoru değil, nedenlerini de anlatan asistan raporu sunar.

### **Başarı Kriteri: Bu proje başarılı olursa ne değişecek?**
* Kullanıcılar ciltlerindeki değişimleri düzenli takip etme alışkanlığı kazanacak.
* AI desteği sayesinde şüpheli durumlar, paniğe yol açmadan profesyonel bir asistan yorumuyla fark edilecek ve uzman yönlendirmesi hızlanacak.
