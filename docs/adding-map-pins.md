# Adding pins to the One For All map

Pins on the map at `/one-for-all` come from a single file:
[`personal_site/one-for-all/pins.json`](../personal_site/one-for-all/pins.json).
Each pin is one entry in that file. Add an entry and a pin appears on the map. Delete it and the pin is gone.

---

## 1. Get the pin's coordinates

1. Open the map in **placement mode** by adding `?place` to the address:
   `https://personal-site-test-eight.vercel.app/one-for-all?place`
2. Zoom in on the spot. The closer you zoom, the more precise the pin will be.
3. Click exactly where the pin should go. A marker appears there, and the
   **Placement Mode** box in the top-right shows the coordinates plus a block of text like this:

   ```json
   {
     "name": "New pin",
     "type": "place",
     "x": 2399,
     "y": 1398,
     "description": [
       "Write your notes here."
     ]
   },
   ```

4. Click **Copy**. If it says *Press Ctrl+C*, the text is already selected, so just press Ctrl+C.

You can click again as many times as you like. The box always shows the latest spot.

## 2. Paste it into `pins.json`

Open `personal_site/one-for-all/pins.json`, either in VS Code or on GitHub (open the file and click the ✏️ pencil icon).

**If this is your first pin**, the file looks like this:

```json
[]
```

Paste your block between the square brackets, then **delete the comma after the closing `}`**:

```json
[
  {
    "name": "Waterdeep",
    "type": "place",
    "x": 2399,
    "y": 1398,
    "description": ["The City of Splendors."]
  }
]
```

**If there are already pins**, paste your block right after the opening `[`. The comma at the end of the copied block then separates it from the pin below:

```json
[
  {
    "name": "My new pin",
    "type": "person",
    "x": 2823,
    "y": 2419,
    "description": ["Notes about this person."]
  },
  {
    "name": "Waterdeep",
    "type": "place",
    "x": 2399,
    "y": 1398,
    "description": ["The City of Splendors."]
  }
]
```

> **The comma rule:** every pin is followed by a comma, *except the last one*.

## 3. Fill in the details

| Field | What to put | Example |
|---|---|---|
| `name` | Shown in the pop-up's title bar and when hovering the pin. | `"Waterdeep"` |
| `type` | One of `"person"`, `"place"` or `"thing"`. Sets the pin's icon. | `"person"` |
| `x`, `y` | The numbers from placement mode. Leave them **without quotes**. | `2399` |
| `description` | Your notes. Each item in the list becomes its own paragraph. | see below |

A description with several paragraphs:

```json
"description": [
  "First paragraph.",
  "Second paragraph.",
  "Third paragraph."
]
```

The icons are an agent in a hat for `person`, a globe with a star for `place`, and a set of keys for `thing`.

## 4. Publish it

- **On GitHub:** after editing in the browser, click **Commit changes** and commit straight to `main`.
- **In VS Code:** commit the change and push to `main`.

Vercel updates the live site about a minute later. Refresh the map to see your pin.

## 5. Check it worked

Open `/one-for-all` and click your pin. If instead you get an **Error** pop-up saying *pins.json could not be loaded*, there's a typo in the file. The message shows a snippet of the text near the problem; see the common mistakes below. Fix the file and publish again.

To check before publishing, VS Code underlines JSON mistakes in red as you type.

### Common mistakes

| Problem | Fix |
|---|---|
| A comma after the **last** pin | Delete it. |
| No comma **between** two pins | Add one after the `}` of the upper pin. |
| Curly quotes (`“ ”`) from Word, Google Docs or a phone | Use plain `"` quotes. Paste notes into VS Code or GitHub, not a word processor. |
| A `"` inside your notes | Write it as `\"`, e.g. `"He called it \"the Relic\"."` Apostrophes (`'`) are fine as-is. |
| Quotes around `x` or `y` | Numbers go without quotes: `"x": 2399`, not `"x": "2399"`. |
| A pin doesn't appear, but there's no error | Check `type` is exactly `person`, `place` or `thing`. |

## Moving or removing a pin

- **To move a pin:** get new coordinates from placement mode and replace its `x` and `y`.
- **To remove a pin:** delete its whole `{ ... }` block. Then check the commas: every pin except the last is followed by one.

## Good to know

- The page is hidden but **not private**. Anyone with the link can view the map and read `pins.json`, so don't put secrets in it.
- Placement mode works on the live site. You don't need to run anything on your computer to add pins.
