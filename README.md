# DermScan AI (doctor-AI)

Cilt ve ben takibi için dijital arşiv. **Yapay zeka (Google Gemini)** yalnızca isteğe bağlı **asistan modunda** kullanılır; tıbbi teşhis veya ana karar verici değildir.

## Yerel çalıştırma

`index.html` dosyasını tarayıcıda açın veya proje klasöründe basit bir HTTP sunucusu kullanın (ör. `npx serve`).

- Görev 1: Ana sayfa / dashboard arayüzü (`index.html`, `css/styles.css`, `js/app.js`)
- Görev 2: Fotoğraf yükleme (sürükle-bırak + dosya seçici) ve önizleme
- Görev 3: Tarih + vücut bölgesi ile arşiv, `localStorage` (`dermscan_archive_v1`), galeri grid
- Görev 4: Gemini Vision — galeri kaydına tıklayınca **Asistana analiz ettir**; sistem mesajı + `netlify/functions/gemini-proxy.mjs` (üretim anahtarı için). Ayrıntı: [docs/API-ANAHTARI.md](docs/API-ANAHTARI.md)

### Gemini / Netlify

1. [API anahtarı](https://aistudio.google.com/apikey) oluşturun.
2. **Yayın:** Netlify’da `GEMINI_API_KEY` ortam değişkeni tanımlayın; uygulamada “Netlify proxy kullan”ı işaretleyin.
3. **Yerel deneme:** Üst menüden anahtarı girin (yalnızca `sessionStorage`). CORS hatası alırsanız proxy veya `netlify dev` kullanın.
