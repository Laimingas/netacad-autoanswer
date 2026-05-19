// Constants for retry mechanism
const MAX_SCRAPE_ATTEMPTS = 10;
const SCRAPE_RETRY_DELAY_MS = 1500;

function getVisibleArea(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") return 0;

  const rect = element.getBoundingClientRect();
  const visibleWidth =
    Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
  const visibleHeight =
    Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

  return Math.max(0, visibleWidth) * Math.max(0, visibleHeight);
}

function isElementDisplayedInComposedTree(element) {
  let currentElement = element;

  while (currentElement) {
    if (currentElement.nodeType !== Node.ELEMENT_NODE) return true;

    const style = window.getComputedStyle(currentElement);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      currentElement.hidden ||
      currentElement.getAttribute("aria-hidden") === "true"
    ) {
      return false;
    }

    if (currentElement.parentElement) {
      currentElement = currentElement.parentElement;
      continue;
    }

    const rootNode = currentElement.getRootNode();
    currentElement = rootNode instanceof ShadowRoot ? rootNode.host : null;
  }

  return true;
}

function getCurrentMcqViewElement(mcqViewElements) {
  const visibleMcqViews = mcqViewElements
    .map((mcqView) => ({
      element: mcqView,
      visibleArea: getVisibleArea(mcqView),
    }))
    .filter(
      ({ element, visibleArea }) =>
        visibleArea > 0 && isElementDisplayedInComposedTree(element),
    )
    .sort((a, b) => b.visibleArea - a.visibleArea);

  if (visibleMcqViews.length === 0) return null;

  return visibleMcqViews[0].element;
}

function findMcqViewElements() {
  const mcqViewElements = [];

  const appRoot = document.querySelector("app-root");
  const pageView = appRoot?.shadowRoot?.querySelector("page-view");
  if (!pageView?.shadowRoot) {
    return mcqViewElements;
  }

  pageView.shadowRoot
    .querySelectorAll("article-view")
    .forEach((articleView) => {
      articleView.shadowRoot
        ?.querySelectorAll("block-view")
        .forEach((blockView) => {
          const mcqView = blockView.shadowRoot?.querySelector("mcq-view");
          if (mcqView) mcqViewElements.push(mcqView);
        });
    });

  return mcqViewElements;
}

async function scrapeData(currentAttempt = 1) {
  const storedData = await chrome.storage.sync.get(["aiApiKey"]);
  const apiKey = storedData.aiApiKey;
  const currentMcqViewElement = getCurrentMcqViewElement(findMcqViewElements());

  if (!currentMcqViewElement) {
    if (currentAttempt < MAX_SCRAPE_ATTEMPTS) {
      setTimeout(() => {
        window.scrapeData && window.scrapeData(currentAttempt + 1);
      }, SCRAPE_RETRY_DELAY_MS);
      return false;
    }
    return false;
  }

  if (!apiKey) {
    return false;
  }

  return processSingleQuestion(currentMcqViewElement, apiKey);
} 
