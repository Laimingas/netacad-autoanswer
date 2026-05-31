document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const saveKeyButton = document.getElementById("saveKey");
  const statusDiv = document.getElementById("status");

  const modeInputs = Array.from(document.querySelectorAll('input[name="answerMode"]'));

  chrome.storage.sync.get(["aiApiKey", "answerMode"], (result) => {
    if (result.aiApiKey) {
      apiKeyInput.value = result.aiApiKey;
    }

    const mode = result.answerMode || "auto";
    const target = modeInputs.find((el) => el.value === mode);
    if (target) target.checked = true;

    statusDiv.textContent = result.aiApiKey ? "Settings loaded." : "API Key not set.";
    setTimeout(() => {
      if (statusDiv.textContent === "Settings loaded." || statusDiv.textContent === "API Key not set.") {
        statusDiv.textContent = "";
      }
    }, 2000);
  });

  saveKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const selectedMode = (modeInputs.find((el) => el.checked)?.value) || "auto";

    chrome.storage.sync.set({ aiApiKey: apiKey, answerMode: selectedMode }, () => {
      statusDiv.textContent = "Settings saved!";
      setTimeout(() => (statusDiv.textContent = ""), 2000);
    });
  });
});