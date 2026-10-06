# Editing the One For All map

Everything on the campaign map at `/one-for-all` (pins, Hubs and the lines between them) is edited in **Sanity Studio**:
<https://mikeybivs.sanity.studio>. Log in with the account that owns the
"Personal Site" Sanity project. Publish a change and it appears on the map. There's no code to edit and nothing to deploy.

---

## What's in the Studio

| Sidebar | What it holds |
|---|---|
| **Pins** | Every record, in one list per Pin Type plus **All pins**. Use the create button at the top of a type's list and the new pin starts with that type (and its first status) already chosen. |
| **Locations** | Towns and regions. A pin's Location is picked from this list. |
| **Party Members** | The player characters. Members link to them (**Recruited By**) and so do Soul Items; each party member's page shows their Soul Item. |
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
| **Order** | Where it sits in the hierarchy. `1` is the highest rank. The pop-up uses this to sort "Direct reports". |
| **Icon** | Upload an image. A square image works best. It's shown as the member's map marker and next to the rank in the pop-up. |

Click **Publish**.

## 2. Get the pin's coordinates

1. Open the map (<https://www.msbivens.com/one-for-all>) and click **Locate** in the toolbar above it.
2. Zoom in on the spot. The closer you zoom, the more precise the pin will be.
3. Click exactly where the pin should go. A red crosshair marks the spot, and the **Locate** box in the top-right shows text like `X: 1490, Y: 1196`. Add a note if you like (it goes in front of the coordinates), then click **Copy**.
4. Click **Locate** again, the box's **X**, or press Esc to go back to browsing.

You can click again as many times as you like. The box always shows the latest spot. While Locate is on, clicking a pin moves the crosshair instead of opening the pin.

Players can do this too, so they can send you a spot. The old `?place` link still works and opens the map with Locate already on.

## 3. Create the pin

| Field | What to put |
|---|---|
| **Name** | Shown in the pop-up's title bar and when hovering the pin. |
| **Type** | One of your Pin Types. |
| **Location** | *Optional.* Pick a town or region from your Locations, or create one from the field. |
| **Map Visibility** | **Map Pin** (its own marker), **Attached to Location** (shown only inside its Location's Hub; see below) or **Hidden** (kept off the map). |
| **Status** | One of that type's statuses, e.g. a Member is Active, Compromised or Dead. Statuses with a Dimmed or Faded map style grey the pin out. |
| **Rank** | *Members only.* Pick one of your ranks. |
| **Reports to** | *Members only.* The member or safe house they report to. This draws a network line on the map. |
| **Recruited By** | *Members only.* The party members who recruited them. Pick one or more. |
| **Party member** | *Soul Items only.* Whose Soul Item it is. Each party member can have only one. |
| **Attitude** | *NPCs only.* Friendly, Neutral, Hostile or Unknown. |
| **Quest giver** | *Quests only.* The NPC or member who gave it. Shown as a link in the pop-up. |
| **Icon override** | *Optional.* An icon for this pin only. |
| **Details** | Short labelled facts shown as rows in the pop-up, e.g. *Reward: 500 gp*. A new pin starts with its type's suggested rows (a Quest gets Reward and Objectives); add, rename or remove rows freely. Rows left empty aren't shown. |
| **X**, **Y** | The numbers from **Locate**. Only asked for on Map Pins (and Post Offices). |
| **Description** | Your notes. Leave a blank line between paragraphs. |

Click **Publish**. Refresh the map and the pin is there. It can take up to a minute to show up.

> **Drafts don't show on the map.** Studio saves your changes as you type, but the map only shows pins (and changes) once you click **Publish**.

## Hubs: crowded places

When several pins are too close together to read, turn their Location into a **Hub**: one marker (a folder, with a badge counting what's inside) that opens a panel listing everything there.

1. Open the Location under **Locations**, turn on **Show as Hub**, give it an **X** and **Y** (from **Locate**), and optionally a **Hub icon** and **Description**. Publish.
2. On each pin that belongs there, set **Location** to that place and **Map Visibility** to **Attached to Location**. Publish. The pin's own marker disappears and it shows up in the Hub's panel instead.

The panel lists every pin at that Location, grouped by type. Pins there that are still Map Pins are marked *on map*. Click any of them to open its pop-up, which has a **◀ Back to …** button. In any pop-up, the **Location** name is a link to that Location's panel, Hub or not.

Network lines from attached pins start at their Hub. A line between two pins in the same Hub would have no length, so it's listed in the Hub's panel under **Lines here** instead.

If you turn **Show as Hub** off while pins are attached to it, Studio warns you: those pins won't appear on the map until it's a Hub again or you switch them back to Map Pin.

**Hidden** pins don't appear anywhere on the map, but the data is still public. For real secrets, use unpublished drafts.

## The network lines

Tick **Network lines** in the **Lines** section of the map's **Legend** box (bottom-left) to draw a line from each member to whoever they report to. Lines from members whose status is Dimmed or Faded (e.g. Compromised or Dead) are dashed. Hover over a line to see who it connects.

In a pop-up, the **Reports to** and **Direct reports** names are links. Click one to fly to that pin.

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
| **Notes** | *Optional.* Shown with the connection in pop-ups. |

A record can have as many connections as you like. Each one shows in **both ends'** pop-ups (→ on the record it's on, ← on the other end), and the names there are links.

How lines are placed:
- Lines from a pin **attached to a Hub** start at the Hub. Lines between two pins in the **same Hub** are listed in the Hub's panel under **Lines here** instead.
- A line to a **Location** ends at its Hub, or at the Location's **X/Y** if it isn't a Hub (no X/Y, no line; it's still listed in pop-ups).
- Connections to **Hidden** or unpublished records aren't drawn or listed.
- When several lines join the same two points they're bowed apart automatically, so they don't sit on top of each other.

## The legend

The **Legend** (bottom-left) has two sections, each with **All** / **None** buttons and a ▾ to fold it away:
- **Pins** shows or hides each pin type and the Hubs.
- **Lines** shows or hides the network lines and each relationship type. A line only shows when the pins at both ends are shown too.

The legend only affects the map: pop-ups and Hub panels always list everything. The map remembers your choices on that browser. On a phone the legend starts minimised.

## Moving or removing a pin

- **To move a pin:** get new coordinates with **Locate**, change **X** and **Y**, and click **Publish**.
- **To remove a pin:** open it, open the menu next to **Publish**, and choose **Delete**. If another record links to it (a **Reports to**, a connection, a **Quest giver**…), Studio lists those records and won't delete it until you remove the links.
- **To hide a pin without deleting it:** use **Unpublish** from the same menu. It stays in Studio as a draft.

## Troubleshooting

| Problem | Fix |
|---|---|
| A pin doesn't appear | Check that it's **published**, not just saved as a draft, and that its **Map Visibility** isn't Hidden. If it's Attached, it's inside its Location's Hub (and its Location must be a Hub). Then refresh the map. |
| A member's line is missing | The pin they report to must also be published. Also check that **Network lines** is ticked and both pin types are shown in the Legend. |
| A connection's line is missing | Both ends must be published and not Hidden, and a Location end needs a Hub or an X/Y. Check its relationship type and both ends' pin types are ticked in the Legend. If both ends are in the same Hub, it's listed in the Hub's panel instead. |
| A member shows the plain Member icon | Their rank has no icon, or they have no rank. |
| A pin shows a red question mark | Neither the pin, its rank nor its Pin Type has an icon. Add one under **Settings → Pin Types**. |
| An **Error** pop-up saying *Map data could not be loaded* | Sanity didn't answer. Try again in a minute. If the site has moved to a new address, add it under **API → CORS origins** at <https://www.sanity.io/manage/project/ohnkcmr7>. |

## Good to know

- The page is hidden but **not private**. The Sanity dataset is public so the map can read it. Anyone who finds the link can read every published record. To keep something secret from players, leave it as an **unpublished draft**: drafts aren't public.
- **Locate** works on the live site. You don't need to run anything on your computer to add pins.
- The Studio's code lives in [`studio/`](../studio/). Run `npm run dev` there to try changes locally at `http://localhost:3333`. **The local Studio edits a test copy of the data (the `development` dataset), not the live map**, so it's safe to experiment. `npx sanity deploy` updates the hosted Studio, which edits the real data.
