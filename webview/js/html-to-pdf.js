class HtmlToPdf {
    constructor(pdfName = 'code.pdf', fontName = 'courier') {
        this.pdfName = pdfName;
        this.fontName = fontName;
        this.codeDiv = document.querySelector("#codeDiv");
        this.defaultCodeDiv = this.codeDiv.cloneNode(true);
        this.fontSize = parseInt(window.getComputedStyle(this.codeDiv).fontSize);
    }
    async setFont(font) {
        if ((font instanceof File) && font.name.match(/\.ttf$/)) {
            const fontName = font.name.replace(/\.ttf$/, '');
            const fontBase64 = await this.#fileToBase64(font);
            const callAddFont = function () {
                this.addFileToVFS(font.name, fontBase64);
                this.addFont(font.name, fontName, 'normal');
            };
            jspdf.jsPDF.API.events.push(['addFonts', callAddFont]);
            this.fontName = fontName;
            return 0;
        } else if (typeof font === 'string') {
            this.fontName = font;
            return 0;
        } else {
            return 1;
        }
    }
    setFileName(name) {
        if (typeof name === 'string') {
            this.pdfName = name;
            return 0;
        } else {
            return 1;
        }
    }
    #fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target.result;
                const base64 = result.substr(result.indexOf('base64,') + 7)
                resolve(base64);
            };
            reader.readAsDataURL(file);
        });
    }
    // PDFのサイズを計算
    #calcPdfSize() {
        const doc = jspdf.jsPDF('p', 'pt', [10000, 10000]);
        // フォントを追加 (ここが実際にPDFを作る場合と同じフォントでないと正しい値が取得できない)
        doc.setFont(this.fontName, "normal");
        doc.setFontSize(this.fontSize);
        const divs = this.codeDiv.querySelectorAll('div');
        let widths = [];
        let height = 0;
        for (const div of divs) {
            if (div.textContent.length === 0) {
                height += doc.getTextDimensions('\n').h;
                continue;
            }
            height += doc.getTextDimensions(div.textContent).h;
            widths.push(doc.getTextDimensions(div.textContent).w);
        }
        return {
            defaultHeight: height,
            defaultWidth: Math.max(...widths)
        };
    }
    // HTMLを画像形式のPDFに変換
    htmlToImagePdf() {
        html2canvas(this.codeDiv).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const orientation = canvas.height > canvas.width ? 'p' : 'l';
            const doc = new jspdf.jsPDF(orientation, 'pt', [canvas.height, canvas.width]);
            doc.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            doc.save(this.pdfName);
        });
    }
    // HTMLをテキスト形式のPDFに変換
    htmlToTextPdf() {
        // PDFのサイズを計算
        const { defaultHeight, defaultWidth } = this.#calcPdfSize();
        // 縦横を判定
        const orientation = defaultHeight > defaultWidth ? 'p' : 'l';
        // PDFを作成
        const doc = jspdf.jsPDF(orientation, 'pt', [defaultHeight, defaultWidth]);
        console.log(doc.getFontList());
        // フォントを追加
        doc.setFont(this.fontName, "normal");
        doc.setFontSize(this.fontSize);
        // 背景色を設定
        doc.setFillColor(this.codeDiv.style.backgroundColor);
        doc.rect(0, 0, defaultWidth, defaultHeight, 'F');
        // テキスト色を設定
        doc.setTextColor(this.codeDiv.style.color);

        const divs = this.codeDiv.querySelectorAll('div');
        let height = 0;
        for (const div of divs) {
            // brタグの場合は改行
            if (div.textContent.length === 0) {
                height += doc.getTextDimensions('\n').h;
                continue;
            }
            const spans = div.querySelectorAll('span');
            height += doc.getTextDimensions(div.textContent).h;
            let text = "";
            for (const span of spans) {
                const width = doc.getTextDimensions(text).w;
                doc.setTextColor(span.style.color);
                doc.text(span.textContent, width, height);
                text += span.textContent;
            }
        }
        this.codeDiv.replaceWith(this.defaultCodeDiv.cloneNode(true));
        doc.save(this.pdfName);
    }
}
