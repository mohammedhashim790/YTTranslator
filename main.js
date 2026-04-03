const sourceElem = document.getElementById("caption-window-1");


const makeDraggable = (block) => {

    Object.assign(block.style, {
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "auto",
        height: "max-content",
        maxWidth: "85%",
        padding: "12px",
        cursor: "move",
        zIndex: "9999",
        display: "block",
        whiteSpace: "pre-wrap",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "white",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.2)",
        boxSizing: "border-box",
        textAlign: "center"
    });

    let isDragging = false;
    let offsetX, offsetY;

    block.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = block.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        block.style.opacity = "0.8";
        block.style.userSelect = "none";
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        block.style.transform = "none";
        block.style.margin = "0";
        block.style.left = `${e.clientX - offsetX}px`;
        block.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            block.style.opacity = "1";
            block.style.userSelect = "auto";
        }
    });

    return block;
}

const targetElemId = "caption-window-2"
const container = document.querySelector('.ytp-caption-window-container');

if (!container) {
    console.error("Caption container not found!");
} else {
    // Create a copy of the node
    const sl = "ar";
    const tl = "en"

    let targetElement = document.getElementById(targetElemId);
    if (targetElement === undefined || targetElement === null) {
        // We use the initial sourceElem if it exists, otherwise we wait for observer
        const initialSource = document.getElementById("caption-window-1");
        if (initialSource) {
            targetElement = initialSource.cloneNode(true);
            targetElement.id = targetElemId;
            targetElement.style.top = "10%";
            makeDraggable(targetElement);
            container.insertBefore(targetElement, container.firstChild);
        }
    }

    let lText = "";
    let debounceTimer = null;
    const debounceTime = 200; //ms

    const doTranslate = async (text) => {
        if (!text || text === lText) return;

        if (!document.getElementById(targetElemId) && targetElement) {
            container.insertBefore(targetElement, container.firstChild);
        }

        lText = text;

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            // Google returns translations in data[0] as an array of segments
            const translated = data[0].map(s => s[0]).join("");
            if (targetElement) targetElement.innerText = translated;
            // console.log("Translated:", translated);
        } catch (e) {
            console.error("Translation Error:", e);
        }
    };

    const observer = new MutationObserver(() => {
        const activeSource = document.getElementById("caption-window-1");
        if (!activeSource) return;

        // If target was deleted by YT UI refresh, recreate it
        if (!document.getElementById(targetElemId)) {
            targetElement = activeSource.cloneNode(true);
            targetElement.id = targetElemId;
            makeDraggable(targetElement);
            container.insertBefore(targetElement, container.firstChild);
        }

        const currentText = activeSource.innerText.trim();

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            doTranslate(currentText);
        }, debounceTime);
    });

    observer.observe(container, {
        childList: true, characterData: true, subtree: true
    });
}
