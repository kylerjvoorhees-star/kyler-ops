'use client'

import { useState, useEffect } from 'react'
import { Bot, Send, Loader2 } from 'lucide-react'

interface CommandLog {
  id: string
  text: string
  result: string
  ts: string
}

export default function OperatorCard() {
  const [briefing, setBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(true)
  const [command, setCommand] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [log, setLog] = useState<CommandLog[]>([])

  useEffect(() => {
    fetch('/api/operator/briefing')
      .then((r) => r.json())
      .then((d) => setBriefing(d.briefing ?? 'Good morning, Kyler.'))
      .catch(() => setBriefing('Unable to load briefing.'))
      .finally(() => setLoadingBriefing(false))
  }, [])

  async function handleCommand(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) return
    setSubmitting(true)
    const text = command
    setCommand('')
    try {
      const res = await fetch('/api/operator/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text }),
      })
      const data = await res.json()
      setLog((prev) =>
        [
          {
            id: Date.now().toString(),
            text,
            result: data.result ?? 'Done.',
            ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ].slice(0, 5)
      )
    } catch {
      setLog((prev) =>
        [{ id: Date.now().toString(), text, result: 'Error executing command.', ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 5)
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <Bot size={16} className="text-violet-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Operator</span>
      </div>

      <div className="text-sm text-white/70 leading-relaxed min-h-[80px]">
        {loadingBriefing ? (
          <div className="flex items-center gap-2 text-white/30">
            <Loader2 size={14} className="animate-spin" />
            Generating briefing…
          </div>
        ) : (
          briefing
        )}
      </div>

      <form onSubmit={handleCommand} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Give me a command…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !command.trim()}
          className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg transition-colors"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>

      {log.length > 0 && (
        <div className="space-y-1.5">
          {log.map((entry) => (
            <div key={entry.id} className="text-xs bg-white/3 rounded-lg px-3 py-2">
              <div className="flex justify-between text-white/40 mb-0.5">
                <span className="truncate">{entry.text}</span>
                <span className="shrink-0 ml-2">{entry.ts}</span>
              </div>
              <div className="text-white/70">{entry.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
