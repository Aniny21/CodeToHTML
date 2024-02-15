class TextWrap {
    constructor(maxCharCount = 100, smart = true) {
        this.maxCharCount = maxCharCount;
        this.smart = smart;
        this.codeDiv = document.querySelector("#codeDiv");
        this.newCodeDiv = document.createElement('div');
        this.newCodeDiv.style = this.codeDiv.style.cssText;
        this.newCodeDiv.id = this.codeDiv.id;
        this.newCodeDiv.className = this.codeDiv.className;
        this.currentLineCharCount = 0;
        this.currentLineIndent = 0;
    }

    run() {
        if (this.maxCharCount === 0) {
            this.#wrapBrWithDiv();
            return;
        } else if (this.#checkMaxIndent()) {
            this.#textWrap();
        } else {
            throw new Error('最大文字数を超えるインデントが存在します');
        }
    }

    #checkMaxIndent() {
        const divs = this.codeDiv.querySelectorAll('div');
        let maxIndent = 0;
        for (const div of divs) {
            const indent = div.textContent.match(/^\s*/)[0].length;
            if (indent > maxIndent) {
                maxIndent = indent;
            }
        }
        if (maxIndent > this.maxCharCount) {
            return 0;
        } else {
            return 1;
        }
    }


    #spanWrapLoop(span, isRoot) {
        if (isRoot) {
            this.currentLineCharCount += span.textContent.length;
        } else {
            this.currentLineCharCount += (this.currentLineIndent + span.textContent.length)
        }

        if (this.currentLineCharCount > this.maxCharCount) {
            // 現在の行の文字数と指定の文字数の差分を取得
            const diff = this.currentLineCharCount - this.maxCharCount;
            this.currentLineCharCount = 0;
            // 指定の文字数の前と後に分割
            const preText = span.textContent.slice(0, span.textContent.length - diff);
            const postText = span.textContent.slice(span.textContent.length - diff);

            // 指定の文字数を超えた場合、次の行に移動
            const preSpan = document.createElement('span');
            preSpan.textContent = preText;
            preSpan.style.color = span.style.color;
            this.newCodeDiv.lastChild.appendChild(preSpan);
            this.newCodeDiv.appendChild(document.createElement('div'));

            // インデントを考慮
            const indentSpan = document.createElement('span');
            indentSpan.innerHTML = '&nbsp;'.repeat(this.currentLineIndent);
            this.newCodeDiv.lastChild.appendChild(indentSpan);

            // 残りの文字列を再帰的に追加
            const postSpan = document.createElement('span');
            postSpan.textContent = postText;
            postSpan.style.color = span.style.color;
            this.#spanWrapLoop(postSpan, false);
        } else {
            this.newCodeDiv.lastChild.appendChild(span);
        }
    }

    #textWrap() {
        this.#wrapBrWithDiv();
        const divs = this.codeDiv.querySelectorAll('div');
        for (const div of divs) {
            if (div.textContent.length === 0) {
                const newDiv = document.createElement('div');
                const newBr = document.createElement('br');
                newDiv.appendChild(newBr);
                this.newCodeDiv.appendChild(newDiv);
                continue;
            }
            // 現在の行の文字数を初期化
            this.currentLineCharCount = 0;
            // smartモードは文字列の折り返しをする際にインデントを考慮する
            this.currentLineIndent = this.smart ? div.textContent.match(/^\s*/)[0].length : 0;

            // mainDivの中のdivを取得
            const newDiv = document.createElement('div');
            this.newCodeDiv.appendChild(newDiv);

            const spans = div.querySelectorAll('span');
            for (const span of spans) {
                this.#spanWrapLoop(span, true);
            }
        }
        this.codeDiv.replaceWith(this.newCodeDiv);
    }

    #wrapBrWithDiv() {
        // divタグが二重になるのを防ぐ
        const brs = this.codeDiv.querySelectorAll(':not(div > div) > br');

        for (const br of brs) {
            const newDiv = document.createElement('div');
            const newBr = document.createElement('br');
            newDiv.appendChild(newBr);
            br.replaceWith(newDiv);
        }
    }
}