function extractQuestionAndAnswers(mcqViewElement) {
  let questionText = "Question text not found";
  let answerElements = [];

  try {
    if (mcqViewElement && mcqViewElement.shadowRoot) {
      const baseView = mcqViewElement.shadowRoot.querySelector('base-view[type="component"]');

      if (baseView && baseView.shadowRoot) {
        let questionTextElement = baseView.shadowRoot.querySelector("div.component__body-inner.mcq__body-inner");
        if (!questionTextElement) questionTextElement = baseView.shadowRoot.querySelector(".mcq__prompt");
        if (!questionTextElement) questionTextElement = baseView.shadowRoot.querySelector(".prompt");

        if (questionTextElement) {
          questionText = questionTextElement.innerText.trim();
        } else {
          const potentialElements = Array.from(baseView.shadowRoot.querySelectorAll("div, p, span"));
          for (const el of potentialElements) {
            const text = el.innerText.trim();
            if (text.length > 20) {
              questionText = text;
              break;
            }
          }
        }
      } else {
        let directQuestionEl = mcqViewElement.shadowRoot.querySelector("div.component__body-inner.mcq__body-inner");
        if (!directQuestionEl) directQuestionEl = mcqViewElement.shadowRoot.querySelector(".mcq__prompt");
        if (!directQuestionEl) directQuestionEl = mcqViewElement.shadowRoot.querySelector(".prompt");

        if (directQuestionEl) {
          questionText = directQuestionEl.innerText.trim();
        } else {
          const potentialElements = Array.from(mcqViewElement.shadowRoot.querySelectorAll("div, p, span"));
          for (const el of potentialElements) {
            const text = el.innerText.trim();
            if (text.length > 20) {
              questionText = text;
              break;
            }
          }
        }
      }

      answerElements = mcqViewElement.shadowRoot.querySelectorAll(".mcq__item-label.js-item-label");
    } else {
      questionText = "Error: MCQ View element not accessible.";
    }
  } catch (e) {
    questionText = `Error extracting data.`;
  }

  return { questionText, answerElements };
}

function processAnswerElements(answerElements) {
  return Array.from(answerElements).map((answer) => getAnswerTitleFromLabel(answer));
}

function getAnswerTitleFromLabel(answerLabel) {
  if (!answerLabel) return "";

  const labelClone = answerLabel.cloneNode(true);
  labelClone.querySelectorAll(".screenReader-position-text, .aria-label").forEach((el) => el.remove());

  return labelClone.innerText.replace(/\s+/g, " ").trim();
}

function normalizeAnswerTitle(answerTitle) {
  return String(answerTitle || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function setAnswerCheckboxState(answerTitle, isChecked, mcqViewElement) {
  const normalizedTargetTitle = normalizeAnswerTitle(answerTitle);

  if (!normalizedTargetTitle || !mcqViewElement || !mcqViewElement.shadowRoot) return false;

  const answerLabels = mcqViewElement.shadowRoot.querySelectorAll(".mcq__item-label.js-item-label");

  for (const answerLabel of answerLabels) {
    const currentTitle = getAnswerTitleFromLabel(answerLabel);
    if (normalizeAnswerTitle(currentTitle) !== normalizedTargetTitle) continue;

    const inputId = answerLabel.getAttribute("for");
    const answerInput = inputId
        ? mcqViewElement.shadowRoot.getElementById(inputId)
        : answerLabel.parentElement?.querySelector(".mcq__item-input");

    const isLabelSelected = answerLabel.classList.contains("is-selected");
    const isInputChecked = Boolean(answerInput && answerInput.checked);

    const isCurrentlyChecked = isChecked ? isLabelSelected : isLabelSelected || isInputChecked;
    if (isCurrentlyChecked === Boolean(isChecked)) return true;

    answerLabel.click();
    return true;
  }

  return false;
}

function splitAnswers(rawText) {
  return String(rawText || "")
      .split("\n")
      .map((ans) => ans.trim())
      .filter((ans) => ans.length > 0);
}

async function processSingleQuestion(mcqViewElement, apiKey, answerMode = "auto") {
  const { questionText, answerElements } = extractQuestionAndAnswers(mcqViewElement);
  const answerTexts = processAnswerElements(answerElements);

  if (!questionText || questionText.startsWith("Error") || answerTexts.length === 0) return false;

  let chosenAnswers = null;

  // 1) Bank mode / Auto mode: try question bank
  if (answerMode === "bank" || answerMode === "auto") {
    try {
      const bankAnswers = await findAnswersInBank(questionText); // from questionBank.js
      if (Array.isArray(bankAnswers) && bankAnswers.length > 0) {
        chosenAnswers = bankAnswers;
      } else if (answerMode === "bank") {
        // bank-only: stop here
        return false;
      }
    } catch (e) {
      if (answerMode === "bank") return false;
      // auto: ignore and fallback to AI
    }
  }

  // 2) AI mode / Auto fallback
  if (!chosenAnswers && (answerMode === "ai" || answerMode === "auto")) {
    if (!apiKey) return false;

    const rawAiResponse = await getAiAnswer(questionText, answerTexts, apiKey);
    chosenAnswers = splitAnswers(rawAiResponse);
  }

  if (!Array.isArray(chosenAnswers) || chosenAnswers.length === 0) return false;

  chosenAnswers.forEach((answer) => setAnswerCheckboxState(answer, true, mcqViewElement));
  return true;
}