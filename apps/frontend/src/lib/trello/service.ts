import { z } from "zod";

const trelloConfigSchema = z.object({
    apiKey: z.string().min(1, "Trello API Key is required."),
    apiToken: z.string().min(1, "Trello API Token is required."),
    boardId: z.string().min(1, "Trello Board ID is required."),
    todoListId: z.string().min(1, "Trello To Do List ID is required."),
});

function getTrelloConfig() {
    const config = {
        apiKey: process.env.TRELLO_API_KEY,
        apiToken: process.env.TRELLO_API_TOKEN,
        boardId: process.env.TRELLO_BOARD_ID,
        todoListId: process.env.TRELLO_TODO_LIST_ID,
    };

    const parsed = trelloConfigSchema.safeParse(config);
    if (!parsed.success) {
        console.warn("Trello integration is not configured. Please set all Trello environment variables.");
        return null;
    }
    return parsed.data;
}

interface CreateCardOptions {
    name: string;
    desc: string;
}

export async function createMockupRequestCard({ name, desc }: CreateCardOptions) {
    const config = getTrelloConfig();
    if (!config) {
        console.log("Skipping Trello card creation because integration is not configured.");
        return; // Silently fail if not configured
    }

    const url = `https://api.trello.com/1/cards?idList=${config.todoListId}&key=${config.apiKey}&token=${config.apiToken}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, desc })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to create Trello card: ${response.status} ${errorBody}`);
        }

        const card = await response.json();
        console.log("Trello card created successfully:", card.id);
        return card;
    } catch (error) {
        console.error("Error creating Trello card:", error);
        // We don't re-throw the error, as failing to create a Trello card
        // should not block the main application workflow.
    }
}
