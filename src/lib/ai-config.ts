import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function getDeepSeekKey(): string {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY

  // 从项目根目录的 deepseek-key.txt 读取
  const rootPath = path.join(__dirname, '..', '..', 'deepseek-key.txt')
  try {
    const key = fs.readFileSync(rootPath, 'utf-8').trim()
    if (key) return key
  } catch { /* file not found */ }

  return ''
}
