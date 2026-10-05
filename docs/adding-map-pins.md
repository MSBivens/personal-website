# Adding pins to the One For All map

Pins on the map at `/one-for-all` are edited in **Sanity Studio**:
<https://mikeybivs.sanity.studio>. Log in with the account that owns the
"Personal Site" Sanity project. Publish a pin and it appears on the map. There's no code to edit and nothing to deploy.

---

## Pin types

| Type | Icon on the map | Use it for |
|---|---|---|
| **Member** | Agent in a hat, or the member's rank icon | People in the OFA network |
| **Enemy** | Yellow warning sign | Threats and opposing groups |
| **Resource** | Briefcase | Things worth having: treasure, knowledge, supplies |
| **Safe House** | Keys and padlock | Bases and hideouts |
| **Landmark** | Globe with a star | Neutral places worth marking |

The Studio sidebar has one list per type. Use the create button at the top of a list and the new pin starts with that type already selected.

## 1. Create your ranks first

Members need a rank, so set the ranks up before adding members. Go to **Ranks** in the sidebar and create one per rank:

| Field | What to put |
|---|---|
| **Name** | e.g. `Hand` |
| **Order** | Where it sits in the hierarchy. `1` is the highest rank. The pop-up uses this to sort "Direct reports". |
| **Icon** | Upload an image. A square image works best. It's shown as the member's map marker and next to the rank in the pop-up. |

Click **Publish**.

## 2. Get the pin's coordinates

1. Open the map in **placement mode**: <https://www.msbivens.com/one-for-all?place>
2. Zoom in on the spot. The closer you zoom, the more precise the pin will be.
3. Click exactly where the pin should go. The **Placement Mode** box in the top-right shows **X** and **Y**. Use the **Copy** buttons next to them.

You can click again as many times as you like. The box always shows the latest spot.

## 3. Create the pin

| Field | What to put |
|---|---|
| **Name** | Shown in the pop-up's title bar and when hovering the pin. |
| **Type** | Member, Enemy, Resource, Safe House or Landmark. |
| **Location** | The town or region, e.g. `Baldur's Gate`. |
| **Rank** | *Members only.* Pick one of your ranks. |
| **Status** | *Members only.* Active, Compromised or Dead. Compromised and dead members are greyed out on the map. |
| **Reports to** | *Members only.* The member or safe house they report to. This draws a network line on the map. |
| **X**, **Y** | The numbers from placement mode. |
| **Description** | Your notes. Leave a blank line between paragraphs. |

Click **Publish**. Refresh the map and the pin is there. It can take up to a minute to show up.

> **Drafts don't show on the map.** Studio saves your changes as you type, but the map only shows pins (and changes) once you click **Publish**.

## The network lines

Tick **Network lines** in the map's **Legend** box (bottom-left) to draw a line from each member to whoever they report to. Lines from compromised or dead members are dashed. Hover over a line to see who it connects.

In a pop-up, the **Reports to** and **Direct reports** names are links. Click one to fly to that pin.

The Legend's other checkboxes show or hide each pin type. The map remembers your choices on that browser.

## Moving or removing a pin

- **To move a pin:** get new coordinates from placement mode, change **X** and **Y**, and click **Publish**.
- **To remove a pin:** open it, open the menu next to **Publish**, and choose **Delete**. If anyone reports to that pin, Studio won't let you delete it until you change their **Reports to**.
- **To hide a pin without deleting it:** use **Unpublish** from the same menu. It stays in Studio as a draft.

## Troubleshooting

| Problem | Fix |
|---|---|
| A pin doesn't appear | Check that it's **published**, not just saved as a draft. Then refresh the map. |
| A member's line is missing | The pin they report to must also be published. Also check that **Network lines** is ticked and both pin types are shown in the Legend. |
| A member shows the plain agent icon | Their rank has no icon, or they have no rank. |
| An **Error** pop-up saying *Map data could not be loaded* | Sanity didn't answer. Try again in a minute. If the site has moved to a new address, add it under **API → CORS origins** at <https://www.sanity.io/manage/project/ohnkcmr7>. |

## Good to know

- The page is hidden but **not private**. The Sanity dataset is public so the map can read it. Anyone who finds the link can read every published pin, so keep anything players shouldn't see out of the descriptions.
- Placement mode works on the live site. You don't need to run anything on your computer to add pins.
- The Studio's code lives in [`studio/`](../studio/). Run `npm run dev` there to try schema changes locally (at `http://localhost:3333`), and `npx sanity deploy` to update the hosted Studio.
