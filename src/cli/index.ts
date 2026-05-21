import { Command } from 'commander'
import { run } from './prompts'

const program = new Command()

program
  .name('ytdl')
  .description('YouTube audio downloader CLI')
  .argument('[urls...]', 'YouTube URLs to download')
  .option('-f, --format <format>', 'Output format: mp3|m4a|wav|ogg|flac')
  .option('-s, --start <time>', 'Trim start time (HH:MM:SS)')
  .option('-e, --end <time>', 'Trim end time (HH:MM:SS)')
  .option('-o, --output <path>', 'Output directory')
  .action(async (urls: string[], opts) => {
    await run(urls, opts)
  })

program.parse()
