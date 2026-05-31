let __questionBankCache = null;

function normalizeText(s) {
    return String(s || "")
        .replace(/\r\n/g, "\n")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// Optional: remove common NetAcad prefixes that might differ
function stripCommonPrefixes(q) {
    let t = String(q || "").trim();

    // remove repeated exhibit references etc.
    t = t.replace(/^refer to the exhibit\.\s*/i, "");
    t = t.replace(/^network information:\s*/i, "");

    return t;
}

async function loadQuestionBank() {
    if (__questionBankCache) return __questionBankCache;

    const url = chrome.runtime.getURL("questions_bank.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load questions_bank.json: ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("questions_bank.json must be an array");

    // Build normalized index
    const indexed = data
        .map((item) => {
            const question = item.question ?? item?.Question ?? item?.q;
            const answers = item.answers ?? item?.Answers ?? item?.a;

            return {
                raw: item,
                question: String(question || ""),
                answers: Array.isArray(answers) ? answers.map(String) : []
            };
        })
        .filter((x) => x.question && x.answers.length > 0)
        .map((x) => {
            const q1 = normalizeText(x.question);
            const q2 = normalizeText(stripCommonPrefixes(x.question));
            return { ...x, norm: q1, normStripped: q2 };
        });

    __questionBankCache = indexed;
    return indexed;
}

async function findAnswersInBank(questionText) {
    const bank = await loadQuestionBank();

    const qNorm = normalizeText(questionText);
    const qNormStripped = normalizeText(stripCommonPrefixes(questionText));

    // 1) Exact match normalized
    let found = bank.find((x) => x.norm === qNorm);
    if (found) return found.answers;

    // 2) Exact match stripped
    found = bank.find((x) => x.normStripped === qNormStripped);
    if (found) return found.answers;

    // 3) Soft contains match (optional but useful if page adds extra whitespace/lines)
    // Prefer longer question texts: if bank question is contained inside page question.
    found = bank.find((x) => qNorm.includes(x.norm) || qNormStripped.includes(x.normStripped));
    if (found) return found.answers;

    return null;
}