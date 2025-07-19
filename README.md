# 🍎 bewindow - macOS Native Writing App

A **native macOS writing application** built with Tauri, React, and TypeScript, featuring authentic glassmorphism design and native window behaviors.

## ✨ Features

- 🎨 **Native macOS glassmorphism** with backdrop-filter effects
- 🚦 **Authentic traffic lights** with native colors and behaviors  
- 🪟 **Native window controls** (minimize, maximize, close, drag)
- 🌓 **Auto dark/light mode** following system preferences
- 📱 **Responsive design** for different screen sizes
- ⚡ **Performance optimized** with hardware acceleration

## 🛠️ Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (latest stable)
- macOS (for native features)

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## 🏗️ Architecture

Built following **macOS Native Interface Specifications** with clear separation of concerns:

- **Frontend**: React + TypeScript for UI logic
- **Backend**: Rust + Tauri for native system integration
- **Styling**: Pure CSS with native macOS design tokens

## 📄 License

Private project - All rights reserved.
