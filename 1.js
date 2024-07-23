import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { yamux } from '@chainsafe/libp2p-yamux'

export default async function (maddr) {
  const node = await createLibp2p({
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
  console.info('My node id:', node.peerId.toString())

  node.dial(maddr)
}
