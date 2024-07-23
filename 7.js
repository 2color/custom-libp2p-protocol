// @ts-check
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { yamux } from '@chainsafe/libp2p-yamux'
import { pipe } from 'it-pipe'
import { rpc } from 'it-rpc'
import all from 'it-all'

export async function finder(protocolId) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(1000)

  peer.handle(protocolId, ({ stream }) => {
    const rpcHandler = rpc()
    pipe(stream, rpcHandler, stream)

    const resolver = rpcHandler.createClient('resolver')

    const finder = {
      async *findValues(options) {
        for (let i = 0; i < options.count; i++) {
          options.onProgress('foundValue')
          const key = Math.random().toString()
          const value = await resolver.resolveValue(key)
          yield {
            key,
            value,
          }
        }
      },
    }

    rpcHandler.createTarget('finder', finder)
  })

  return peer.getMultiaddrs()[0]
}

export async function resolver(maddr, protocolId) {
  const peer = await createPeer()
  const signal = AbortSignal.timeout(1000)
  const stream = await peer.dialProtocol(maddr, protocolId, { signal })

  const rpcHandler = rpc()
  pipe(stream, rpcHandler, stream)

  const finder = rpcHandler.createClient('finder')

  const resolver = {
    async resolveValue(key) {
      return `value-for-${key}`
    },
  }
  rpcHandler.createTarget('resolver', resolver)

  const events = []
  const values = await all(finder.findValues({ count: 10, onProgress: (evt) => events.push(evt) }))

  await stream.close()

  return {
    events,
    values
  }
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
