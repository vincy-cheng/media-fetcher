import { Command } from 'commander'
import { run } from './prompts'

const program = new Command()

program
  .name('ytdl')
  .description('YouTube audio / video downloader CLI')
  .argument('[urls...]', 'YouTube URLs to download')
  .option('-f, --format <format>', 'Output format: mp3|m4a|wav|ogg|flac|mp4|webm')
  .option('-r, --resolution <res>', 'Video resolution: 360p|480p|720p|1080p|1440p|2160p (video only, default: 1080p)')
  .option('-s, --start <time>', 'Trim start time (HH:MM:SS)')
  .option('-e, --end <time>', 'Trim end time (HH:MM:SS)')
  .option('-o, --output <path>', 'Output directory')
  .action(async (urls: string[], opts) => {
    await run(urls, opts)
  })

program.parse()
