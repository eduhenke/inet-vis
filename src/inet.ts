export type INode =
  {
    type: 'Erase' | 'Root',
    ports: [PortLabel]
  } |
  {
    type: 'Dup' | 'Lam' | 'App',
    ports: [PortLabel, PortLabel, PortLabel]
  };

export type INet = INode[];

export type PortLabel =
  // explicit label
  string
  // hidden label(generated by parser)
  | number;

export function isExplicitPortLabel(label: PortLabel): label is string {
  return typeof label === 'string';
}

// Direction of the provided port
export function nodeDirection(type: INode['type'], port: number): 'up' | 'down' | 'any' {
  switch (type) {
    case 'Erase':
    case 'Root':
      return 'any';
    case 'Dup':
    case 'Lam':
      return port === 0 ? 'up' : 'down';
    case 'App':
      return port === 0 ? 'down' : 'up';
  }
}