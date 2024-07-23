// @ts-check
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { yamux } from '@chainsafe/libp2p-yamux'
import { lpStream } from 'it-length-prefixed-stream'
import * as lp from 'it-length-prefixed'
import { pipe } from 'it-pipe'


export async function challengelps(maddr, protocolId) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(5000)

  const pstream = await peer.dialProtocol(maddr, protocolId, {
    signal,
  })

  const bstream = lpStream(pstream)

  const bytes = await bstream.read({ signal })

  const number = parseVarint(bytes.slice())
  console.log(number)

  await bstream.write(new Uint8Array(number))

  await pstream.close({ signal })
}

export default async function challengelp(maddr, protocolId) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(10000)

  const pstream = await peer.dialProtocol(maddr, protocolId, {
    signal,
  })

  await pipe(
    pstream,
    lp.decode,
    async function * (source) {
      for await (const chunk of source) {
        yield new Uint8Array(parseVarint(chunk.subarray()))
      }
    },
    lp.encode,
    pstream
  )

  await pstream.close({ signal })
}

async function createPeer() {
  return createLibp2p({
    addresses: {
      listen: [
        // listen on a random port and accept incoming connections from any host
        '/ip4/0.0.0.0/tcp/0',
      ],
    },
    transports: [tcp()],
    connectionEncryption: [tls()],
    streamMuxers: [yamux()],
  })
}


function parseVarint(bytes) {
  let result = 0
  let shift = 0
  for (const byte of bytes) {
    result |= (byte & 0b0111_1111) << shift
    
    if ((byte & 0b1000_0000) === 0) {
      // If it is 0 then we should take all previous bytes, remove the msb and interpret what's left as the number
      return result
    }

    // If the most significant bit (msb) in the byte is 1 then the subsequent byte is also part of the varint
    shift += 7 // shift by another whole bit group (7 buts) because bit groups are reversed
  }
  return result
}