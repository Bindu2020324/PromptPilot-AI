/**
 * exportUtils.js
 * Pure functions for exporting prompt history as JSON or Markdown.
 * No DOM manipulation — just string generation.
 */

/**
 * Converts a prompts array into a JSON string and filename.
 *
 * @param {Array} prompts – versioned prompt objects from pp_prompts
 * @returns {{ content: string, filename: string }}
 */
export function exportHistoryAsJSON(prompts) {
  const data = JSON.stringify(prompts, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return { content: data, filename: `promptpilot-history-${timestamp}.json` };
}

/**
 * Converts a prompts array into a Markdown string and filename.
 *
 * @param {Array} prompts – versioned prompt objects from pp_prompts
 * @returns {{ content: string, filename: string }}
 */
export function generateHistoryMarkdown(prompts) {
  let md = `# PromptPilot AI - Exported Prompt History\n`;
  md += `Exported on: ${new Date().toLocaleString()}\n`;
  md += `Total Prompts: ${prompts.length}\n\n`;
  md += `---\n\n`;

  const latestVersionNum =
    prompts.length > 0 && prompts[0].versions?.length > 0
      ? prompts[0].versions[0].version_number
      : null;

  prompts.forEach((prompt, idx) => {
    md += `## ${idx + 1}. ${prompt.original_text.slice(0, 50)}${prompt.original_text.length > 50 ? '...' : ''}\n\n`;
    md += `- **Original Prompt:** ${prompt.original_text}\n`;
    md += `- **Domain:** ${prompt.domain || 'General'}\n`;
    md += `- **Mode:** ${prompt.mode}\n`;
    md += `- **Status:** ${prompt.favorite ? '⭐ Favorite' : 'Standard'}\n`;
    md += `- **Created:** ${new Date(prompt.created_at).toLocaleString()}\n`;
    md += `- **Last Updated:** ${new Date(prompt.updated_at).toLocaleString()}\n\n`;

    md += `### Version History\n\n`;

    prompt.versions.forEach((ver) => {
      md += `#### Version ${ver.version_number}${ver.version_number === latestVersionNum ? ' (Latest)' : ''}\n`;
      md += `- **Created At:** ${new Date(ver.created_at).toLocaleString()}\n`;
      md += `- **AI Provider:** ${ver.provider || 'Gemini'} (${ver.model || 'gemini-pro'})\n`;
      md += `- **Scores:** Clarity: ${ver.clarity_score} | Specificity: ${ver.specificity_score} | Quality: ${ver.quality_score}\n`;
      if (ver.change_note) {
        md += `- **Change Note:** *${ver.change_note}*\n`;
      }
      if (ver.transformation_insight) {
        md += `- **Insight:** ${ver.transformation_insight}\n`;
      }
      md += `\n**Enhanced Prompt:**\n\n`;
      md += `\`\`\`\n${ver.enhanced_prompt}\n\`\`\`\n\n`;
    });

    md += `---\n\n`;
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return { content: md, filename: `promptpilot-history-${timestamp}.md` };
}
