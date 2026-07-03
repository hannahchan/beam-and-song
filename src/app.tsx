import { useEffect } from 'preact/hooks';
import { useRoute } from './lib/router';
import { Landing } from './ui/Landing';
import { Chooser } from './ui/Chooser';
import { Player } from './ui/Player';
import { GrownUps } from './ui/grownups/GrownUps';

export function App() {
  const route = useRoute();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Beam and Song',
      '/choose': 'Choose a lesson — Beam and Song',
      '/play': 'Lesson — Beam and Song',
    };
    document.title = route.path.startsWith('/grown-ups')
      ? 'For grown-ups — Beam and Song'
      : (titles[route.path] ?? 'Beam and Song');
  }, [route.path]);

  if (route.path === '/choose') return <Chooser />;
  if (route.path === '/play')
    return (
      <Player
        lessonId={route.params.get('lesson') ?? undefined}
        programId={route.params.get('program') ?? undefined}
      />
    );
  if (route.path.startsWith('/grown-ups')) return <GrownUps route={route} />;
  return <Landing />;
}
