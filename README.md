# NetAcad Assistant

This is a fork of the original: https://github.com/vbatecan/netacad-autoanswer

## What Does It Do?
- **Scrapes** the currently visible multiple-choice question and answer options from NetAcad quiz pages.
- **Sends** the current question to the OpenAI API when triggered with the keyboard shortcut.
- **Supports** single-answer, multi-answer and match categories/options questions.
- **Selects** correct answers automatically.

## How to Install and Use
1. **Clone or Download** this repository.
2. **Load the Extension in Chrome:**
   - Go to `chrome://extensions/`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked" and select the project folder.
3. **Get an OpenAI API Key.**
4. **Set Your API Key:**
   - Click the extension icon.
   - Enter your OpenAI API key in the popup and click "Save API Key".
5. **Use on NetAcad:**
   - Navigate to a NetAcad quiz page.
   - Use the keyboard shortcut **Alt+M** to trigger processing.
   - The extension will scrape the current question and send it to OpenAI.
   - The correct answers will automatically be selected

## API Key & Privacy
- Your OpenAI API key is stored locally in your browser's extension storage and is **never shared** with anyone except OpenAI.
- You can remove or change your API key at any time via the extension popup.

## Last check working
2026-05-29
