// @ts-check
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { yamux } from '@chainsafe/libp2p-yamux'
import { pipe } from 'it-pipe'

export async function dial(maddr, protocolId, data) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(5000)

  const pstream = await peer.dialProtocol(maddr, protocolId, {
    signal,
  })
  const result = await pipe(data, pstream, async (source) => source)

  let answer = []
  for await (const d of result) {
    answer.push(d)
  }
  return answer

}

export async function respond(protocolId) {
  const peer = await createPeer()
  peer.handle(protocolId, ({ stream }) =>  {
    pipe(stream, stream)
  })

  return peer.getMultiaddrs()
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
