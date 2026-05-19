chrome.commands.onCommand.addListener((command) => {
  if (command === "process-page-command") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { action: "processPage" }, () => {
          if (!chrome.runtime.lastError) {
            return;
          }

          chrome.scripting.executeScript(
            {
              target: { tabId: tabId, allFrames: true },
              files: ["api.js", "ui.js", "scraper.js", "content.js"],
            },
            () => {
              if (chrome.runtime.lastError) {
                return;
              }

              chrome.tabs.sendMessage(tabId, { action: "processPage" }, () => {
                if (chrome.runtime.lastError) {
                  return;
                }
              });
            },
          );
        });
      }
    });
  }
});
