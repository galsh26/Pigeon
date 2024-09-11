document.addEventListener("DOMContentLoaded", () => {
    const screenshotImg = document.getElementById("screenshot");
    const captureBtn = document.getElementById("captureBtn");
  
    function captureScreenshot() {
      chrome.runtime.sendMessage({ action: "capture_screenshot" }, (response) => {
        if (response && response.screenshot) {
          resizeImage(response.screenshot, 200, 200, (resizedImage) => {
            screenshotImg.src = resizedImage;
          });
        }
      });
    }
  
    function resizeImage(dataUrl, width, height, callback) {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg"));
      };
    }
  
    captureBtn.addEventListener("click", captureScreenshot);
  
    // Capture screenshot on load
    captureScreenshot();
  });
  