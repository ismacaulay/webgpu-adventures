export interface ScriptComponent extends Component {
  type: ComponentType.Script;

  update: (dt?: number) => void;
}
