import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "scripts/ui-default.png" });

const board = page.locator(".board");
const box = await board.boundingBox();
const at = (fx, fy) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });

// Draw a run by dragging, which selects it and shows handles.
await page.getByRole("button", { name: "Run" }).click();
const a = at(0.5, 0.58);
const b = at(0.72, 0.4);
await page.mouse.move(a.x, a.y);
await page.mouse.down();
await page.mouse.move(b.x, b.y, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/ui-selected.png" });

// Grab the end handle and drag it (without releasing) to show the active state.
await page.mouse.move(b.x, b.y);
await page.mouse.down();
await page.mouse.move(at(0.78, 0.32).x, at(0.78, 0.32).y, { steps: 8 });
await page.waitForTimeout(150);
await page.screenshot({ path: "scripts/ui-drag.png" });
await page.mouse.up();

await browser.close();
console.log("done");
