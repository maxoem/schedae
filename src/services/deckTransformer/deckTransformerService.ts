import type {
  ContentTransformer,
  TransformationConfig,
  TransformationContext,
} from "./types";
import { DEFAULT_TRANSFORMATION_CONFIG } from "./types";
import { FieldLabelTransformer } from "./transformers/fieldLabelTransformer";
import { HtmlToMarkdownTransformer } from "./transformers/htmlToMarkdownTransformer";
import { MathEnvironmentTransformer } from "./transformers/mathEnvironmentTransformer";
import { ListBulletTransformer } from "./transformers/listBulletTransformer";
import { WhitespaceTransformer } from "./transformers/whitespaceTransformer";

export interface TransformationReport {
  appliedTransformers: string[];
  original: string;
  result: string;
  hasChanged: boolean;
}

export class DeckTransformerService {
  private transformers: ContentTransformer[] = [];

  constructor(customTransformers?: ContentTransformer[]) {
    if (customTransformers && customTransformers.length > 0) {
      this.transformers = [...customTransformers].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
    } else {
      this.transformers = this.createDefaultTransformers();
    }
  }

  private createDefaultTransformers(): ContentTransformer[] {
    return [
      new FieldLabelTransformer(),
      new HtmlToMarkdownTransformer(),
      new MathEnvironmentTransformer(),
      new ListBulletTransformer(),
      new WhitespaceTransformer(),
    ].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  /**
   * Registers a new transformer or replaces an existing transformer with the same id.
   */
  registerTransformer(transformer: ContentTransformer): void {
    const existingIdx = this.transformers.findIndex((t) => t.id === transformer.id);
    if (existingIdx >= 0) {
      this.transformers[existingIdx] = transformer;
    } else {
      this.transformers.push(transformer);
    }
    this.transformers.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  /**
   * Unregisters a transformer by id.
   */
  unregisterTransformer(id: string): boolean {
    const initialLen = this.transformers.length;
    this.transformers = this.transformers.filter((t) => t.id !== id);
    return this.transformers.length < initialLen;
  }

  /**
   * Returns list of currently registered transformers.
   */
  getTransformers(): readonly ContentTransformer[] {
    return [...this.transformers];
  }

  /**
   * Checks whether a specific transformer is enabled according to the given TransformationConfig.
   */
  private isTransformerEnabled(transformerId: string, config: TransformationConfig): boolean {
    switch (transformerId) {
      case "field-labels":
        return config.stripFieldLabels;
      case "html-to-markdown":
        return config.htmlToMarkdown;
      case "math-environments":
        return config.normalizeMath;
      case "list-bullets":
        return config.cleanListBullets;
      case "whitespace":
        return config.normalizeWhitespace;
      default:
        // Any custom registered transformer is enabled by default
        return true;
    }
  }

  /**
   * Transforms a field content string through the pipeline.
   * For each active transformer, it verifies `canTransform` before applying it.
   */
  transformField(
    content: string,
    config: TransformationConfig = DEFAULT_TRANSFORMATION_CONFIG,
    context?: TransformationContext
  ): string {
    if (!content || typeof content !== "string") return "";

    let current = content;

    for (const transformer of this.transformers) {
      if (!this.isTransformerEnabled(transformer.id, config)) {
        continue;
      }

      // Check whether this transformer wants to apply to this content
      if (transformer.canTransform(current, context)) {
        current = transformer.transform(current, context);
      }
    }

    return current;
  }

  /**
   * Detailed transform returning a report of which transformers applied.
   */
  transformFieldWithReport(
    content: string,
    config: TransformationConfig = DEFAULT_TRANSFORMATION_CONFIG,
    context?: TransformationContext
  ): TransformationReport {
    if (!content || typeof content !== "string") {
      return {
        appliedTransformers: [],
        original: content || "",
        result: "",
        hasChanged: false,
      };
    }

    const appliedTransformers: string[] = [];
    let current = content;

    for (const transformer of this.transformers) {
      if (!this.isTransformerEnabled(transformer.id, config)) {
        continue;
      }

      if (transformer.canTransform(current, context)) {
        const next = transformer.transform(current, context);
        if (next !== current) {
          appliedTransformers.push(transformer.id);
          current = next;
        }
      }
    }

    return {
      appliedTransformers,
      original: content,
      result: current,
      hasChanged: current !== content,
    };
  }
}

// Global default singleton instance
export const defaultDeckTransformerService = new DeckTransformerService();
