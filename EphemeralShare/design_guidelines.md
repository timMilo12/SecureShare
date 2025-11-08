# Design Guidelines: Temporary File Sharing Web App

## Design Approach
**Utility-First Design System** inspired by modern file-sharing services (WeTransfer, Dropbox Send) with emphasis on clarity, security indicators, and workflow efficiency.

## Typography
- **Primary Font**: Inter or DM Sans via Google Fonts CDN
- **Headings**: 
  - H1: text-4xl font-bold (landing hero)
  - H2: text-2xl font-semibold (page titles)
  - H3: text-lg font-medium (section headers)
- **Body**: text-base leading-relaxed
- **Monospace**: JetBrains Mono for slot IDs and technical data (text-sm font-mono)
- **Labels/Helpers**: text-sm text-gray-600

## Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-6 to p-8
- Section spacing: my-12 to my-20
- Form field gaps: space-y-4
- Button/Input height: h-12 to h-14

**Container Strategy**:
- Max-width: max-w-2xl for forms, max-w-4xl for file lists
- Center alignment: mx-auto for all content containers
- Full-height sections: min-h-screen with flex centering for landing

## Component Library

### Landing Page (index.html)
- **Hero Section**: Centered vertical layout with large heading, subtitle, and two prominent action buttons
- **Hero Content**: "Share Files Securely" headline, subtext explaining 24-hour expiration, password protection
- **Action Buttons**: Large pill-shaped buttons (Create Slot / Open Slot) stacked vertically on mobile, horizontal on desktop
- **Security Badge**: Small trust indicator below buttons ("Military-grade encryption • Auto-deletion • No tracking")

### Create Slot Page
- **Centered Card Layout**: Single card (p-8, rounded-lg border) containing entire workflow
- **Step Indicator**: Progress dots showing: 1) Set Password → 2) Upload Files → 3) Share
- **Password Input**: Large, clear password field with strength indicator bar below
- **Upload Zone**: Drag-drop area with dashed border, large icon, "Click or drag files" text
- **File List**: Stack layout showing uploaded files with name, size, remove icon
- **Text Area**: Expandable textarea for optional text notes (min-h-32)
- **Slot ID Display**: After creation, show large monospace ID in outlined box with copy button
- **Countdown Timer**: Prominent display showing "Expires in: 23h 45m" with subtle progress ring

### Open Slot Page
- **Two-Step Layout**:
  1. Input form: Slot ID + Password fields centered
  2. Content view: File list + text display after authentication
- **Failed Attempts Indicator**: Red warning badge showing remaining attempts (e.g., "2 attempts remaining")
- **File Download List**: Clean list with file icons, names, sizes, individual download buttons
- **Text Display**: Code-block style box for stored text with copy button
- **Expiration Alert**: Yellow warning banner at top when < 2 hours remaining

### Navigation
- **Simple Header**: Logo/title on left, "Create" and "Open" links on right (sticky top)
- **No footer** needed for this utility app

### Forms & Inputs
- **Input Fields**: Large touch-friendly (h-12), rounded corners, subtle borders
- **Labels**: Above inputs, text-sm font-medium
- **Validation**: Inline error messages in red below fields
- **Buttons**: 
  - Primary: Large (h-12 px-8), rounded-lg, font-medium
  - Secondary: Similar size, outlined variant
  - Icon buttons: Square (w-10 h-10), rounded-full for actions

### Status & Feedback
- **Upload Progress**: Horizontal progress bar with percentage
- **Countdown Timer**: Large numeric display with circular progress indicator
- **Success States**: Green checkmark icons with confirmation messages
- **Error States**: Red alert icons with clear error text
- **Loading States**: Spinner with "Processing..." text

### Icons
Use **Heroicons** via CDN:
- Upload: cloud-arrow-up
- Download: arrow-down-tray
- Copy: clipboard-document
- Delete: trash
- Lock: lock-closed
- Clock: clock
- Check: check-circle

## Images
**No hero images** - This is a utility-focused application where clarity and speed matter more than visual storytelling. Keep interface clean and distraction-free.

## Animations
**Minimal, functional only**:
- Fade-in for success messages (300ms)
- Slide-down for error alerts (200ms)
- Smooth countdown timer updates
- NO decorative animations or scroll effects

## Accessibility
- Clear focus states on all interactive elements
- ARIA labels for icon buttons
- Keyboard navigation for entire workflow
- High contrast for all text
- Screen reader announcements for slot creation and file uploads