# Adding pins to the One For All map

Pins on the map at `/one-for-all` are edited in **Sanity Studio**:
<https://mikeybivs.sanity.studio>. Log in with the account that owns the
"Personal Site" Sanity project. Publish a pin and it appears on the map. There's no code to edit and nothing to deploy.

---

## What's in the Studio

| Sidebar | What it holds |
|---|---|
| **Pins** | Every record, in one list per Pin Type plus **All pins**. Use the create button at the top of a type's list and the new pin starts with that type (and its first status) already chosen. |
| **Locations** | Towns and regions. A pin's Location is picked from this list. |
| **Party Members** | The player characters. |
| **Settings → Pin Types** | Each type's name, plural, icon and position in the legend. Add a new type here and it gets its own list and legend entry, no code needed. |
| **Settings → Statuses** | Each type's statuses and how they look on the map (Normal, Dimmed or Faded). |
| **Settings → Ranks** | Member ranks and their icons. |

The starting types are Member, Enemy, Resource, Safe House, Landmark, NPC, Soul Item, Rumor, World Event, Dungeon, Quest and Post Office, with Win98 placeholder icons you can replace. Those twelve can be renamed but not deleted, because the map's code relies on them. Post Offices never appear on the map; they're waypoints for communication lines.

**Which icon a pin shows:** its own **Icon override** if it has one, then (for members) its rank's icon, then its type's icon. If none of those is set, the map shows a red question mark.

## 1. Create your ranks first

Members need a rank, so set the ranks up before adding members. Go to **Settings → Ranks** and create one per rank:

| Field | What to put |
|---|---|
| **Name** | e.g. `Hand` |
| **Order** | Where it sits in the hierarchy. `1` is the highest rank. The pop-up uses this to sort "Direct reports". |
| **Icon** | Upload an image. A square image works best. It's shown as the member's map marker and next to the rank in the pop-up. |

Click **Publish**.

## 2. Get the pin's coordinates

1. Open the map (<https://www.msbivens.com/one-for-all>) and click **Locate** in the toolbar above it.
2. Zoom in on the spot. The closer you zoom, the more precise the pin will be.
3. Click exactly where the pin should go. A red crosshair marks the spot, and the **Locate** box in the top-right shows text like `X: 3503, Y: 2618`. Add a note if you like (it goes in front of the coordinates), then click **Copy**.
4. Click **Locate** again, the box's **X**, or press Esc to go back to browsing.

You can click again as many times as you like. The box always shows the latest spot. While Locate is on, clicking a pin moves the crosshair instead of opening the pin.

Players can do this too, so they can send you a spot. The old `?place` link still works and opens the map with Locate already on.

## 3. Create the pin

| Field | What to put |
|---|---|
| **Name** | Shown in the pop-up's title bar and when hovering the pin. |
| **Type** | One of your Pin Types. |
| **Location** | *Optional.* Pick a town or region from your Locations, or create one from the field. |
| **Status** | One of that type's statuses, e.g. a Member is Active, Compromised or Dead. Statuses with a Dimmed or Faded map style grey the pin out. |
| **Rank** | *Members only.* Pick one of your ranks. |
| **Reports to** | *Members only.* The member or safe house they report to. This draws a network line on the map. |
| **Icon override** | *Optional.* An icon for this pin only. |
| **X**, **Y** | The numbers from **Locate**. |
| **Description** | Your notes. Leave a blank line between paragraphs. |

Click **Publish**. Refresh the map and the pin is there. It can take up to a minute to show up.

> **Drafts don't show on the map.** Studio saves your changes as you type, but the map only shows pins (and changes) once you click **Publish**.

## The network lines

Tick **Network lines** in the map's **Legend** box (bottom-left) to draw a line from each member to whoever they report to. Lines from members whose status is Dimmed or Faded (e.g. Compromised or Dead) are dashed. Hover over a line to see who it connects.

In a pop-up, the **Reports to** and **Direct reports** names are links. Click one to fly to that pin.

The Legend's other checkboxes show or hide each pin type. The map remembers your choices on that browser.

## Moving or removing a pin

- **To move a pin:** get new coordinates with **Locate**, change **X** and **Y**, and click **Publish**.
- **To remove a pin:** open it, open the menu next to **Publish**, and choose **Delete**. If anyone reports to that pin, Studio won't let you delete it until you change their **Reports to**.
- **To hide a pin without deleting it:** use **Unpublish** from the same menu. It stays in Studio as a draft.

## Troubleshooting

| Problem | Fix |
|---|---|
| A pin doesn't appear | Check that it's **published**, not just saved as a draft. Then refresh the map. |
| A member's line is missing | The pin they report to must also be published. Also check that **Network lines** is ticked and both pin types are shown in the Legend. |
| A member shows the plain Member icon | Their rank has no icon, or they have no rank. |
| A pin shows a red question mark | Neither the pin, its rank nor its Pin Type has an icon. Add one under **Settings → Pin Types**. |
| An **Error** pop-up saying *Map data could not be loaded* | Sanity didn't answer. Try again in a minute. If the site has moved to a new address, add it under **API → CORS origins** at <https://www.sanity.io/manage/project/ohnkcmr7>. |

## Good to know

- The page is hidden but **not private**. The Sanity dataset is public so the map can read it. Anyone who finds the link can read every published record. To keep something secret from players, leave it as an **unpublished draft**: drafts aren't public.
- **Locate** works on the live site. You don't need to run anything on your computer to add pins.
- The Studio's code lives in [`studio/`](../studio/). Run `npm run dev` there to try changes locally at `http://localhost:3333`. **The local Studio edits a test copy of the data (the `development` dataset), not the live map**, so it's safe to experiment. `npx sanity deploy` updates the hosted Studio, which edits the real data.
