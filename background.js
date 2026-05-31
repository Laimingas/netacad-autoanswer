chrome.commands.onCommand.addListener((command) => {
  if (command !== "process-page-command") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].id) return;

    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: "processPage" }, () => {
      if (!chrome.runtime.lastError) return;

      chrome.scripting.executeScript(
          {
            target: { tabId: tabId, allFrames: true },
            files: ["api.js", "questionBank.js", "ui.js", "scraper.js", "content.js"]
          },
          () => {
            if (chrome.runtime.lastError) return;

            chrome.tabs.sendMessage(tabId, { action: "processPage" }, () => {
              // ignore errors
            });
          }
      );
    });
  });
});