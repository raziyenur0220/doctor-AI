/**
 * DermScan AI — galeri, LocalStorage, Gemini Vision (Görev 2–4).
 */

(function () {
  var STORAGE_KEY = "dermscan_archive_v1";
  var KEY_SESSION = "dermscan_gemini_api_key_session";

  /** system_instruction yok; tüm asistan talimatları kullanıcı metninin başında */
  var GEMINI_ANALYSIS_PROMPT =
    "Öncelikle görüntüyü incele ve durumun ciddiyetine göre 1 (Düşük Risk / Güvenli) ile 10 (Yüksek Risk / Tehlikeli) arasında bir sayısal risk skoru belirle. Raporuna ilk satırda tam olarak `[RISK_SKORU: X]` (X yerine skor) yazarak başla.\n\n" +
    "Sen bir dermatoloji asistanısın: tıbbi teşhis koymaz, yalnızca bilgilendirici teknik gözlem sunarsın.\n\n" +
    "Aşağıdaki cilt görüntüsündeki lekeyi veya lezyonu şu başlıklar altında teknik olarak analiz et ve kısa bir rapor yaz:\n" +
    "• Asimetri\n" +
    "• Renk (dağılım, ton çeşitliliği)\n" +
    "• Sınır düzensizliği (kenarların netliği)\n\n" +
    "---\n\n" +
    "Yukarıdaki analiz bittikten sonra görsel olarak ayrılmış yeni bir blok olarak (örneğin --- ile ayırarak) ekle:\n\n" +
    "**Asistan Notu & Bakım Rehberi**\n" +
    "- Görüntüdeki cildin yapısına (şüpheli, kuru, yağlı, gözenekli vb.) uygun olacak şekilde, kişiye özel ve ayrıntılı günlük cilt bakım tavsiyeleri (temizleme adımları, nemlendirme, güneş koruyucu kullanımı) oluştur.\n" +
    "- Eğer analiz edilen lezyon şüpheli veya riskli görünüyorsa, destekleyici ve yönlendirici bir dille 'Bir dermatoloğa danışmanız önerilir' vurgusunu yap.\n" +
    "- Asla kesin bir teşhis, isimli bir ilaç veya 'tıbbi tedavi' önerme! Bilgilendirici ve destekleyici asistan üslubundan çıkma.\n\n" +
    "---\n\n" +
    "Raporunun en sonuna da mutlaka kalın (bold) font ile şu sabit uyarıyı ekle:\n" +
    "**Bu bilgiler tıbbi tavsiye değildir; şüpheli durumlarda mutlaka doktora başvurulmalıdır.**\n\n" +
    "Şimdi görüntüyü bu şablona tam uyarak analiz et:";

  var GEMINI_COMPARE_PROMPT =
    "Öncelikle iki görüntüyü incele ve mevcut durumun ciddiyetine göre 1 (Düşük Risk / Güvenli) ile 10 (Yüksek Risk / Tehlikeli) arasında sayısal risk skoru belirle. Raporuna ilk satırda tam olarak `[RISK_SKORU: X]` (X yerine skor) yazarak başla.\n\n" +
    "Sen bir dermatoloji asistanısın. Eklediğim **ilk görsel eski tarihli (Before)**, **ikinci görsel ise yeni tarihli (After)** cilt lekelerine aittir. İki görseli detaylı karşılaştırarak lezyondaki değişimi (büyüme, renk değişimi, sınır farklılığı vb.) teknik olarak yorumla.\n\n" +
    "---\n\n" +
    "Yukarıdaki analiz bittikten sonra görsel olarak ayrılmış yeni bir blok olarak (örneğin --- ile ayırarak) ekle:\n\n" +
    "**Asistan Notu & Bakım Rehberi**\n" +
    "- İki durum arasındaki değişime ve cildin yapısına uygun günlük cilt bakım tavsiyeleri oluştur.\n" +
    "- Eğer lezyonda şüpheli bir büyüme veya riskli renk değişimi varsa, 'Bir dermatoloğa danışmanız önerilir' vurgusunu yap.\n" +
    "- Kesin bir teşhis, isimli ilaç veya tıbbi tedavi önerme.\n\n" +
    "---\n\n" +
    "Raporunun en sonuna da mutlaka kalın (bold) font ile şu sabit uyarıyı ekle:\n" +
    "**Bu bilgiler tıbbi tavsiye değildir; şüpheli durumlarda mutlaka doktora başvurulmalıdır.**\n\n" +
    "Şimdi bu iki görüntüyü karşılaştırarak şablona uygun analiz et:";

  var REGION_LABELS = {
    arms: "Kollar",
    legs: "Bacaklar",
    back: "Sırt",
    chest: "Göğüs",
    abdomen: "Karın",
    neck: "Boyun",
    face: "Yüz",
    hands: "Eller",
    feet: "Ayaklar",
    other: "Diğer",
  };

  var previewObjectUrl = null;
  var activeEntryId = null;

  var btnNew = document.getElementById("btn-new-entry");
  var dropzone = document.getElementById("dropzone");
  var photoInput = document.getElementById("photo-input");
  var btnBrowse = document.getElementById("btn-browse");
  var uploadError = document.getElementById("upload-error");
  var previewPanel = document.getElementById("preview-panel");
  var previewImage = document.getElementById("preview-image");
  var btnChange = document.getElementById("btn-change-photo");
  var btnClear = document.getElementById("btn-clear-photo");
  var uploadSection = document.getElementById("upload-section");
  var entryDate = document.getElementById("entry-date");
  var entryRegion = document.getElementById("entry-region");
  var btnSaveEntry = document.getElementById("btn-save-entry");
  var moleList = document.getElementById("mole-list");
  var emptyState = document.getElementById("empty-state");
  var galleryCount = document.getElementById("gallery-count");

  var entryModal = document.getElementById("entry-modal");
  var entryModalImage = document.getElementById("entry-modal-image");
  var entryModalMeta = document.getElementById("entry-modal-meta");
  var btnAnalyze = document.getElementById("btn-assistant-analyze");
  var analysisStatus = document.getElementById("analysis-status");
  var analysisResult = document.getElementById("analysis-result");

  var apiModal = document.getElementById("api-modal");
  var btnApiSettings = document.getElementById("btn-api-settings");
  var apiKeyInput = document.getElementById("api-key-input");
  var btnSaveApi = document.getElementById("btn-save-api-settings");
  var btnClearApiKey = document.getElementById("btn-clear-api-key");

  if (!dropzone || !photoInput || !previewPanel || !previewImage) return;

  function todayISODateLocal() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length === 1) m = "0" + m;
    if (day.length === 1) day = "0" + day;
    return y + "-" + m + "-" + day;
  }

  function makeId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }

  function loadEntries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function sortEntries(entries) {
    return entries.slice().sort(function (a, b) {
      var da = a.dateISO || "";
      var db = b.dateISO || "";
      if (da !== db) return da < db ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function formatDateDisplay(iso) {
    if (!iso || typeof iso !== "string") return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var y = Number(parts[0]);
    var mo = Number(parts[1]) - 1;
    var d = Number(parts[2]);
    if (isNaN(y) || isNaN(mo) || isNaN(d)) return iso;
    var date = new Date(y, mo, d);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getEntryById(id) {
    var list = loadEntries();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function getWindowKey() {
    if (
      typeof window.__DERMSCAN_GEMINI_KEY__ === "string" &&
      window.__DERMSCAN_GEMINI_KEY__.trim()
    ) {
      return window.__DERMSCAN_GEMINI_KEY__.trim();
    }
    return "";
  }

  function getSessionKey() {
    try {
      return sessionStorage.getItem(KEY_SESSION) || "";
    } catch (e) {
      return "";
    }
  }

  function getApiKeyForRequest() {
    return getWindowKey() || getSessionKey();
  }

  function parseDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string") return null;
    var m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl.replace(/\s/g, ""));
    if (!m) return null;
    var mime = m[1].split(";")[0].trim();
    var rawB64 = String(m[2]).replace(/\s/g, "");
    if (/^data:/i.test(rawB64)) {
      return null;
    }
    return { mimeType: mime, data: rawB64 };
  }

  /**
   * Doğrudan Google Gemini (proxy yok). Model yalnızca URL'de; body'de model alanı yok.
   * inline_data.data: yalnızca saf base64 (data:image/... ön eki yok).
   */
  function analyzeImage(apiKey, imageDataUrl, imageDataUrl2) {
    var parsed = parseDataUrl(imageDataUrl);
    if (!parsed) {
      console.error(
        "[DermScan Gemini]",
        "Geçersiz veya eksik data URL; beklenen: data:<mime>;base64,<saf base64>"
      );
      return Promise.reject(new Error("Görüntü verisi okunamadı."));
    }

    var isCompare = !!imageDataUrl2;
    var promptToUse = isCompare ? GEMINI_COMPARE_PROMPT : GEMINI_ANALYSIS_PROMPT;
    var reqParts = [
      { text: promptToUse },
      { inline_data: { mime_type: parsed.mimeType, data: parsed.data } }
    ];

    if (isCompare) {
      var parsed2 = parseDataUrl(imageDataUrl2);
      if (parsed2) {
        reqParts.push({
          inline_data: { mime_type: parsed2.mimeType, data: parsed2.data }
        });
      }
    }

    var payload = {
      contents: [
        {
          role: "user",
          parts: reqParts,
        },
      ],
    };

    var isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:";

    let url;
    if (isLocal) {
      url = "https://corsproxy.io/?https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
    } else {
      // Prod (Netlify) ortamında netlify.toml rewrite kuralını kullanır (CORS'u tamamen çözer)
      url = "/api/gemini/gemini-2.5-flash:generateContent?key=" + apiKey;
    }

    console.log("İstek gönderilen URL:", url);

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.text().then(function (t) {
          return { ok: res.ok, status: res.status, text: t };
        });
      })
      .then(function (pack) {
        var data;
        try {
          data = JSON.parse(pack.text);
        } catch (e) {
          console.error("[DermScan Gemini] JSON ayrıştırma hatası", {
            error: e,
            status: pack.status,
            raw: pack.text,
          });
          throw new Error(
            pack.ok ? "JSON ayrıştırılamadı." : pack.text || "İstek başarısız."
          );
        }

        console.log("[DermScan Gemini] response json:", data);

        if (data.error) {
          console.error("[DermScan Gemini] API hata gövdesi", data.error);
          throw new Error(data.error.message || "Gemini API hatası");
        }
        if (!pack.ok) {
          console.error("[DermScan Gemini] HTTP hata", {
            status: pack.status,
            body: data,
          });
          throw new Error(
            (data.error && data.error.message) ||
            "İstek hatası (" + pack.status + ")."
          );
        }
        var c = data.candidates && data.candidates[0];
        var parts = c && c.content && c.content.parts;
        if (!parts || !parts.length) {
          console.error("[DermScan Gemini] Aday veya parts yok", data);
          throw new Error("Yanıt üretilemedi.");
        }
        var text = parts
          .map(function (p) {
            return p && p.text ? p.text : "";
          })
          .join("\n")
          .trim();
        if (!text) {
          console.error("[DermScan Gemini] Boş metin", data);
          throw new Error("Metin çıkarılamadı.");
        }
        return text;
      });
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  }

  function normalizeImage(dataUrl, maxWidth) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }

        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        var imageData;
        try {
          imageData = ctx.getImageData(0, 0, w, h);
        } catch (e) {
          // If CORS issues occur returning the original image
          console.warn("Canvas Taint / CORS", e);
          resolve(dataUrl);
          return;
        }

        var data = imageData.data;
        var length = data.length;

        var totalLum = 0;
        var numPixels = length / 4;
        var minLum = 255;
        var maxLum = 0;

        for (var i = 0; i < length; i += 4) {
          var r = data[i], g = data[i + 1], b = data[i + 2];
          var lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLum += lum;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }
        var avgLum = totalLum / numPixels;

        var targetLum = 120;
        var brightnessOffset = targetLum - avgLum;

        var range = maxLum - minLum;
        if (range < 1) range = 1;
        var contrastScale = 255 / range;

        // Very extreme lighting fixes can look overblown if fully stretched. Use a softened stretch:
        contrastScale = 1 + (contrastScale - 1) * 0.5;
        // Limit brightness offset
        if (brightnessOffset > 60) brightnessOffset = 60;
        if (brightnessOffset < -60) brightnessOffset = -60;

        for (var k = 0; k < length; k += 4) {
          var r2 = data[k] + brightnessOffset;
          var g2 = data[k + 1] + brightnessOffset;
          var b2 = data[k + 2] + brightnessOffset;

          data[k] = Math.min(255, Math.max(0, (r2 - minLum) * contrastScale + minLum));
          data[k + 1] = Math.min(255, Math.max(0, (g2 - minLum) * contrastScale + minLum));
          data[k + 2] = Math.min(255, Math.max(0, (b2 - minLum) * contrastScale + minLum));
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = function (e) { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  function showError(message) {
    if (!uploadError) return;
    uploadError.textContent = message;
    uploadError.hidden = false;
  }

  function hideError() {
    if (!uploadError) return;
    uploadError.hidden = true;
    uploadError.textContent = "";
  }

  function revokePreviewUrl() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
  }

  function resetSaveFields() {
    if (entryDate) entryDate.value = todayISODateLocal();
    if (entryRegion) entryRegion.value = "";
  }

  function clearPreview() {
    revokePreviewUrl();
    previewImage.removeAttribute("src");
    previewPanel.hidden = true;
    photoInput.value = "";
    resetSaveFields();
    hideError();
  }

  function isImageFile(file) {
    if (!file || !file.type) return false;
    return file.type.indexOf("image/") === 0;
  }

  function setPreviewFromFile(file) {
    if (!isImageFile(file)) {
      showError("Lütfen bir görüntü dosyası seçin (ör. PNG veya JPEG).");
      return;
    }
    hideError();
    revokePreviewUrl();
    previewObjectUrl = URL.createObjectURL(file);
    previewImage.src = previewObjectUrl;
    previewPanel.hidden = false;
    if (entryDate && !entryDate.value) entryDate.value = todayISODateLocal();
  }

  function openFilePicker() {
    hideError();
    photoInput.click();
  }

  function openModal(el) {
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(el) {
    if (!el) return;
    el.hidden = true;
    document.body.style.overflow = "";
  }

  function closeAllModals() {
    if (entryModal) closeModal(entryModal);
    if (apiModal) closeModal(apiModal);
  }

  function openEntryModal(id) {
    var entry = getEntryById(id);
    if (!entry || !entryModal || !entryModalImage || !entryModalMeta) return;
    activeEntryId = id;
    entryModalImage.src = entry.imageDataUrl || "";
    entryModalImage.alt =
      formatDateDisplay(entry.dateISO) +
      ", " +
      (REGION_LABELS[entry.regionKey] || entry.regionLabel || "") +
      " kaydı";
    entryModalMeta.textContent =
      formatDateDisplay(entry.dateISO) +
      " · " +
      (REGION_LABELS[entry.regionKey] || entry.regionLabel || "—");

    var compareSelect = document.getElementById("compare-select");
    var compareError = document.getElementById("compare-error");
    if (compareSelect) {
      compareSelect.innerHTML = '<option value="">Karşılaştırma Yapma</option>';
      var allEntries = sortEntries(loadEntries());
      var validOldEntries = [];
      for (var i = 0; i < allEntries.length; i++) {
        var e = allEntries[i];
        if (e.regionKey === entry.regionKey && e.id !== entry.id && new Date(e.dateISO) <= new Date(entry.dateISO)) {
          validOldEntries.push(e);
        }
      }
      if (validOldEntries.length > 0) {
        for (var j = 0; j < validOldEntries.length; j++) {
          var oldE = validOldEntries[j];
          var opt = document.createElement("option");
          opt.value = oldE.id;
          opt.textContent = formatDateDisplay(oldE.dateISO) + " tarihli kayıtla";
          compareSelect.appendChild(opt);
        }
        compareSelect.disabled = false;
        if (compareError) compareError.hidden = true;
      } else {
        compareSelect.disabled = true;
        if (compareError) compareError.hidden = false;
      }
      compareSelect.value = "";
    }

    if (analysisResult) {
      analysisResult.textContent = "";
      analysisResult.hidden = true;
    }
    if (analysisStatus) {
      analysisStatus.textContent = "";
      analysisStatus.hidden = true;
    }
    var reportForm = document.getElementById("report-form");
    if (reportForm) reportForm.hidden = true;
    var reportName = document.getElementById("report-name");
    if (reportName) reportName.value = "";

    openModal(entryModal);
    if (btnAnalyze) btnAnalyze.disabled = false;
    if (btnAnalyze) btnAnalyze.focus();
  }

  function closeEntryModal() {
    activeEntryId = null;
    if (entryModalImage) {
      entryModalImage.removeAttribute("src");
    }

    var compareSelect = document.getElementById("compare-select");
    if (compareSelect) compareSelect.value = "";

    var entryModalPreview = document.querySelector(".entry-modal__preview");
    if (entryModalPreview) entryModalPreview.classList.remove("compare-mode");
    var oldImg = document.getElementById("compare-old-image");
    if (oldImg && oldImg.parentNode) oldImg.parentNode.removeChild(oldImg);

    var reportForm = document.getElementById("report-form");
    if (reportForm) reportForm.hidden = true;
    var reportName = document.getElementById("report-name");
    if (reportName) reportName.value = "";

    closeModal(entryModal);
  }

  function openApiSettingsModal() {
    if (!apiModal || !apiKeyInput) return;
    apiKeyInput.value = getSessionKey() ? "••••••••••••" : "";
    apiKeyInput.dataset.masked = getSessionKey() ? "1" : "0";
    openModal(apiModal);
    apiKeyInput.focus();
  }

  function closeApiModalFn() {
    closeModal(apiModal);
  }

  document.querySelectorAll("[data-close-modal]").forEach(function (node) {
    node.addEventListener("click", function () {
      var m = node.closest(".modal");
      if (m === entryModal) closeEntryModal();
      else if (m === apiModal) closeApiModalFn();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (apiModal && !apiModal.hidden) closeApiModalFn();
    else if (entryModal && !entryModal.hidden) closeEntryModal();
  });

  if (btnApiSettings) {
    btnApiSettings.addEventListener("click", openApiSettingsModal);
  }

  if (btnSaveApi && apiKeyInput) {
    btnSaveApi.addEventListener("click", function () {
      try {
        var raw = apiKeyInput.value.trim();
        if (raw && raw !== "••••••••••••") {
          sessionStorage.setItem(KEY_SESSION, raw);
        } else if (raw === "" && apiKeyInput.dataset.masked !== "1") {
          sessionStorage.removeItem(KEY_SESSION);
        }
      } catch (err) {
        alert("Ayarlar kaydedilemedi: " + err);
        return;
      }
      closeApiModalFn();
    });
  }

  if (btnClearApiKey && apiKeyInput) {
    btnClearApiKey.addEventListener("click", function () {
      try {
        sessionStorage.removeItem(KEY_SESSION);
      } catch (e) { }
      apiKeyInput.value = "";
      apiKeyInput.dataset.masked = "0";
    });
  }

  if (apiKeyInput) {
    apiKeyInput.addEventListener("focus", function () {
      if (apiKeyInput.dataset.masked === "1") {
        apiKeyInput.value = "";
        apiKeyInput.dataset.masked = "0";
      }
    });
  }

  if (btnAnalyze) {
    btnAnalyze.addEventListener("click", function () {
      if (!activeEntryId) return;
      var entry = getEntryById(activeEntryId);
      if (!entry || !entry.imageDataUrl) return;

      var key = getApiKeyForRequest();
      if (!key) {
        if (analysisStatus) {
          analysisStatus.textContent =
            "Önce üst menüden API anahtarını girin.";
          analysisStatus.hidden = false;
        }
        openApiSettingsModal();
        return;
      }

      btnAnalyze.disabled = true;
      if (analysisResult) {
        analysisResult.hidden = true;
        analysisResult.textContent = "";
      }
      if (analysisStatus) {
        analysisStatus.textContent = "Işık ve kontrast optimize ediliyor...";
        analysisStatus.hidden = false;
      }

      var base64Url2 = undefined;
      var compareSelect = document.getElementById("compare-select");
      if (compareSelect && compareSelect.value) {
        var compareEntry = getEntryById(compareSelect.value);
        if (compareEntry) base64Url2 = compareEntry.imageDataUrl;
      }

      var normPromises = [normalizeImage(entry.imageDataUrl, 800)];
      if (base64Url2) normPromises.push(normalizeImage(base64Url2, 800));

      Promise.all(normPromises).then(function (normResults) {
        var normImg1 = normResults[0];
        var normImg2 = normResults[1];

        if (entryModalImage) entryModalImage.src = normImg1;
        var oldImgEl = document.getElementById("compare-old-image");
        if (oldImgEl && normImg2) oldImgEl.src = normImg2;

        if (analysisStatus) {
          var isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
          analysisStatus.textContent = isLocal ? "CORS engeli aşıldı, analiz yapılıyor..." : "Asistan analizi hazırlanıyor…";
        }

        return analyzeImage(key, normImg1, normImg2);
      })
        .then(function (text) {
          if (analysisResult) {
            var scoreMatch = text.match(/\[RISK_SKORU:\s*(\d+)\]/i);
            var score = null;
            var cleanText = text;

            if (scoreMatch) {
              score = parseInt(scoreMatch[1], 10);
              cleanText = text.replace(scoreMatch[0], "").trim();
            }

            analysisResult.innerHTML = "";

            if (score !== null && score >= 1 && score <= 10) {
              var riskWidget = document.createElement("div");
              riskWidget.className = "risk-widget";

              var riskBarWrapper = document.createElement("div");
              riskBarWrapper.className = "risk-bar-wrapper";

              var indicator = document.createElement("div");
              indicator.className = "risk-indicator";
              var percent = Math.max(0, Math.min(100, (score - 1) / 9 * 100));
              indicator.style.left = percent + "%";

              riskBarWrapper.appendChild(indicator);

              var label = document.createElement("div");
              label.className = "risk-label";
              if (score <= 3) {
                label.textContent = "Güvenli";
                label.classList.add("risk-label--safe");
              } else if (score <= 7) {
                label.textContent = "Takip Gerekli";
                label.classList.add("risk-label--warning");
              } else {
                label.textContent = "Acil Uzman Görüşü";
                label.classList.add("risk-label--danger");
              }

              riskWidget.appendChild(riskBarWrapper);
              riskWidget.appendChild(label);
              analysisResult.appendChild(riskWidget);
            }

            var textNode = document.createElement("div");
            textNode.className = "analysis-text";
            textNode.textContent = cleanText;
            analysisResult.appendChild(textNode);

            analysisResult.hidden = false;
            var reportForm = document.getElementById("report-form");
            if (reportForm) reportForm.hidden = false;
          }
          if (analysisStatus) analysisStatus.hidden = true;
        })
        .catch(function (err) {
          console.error("[DermScan Gemini] analyzeImage", err);
          var msg = err && err.message ? err.message : String(err);
          if (
            msg.indexOf("Failed to fetch") !== -1 ||
            msg.indexOf("NetworkError") !== -1
          ) {
            msg +=
              " Ağ veya CORS: docs/API-ANAHTARI.md dosyasına bakın.";
          }
          if (analysisStatus) {
            analysisStatus.textContent = msg;
            analysisStatus.hidden = false;
          }
        })
        .finally(function () {
          btnAnalyze.disabled = false;
        });
    });
  }

  var compareSelect = document.getElementById("compare-select");
  var entryModalPreview = document.querySelector(".entry-modal__preview");
  if (compareSelect && entryModalPreview) {
    compareSelect.addEventListener("change", function () {
      var oldImg = document.getElementById("compare-old-image");
      if (oldImg && oldImg.parentNode) {
        oldImg.parentNode.removeChild(oldImg);
      }
      if (this.value) {
        var oldEntry = getEntryById(this.value);
        if (oldEntry) {
          entryModalPreview.classList.add("compare-mode");
          var newImg = document.createElement("img");
          newImg.id = "compare-old-image";
          newImg.src = oldEntry.imageDataUrl;
          newImg.alt = "Eski kayıt";
          entryModalPreview.insertBefore(newImg, entryModalPreview.firstChild);
        }
      } else {
        entryModalPreview.classList.remove("compare-mode");
      }
    });
  }

  var btnPrintReport = document.getElementById("btn-print-report");
  if (btnPrintReport) {
    btnPrintReport.addEventListener("click", function () {
      var printContainer = document.createElement("div");
      printContainer.id = "print-container";

      var header = document.createElement("div");
      header.className = "print-header";
      header.innerHTML = "<h1>DermScan AI: Doktor Bilgilendirme Raporu</h1><p>Bu rapor yapay zeka asistanı tarafından teknik gözlem amaçlı üretilmiştir.</p>";
      printContainer.appendChild(header);

      var info = document.createElement("div");
      info.className = "print-info";
      var entry = getEntryById(activeEntryId);
      var region = REGION_LABELS[entry.regionKey] || entry.regionLabel || "—";
      var dateStr = formatDateDisplay(entry.dateISO);

      var reportNameEl = document.getElementById("report-name");
      var patientName = reportNameEl && reportNameEl.value.trim() ? reportNameEl.value.trim() : "Anonim";

      info.innerHTML = "<strong>Hasta Adı / Not:</strong> " + patientName + "<br>" +
        "<strong>Vücut Bölgesi:</strong> " + region + "<br>" +
        "<strong>Tarih:</strong> " + dateStr;
      printContainer.appendChild(info);

      var imagesDiv = document.createElement("div");
      imagesDiv.className = "print-images";

      var oldImgEl = document.getElementById("compare-old-image");
      var currentImgEl = document.getElementById("entry-modal-image");

      if (oldImgEl && oldImgEl.src) {
        var img1 = document.createElement("img");
        img1.src = oldImgEl.src;
        var img2 = document.createElement("img");
        img2.src = currentImgEl ? currentImgEl.src : entry.imageDataUrl;
        imagesDiv.appendChild(img1);
        imagesDiv.appendChild(img2);
      } else {
        var img = document.createElement("img");
        img.src = currentImgEl ? currentImgEl.src : entry.imageDataUrl;
        imagesDiv.appendChild(img);
      }
      printContainer.appendChild(imagesDiv);

      var resultObj = document.getElementById("analysis-result");
      if (resultObj) {
        var resultClone = resultObj.cloneNode(true);
        resultClone.id = "";
        resultClone.className = "print-content";
        printContainer.appendChild(resultClone);
      }

      document.body.appendChild(printContainer);
      document.body.classList.add("print-mode-active");
      window.print();
      document.body.classList.remove("print-mode-active");
      document.body.removeChild(printContainer);
    });
  }

  function renderGallery() {
    var entries = sortEntries(loadEntries());
    var n = entries.length;

    if (galleryCount) {
      if (n === 0) {
        galleryCount.textContent = "";
        galleryCount.hidden = true;
      } else {
        galleryCount.hidden = false;
        galleryCount.textContent = n === 1 ? "1 kayıt" : n + " kayıt";
      }
    }

    if (!moleList || !emptyState) return;

    if (n === 0) {
      emptyState.hidden = false;
      moleList.hidden = true;
      moleList.innerHTML = "";
      return;
    }

    emptyState.hidden = true;
    moleList.hidden = false;
    moleList.innerHTML = "";

    entries.forEach(function (entry) {
      var regionLabel =
        REGION_LABELS[entry.regionKey] ||
        entry.regionLabel ||
        entry.regionKey ||
        "—";
      var li = document.createElement("li");
      li.className = "gallery__item gallery__item--interactive";
      li.setAttribute("data-id", entry.id);
      li.setAttribute("tabindex", "0");
      li.setAttribute(
        "aria-label",
        "Aç: " +
        formatDateDisplay(entry.dateISO) +
        ", " +
        regionLabel
      );

      var thumbWrap = document.createElement("div");
      thumbWrap.className = "gallery__thumb-wrap";
      var img = document.createElement("img");
      img.className = "gallery__thumb";
      img.src = entry.imageDataUrl || "";
      img.alt =
        formatDateDisplay(entry.dateISO) + ", " + regionLabel + " bölgesi ben kaydı";
      thumbWrap.appendChild(img);

      var meta = document.createElement("div");
      meta.className = "gallery__meta";
      var dateEl = document.createElement("span");
      dateEl.className = "gallery__date";
      dateEl.textContent = formatDateDisplay(entry.dateISO);
      var regionEl = document.createElement("span");
      regionEl.className = "gallery__region";
      regionEl.textContent = regionLabel;
      meta.appendChild(dateEl);
      meta.appendChild(regionEl);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "gallery__delete";
      del.setAttribute("data-action", "delete");
      del.setAttribute(
        "aria-label",
        formatDateDisplay(entry.dateISO) + " tarihli kaydı sil"
      );
      del.textContent = "Sil";

      li.appendChild(thumbWrap);
      li.appendChild(meta);
      li.appendChild(del);
      moleList.appendChild(li);
    });
  }

  function deleteEntryById(id) {
    var entries = loadEntries().filter(function (e) {
      return e.id !== id;
    });
    saveEntries(entries);
    renderGallery();
  }

  if (entryDate) {
    entryDate.value = todayISODateLocal();
  }

  if (btnNew && uploadSection) {
    btnNew.addEventListener("click", function () {
      uploadSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
      dropzone.focus();
    });
  }

  if (btnBrowse) {
    btnBrowse.addEventListener("click", function (e) {
      e.stopPropagation();
      openFilePicker();
    });
  }

  dropzone.addEventListener("click", function () {
    openFilePicker();
  });

  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  });

  photoInput.addEventListener("change", function () {
    var file = photoInput.files && photoInput.files[0];
    if (file) setPreviewFromFile(file);
  });

  ["dragenter", "dragover"].forEach(function (type) {
    dropzone.addEventListener(type, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dropzone--active");
    });
  });

  ["dragleave", "drop"].forEach(function (type) {
    dropzone.addEventListener(type, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dropzone--active");
    });
  });

  dropzone.addEventListener("drop", function (e) {
    var dt = e.dataTransfer;
    if (!dt || !dt.files || !dt.files.length) return;
    var file = dt.files[0];
    try {
      var dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      photoInput.files = dataTransfer.files;
    } catch (err) {
      setPreviewFromFile(file);
      return;
    }
    setPreviewFromFile(file);
  });

  if (btnChange) {
    btnChange.addEventListener("click", function () {
      openFilePicker();
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      clearPreview();
    });
  }

  if (btnSaveEntry && entryDate && entryRegion) {
    btnSaveEntry.addEventListener("click", function () {
      hideError();
      var file = photoInput.files && photoInput.files[0];
      if (!file || !isImageFile(file)) {
        showError("Önce bir fotoğraf seçin.");
        return;
      }
      if (!entryRegion.value) {
        showError("Lütfen vücut bölgesi seçin.");
        entryRegion.focus();
        return;
      }
      if (!entryDate.value) {
        showError("Lütfen tarih seçin.");
        entryDate.focus();
        return;
      }

      btnSaveEntry.disabled = true;
      fileToDataUrl(file)
        .then(function (dataUrl) {
          var regionKey = entryRegion.value;
          var entry = {
            id: makeId(),
            dateISO: entryDate.value,
            regionKey: regionKey,
            regionLabel: REGION_LABELS[regionKey] || regionKey,
            imageDataUrl: dataUrl,
            createdAt: Date.now(),
          };
          var entries = loadEntries();
          entries.push(entry);
          try {
            saveEntries(entries);
          } catch (err) {
            var msg = "Kayıt saklanamadı.";
            if (
              err &&
              (err.name === "QuotaExceededError" || err.code === 22)
            ) {
              msg =
                "Depolama alanı yetersiz veya fotoğraf çok büyük. Daha küçük bir görüntü deneyin veya eski kayıtları silin.";
            }
            showError(msg);
            return;
          }
          renderGallery();
          clearPreview();
        })
        .catch(function () {
          showError("Fotoğraf okunamadı. Başka bir dosya deneyin.");
        })
        .finally(function () {
          btnSaveEntry.disabled = false;
        });
    });
  }

  if (moleList) {
    moleList.addEventListener("click", function (e) {
      var delBtn = e.target.closest("[data-action='delete']");
      if (delBtn && moleList.contains(delBtn)) {
        e.stopPropagation();
        var item = delBtn.closest(".gallery__item");
        var id = item && item.getAttribute("data-id");
        if (!id) return;
        if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
          deleteEntryById(id);
        }
        return;
      }

      var item = e.target.closest(".gallery__item");
      if (!item || !moleList.contains(item)) return;
      var openId = item.getAttribute("data-id");
      if (openId) openEntryModal(openId);
    });

    moleList.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".gallery__item");
      if (!item || !moleList.contains(item)) return;
      if (e.target.closest("[data-action='delete']")) return;
      e.preventDefault();
      var openId = item.getAttribute("data-id");
      if (openId) openEntryModal(openId);
    });
  }

  renderGallery();

  window.addEventListener("beforeunload", function () {
    revokePreviewUrl();
    closeAllModals();
  });
})();
