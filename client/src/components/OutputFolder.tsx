import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'

interface OutputFolderProps {
  value: string
  onChange: (path: string) => void
}

export function OutputFolder({ value, onChange }: OutputFolderProps) {
  const [picking, setPicking] = useState(false)

  const handlePick = async () => {
    setPicking(true)
    try {
      const selected = await open({ directory: true, multiple: false })
      if (typeof selected === 'string') onChange(selected)
    } catch {
      // user cancelled or API unavailable
    } finally {
      setPicking(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Output Folder</label>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="/Users/you/Downloads"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={handlePick}
          disabled={picking}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Browse
        </button>
      </div>
    </div>
  )
}
