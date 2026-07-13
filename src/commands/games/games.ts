import { Command } from "../../command-system/command.js";
import {
	allGamesStreak,
	completedAllGames,
	dailyGames,
	gameNumber,
	gameStatus,
	gameStreak,
	localDate,
} from "../../resources/daily-games.js";

const statusEmoji = { won: "✅", lost: "❌", unplayed: "⬜" } as const;

export class Games extends Command {
	static override names(): readonly string[] {
		return ["games"];
	}
	static override description(): string {
		return "Show today's games.";
	}

	override run(): string {
		const date = localDate();
		const available = dailyGames.filter((game) => game.started <= date);
		return [
			`Freddy's games — ${date}`,
			"",
			...available.map(
				(game) =>
					`${statusEmoji[gameStatus(game.id, date) ?? "unplayed"]} ${game.title} #${gameNumber(game.started, date)} — type '${game.id}' — streak: ${gameStreak(game, date)}`,
			),
			...(completedAllGames(date) ? ["", `🔥 All-games streak: ${allGamesStreak(date)}`] : []),
		].join("\n");
	}
}
