import { Card } from './bits';

/**
 * PT-11 / PT-12 / PT-10 — plain-language orientation and setup guidance.
 * Framed throughout as support alongside professionals, never instead of
 * them (SR-4), and written for a parent who may have no TVI yet.
 */
export function Guide() {
  return (
    <div class="stack">
      <h1 tabindex={-1}>A short guide for grown-ups</h1>

      <Card title="What CVI is, briefly">
        <p>
          Cortical (or cerebral) visual impairment means the eyes gather light well enough, but the brain has a
          harder time making sense of what arrives. It is the most common cause of visual impairment in children
          in many countries — and, importantly, <b>vision with CVI can develop</b>. Familiar colours, simple
          scenes, movement, light, and time are the usual doorways in.
        </p>
        <p>
          Every child's CVI is different: the helpful colour, pace, and amount-on-screen vary hugely. That is why
          almost everything here is adjustable — and why your child's own team knows best which settings fit.
        </p>
        <p class="card-note">
          If you don't yet have a vision professional (a TVI — teacher of students with visual impairments — or a
          low-vision specialist), it is truly worth pursuing through your early-intervention service,
          ophthalmologist, or local blind/low-vision organisation. This app is a companion for the journey, not a
          programme, and nothing in it diagnoses or treats anything.
        </p>
      </Card>

      <Card title="What a response can look like">
        <p>With CVI — especially in babies — a “look” is often not a straight look at first. Watch for:</p>
        <ul>
          <li>Going still, going quiet, or breathing differently when the light appears</li>
          <li>Eyes widening, blinking, or turning <em>near</em> the target (looking slightly beside it is common)</li>
          <li>A response that arrives seconds late — visual latency is part of CVI, so wait longer than feels natural</li>
          <li>Looking away and then back — or looking <em>away from</em> the screen while clearly attending to it</li>
        </ul>
        <p class="card-note">Any of these counts as “responded” in your notes. Trust what you notice; you know your baby.</p>
      </Card>

      <Card title="When to pause or stop">
        <p>
          Watching is hard work. Stop while it's still going well, and always stop for: turning away repeatedly,
          fussing or crying, eye-rubbing, yawning or drowsiness, hiccups or spitting up, stiffening, or going
          floppy. The pause button dims the screen and hushes the sound at once — and being on screen never means
          a baby is enjoying it, so trust the body language over the gaze.
        </p>
        <p class="card-note">
          Sessions here wind down by themselves after a few minutes on purpose. Several tiny sessions across a
          day beat one long one.
        </p>
      </Card>

      <Card title="Setting up the room">
        <ul>
          <li><b>Dim the room.</b> The target should be the brightest, most interesting thing in view.</li>
          <li><b>Kill reflections.</b> No window or lamp behind the screen or reflected in it.</li>
          <li><b>Come close.</b> Roughly 30–50 cm away is a good start for a baby; closer is fine.</li>
          <li><b>Support the body.</b> Comfortable, well-supported positioning (a feeding pillow, a carer's lap, a supportive seat) frees energy for looking — posture and vision compete for effort.</li>
          <li><b>Quiet, too.</b> A calm room helps; competing household noise works against listening lessons especially.</li>
          <li><b>Device brightness</b> at a comfortable middle, not maximum.</li>
        </ul>
      </Card>

      <Card title="Sound and looking — why there are three sound modes">
        <p>
          Many children with CVI cannot attend to looking and listening at the same time; a song can actually pull
          attention <em>off</em> the target. If looks are rare with sound on, try <b>visual-only</b>, or the{' '}
          <b>after a look</b> mode — where you tap when your baby looks, and the music arrives as a warm answer.
          Other children need the sound to arrive <em>first</em> as the invitation. Watch, try, and keep what
          works.
        </p>
      </Card>

      <Card title="About glow">
        <p>
          A glowing target helps many children find and hold it. For some, though, glow feeds a habit of gazing at
          light itself rather than looking at <em>things</em> — something vision teachers often work to reduce. If
          your baby seems drawn into the glow rather than the shape, turn glow down or off in Settings and mention
          it to your vision professional.
        </p>
      </Card>

      <Card title="Moving up, stepping back">
        <p>Signs a baby might enjoy a bit more (after several relaxed sessions, not one good day):</p>
        <ul>
          <li>Finds the target within a few seconds most sessions, and holds it a little</li>
          <li>Starts following slow movement, or re-finding the light after it moves</li>
          <li>Reaches, bats, or vocalises at the screen — anticipates the fun</li>
        </ul>
        <p>Signs to step back down or rest for a while:</p>
        <ul>
          <li>Looks have become rarer since a change — new speed, new lesson, more on screen</li>
          <li>Fussing starts earlier in sessions than it used to</li>
          <li>A hard season (illness, a medication change, poor sleep) — comfort first, always</li>
        </ul>
        <p class="card-note">
          Moving “up” can simply mean: slightly smaller target, a touch more speed, one more thing on screen — one
          change at a time. And no level is a grade: meeting your baby where they are <em>is</em> the practice.
        </p>
      </Card>

      <Card title="From the screen to the world">
        <p>
          Screens are a doorway, not the destination. The lessons with familiar objects suggest a real-world
          follow-up (a real ball, a real bath duck) — that little bridge, screen first and real thing next, is
          where the learning lands. The same goes for faces: the photo lesson works best right before a real
          cuddle with the person in the picture.
        </p>
      </Card>

      <Card title="Working with your vision team">
        <p>
          Bring the app along to appointments: the <a href="#/grown-ups/sessions">Notes page</a> saves a readable
          summary a professional can skim in a minute, and the full profile file lets a TVI see (or adjust) the
          exact settings. If your TVI prefers a different order or emphasis than our levels, follow your TVI —
          star any lessons in any order; the levels are a convenience, not a doctrine.
        </p>
      </Card>

      <Card title="Put it on the home screen">
        <p class="card-note">
          On an iPad: open this site in Safari → tap the share square → <b>Add to Home Screen</b>. On Android:
          browser menu → <b>Add to home screen</b> (or "Install"). It then opens truly full-screen, without
          browser bars competing with the lesson, and keeps working even with patchy internet.
        </p>
      </Card>

      <Card title="Privacy, plainly">
        <p>
          Everything — profiles, settings, notes, photos — lives only in this browser on this device. Nothing is
          uploaded, transmitted, or collected; there are no accounts and no analytics. Export files are created
          only when you ask and go only where you put them. On a shared device, you can add a PIN on the{' '}
          <a href="#/grown-ups/profiles">Children page</a>.
        </p>
      </Card>

      <Card title="How this app keeps visuals gentle">
        <p class="card-note">
          Because seizure conditions commonly accompany CVI, the app is built so that nothing can flash in the
          hazardous range: all changes are slow fades, brightness changes are capped, there are no stripes or
          checkerboard patterns, and even the “reward” moments obey the same rules at their most excited. These
          limits are enforced in code and verified by automated tests on every lesson at every setting — they are
          not adjustable, by design. This does not replace your own judgement or your medical team's advice about
          screen use for your child.
        </p>
      </Card>
    </div>
  );
}
