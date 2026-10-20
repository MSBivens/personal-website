import type {ArrayRule, NumberRule, TextRule} from 'sanity'
import {API_VERSION, TYPE_IDS, publishedId} from './ids'

// Yellow warnings that point out likely slips. They never stop you publishing.

type Doc = {
  _id?: string
  _type?: string
  x?: number
  y?: number
  type?: {_ref?: string}
  location?: {_ref?: string}
  reportsTo?: {_ref?: string}
  questGiver?: {_ref?: string}
  connections?: {to?: {_ref?: string}}[]
}

const ON_TOP_PX = 10

/** On X: this record's own position sits on top of another record or Location. */
export const overlapWarning = (rule: NumberRule) =>
  rule
    .custom(async (_value, context) => {
      const doc = context.document as Doc | undefined
      if (!doc || doc.x === undefined || doc.y === undefined) return true
      if (doc.type?._ref === TYPE_IDS.postOffice) return true // waypoints often sit on a town
      const others = await context
        .getClient({apiVersion: API_VERSION})
        .withConfig({perspective: 'published'})
        .fetch<{_id: string; _type: string; name?: string; x: number; y: number}[]>(
          `*[(_type == "location" || (_type == "pin" && type._ref != $postOffice))
             && defined(x) && defined(y) && _id != $id]{_id, _type, name, x, y}`,
          {id: publishedId(doc._id ?? ''), postOffice: TYPE_IDS.postOffice},
        )
      const near = others.find((other) => Math.hypot(other.x - doc.x!, other.y - doc.y!) <= ON_TOP_PX)
      if (!near) return true
      const name = near.name ?? 'another record'
      if (near._type === 'location' && doc._type === 'pin') {
        return `This is on top of ${name}. If it's there, pick ${name} as its Location and leave X and Y empty.`
      }
      return `This is on top of ${name}. If they're at the same place, give both the same Location instead of their own positions.`
    })
    .warning()

/** On Details: every row is empty, so nothing shows on the map. */
export const emptyDetailsWarning = (rule: ArrayRule<unknown[]>) =>
  rule
    .custom((rows) => {
      const list = (rows ?? []) as {value?: string}[]
      return list.length && list.every((row) => !row.value?.trim())
        ? "These Details rows are all empty, so none of them show on the map. Fill them in or remove them."
        : true
    })
    .warning()

const straighten = (text: string) => text.replace(/[’‘]/g, "'")
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const mentions = (text: string, name: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${escape(straighten(name).trim())}($|[^\\p{L}\\p{N}])`, 'iu').test(text)

/** On Description: it names another record that this one isn't linked to. */
export const mentionWarning = (rule: TextRule) =>
  rule
    .custom(async (value, context) => {
      const doc = context.document as Doc | undefined
      if (!value || !doc?._id) return true
      const id = publishedId(doc._id)
      const {records, linkedFrom} = await context
        .getClient({apiVersion: API_VERSION})
        .withConfig({perspective: 'published'})
        .fetch<{records: {_id: string; name?: string}[]; linkedFrom: string[]}>(
          `{
            "records": *[(_type == "location" || (_type == "pin" && type._ref != $postOffice)) && _id != $id]{_id, name},
            "linkedFrom": *[references($id)]._id
          }`,
          {id, postOffice: TYPE_IDS.postOffice},
        )
      // Linked either way: this record points at it, or it points at this record.
      const linked = new Set([
        doc.location?._ref,
        doc.reportsTo?._ref,
        doc.questGiver?._ref,
        ...(doc.connections ?? []).map((connection) => connection.to?._ref),
        ...linkedFrom.map(publishedId),
      ])
      const text = straighten(value)
      const named = records.filter(
        (record) =>
          record.name &&
          record.name.replace(/[^\p{L}\p{N}]/gu, '').length >= 4 &&
          !linked.has(record._id) &&
          mentions(text, record.name),
      )
      if (!named.length) return true
      const names = named.slice(0, 3).map((record) => record.name)
      const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
      return `Mentions ${list}${named.length > 3 ? ' and others' : ''}, but isn't linked to ${named.length > 1 ? 'them' : 'it'}. Add a Connection (or Location, Reports to…) so players can click through.`
    })
    .warning()
