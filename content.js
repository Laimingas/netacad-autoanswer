if (typeof window.scrapeData !== "function") {
  if (typeof scrapeData === "function") {
    window.scrapeData = scrapeData;
  }
}

if (!window.netacadProcessPageListenerAttached) {
  window.netacadProcessPageListenerAttached = true;

  // Listener for messages from the shortcut command.
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processPage") {
      // Check if this frame contains the app-root element
      if (document.querySelector("app-root")) {
        if (typeof window.scrapeData === "function") {
          window
            .scrapeData()
            .then((result) => {
              sendResponse({ success: true, result: result });
            })
            .catch((error) => {
              sendResponse({ success: false, error: error.toString() });
            });
          return true; // Indicates that sendResponse will be called asynchronously
        } else {
          sendResponse({
            success: false,
            error: "scrapeData_not_found_in_frame",
          });
        }
      } else {
        return false;
      }
    }
    return false;
  });
}
