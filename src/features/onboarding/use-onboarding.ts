import { useCallback, useState } from 'react';

import { db } from '@/db/client';
import { getMeta, setMeta } from '@/db/meta';

const ONBOARDING_KEY = 'onboarding_seen';

/** Controla se o onboarding de primeiro uso já foi visto (persistido em meta). */
export function useOnboarding() {
  const [seen, setSeen] = useState(() => getMeta(db, ONBOARDING_KEY) === 'true');

  const complete = useCallback(() => {
    setMeta(db, ONBOARDING_KEY, 'true');
    setSeen(true);
  }, []);

  return { seen, complete };
}
