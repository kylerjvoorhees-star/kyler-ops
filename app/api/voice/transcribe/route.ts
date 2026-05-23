export async function POST(request: Request) {
  const formData = await request.formData()
  const audio = formData.get('audio') as File | null
  if (!audio) return Response.json({ error: 'No audio file' }, { status: 400 })

  // Try Groq first (free), fall back to OpenAI
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (groqKey) {
    const fd = new FormData()
    fd.append('file', audio, 'audio.webm')
    fd.append('model', 'whisper-large-v3')
    fd.append('response_format', 'json')

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      return Response.json({ text: data.text })
    }
  }

  if (openaiKey && openaiKey !== 'placeholder') {
    const fd = new FormData()
    fd.append('file', audio, 'audio.webm')
    fd.append('model', 'whisper-1')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      return Response.json({ text: data.text })
    }
  }

  return Response.json({ error: 'No voice transcription service configured. Add GROQ_API_KEY or OPENAI_API_KEY to .env.local.' }, { status: 503 })
}
