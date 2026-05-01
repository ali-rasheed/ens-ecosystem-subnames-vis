# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the Vite app under `src/`** (`App.jsx`, `SubnameDiagram.jsx`, `ControlsPanel.jsx`, `ShaderCanvas.jsx`, `index.css`) — that is the maintained implementation. Match behavior and visuals from there when extending the app.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the implementation

The shipped UI lives in **React + Vite** under `src/`. When changing layout or visuals, read the relevant components and CSS there and keep the result consistent with the existing ENS palette and typography tokens.

## Bundle contents

- `subname-visualizer/README.md` — this file
- `subname-visualizer/src/` — React + Vite application source
# ens-ecosystem-subnames-vis
