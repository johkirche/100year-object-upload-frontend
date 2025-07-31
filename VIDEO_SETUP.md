# Video Feature Setup

This document explains how to set up the video cards feature on the home page.

## Overview

The home page now includes two video cards that are displayed below the main upload form, but only when the user is on the first step ("type-selection"). Each card shows a thumbnail with a play button overlay, and when clicked, opens a modal dialog with the full video player.

## Components

### VideoCard.vue
- Located at: `src/components/VideoCard.vue`
- Props:
  - `title` (string): The title displayed on the card and in the modal
  - `description` (string, optional): Description text shown below the title
  - `thumbnail` (string): Path to the thumbnail image
  - `videoSrc` (string): Path to the video file

### Features
- Hover effects with scale animation and play button
- Responsive design (single column on mobile, two columns on desktop)
- Error handling for missing thumbnails and videos
- Fullscreen video modal with controls
- Only visible on the first step of the upload form

## File Structure

```
public/
├── thumbnails/
│   ├── geschichte-thumbnail.jpg    # Church history video thumbnail
│   ├── anleitung-thumbnail.jpg     # Tutorial video thumbnail
│   └── README.md
└── videos/
    ├── geschichte.mp4              # Church history video
    ├── anleitung.mp4               # Tutorial video
    └── README.md
```

## Setup Instructions

1. **Add Thumbnail Images**
   - Place thumbnail images in `public/thumbnails/`
   - Recommended size: 400x300 pixels (4:3 aspect ratio)
   - Formats: JPEG or PNG
   - Files needed:
     - `geschichte-thumbnail.jpg`
     - `anleitung-thumbnail.jpg`

2. **Add Video Files**
   - Place video files in `public/videos/`
   - Recommended format: MP4 (H.264 codec)
   - Recommended resolution: 1920x1080 or 1280x720
   - Files needed:
     - `geschichte.mp4`
     - `anleitung.mp4`

3. **Customization**
   - Video titles and descriptions can be changed in `src/views/Home.vue`
   - Styling can be modified in `src/components/VideoCard.vue`
   - To add more videos, add additional `<VideoCard>` components to the grid

## Technical Details

- Uses Lucide Vue icons for the play button
- Built with shadcn/ui components (Card, Dialog)
- Tailwind CSS for styling
- Vue 3 Composition API
- TypeScript support

## Fallback Behavior

- If thumbnail images are missing, a fallback SVG placeholder is shown
- If video files are missing, an error message is displayed in the modal
- The feature gracefully degrades without breaking the main upload functionality
