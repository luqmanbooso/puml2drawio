# 🚀 PlantUML ➔ Draw.io Studio

> **Native, Client-Side PlantUML to mxGraph Diagram Engine**

**Are you a student struggling with PlantUML generating static, uneditable images?**
> Look, let’s be honest—we're not gonna sit here and act all dramatic telling you to draw every single rectangle, lifeline, and arrow manually in Draw.io. But wouldn't it be so much better if you could write clean, fast PlantUML code and get **actual, native, fully editable Draw.io components** out of it instead of just a flat PNG/SVG image?
> **Well, you're at the right place.** PlantUML ➔ Draw.io Studio bridges that gap instantly right inside your browser.

---

## 🌟 Key Features

* **⚡ 100% Client-Side Engine:** Everything runs locally in your browser. No server calls, no backend queuing, no privacy concerns.
* **📐 7 Native Diagram Types Supported:**
  * **Sequence Diagrams:** Lifelines, activation lifespan bars, autonumbering, notes, and nested group frames (`alt`, `opt`, `loop`, `par`).
  * **Use Case Diagrams:** Actors, system boundaries, and stereotype relationships (`«include»`, `«extend»`).
  * **State Diagrams:** Simple states, choice nodes (`<<choice>>`), scoped initial/final nodes (`[*]`), state actions (`entry /`, `exit /`), and **composite states with concurrent regions (`--`)**.
  * **Class Diagrams:** Multi-compartment attributes and methods with visibility modifiers (`+`, `-`, `#`), inheritance (`<|--`), and composition (`*--`).
  * **Entity Relationship (ER) Diagrams:** Entity tables, primary/foreign key attributes, and cardinality lines.
  * **Component & Deployment Diagrams:** Component nodes, database cylinders, cloud boundaries, and package containers.
* **🎨 Multiple Visual Themes:** Instant one-click theme switching between *Classic Light*, *Dracula Dark*, *AWS Cloud*, *Nord Ice*, and *Monochrome Blueprint*.
* **💻 Monaco Code Editor:** Full code editing experience powered by VS Code's core editor with line numbers, syntax highlighting, and auto-completion.
* **🖼️ Interactive Draw.io Visual Canvas:** Live preview rendering using Draw.io's official viewer engine (`viewer.diagrams.net`).
* **📦 One-Click Exports:** Export directly to `.drawio` files, copy raw `mxGraphModel` XML, or open directly inside diagrams.net.

---

## 🛠️ Tech Stack

| Component | Technology |
| --- | --- |
| **Framework** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 + Lucide React Icons |
| **Code Editor** | `@monaco-editor/react` (Monaco Engine) |
| **Layout Engine** | `dagre` (Graph Layout) + Custom Sequence Timeline Traverser |
| **XML Generation** | `xmlbuilder2` (`mxGraphModel` standard) |
| **Canvas Integration** | HTML5 PostMessage API + Embedded Draw.io Viewer |

---

## 📂 Project Structure

```text
src/
├── builder/
│   └── buildMxGraph.ts       # Converts calculated AST layout to Draw.io mxGraph XML
├── components/
│   ├── Header.tsx            # Top nav with presets, theme selector, & export actions
│   └── PreviewCanvas.tsx     # Split view for embedded Draw.io iframe and XML source
├── core/
│   └── index.ts              # Core entrypoint wrapping parse -> layout -> XML pipeline
├── layout/
│   ├── calculateLayout.ts    # Dagre layout logic (State, Use Case, Class, ER, etc.)
│   └── calculateSequenceLayout.ts # Timeline layout engine for Sequence diagrams
├── parser/
│   └── parsePuml.ts          # Multi-pass regex AST parser for PlantUML definitions
├── themes/
│   └── themeManager.ts       # Color palette definitions for themes
├── presets.ts                # Built-in sample diagrams for quick testing
├── types.ts                  # TypeScript interfaces for AST and Graph nodes
├── App.tsx                   # Main studio workbench grid layout
└── main.tsx                  # Application mount point
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

Make sure you have Node.js (v18 or higher) and `npm` installed.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/plantuml-to-drawio.git
cd plantuml-to-drawio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

---

## 🤝 How to Contribute

Contributions are welcome! If you want to add support for new PlantUML syntax, improve layout algorithms, or refine diagram styling, follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
3. **Commit Your Changes:**
   ```bash
   git commit -m "Add support for PlantUML activity diagrams"
   ```
4. **Push to the Branch:**
   ```bash
   git push origin feature/amazing-new-feature
   ```
5. **Open a Pull Request**

### Contribution Guidelines:

* Ensure pure functions in `parser/` and `layout/` remain side-effect-free.
* Add unit or sample presets in `presets.ts` for any newly supported PlantUML syntax.
* Verify layout stability across both light and dark themes.

---

## 🐛 Seeing Bugs or Want to Request Features?

If you encounter a syntax parsing glitch, layout overlap, or unexpected diagram conversion issue, please open an issue!

### Opening an Issue Instructions:

When creating an issue on GitHub, please include:

1. **Diagram Type:** (e.g., State Diagram, Sequence Diagram, etc.)
2. **PlantUML Input Code:** The exact `@startuml ... @enduml` code that caused the bug.
3. **Expected Behavior:** What the diagram should look like or how nodes should be arranged.
4. **Actual Output / Screenshot:** A screenshot of the visual canvas error or rendering glitch.
5. **Browser & OS:** (e.g., Chrome v124 on Windows 11 / Firefox on macOS).

👉 **[Click here to open a Bug Report or Feature Request](https://github.com/your-username/plantuml-to-drawio/issues/new)**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
