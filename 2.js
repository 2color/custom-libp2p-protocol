// @ts-check
import filter from 'it-filter'
import map from 'it-map'
import { pipe } from 'it-pipe'

export default async function (stream) {
  return pipe(
    stream,
    (source) => filter(source, (n) => {
      return (typeof n === 'number' && n < 5)
    }),
    (source) => map(source, (n) =>  (n * 2)),
    stream
  )
  
}
