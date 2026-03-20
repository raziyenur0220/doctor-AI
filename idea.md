# idea.md: DermScan AI

### **Problem: Ne çözüyorum?**
Cilt kanseri ve ciddi deri hastalıklarında erken teşhis hayat kurtarıcıdır; ancak uzman dermatologlara erişim süresinin uzunluğu, muayene maliyetleri ve bireylerin semptomları fark etmemesi teşhisi geciktirmektedir. Bu proje, sağlıkta erişim sorununu ele alarak kullanıcıların şüpheli gördükleri cilt durumlarını anında analiz etmelerini ve bir ön farkındalık oluşturmalarını amaçlar.

### **Kullanıcı: Bu uygulamayı kim kullanacak?**
* Cildinde yeni bir leke, ben veya kızarıklık fark eden üniversite öğrencileri ve bireyler.
* Dermatolojik kontrol süreçlerini dijital olarak takip etmek isteyen teknoloji meraklısı kullanıcılar.
* Hastaneye gitmeden önce hızlı ve güvenilir bir yapay zeka ön değerlendirmesi arayan kişiler.

### **AI'ın Rolü: Yapay zeka bu çözümde ne yapıyor?**
* **Görüntü Analizi:** Gemini API (Vision özellikleri), kullanıcının yüklediği net fotoğrafları tarayarak asimetri, renk düzensizliği ve doku bozukluklarını detaylıca analiz eder.
* **Sınıflandırma:** Yapay zeka, görüntüyü işleyerek olası durumları (örneğin: Melanom riski, egzama, normal ben) kategorize eder.
* **Yönlendirme:** Analiz sonucuna göre kullanıcıya bir risk skoru sunar ve tıbbi bir tavsiye olmamakla birlikte, bir uzmana görünme aciliyetini belirtir.

### **Rakip Durum: Benzer çözümler var mı? Benimki nasıl farklı?**
* **Mevcut Çözümler:** SkinVision ve Google Lens gibi uygulamalar görsel arama ve tıbbi analiz yapabilmektedir.
* **Bizim Farkımız:** Mevcut genel araçların aksine, Gemini API'ın güçlü doğal dil işleme yeteneğiyle birleşen detaylı bir "risk açıklama raporu" sunması ve kullanıcıyı yerel sağlık adımlarına daha spesifik yönlendirmesidir.

### **Başarı Kriteri: Bu proje başarılı olursa ne değişecek?**
* Kullanıcılar şüpheli bir durumu fark ettiklerinde 1 dakikadan kısa sürede yapay zeka destekli bir analiz alabilecek.
* Riskli vakaların daha erken fark edilmesi sağlanarak profesyonel tıbbi müdahale süreci hızlandırılacak ve farkındalık artacak.
