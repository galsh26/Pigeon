
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: takeScreenshot
  });
});

function takeScreenshot() {
  chrome.tabs.captureVisibleTab(null, {}, function(dataUrl) {
    console.log(dataUrl);
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.captureVisibleTab(null, {}, function(image) {
      // This is just a placeholder for capturing screenshots in the background
  });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture_screenshot") {
    chrome.tabs.captureVisibleTab(null, {format: "png"}, (screenshotUrl) => {
      sendResponse({screenshot: screenshotUrl});
    });
    return true;  // Keep the message channel open for asynchronous response
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "closePopup") {
      window.close();
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    const currentUrl = activeTab.url;

    // Send message to content script to update the URL
    chrome.storage.local.set({ currentUrl });
  });
});

