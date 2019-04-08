import { ANTLRErrorListener, RecognitionException, Recognizer } from "antlr4ts";
import { ReportDielBasicParsingError } from "../util/messages";

// modified from the original src/ConsoleErrorListener.ts
export class ConsoleErrorListener implements ANTLRErrorListener<any> {
	/**
	 * Provides a default instance of {@link ConsoleErrorListener}.
	 */
	public static readonly INSTANCE: ConsoleErrorListener = new ConsoleErrorListener();

	/**
	 * {@inheritDoc}
	 *
	 * <p>
	 * This implementation prints messages to {@link System#err} containing the
	 * values of {@code line}, {@code charPositionInLine}, and {@code msg} using
	 * the following format.</p>
	 *
	 * <pre>
	 * line <em>line</em>:<em>charPositionInLine</em> <em>msg</em>
	 * </pre>
	 */
	public syntaxError<T>(
		recognizer: Recognizer<T, any>,
		offendingSymbol: T,
		line: number,
		charPositionInLine: number,
		msg: string,
		e: RecognitionException | undefined): void {
      ReportDielBasicParsingError(`line ${line}:${charPositionInLine} ${msg}`);
	}
}