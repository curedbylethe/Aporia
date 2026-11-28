# Install the portable Aporia workflow

From the repository root, run `npm run package:skill`. It writes the
`aporia-design/` folder under `packages/agent-skill/dist/` with the skill,
license, rulebook, guides, reference annotations and generated CSS. Copy that
folder into the project's skill directory using the path supported by the
target agent.

| Agent | Typical project directory |
| --- | --- |
| Codex | `.agents/skills/` |
| Claude Code | `.claude/skills/` |
| OpenCode | `.opencode/skills/` |

For any agent that reads Markdown instructions, point it at the repository's
`AGENTS.md` or the portable `DESIGN.md`. Request the workflow by name and
include the intended audience, artifact and task in the prompt.
