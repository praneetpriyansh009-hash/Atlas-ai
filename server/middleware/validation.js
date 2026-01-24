import { z } from 'zod';

// Zod Schema for AI Chat Completion
const chatSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string().min(1).max(20000) // Reasonable limit for prompt context
        })
    ).min(1),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(1).max(4096).optional(),
    top_p: z.number().min(0).max(1).optional()
});

export const validateAIRequest = (req, res, next) => {
    try {
        // Parse request body against schema
        // strip() will remove unknown keys, effectively sanitizing the input
        const validatedData = chatSchema.parse(req.body);

        // Replace req.body with sanitized data
        req.body = validatedData;

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
            });
        }
        return res.status(400).json({ error: 'Invalid Input' });
    }
};
