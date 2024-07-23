// @ts-check
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { yamux } from '@chainsafe/libp2p-yamux'
import { lpStream } from 'it-length-prefixed-stream'
import cbor from 'cbor'


export default async function challengelps(maddr, protocolId) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(5000)

  const pstream = await peer.dialProtocol(maddr, protocolId, {
    signal,
  })

  const bstream = lpStream(pstream)

  const bytes = await bstream.read({ signal })

  const obj = cbor.decode(bytes.slice())
  const answer = obj.challenge.split("").reverse().join("");

  const resp = cbor.encode({
    type: "RESPONSE",
    answer
  })

  await bstream.write(resp)

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