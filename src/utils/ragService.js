/**
 * RagService - Handles document chunking, pseudo-embeddings, and robust retrieval.
 */

export const RagService = {
    /**
     * Creates hierarchical chunks.
     * Small chunks (300 chars) for high-precision search.
     * Large chunks (1500 chars) for actual context provided to LLM.
     */
    chunkText: (text) => {
        const largeChunks = [];
        const smallChunks = [];
        const largeSize = 1500;
        const smallSize = 300;
        const overlap = 50;

        // Create Large (Parent) Chunks
        for (let i = 0; i < text.length; i += (largeSize - overlap)) {
            const chunk = text.substring(i, i + largeSize);
            largeChunks.push(chunk);

            // For each large chunk, create small (Search) vectors/sub-chunks
            for (let j = 0; j < chunk.length; j += (smallSize - overlap)) {
                smallChunks.push({
                    text: chunk.substring(j, j + smallSize),
                    parentId: largeChunks.length - 1
                });
            }
        }
        return { largeChunks, smallChunks };
    },

    /**
     * Multi-Vector Style Retrieval.
     * Matches the query against small chunks but returns the full Parent chunks
     * to provide the LLM with enough context.
     */
    retrieveContext: async (query, document) => {
        if (!document || !document.content) return "";

        const { largeChunks, smallChunks } = RagService.chunkText(document.content);
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

        // Score small chunks
        const scoredSmall = smallChunks.map(s => {
            let score = 0;
            const textLower = s.text.toLowerCase();
            queryTerms.forEach(term => {
                if (textLower.includes(term)) score += 1;
            });
            return { ...s, score };
        });

        // Get unique parent IDs from top 5 small chunks
        const topParents = [...new Set(
            scoredSmall
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .filter(s => s.score > 0)
                .map(s => s.parentId)
        )].slice(0, 2); // Final top 2 large context blocks

        if (topParents.length === 0) return document.content.substring(0, 2000);

        return topParents.map(id => largeChunks[id]).join("\n\n---\n\n");
    },

    /**
     * Robustly extracts JSON from an LLM response that might contain preamble/chat.
     */
    extractJson: (text) => {
        try {
            // Find the first '{' and the last '}'
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start === -1 || end === -1) throw new Error("No JSON object found");

            const jsonStr = text.substring(start, end + 1);
            return JSON.parse(jsonStr);
        } catch (e) {
            // Fallback for arrays if needed
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                return JSON.parse(text.substring(start, end + 1));
            }
            throw new Error("Failed to parse AI response as JSON: " + e.message);
        }
    },

    /**
     * Formats the RAG prompt for Quiz Generation.
     */
    buildQuizPrompt: (context, difficulty, count, type) => {
        return `
            SYSTEM PROMPT:
            You are an expert CBSE/ICSE Exam Paper Setter. Your goal is to create a valid, syllabus-aligned assessment using only the provided context.

            CONTEXT:
            ${context.substring(0, 10000)}

            REQUIREMENTS:
            - Difficulty: ${difficulty}
            - Questions: ${count}
            - Format: ${type}
            
            OUTPUT: Respond ONLY with a valid JSON object matching this schema:
            {
              "quiz_metadata": {"topic": "string", "difficulty": "${difficulty}"},
              "questions": [
                {
                  "id": number,
                  "type": "objective",
                  "question": "string",
                  "options": ["A", "B", "C", "D"],
                  "correct_answer": "Option",
                  "explanation": "string"
                }
              ]
            }
        `;
    },

    /**
     * Formats the RAG prompt for Remedial Assessment.
     */
    buildAssessmentPrompt: (results, originalContext) => {
        return `
            SYSTEM PROMPT:
            You are an AI Learning Mentor. Analyze the performance and provide a remedial plan.
            
            DATA:
            - Score: ${results.score_percentage}%
            - Mistakes: ${JSON.stringify(results.wrong_answers)}
            - Document Context: ${originalContext.substring(0, 5000)}

            FORMAT: Return a structured Markdown report with headers (Performance, Gaps, Remedial, Action Plan).
        `;
    }
};

export default RagService;
