import React from 'react'
import { Composition } from 'remotion'
import { FPS, W, H } from './theme'
import { ManifestationReel } from './ManifestationReel'
import { ElementsReel } from './ElementsReel'
import { DailyReel } from './DailyReel'

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

const sampleDaily = {
  seed: 905,
  dateLabel: '05 SEP',
  ambientSrc: null,
  styleVariant: 'kinetic_type',
  lines: [
    { kind: 'hook', text: 'You keep starting new things because finishing the old one means feeling something.', show: 'new thing, old feeling', src: null, durationInFrames: 88 },
    { kind: 'beat', text: 'You signed up for the course, the app, the city, the person.', show: 'two week high', src: null, durationInFrames: 82 },
    { kind: 'beat', text: 'Then it got boring, or hard, or real.', show: 'boring means real', src: null, durationInFrames: 78 },
    { kind: 'beat', text: "That's a very fast way to never sit with anything.", show: 'speed as avoidance', src: null, durationInFrames: 80 },
    { kind: 'beat', text: 'Curiosity moves toward, restlessness moves away.', show: 'toward vs away', src: null, durationInFrames: 84 },
    { kind: 'beat', text: "Ask what you'd have to feel if you stayed one more month.", show: 'stay one more month', src: null, durationInFrames: 84 },
    { kind: 'beat', text: "If the answer scares you, that's the actual thing.", show: 'the fear is the map', src: null, durationInFrames: 82 },
    { kind: 'payoff', text: "You're not chasing a new life, you're running from the current one.", show: "You're not chasing a new life, you're running from the current one", src: null, durationInFrames: 96 },
    { kind: 'cta', text: "Send this to the friend who's already planning their next escape.", show: "Send this to the friend who's already planning their next escape.", src: null, durationInFrames: 90 },
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
      id="DailyReel"
      component={DailyReel}
      calculateMetadata={durationFromLines}
      defaultProps={sampleDaily}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={780}
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
