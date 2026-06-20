# TacticBoard — Football Tactics Board ⚽

A web app to design, draw and **experiment with 11v11 football tactics**:
drag players, draw runs / passes, pick formations and save your setups.

## ✨ Features

- **Drag & drop players** freely on the pitch (mouse & touch).
- **Draw tactics**: runs (straight arrow), passes (straight dashed arrow), free draw — multiple colors.
- **Formation presets**: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2, 4-1-2-1-2.
- **Opponent team** (red) toggle to set up match-ups.
- Draggable **ball**, toggle **shirt number** or **position** labels.
- **Save / open** multiple tactics (localStorage) + **export / import** JSON files.
- **Server sync**: save/load tactics through an API (`/api/tactics`).
- **Autosave** of the current board, restored on reload.
- **Dark, modern** UI, responsive (desktop & mobile).

## 🛠 Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| UI pattern | class-variance-authority + clsx + tailwind-merge |
| Icons | lucide-react |
| State | Zustand |
| Font | Geist |

## 🚀 Run the project

```bash
npm install      # install (first time)
npm run dev      # development → http://localhost:3000
npm run build    # production build
npm start        # run the production build
```

## 📁 Structure

```
app/
  layout.tsx            # root layout + Geist font
  page.tsx             # main page
  globals.css          # Tailwind v4 theme
  api/tactics/route.ts # save/load tactics API (data/tactics.json)
components/
  App.tsx              # layout + autosave
  TacticsBoard.tsx     # SVG pitch: drag & drop, arrow drawing
  Pitch.tsx            # 11v11 pitch markings
  Sidebar.tsx          # control panel
  ui/Button.tsx        # variant button
lib/
  store.ts             # Zustand store
  formations.ts        # formation presets
  storage.ts           # localStorage + API calls
  types.ts             # data types
```

## 💡 Quick start

1. Pick the **home Formation** in the sidebar.
2. **Move** tool → drag players / the ball where you want them.
3. Pick **Run / Pass / Free draw** + a color → drag on the pitch to draw.
4. **Erase** → click a stroke to remove it; **Undo** to drop the last stroke.
5. Name it and **Save** — reopen anytime or **Export** to share.
