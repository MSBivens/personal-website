import {connection} from './connection'
import {location} from './location'
import {partyMember} from './partyMember'
import {pin} from './pin'
import {pinStatus} from './pinStatus'
import {pinType} from './pinType'
import {rank} from './rank'
import {relationshipType} from './relationshipType'

export const schemaTypes = [
  pin,
  location,
  partyMember,
  pinType,
  pinStatus,
  rank,
  relationshipType,
  connection,
]
