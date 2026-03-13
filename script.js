(function() {
    const fileInput = document.getElementById('fileInput');
    const imgPreview = document.getElementById('imgPreview');
    const startBtn = document.getElementById('startBtn');
    const statusLabel = document.getElementById('statusLabel');
    const progressBar = document.getElementById('progressBar');
    const output = document.getElementById('output');
    const langSelect = document.getElementById('langSelect');
    const speedSlider = document.getElementById('speedSlider');
    const speedVal = document.getElementById('speedVal');
    const speakBtn = document.getElementById('speakBtn');
    const stopBtn = document.getElementById('stopBtn');

    window.onload = function() {
      if (typeof Tesseract !== 'undefined') {
        statusLabel.innerHTML = '<i class="far fa-check-circle" style="color: #10b981;"></i> Engine ready. Select image.';
      } else {
        statusLabel.innerText = '⚠️ Tesseract not loaded – check assets.';
        statusLabel.style.color = '#b91c1c';
      }
    };

    fileInput.onchange = function() {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imgPreview.src = e.target.result;
          imgPreview.style.display = 'block';
          startBtn.disabled = false;
          statusLabel.innerHTML = '<i class="fas fa-image" style="color:#2563eb;"></i> Image loaded, press Start.';
        };
        reader.readAsDataURL(file);
      } else {
        imgPreview.style.display = 'none';
        startBtn.disabled = true;
      }
    };

    startBtn.onclick = async function() {
      const file = fileInput.files[0];
      const selectedLang = langSelect.value;
      if (!file) return;

      startBtn.disabled = true;
      output.innerText = '⏳ Recognizing text ...';

      try {
        const worker = await Tesseract.createWorker(selectedLang, 1, {
          workerPath: './tesseract-assets/worker.min.js',
          corePath: './tesseract-assets/tesseract-core-simd.wasm.js',
          langPath: './tesseract-assets/lang-data',
          gzip: false,
          logger: m => {
            if (m.status === 'recognizing text') {
              progressBar.value = m.progress || 0;
              statusLabel.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> Recognizing ${Math.round(m.progress * 100)}%`;
            } else {
              statusLabel.innerText = m.status;
            }
          }
        });

        const { data: { text } } = await worker.recognize(file);
        output.innerText = text.trim() || '⚠️ No text detected.';
        statusLabel.innerHTML = '<i class="far fa-check-circle" style="color:#059669;"></i> Complete!';
        await worker.terminate();
      } catch (err) {
        console.error(err);
        output.innerText = '❌ OCR error. Make sure language data exists.';
        statusLabel.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#b91c1c;"></i> Recognition failed.';
      } finally {
        startBtn.disabled = false;
      }
    };

    speedSlider.oninput = function() {
      speedVal.innerText = speedSlider.value;
    };

    window.purifyText = function() {
      let text = output.innerText;
      if (!text || text.startsWith('Upload') || text.startsWith('⬆️')) return;
      const purified = text
        .replace(/[ \t]+/g, ' ')
        .replace(/([^\n])\n([^\n])/g, '$1 $2')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      output.innerText = purified;
    };

    window.copyText = function() {
      navigator.clipboard.writeText(output.innerText);
      alert('Copied to clipboard!');
    };

    window.speakText = function() {
      const text = output.innerText;
      if (!text || text.startsWith('⬆️') || text.startsWith('Upload')) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = parseFloat(speedSlider.value);

      const langMap = {
        'eng': 'en-US'
      };
      utterance.lang = langMap[langSelect.value] || 'en-US';

      speakBtn.style.display = 'none';
      stopBtn.style.display = 'inline-flex';

      utterance.onend = utterance.onerror = function() {
        speakBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
      };

      window.speechSynthesis.speak(utterance);
    };

    window.stopSpeech = function() {
      window.speechSynthesis.cancel();
      speakBtn.style.display = 'inline-flex';
      stopBtn.style.display = 'none';
    };
  })();
