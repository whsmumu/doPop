# 🖥️ bewindow - Native Desktop App Boilerplate

A **cross-platform desktop app boilerplate** built with Tauri, React, and TypeScript, featuring native macOS glassmorphism design and cross-platform window controls.

## 🚀 What is this?

**bewindow** is a ready-to-clone boilerplate for creating beautiful native desktop applications. It provides:

- ✨ **Native macOS styling** with authentic glassmorphism effects
- 🔄 **Cross-platform support** (macOS, Windows, Linux)
- ⌨️ **Global shortcut** (`⇧⌘T` / `⇧Ctrl+T`) to toggle window visibility
- 🎨 **Platform-specific UI** that adapts to each operating system
- 🚀 **Production-ready** architecture with best practices

## 🎯 Perfect for building:

- Writing apps
- Note-taking tools
- Quick utilities
- Dashboard applications
- System monitors
- Developer tools

## ✨ Key Features

### 🍎 **Native macOS Experience**
- Authentic glassmorphism with `window-vibrancy`
- Native titlebar with drag regions
- System font stack (`-apple-system`)
- Automatic dark/light mode switching
- Native shadows and blur effects

### 🪟 **Windows Support**
- Custom titlebar with minimize/maximize/close buttons
- Acrylic blur effects
- Proper drag regions and window controls

### ⌨️ **Global Shortcuts**
- `⇧⌘T` (macOS) / `⇧Ctrl+T` (Windows/Linux) to toggle window
- Always-on-top window for quick access
- Hide/show with focus management

### 🎨 **Design System**
- Native typography (14px system font)
- 7px border radius for native feel
- No text selection or focus outlines
- Consistent spacing and layout
- Responsive design for different screen sizes

## 🛠️ Quick Start

### 1. Clone this repository
```bash
git clone https://github.com/your-username/bewindow.git
cd bewindow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run in development
```bash
npm run tauri dev
```

### 4. Build for production
```bash
npm run tauri build
```

## 📋 Prerequisites

- **Node.js** v18+
- **Rust** (latest stable via [rustup](https://rustup.rs/))
- **Platform-specific**:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft Visual Studio C++ Build Tools
  - Linux: Development packages for your distro

## 🏗️ Project Structure

```
bewindow/
├── 🎯 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx          # Main component with platform detection
│   │   ├── App.css          # Native macOS styling
│   │   ├── index.css        # Global styles and resets
│   │   └── main.tsx         # React root
│   └── index.html           # App entry point
│
├── 🦀 Backend (Rust + Tauri)
│   └── src-tauri/
│       ├── src/main.rs      # Window setup + platform detection
│       ├── tauri.conf.json  # Window configuration
│       └── Cargo.toml       # Rust dependencies
│
└── 📦 Config
    ├── package.json         # Node dependencies & scripts
    ├── vite.config.ts       # Build configuration
    └── tsconfig.json        # TypeScript settings
```

## 🎨 Customization

### Change App Name
1. Update `tauri.conf.json` → `productName`
2. Update `package.json` → `name`
3. Update window title in `App.tsx`

### Modify Shortcuts
Edit `src-tauri/src/main.rs`:
```rust
.with_shortcut("Shift+CmdOrCtrl+T")? // Your custom shortcut
```

### Adjust Window Size
Edit `tauri.conf.json`:
```json
{
  "width": 520,  // Your preferred width
  "height": 390  // Your preferred height
}
```

### Platform-Specific Styling
- **macOS**: Modify `.macos-window` class in `App.css`
- **Windows**: Adjust inline styles for custom titlebar
- **Cross-platform**: Use platform detection in `App.tsx`

## 🔧 Built-in Features

### Platform Detection
```typescript
const [platform, setPlatform] = useState('');
invoke('get_platform').then((p: unknown) => setPlatform(p as string));
```

### Window Controls
```typescript
const appWindow = Window.getCurrent();
appWindow.minimize();
appWindow.toggleMaximize();
appWindow.close();
```

### Native Effects
- **macOS**: `NSVisualEffectMaterial::Menu` vibrancy
- **Windows**: Acrylic blur with custom opacity
- **Linux**: Backdrop blur effects

## 🎯 Design Philosophy

This boilerplate follows **macOS Human Interface Guidelines** while maintaining cross-platform compatibility:

1. **Native Feel**: Each platform gets appropriate styling
2. **Performance**: Hardware-accelerated effects and minimal React overhead
3. **Accessibility**: Proper focus management and keyboard navigation
4. **Consistency**: Unified codebase with platform-specific adaptations

## 📱 Responsive Behavior

- Adapts to different screen sizes
- Touch-friendly controls on smaller displays
- Maintains aspect ratios and proportions
- Smooth animations with native easing curves

## 🚀 Production Ready

- TypeScript for type safety
- Proper error handling
- Security-focused Tauri configuration
- Optimized build process with Vite
- Cross-platform distribution ready

## 🤝 Contributing

This is a boilerplate template - fork it, customize it, make it yours!

## 📄 License

MIT License - Use freely for personal and commercial projects.

---

**Happy building!** 🚀

*Built with ❤️ using Tauri + React + TypeScript*
