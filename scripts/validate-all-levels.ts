import * as fs from 'fs';
import * as path from 'path';
import { validateBeatmap } from '../src/shared/beatmapValidator';

const songsDir = path.resolve(__dirname, '..', 'public', 'songs');
const entries = fs.readdirSync(songsDir, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name.startsWith('level-'))
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`Validating ${entries.length} levels in ${songsDir}...\n`);

let allValid = true;

for (const entry of entries) {
  const beatmapPath = path.join(songsDir, entry.name, 'beatmap.json');
  const audioPath = path.join(songsDir, entry.name, 'audio.mp3');

  // Check files exist
  const hasBeatmap = fs.existsSync(beatmapPath);
  const hasAudio = fs.existsSync(audioPath);

  if (!hasBeatmap) {
    console.log(`  FAIL ${entry.name}: missing beatmap.json`);
    allValid = false;
    continue;
  }
  if (!hasAudio) {
    console.log(`  FAIL ${entry.name}: missing audio.mp3`);
    allValid = false;
    continue;
  }

  const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'));
  const result = validateBeatmap(data);

  if (!result.valid) {
    console.log(`  FAIL ${entry.name}:`);
    result.errors.forEach(e => console.log(`    ERROR: ${e}`));
    allValid = false;
  } else {
    const { stats } = result;
    console.log(
      `  OK   ${entry.name}: ${stats.totalNotes} notes ` +
      `(${stats.tapNotes} tap, ${stats.holdNotes} hold), ` +
      `${stats.avgNotesPerSecond.toFixed(2)} notes/s`,
    );
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.log(`    WARN: ${w}`));
  }
}

console.log(`\n${allValid ? 'All levels valid!' : 'Some levels have errors.'}`);
process.exit(allValid ? 0 : 1);
