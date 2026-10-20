# Editing the One For All map

Everything on the campaign map at `/one-for-all` (pins, Locations and the lines between them) is edited in **Sanity Studio**:
<https://mikeybivs.sanity.studio>. Log in with the account that owns the
"Personal Site" Sanity project. Publish a change and it appears on the map. There's no code to edit and nothing to deploy.

---

## What's in the Studio

| Sidebar | What it holds |
|---|---|
| **Pins** | Every record, in one list per Pin Type plus **All pins**. Use the create button at the top of a type's list and the new pin starts with that type (and its first status) already chosen. |
| **Locations** | Named places, from cities and regions down to a single lair. A pin's Location is picked from this list, and the pin sits at the Location's spot. |
| **Party Members** | The player characters. Members link to them (**Recruited By**) and so do Soul Items; each party member's page shows their Soul Item. |
| **Settings → Campaign Settings** | Which pin is the party, and the party's trail. See *The party* below. |
| **Settings → Pin Types** | Each type's name, plural, icon, position in the legend, and **Suggested details** (the Details rows a new pin of that type starts with). Add a new type here and it gets its own list and legend entry, no code needed. |
| **Settings → Statuses** | Each type's statuses and how they look on the map (Normal, Dimmed or Faded). The first one (lowest **Order**) is the default for new pins. |
| **Settings → Ranks** | Member ranks and their icons. |
| **Settings → Relationship Types** | The kinds of lines you can draw between records, and how each looks. See *Relationship lines* below. |

The starting types are Member, Enemy, Resource, Safe House, Landmark, NPC, Soul Item, Rumor, World Event, Dungeon, Quest and Post Office, with Win98 placeholder icons you can replace. Those twelve can be renamed but not deleted, because the map's code relies on them. Post Offices never appear on the map; they're waypoints for communication lines.

**Which icon a pin shows:** its own **Icon override** if it has one, then (for members) its rank's icon, then its type's icon. If none of those is set, the map shows a red question mark.

## 1. Create your ranks first

Members need a rank, so set the ranks up before adding members. Go to **Settings → Ranks** and create one per rank:

| Field | What to put |
|---|---|
| **Name** | e.g. `Hand` |
| **Order** | Where it sits in the hierarchy. `1` is the highest rank. The panel uses this to sort "Direct reports". |
| **Icon** | Upload an image. A square image works best. It's shown as the member's map marker and next to the rank in the panel. |

Click **Publish**.

## 2. Get coordinates (only when you need them)

Most pins don't need coordinates: a pin with a **Location** sits at that Location's spot. You only need X/Y for a Location itself, or for a pin somewhere specific away from its Location (a dungeon in the hills outside town).

1. Open the map (<https://www.msbivens.com/one-for-all>) and click **Locate** in the toolbar above it.
2. Zoom in on the spot. The closer you zoom, the more precise the pin will be.
3. Click exactly where the pin should go. A red crosshair marks the spot, and the **Locate** box in the top-right shows text like `X: 1490, Y: 1196`. Add a note if you like (it goes in front of the coordinates), then click **Copy**.
4. Click **Locate** again, the box's **X**, or press Esc to go back to browsing.

You can click again as many times as you like. The box always shows the latest spot. While Locate is on, clicking a pin moves the crosshair instead of opening the pin.

Players can do this too, so they can send you a spot. The old `?place` link still works and opens the map with Locate already on.

## 3. Create the pin

| Field | What to put |
|---|---|
| **Name** | Shown in the panel's title bar and when hovering the pin. |
| **Type** | One of your Pin Types. |
| **Location** | The town, region or place it's at. The pin sits at the Location's spot unless you give it its own position. Pick one from your Locations, or create one from the field. |
| **Show on map** | On by default. Untick it to keep the pin off the map (it's still public; see *Good to know*). |
| **Status** | One of that type's statuses, e.g. a Member is Active, Compromised or Dead. Statuses with a Dimmed or Faded map style grey the pin out. |
| **Rank** | *Members only.* Pick one of your ranks. |
| **Reports to** | *Members only.* The member or safe house they report to. This draws a network line on the map. |
| **Recruited By** | *Members only.* The party members who recruited them. Pick one or more. |
| **Party member** | *Soul Items only.* Whose Soul Item it is. Each party member can have only one. |
| **Attitude** | *NPCs only.* Friendly, Neutral, Hostile or Unknown. |
| **Quest giver** | *Quests only.* The NPC or member who gave it. Shown as a link in the panel. |
| **Icon override** | *Optional.* An icon for this pin only. |
| **Details** | Short labelled facts shown as rows in the panel, e.g. *Reward: 500 gp*. A new pin starts with its type's suggested rows (a Quest gets Reward and Objectives); add, rename or remove rows freely. Rows left empty aren't shown. |
| **Own position** (**X**, **Y**) | *Optional.* Leave empty to use the Location's spot. Fill in both (from **Locate**) for a spot of its own. A pin on the map needs one or the other: Studio tells you if it has neither. |
| **Description** | Your notes. Leave a blank line between paragraphs. |

Click **Publish**. Refresh the map and the pin is there. It can take up to a minute to show up.

> **Drafts don't show on the map.** Studio saves your changes as you type, but the map only shows pins (and changes) once you click **Publish**.

## Locations and crowded spots

A **Location** is any named place: a city, a region, or something as small as a dragon's lair. Each has:

| Field | What to put |
|---|---|
| **Name** | Must be unique. |
| **Map position** (**X**, **Y**) | Where its pins sit. Leave empty for a region with no single spot; its pins then need their own position. |
| **Map icon** | *Optional.* Shown on its marker. Without one, a folder. |
| **Description** | Shown in its panel. |
| **Details** | Short facts about the place, shown as rows in its panel, e.g. *Restorative pool: heals once per long rest*. Use these for things that don't need a pin of their own. |
| **Connections** | Lines from this place (see *Relationship lines*). |

How Locations appear on the map, with no settings to manage:
- **Two or more pins at a Location's spot** are shown as one Location marker (its icon, with a badge counting what's there). Click it to open its panel.
- **One pin at a Location's spot** is shown as itself.
- **A Location with nothing at it yet** gets a plain marker if it has a description, Details or Connections, so it can still be found.
- **Pins with their own position** always have their own marker.

When zoomed out, markers that are close together merge into a grey numbered box. Click it to zoom in. Markers on exactly the same spot fan out when you click them.

A Location's panel shows its description and Details, then every pin at that Location grouped by type. Click any pin to show it. In a pin's panel, the **Location** name is a link to that Location.

**Rule of thumb:** give something its own pin if it has a status, links to other records, or players will want to search for it. Otherwise, a Details row on its Location is enough.

## The party

The map opens on the party, zoomed in far enough to read place names, and the **Party** button in the toolbar flies back there. The party pin has a ring around it, sits above everything else, and is never merged into a Location marker or a numbered box.

**Which pin is the party:** set **Party pin** under **Settings → Campaign Settings**.

**Moving the party:** change the party pin's **Location** or **X/Y** and click **Publish**. Its old spot is added to the end of the **Trail** automatically, dated today, so you don't need to do anything else.

**The trail** is the list under **Settings → Campaign Settings → Trail**, oldest first. The map draws a dotted line through the stops to the party pin, with a dot at each stop; hovering a dot shows its date and note. You can edit it freely:
- **Add past stops by hand** to fill in where the party has been: click **Add item**, pick a **Location** (or fill in **X** and **Y** for a spot that isn't one), and add a **Date** (free text, e.g. *Session 4*) and an optional **Note**.
- **Drag** stops to put them in order. The line follows the list order.
- **Edit or delete** any stop, including the ones added automatically.

Stops added automatically show straight away. After editing the list yourself, publish Campaign Settings. Players can hide the trail with **Party trail** in the Legend.

**Where they're heading:** add a **Travel Destination** connection from the party pin to the place (see *Relationship lines*). It's drawn as an arrow.

## The record panel

Clicking a marker (or a search result, a Records row, or a link) opens that pin or Location in a panel docked on the right of the map; on a phone it's a sheet along the bottom (**▲** makes it taller). The map stays usable around it, and the marker it belongs to gets a yellow ring.

- Names in the panel (Location, Reports to, Quest giver, Connections, lists) are links: click one to fly there and show it in the panel.
- **◀ Back** and **Forward ▶** step through what you've opened, like a browser.
- **Also at …** lists the other pins at the same Location, and **Mentioned in** lists records whose description or Details mention this one by name.
- **Copy link** copies a link straight to this record. **X** or Esc closes the panel.

## Finding things

- **Find** (top-right of the toolbar, or press **/**): type part of a name, or a word from a record's Location, Details, status or description. Pick a result with the mouse or the arrow keys and Enter. The map flies to it, zooming in past any numbered box, and opens it.
- **Records** (toolbar): every pin and Location in one table. Click a column heading to sort (click **Added** for newest first), narrow it with **Type** and **Status**, and click a name to go to it.
- **Names on the map** appear under the markers once you zoom in far enough.
- **Links to a record:** opening a pin or Location puts its name in the address bar (e.g. `…/one-for-all#jenna`), and **Copy link** in its panel copies that link. Anyone who opens it lands on that record. Renaming a record changes its link; two records with the same name get `-2`, `-3` and so on.

## The network lines

Tick **Network lines** in the **Lines** section of the map's **Legend** box (bottom-left) to draw a line from each member to whoever they report to. Lines from members whose status is Dimmed or Faded (e.g. Compromised or Dead) are dashed. Hover over a line to see who it connects.

In a panel, the **Reports to** and **Direct reports** names are links. Click one to fly to that pin.

## Relationship lines

Besides who-reports-to-whom, you can draw any relationship between two records, for example an NPC's tie to a Dungeon, or the route a member's letters take.

**1. Set up the kinds of line** under **Settings → Relationship Types**. Two starters exist (*Communication* and *Significant tie*); change or delete them freely. Each type has:

| Field | Options |
|---|---|
| **Colour** | One of ten colours chosen to stay readable on the map. (Navy is kept for the network lines.) |
| **Pattern** | Solid, Dashed, Dotted, Dash-dot or Long dash. |
| **Width** | Thin, Normal or Thick. |
| **Direction** | None, **Arrow** (an arrowhead at the far end) or **Flowing** (the line animates toward the far end). |
| **Shape** | Straight or Curved. |
| **Shown by default** | Whether it's ticked in the legend the first time someone opens the map. |

**2. Add the connection** on the record it starts from (pins and Locations both have a **Connections** list):

| Field | What to put |
|---|---|
| **Relationship** | One of your Relationship Types. |
| **To** | Any pin or Location. |
| **Via** | *Optional.* Post Offices the line passes through, in order. Use this for letter routes: the line goes from the sender through each Post Office to the recipient. |
| **Label** | *Optional.* Shown when hovering the line. |
| **Notes** | *Optional.* Shown with the connection in panels. |

A record can have as many connections as you like. Each one shows in **both ends'** panels (→ on the record it's on, ← on the other end), and the names there are links.

How lines are placed:
- A line starts and ends at whatever is drawn for that record: its own marker, its Location's marker, or the numbered box it's merged into when zoomed out. Zoom in and the lines follow.
- Lines between two pins at the **same Location's spot** would have no length, so they're listed in the Location's panel under **Lines here** instead.
- A line to a **Location** ends at its marker, or at its **X/Y** (no X/Y, no line; it's still listed in panels).
- Connections to unpublished records, or to pins with **Show on map** off, aren't drawn or listed.
- When several lines join the same two points they're bowed apart automatically, so they don't sit on top of each other.

## The legend

The **Legend** (bottom-left) has two sections, each with **All** / **None** buttons and a ▾ to fold it away:
- **Pins** shows or hides each pin type, plus **Other places** (Locations with nothing at them yet) when there are any. Location markers and numbered boxes only count what's ticked.
- **Lines** shows or hides the party's trail, the network lines and each relationship type. A line only shows when the pins at both ends are shown too.

The legend only affects the map: the record panel always lists everything. The map remembers your choices on that browser. On a phone the legend starts minimised.

## Moving or removing a pin

- **To move a pin:** change its **Location**, or get new coordinates with **Locate** and change **X** and **Y**. Click **Publish**.
- **To remove a pin:** open it, open the menu next to **Publish**, and choose **Delete**. If another record links to it (a **Reports to**, a connection, a **Quest giver**…), Studio lists those records and won't delete it until you remove the links.
- **To hide a pin without deleting it:** use **Unpublish** from the same menu. It stays in Studio as a draft.

## Troubleshooting

| Problem | Fix |
|---|---|
| A pin doesn't appear | Check that it's **published**, not just saved as a draft, that **Show on map** is ticked, and that its type is ticked in the Legend. It may be inside its Location's marker or a numbered box: zoom in or click it. It also needs a position: its own X/Y, or a Location that has one. Then refresh the map. |
| A member's line is missing | The pin they report to must also be published. Also check that **Network lines** is ticked and both pin types are shown in the Legend. |
| A connection's line is missing | Both ends must be published with **Show on map** ticked, and a Location end needs an X/Y. Check its relationship type and both ends' pin types are ticked in the Legend. If both ends are at the same Location's spot, it's listed in that Location's panel instead. Zoomed out, both ends may be in the same numbered box. |
| A member shows the plain Member icon | Their rank has no icon, or they have no rank. |
| A pin shows a red question mark | Neither the pin, its rank nor its Pin Type has an icon. Add one under **Settings → Pin Types**. |
| An **Error** panel saying *Map data could not be loaded* | Sanity didn't answer. Try again in a minute. If the site has moved to a new address, add it under **API → CORS origins** at <https://www.sanity.io/manage/project/ohnkcmr7>. |

## Good to know

- **Test data:** add `?data=test` to the map's address (e.g. `/one-for-all?data=test`) to see the `development` dataset instead of the real one. The title bar then says *(test data)*.
- The page is hidden but **not private**. The Sanity dataset is public so the map can read it. Anyone who finds the link can read every published record. To keep something secret from players, leave it as an **unpublished draft**: drafts aren't public.
- **Locate** works on the live site. You don't need to run anything on your computer to add pins.
- The Studio's code lives in [`studio/`](../studio/). Run `npm run dev` there to try changes locally at `http://localhost:3333`. **The local Studio edits a test copy of the data (the `development` dataset), not the live map**, so it's safe to experiment. `npx sanity deploy` updates the hosted Studio, which edits the real data.
