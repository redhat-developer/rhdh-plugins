export interface NodeConfigProps {
  nodeData: Record<string, unknown>;
  update: (field: string, value: unknown) => void;
  availableModels: string[];
}
