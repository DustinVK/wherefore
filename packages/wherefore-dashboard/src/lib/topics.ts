import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TopicVocab {
  areas: string[];
  topics: string[];
}

export function parseTopics(loreSrc: string): TopicVocab {
  try {
    const content = readFileSync(resolve(loreSrc, 'topics.md'), 'utf-8');
    const areas: string[] = [];
    const topics: string[] = [];
    let section: 'areas' | 'topics' | null = null;

    for (const line of content.split('\n')) {
      if (/^##\s+Areas/i.test(line)) { section = 'areas'; continue; }
      if (/^##\s+Topics/i.test(line)) { section = 'topics'; continue; }
      if (line.startsWith('#')) { section = null; continue; }
      const m = line.match(/^-\s+(\S+)/);
      if (m) {
        if (section === 'areas') areas.push(m[1]);
        else if (section === 'topics') topics.push(m[1]);
      }
    }

    return { areas, topics };
  } catch {
    return { areas: [], topics: [] };
  }
}
