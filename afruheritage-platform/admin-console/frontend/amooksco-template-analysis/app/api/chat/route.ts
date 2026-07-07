import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai"
import { matchFaq } from "@/lib/faq"

export const maxDuration = 30

function latestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== "user") continue
    return m.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join(" ")
  }
  return ""
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const query = latestUserText(messages)
  const answer = matchFaq(query)
  const words = answer.split(" ")

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const id = "amo-answer"
      writer.write({ type: "text-start", id })
      for (let i = 0; i < words.length; i++) {
        const delta = (i === 0 ? "" : " ") + words[i]
        writer.write({ type: "text-delta", id, delta })
        // Small delay for a natural typing feel.
        await new Promise((r) => setTimeout(r, 22))
      }
      writer.write({ type: "text-end", id })
    },
  })

  return createUIMessageStreamResponse({ stream })
}
