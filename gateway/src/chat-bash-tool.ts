/**
 * Chat bash tool, adapted from holocron website/src/chat-bash-tool.ts (a71162e)
 * through the frozen spike's gateway/chat-bash-tool.ts.
 *
 * Same in-memory docs filesystem (just-bash, browser build: no real fs, and no
 * network because no `network` option is passed, so `curl` does not exist), same
 * tool description and input schema, same { stdout, stderr, exitCode } result the
 * site's chat-stream.ts renders. Changes: remote SKILL.md loading is dropped (the
 * site sends `skillUrls: []`, and fetching arbitrary URLs is not needed here), each
 * command's name and length are logged (never its text), and the output the
 * model receives is bounded: all tool calls of one step together get at most
 * MAX_TOOL_BYTES of JSON, the bound worstCaseUsd prices, and a call that finds the
 * step's bytes spent gets only the empty envelope (about 55 bytes), framing priced
 * with the call that asked for it. A cut result carries `truncated: true`.
 */

import { tool } from 'ai'
import { Bash } from 'just-bash/browser'
import { z } from 'zod'
import { MAX_TOOL_BYTES } from './ledger.ts'
import { clipToolOutput, jsonBytes } from './policy.ts'

export function createChatBashTool({ files, log }: { files: Record<string, string>; log: (line: string) => void }) {
  const bash = new Bash({ files, cwd: '/docs' })
  // Bytes already handed to the model per step. A step is keyed by the length of the
  // messages it was called with: parallel calls of one step share it, and it grows
  // with every step.
  const usedByStep = new Map<number, number>()

  return tool({
    description: [
      'Execute bash commands in the in-memory documentation filesystem.',
      'Working directory: /docs',
      'Use grep -rn "term" /docs to search and cat /docs/slug.mdx to read files.',
      'Always provide a short 5-10 word `description` summarizing what the command does; it is shown to the user.',
    ].join('\n'),
    inputSchema: z.object({
      command: z.string().describe('The bash command to execute'),
      description: z
        .string()
        .describe(
          'Short human readable summary of what this command does, shown to the user, e.g. "Searching docs for navigation config"',
        ),
    }),
    execute: async ({ command }: { command: string }, { messages }) => {
      const result = await bash.exec(command)
      const lines = result.stdout ? result.stdout.split('\n').filter(Boolean).length : 0
      const step = messages.length
      const used = usedByStep.get(step) ?? 0
      const output = clipToolOutput(
        { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode },
        MAX_TOOL_BYTES - used,
      )
      const bytes = jsonBytes(output)
      usedByStep.set(step, used + bytes)
      // The command name and length only: the model writes the command, and it can quote the conversation.
      const name = /^\s*([\w.-]{1,32})/.exec(command)?.[1] ?? '-'
      log(
        `bash exit=${result.exitCode} lines=${lines} bytes=${bytes}${output.truncated ? ' truncated' : ''} cmd=${name} chars=${command.length}`,
      )
      return output
    },
  })
}
