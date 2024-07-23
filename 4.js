// @ts-check
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { yamux } from '@chainsafe/libp2p-yamux'
// import { pipe } from 'it-pipe'
import { byteStream } from 'it-byte-stream'


export default async function challenge(maddr, protocolId) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(5000)

  const pstream = await peer.dialProtocol(maddr, protocolId, {
    signal,
  })

  const bstream = byteStream(pstream)

  const byte = await bstream.read(1, { signal })
  const number = byte.get(0)

  await bstream.write(new Uint8Array(number))

  await pstream.close({signal})
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
