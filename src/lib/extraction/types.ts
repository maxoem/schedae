// Lightweight types for the AST extraction pipeline
export interface SimplifiedNode {
  id: number;
  type: string;
  text: string;
  children: number[];
}

export interface PreprocessorResult {
  root: any;
  nodes: SimplifiedNode[];
  idToNode: Record<number, any>;
}

export interface Stencil {
  front_path: number[];
  back_path: number[];
  // Preserve original selected node ids for robust re-evaluation
  front_id?: number;
  back_id?: number;
}
