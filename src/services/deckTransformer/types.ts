import type { CardTemplateId } from "@/converters/templates";

/**
 * Context passed along during content transformation.
 */
export interface TransformationContext {
  /** The field name being transformed (e.g. "front", "back", "quelle") */
  fieldName?: string;
  /** The note ID if known */
  noteId?: number;
  /** Deck name if known */
  deckName?: string;
  /** Additional card custom fields */
  customFields?: Record<string, string>;
  /** Extra contextual options */
  options?: Record<string, any>;
}

/**
 * Interface for individual content transformers.
 * Each transformer must provide a `canTransform` check to decide
 * whether it should execute on the given content.
 */
export interface ContentTransformer {
  /** Unique identifier, e.g. 'math-environments' */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Description of the transformation behavior */
  readonly description: string;
  /** Execution order index (lower numbers run earlier) */
  readonly order?: number;

  /**
   * Checks whether this transformation rule applies to the specified content.
   * If false, the orchestrator skips this transformer, leaving the content untouched.
   */
  canTransform(content: string, context?: TransformationContext): boolean;

  /**
   * Executes the transformation on the content.
   */
  transform(content: string, context?: TransformationContext): string;
}

/**
 * Configuration options for the transformation pipeline.
 */
export interface TransformationConfig {
  cleanListBullets: boolean;
  normalizeMath: boolean;
  htmlToMarkdown: boolean;
  stripFieldLabels: boolean;
  normalizeWhitespace: boolean;
  targetTemplate: CardTemplateId;
}

export const DEFAULT_TRANSFORMATION_CONFIG: TransformationConfig = {
  cleanListBullets: true,
  normalizeMath: true,
  htmlToMarkdown: true,
  stripFieldLabels: true,
  normalizeWhitespace: true,
  targetTemplate: "markdown_basic",
};
