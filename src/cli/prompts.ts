import inquirer from 'inquirer'
import ora from 'ora'
import chalk from 'chalk'
import { downloadAudio } from '../core/downloader'
import type { AudioFormat } from '../core/types'

interface CliOpts {
  format?: string
  start?: string
  end?: string
  output?: string
}

function parseTime(t: string): number {
  const parts = t.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return Number(parts[0]) || 0
}

export async function run(urls: string[], opts: CliOpts) {
  if (urls.length === 0) {
    const { url } = await inquirer.prompt([
      { type: 'input', name: 'url', message: 'YouTube URL:' },
    ])
    urls = [url]
  }

  const format: AudioFormat = (opts.format as AudioFormat) ??
    ((await inquirer.prompt([{
      type: 'list',
      name: 'format',
      message: 'Output format:',
      choices: ['mp3', 'm4a', 'wav', 'ogg', 'flac'],
      default: 'mp3',
    }])).format)

  const outputDir: string = opts.output ??
    ((await inquirer.prompt([{
      type: 'input',
      name: 'outputDir',
      message: 'Output directory:',
      default: process.cwd(),
    }])).outputDir)

  for (const url of urls) {
    const spinner = ora(`Downloading ${chalk.cyan(url)}`).start()
    try {
      const out = await downloadAudio({
        url,
        format,
        start: opts.start ? parseTime(opts.start) : undefined,
        end: opts.end ? parseTime(opts.end) : undefined,
        outputDir,
      }, (pct, stage) => {
        spinner.text = `${stage} ${pct}%`
      })
      spinner.succeed(chalk.green(`Saved: ${out}`))
    } catch (e) {
      spinner.fail(chalk.red(String(e)))
    }
  }
}
