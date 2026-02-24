# ♿ Accessibility Statement

**Gear Lab Pro** is committed to ensuring that all Formula Student engineers—regardless of ability—can effectively operate the platform in high-pressure competition environments.

---

## 🎯 Standards

We target **WCAG 2.1 Level AA** compliance across all interactive components.

---

## ✅ Current Accessibility Features

### 🔤 Typography & Readability
- **Inter** font family used throughout for optimal screen readability
- **JetBrains Mono** for telemetry data and code-like displays
- Minimum font size of `14px` for all interactive labels
- High contrast ratios ($> 4.5:1$) ensured between text and backgrounds

### 🎨 Color & Visual Design
- Color is never the sole indicator of state; icons and labels always accompany color changes
- Dark mode optimized for low-light garage environments
- Critical alerts (Traction Saturation, RPM Redline) use both color and iconography

### ⌨️ Keyboard Navigation
- All interactive elements (sliders, buttons, tabs) are keyboard-accessible via `Tab` and `Enter`
- Tab order follows logical reading flow: Parameters → Simulation → Results
- Focus indicators are visible on all focusable elements

### 🎙️ Voice Interaction
- Full voice command support via Web Speech API
- Supports hands-free operation for engineers with limited mobility or occupied hands
- Commands: "Start Run", "Mute Audio", "Reset Baseline"

### 📱 Responsive & Adaptive
- Mobile-optimized layout ensures usability on tablets and phones
- Touch targets meet minimum `44×44px` recommended size
- Shadcn-UI Sheet navigation provides swipe-accessible menus

### 🔊 Auditory Feedback
- Engine RPM audio synthesis provides non-visual feedback on gear ratio behavior
- Master mute toggle prevents audio interference during team communication
- Audio state persists across all components and page navigation

---

## 🛠️ Assistive Technology Compatibility

| Technology | Status |
|------------|--------|
| Screen Readers (NVDA, VoiceOver) | ✅ Semantic HTML + ARIA labels |
| Keyboard-Only Navigation | ✅ Full tab support |
| Voice Control | ✅ Web Speech API integration |
| High Contrast Mode | ✅ Dark theme with 4.5:1+ ratios |
| Reduced Motion | ⚠️ Partial (animations respect `prefers-reduced-motion`) |

---

## 🔮 Planned Improvements

- Full `prefers-reduced-motion` support for all micro-animations
- ARIA live regions for real-time solver progress announcements
- Skip-to-content links for faster navigation
- Screen reader optimization for chart data (text alternatives for SVG visualizations)

---

## 📬 Feedback

If you encounter any accessibility barriers, please open an issue with the `accessibility` label. We are committed to removing barriers to engineering participation.
