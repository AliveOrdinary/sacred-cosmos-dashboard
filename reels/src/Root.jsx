import React from 'react'
import { Composition } from 'remotion'
import { FPS, W, H } from './theme'
import { ManifestationReel } from './ManifestationReel'
import { ElementsReel } from './ElementsReel'

const TAIL_PAD = 45 // 1.5s hold on the final frame for loop feel

const durationFromLines = ({ props }) => ({
  durationInFrames: Math.max(90, props.lines.reduce((a, l) => a + l.durationInFrames, 0) + TAIL_PAD),
  fps: FPS,
  width: W,
  height: H,
})

// Sample scripts so `npm run studio` works without the render server.
const sampleManifestation = {
  seed: 19,
  dateLabel: '19 JUL',
  ambientSrc: null,
  lines: [
    { kind: 'hook', text: 'Not the exciting one. The boring one.', src: null, durationInFrames: 70 },
    { kind: 'beat', text: 'Pick one commitment you have been half-keeping.', src: null, durationInFrames: 75 },
    { kind: 'beat', text: 'Keep it fully today. No exceptions, no audience.', src: null, durationInFrames: 75 },
    { kind: 'beat', text: 'Boring means you are in the part that counts.', src: null, durationInFrames: 80 },
    { kind: 'cta', text: 'Save this. Tonight, tell yourself you kept it.', src: null, durationInFrames: 80 },
  ],
}

const sampleElements = {
  seed: 19,
  dateLabel: '19 JUL',
  ambientSrc: null,
  lines: [
    { kind: 'hook', text: 'You said yes before it got boring.', src: null, durationInFrames: 70 },
    { kind: 'fire', text: 'Show up now that the excitement wore off.', src: null, durationInFrames: 70 },
    { kind: 'earth', text: 'Boring is not a signal to stop.', src: null, durationInFrames: 70 },
    { kind: 'air', text: 'Answer the message you keep rereading.', src: null, durationInFrames: 65 },
    { kind: 'water', text: 'You already know who is not following through.', src: null, durationInFrames: 72 },
    { kind: 'cta', text: 'Which one already happened today? Tell us.', src: null, durationInFrames: 75 },
  ],
}

export const RemotionRoot = () => (
  <>
    <Composition
      id="ManifestationReel"
      component={ManifestationReel}
      calculateMetadata={durationFromLines}
      defaultProps={sampleManifestation}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={450}
    />
    <Composition
      id="ElementsReel"
      component={ElementsReel}
      calculateMetadata={durationFromLines}
      defaultProps={sampleElements}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={480}
    />
  </>
)
