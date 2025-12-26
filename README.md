# PDF-Video Sync

A web application that synchronizes PDF page navigation with video playback, allowing you to create synchronized presentations, lectures, or tutorials.

## Features

- **Split-view Layout**: Video and PDF displayed side-by-side (or vertically stacked on mobile)
- **Automatic Synchronization**: PDF pages automatically advance based on video timestamp
- **Manual Controls**: Navigate pages manually with play/pause and seek behavior
- **Responsive Design**: Adapts to desktop and mobile screens
- **Draggable Divider**: Adjustable panel sizes to customize your view
- **Keyboard Shortcuts**: Efficient navigation using keyboard
- **Configurable**: Easy JSON configuration for different video/PDF pairs

## Setup Instructions

### Requirements

- A local web server (required due to browser CORS policies)
- Modern web browser with JavaScript enabled

### Running the Application

1. Clone or download this repository:
   ```bash
   git clone https://github.com/janzal/pdf-video-sync.git
   cd pdf-video-sync
   ```

2. Start a local web server. Choose one of these methods:

   **Python 3:**
   ```bash
   python -m http.server 8000
   ```

   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Node.js (with http-server):**
   ```bash
   npx http-server -p 8000
   ```

   **PHP:**
   ```bash
   php -S localhost:8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Usage

### Configuration Format

Edit `config.json` to customize your video and PDF sources:

```json
{
  "videoUrl": "path/to/your/video.mp4",
  "pdfUrl": "path/to/your/document.pdf",
  "sync": [
    {"time": 0, "page": 1},
    {"time": 30, "page": 2},
    {"time": 60, "page": 3}
  ]
}
```

**Configuration Fields:**

- `videoUrl`: URL or path to your video file (supports MP4, WebM, etc.)
- `pdfUrl`: URL or path to your PDF document
- `sync`: Array of synchronization points
  - `time`: Video timestamp in seconds
  - `page`: PDF page number (1-indexed)

### Controls

**Video Controls:**
- Play/Pause button on video player
- Spacebar: Toggle play/pause

**Page Navigation:**
- Previous/Next buttons below PDF
- Left Arrow: Previous page
- Right Arrow: Next page

**Panel Resizing:**
- Drag the divider between video and PDF panels to adjust sizes
- Minimum panel width: 200px

### Behavior

**Automatic Synchronization:**
- As the video plays, the PDF automatically advances to the page corresponding to the current timestamp
- Based on the sync configuration, the app finds the highest sync point where `time <= currentTime`

**Manual Page Changes:**
- Clicking Previous/Next or using arrow keys pauses the video
- The video seeks to the timestamp associated with the new page
- A 500ms delay prevents auto-advance conflicts

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements:**
- JavaScript enabled
- HTML5 video support
- Canvas support for PDF rendering

## Technical Details

### PDF.js Integration

This application uses [PDF.js](https://mozilla.github.io/pdf.js/) version 3.11.174 from CDN:
- Main library: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js`
- Worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

PDF pages are rendered to a canvas element with automatic scaling to fit the container while maintaining aspect ratio.

### Synchronization Algorithm

The synchronization logic works as follows:

1. **Video timeupdate event**: Fired as video plays
2. **Find target page**: Iterate through sync points to find the highest one where `time <= currentTime`
3. **Render page**: If target page differs from current page, render the new page
4. **Manual override**: When user manually changes pages, set `isManualPageChange` flag to prevent auto-advance

### State Management

Global state variables:
- `pdfDoc`: PDF.js document object
- `currentPage`: Current page number (1-indexed)
- `totalPages`: Total number of pages in PDF
- `syncConfig`: Parsed configuration object
- `isManualPageChange`: Flag to prevent auto-advance after manual navigation

### Responsive Design

- **Desktop (>768px)**: Side-by-side layout with horizontal divider
- **Mobile (≤768px)**: Vertical stack layout with horizontal divider
- PDF canvas automatically re-renders on window resize

## File Structure

```
pdf-video-sync/
├── index.html       # Main HTML structure
├── styles.css       # Styling and responsive design
├── app.js          # Application logic
├── config.json     # Configuration file
└── README.md       # This file
```

## Customization

### Adding Your Own Content

1. Prepare your video file (MP4 recommended)
2. Prepare your PDF document
3. Determine sync points (timestamp to page mappings)
4. Update `config.json` with your URLs and sync points
5. Reload the page

### Styling

Customize the appearance by editing `styles.css`:
- Color scheme: Modify hex colors for header (#2c3e50), buttons (#3498db), etc.
- Fonts: Change the `font-family` in body styles
- Layout: Adjust padding, margins, and panel sizes

## Example Use Case

The default configuration uses:
- **Video**: Big Buck Bunny (open source animated short)
- **PDF**: TraceMoney research paper
- **Sync**: Pages change every 30 seconds

This demonstrates how you could sync a video lecture with presentation slides, educational content with transcripts, or any video-document pair.

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/janzal/pdf-video-sync).
